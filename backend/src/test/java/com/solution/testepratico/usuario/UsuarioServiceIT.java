package com.solution.testepratico.usuario;

import com.solution.testepratico.shared.exception.CpfDuplicadoException;
import com.solution.testepratico.shared.exception.EmailDuplicadoException;
import com.solution.testepratico.usuario.dto.CriarUsuarioRequest;
import com.solution.testepratico.usuario.dto.UsuarioResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.solution.testepratico.seguranca.UsuarioAutenticado;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unicidade de CPF no cadastro.
 *
 * Contra Postgres de verdade, e nao com mock, por dois motivos:
 *
 *   1. A garantia final da regra e o indice unico uk_usuarios_cpf (migration
 *      V1), nao o if do service. Um repositorio simulado concordaria com
 *      qualquer implementacao, inclusive com uma que tivesse perdido o indice.
 *   2. A regra interessante nao e "CPF igual e rejeitado", e sim que a
 *      NORMALIZACAO acontece antes da comparacao. Com mock eu estaria testando
 *      o meu proprio stub.
 *
 * Cada teste roda em transacao revertida no final, entao o seed fica intacto.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UsuarioServiceIT {

    /** Ja existe no seed V3 (Ana Souza). */
    private static final String CPF_DA_ANA = "11144477735";

    /** Digitos verificadores corretos e ausente do seed. */
    private static final String CPF_LIVRE = "12345678909";

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    private CriarUsuarioRequest pedido(String cpf, String email) {
        return new CriarUsuarioRequest("Fulano de Tal", cpf, email,
                LocalDate.of(1990, 5, 20), "senhaSegura123");
    }

    // ==================================================================
    // CPF duplicado
    // ==================================================================

    @Test
    @DisplayName("CPF duplicado e rejeitado com CpfDuplicadoException, nao com erro de banco")
    void cpfDuplicadoERejeitado() {
        assertThatThrownBy(() -> usuarioService.criar(pedido(CPF_DA_ANA, "outro@exemplo.com")))
                .isInstanceOf(CpfDuplicadoException.class)
                .hasMessageContaining("CPF");
    }

    @Test
    @DisplayName("CPF duplicado COM MASCARA tambem e rejeitado: normaliza antes de comparar")
    void cpfDuplicadoComMascaraTambemERejeitado() {
        // Se a checagem de unicidade rodasse sobre a string crua, "111.444.777-35"
        // nao casaria com "11144477735" gravado no banco: o insert passaria pelo
        // service e so estouraria no indice unico, virando um 409 generico em vez
        // da mensagem util que diz qual campo esta em conflito.
        assertThatThrownBy(() -> usuarioService.criar(pedido("111.444.777-35", "outro@exemplo.com")))
                .isInstanceOf(CpfDuplicadoException.class);
    }

    @Test
    @DisplayName("o indice unico do banco rejeita CPF duplicado mesmo sem passar pelo service")
    void indiceUnicoDoBancoRejeitaCpfDuplicado() {
        // Escreve direto pelo repository, desviando do if do service. Prova que
        // a invariante pertence ao schema: entre o existsByCpf e o insert cabe
        // outra requisicao gravando o mesmo CPF, e e o indice que fecha a janela.
        Usuario clandestino = new Usuario("Clone da Ana", CPF_DA_ANA, "clone@exemplo.com",
                LocalDate.of(1995, 6, 15), "$2b$10$hashQualquer", Role.USUARIO_COMUM);

        assertThatThrownBy(() -> usuarioRepository.saveAndFlush(clandestino))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("CPF livre e aceito: os testes de duplicidade falham pela regra, nao por outro motivo")
    void cpfLivreEAceito() {
        // Controle positivo. Sem ele, um CPF_LIVRE que por acaso ja existisse no
        // banco faria os testes de duplicidade passarem pelo motivo errado.
        UsuarioResponse criado = usuarioService.criar(pedido(CPF_LIVRE, "livre@exemplo.com"));

        assertThat(criado.id()).isNotNull();
        assertThat(criado.cpf()).isEqualTo(CPF_LIVRE);
    }

    // ==================================================================
    // Regras irmas do mesmo cadastro
    // ==================================================================

    @Test
    @DisplayName("e-mail duplicado e rejeitado ignorando a caixa")
    void emailDuplicadoIgnoraCaixa() {
        // O seed tem ana@exemplo.com. O indice e funcional, sobre lower(email),
        // entao "ANA@EXEMPLO.COM" e o mesmo e-mail.
        assertThatThrownBy(() -> usuarioService.criar(pedido(CPF_LIVRE, "ANA@EXEMPLO.COM")))
                .isInstanceOf(EmailDuplicadoException.class);
    }

    @Test
    @DisplayName("cadastro publico nasce sempre USUARIO_COMUM, com a senha em hash BCrypt")
    void cadastroPublicoNasceUsuarioComum() {
        usuarioService.criar(pedido(CPF_LIVRE, "livre@exemplo.com"));

        Usuario gravado = usuarioRepository.findByCpf(CPF_LIVRE).orElseThrow();

        assertThat(gravado.getRole())
                .as("nao existe caminho para alguem se cadastrar como ADMIN")
                .isEqualTo(Role.USUARIO_COMUM);
        assertThat(gravado.getSenhaHash())
                .as("senha nunca em texto puro")
                .isNotEqualTo("senhaSegura123")
                .startsWith("$2");
    }

    @Test
    @DisplayName("CPF com mascara e gravado so com digitos")
    void cpfEGravadoSemMascara() {
        // Garante a premissa do teste de duplicidade com mascara: se o banco
        // guardasse "123.456.789-09", existiriam duas representacoes do mesmo
        // CPF e a unicidade nao valeria nada.
        usuarioService.criar(pedido("123.456.789-09", "livre@exemplo.com"));

        assertThat(usuarioRepository.existsByCpf(CPF_LIVRE)).isTrue();
    }

    @Test
    @DisplayName("a listagem traz a contagem de enderecos de cada usuario")
    void listagemTrazContagemDeEnderecos() {
        var admin = usuarioRepository.findByCpf("52998224725").orElseThrow();
        var principal = new UsuarioAutenticado(admin.getId(), admin.getCpf(), admin.getRole());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.authorities()));
        try {
            usuarioService.criar(pedido(CPF_LIVRE, "livre@exemplo.com"));

            var lista = usuarioService.listarTodos();

            // Os tres do seed tem dois enderecos cada (V3 + V5).
            assertThat(lista)
                    .filteredOn(u -> !u.cpf().equals(CPF_LIVRE))
                    .allSatisfy(u -> assertThat(u.totalEnderecos()).isEqualTo(2));

            // Quem acabou de ser criado nao tem endereco. Este e o caso que a
            // consulta agregada NAO devolve, e que so funciona porque o service
            // trata a ausencia como zero em vez de estourar.
            assertThat(lista)
                    .filteredOn(u -> u.cpf().equals(CPF_LIVRE))
                    .singleElement()
                    .satisfies(u -> assertThat(u.totalEnderecos()).isZero());
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
