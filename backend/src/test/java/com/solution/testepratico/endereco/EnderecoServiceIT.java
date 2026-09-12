package com.solution.testepratico.endereco;

import com.solution.testepratico.endereco.dto.AtualizarEnderecoRequest;
import com.solution.testepratico.endereco.dto.CriarEnderecoRequest;
import com.solution.testepratico.endereco.dto.EnderecoResponse;
import com.solution.testepratico.seguranca.UsuarioAutenticado;
import com.solution.testepratico.shared.exception.AcessoNegadoException;
import com.solution.testepratico.shared.exception.RecursoNaoEncontradoException;
import com.solution.testepratico.usuario.Role;
import com.solution.testepratico.usuario.Usuario;
import com.solution.testepratico.usuario.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * As tres regras de negocio contra um Postgres de verdade.
 *
 * Nao da para provar nenhuma delas com mock: a REGRA 1 e uma constraint do
 * banco, e a REGRA 3 depende da ordem em que o Hibernate emite DELETE e UPDATE
 * no flush. Um repositorio simulado concordaria com qualquer implementacao,
 * inclusive com a errada.
 *
 * Cada teste roda dentro de uma transacao revertida ao final, entao os dados do
 * seed permanecem intactos.
 */
@SpringBootTest
@Transactional
class EnderecoServiceIT {

    @Autowired
    private EnderecoService enderecoService;

    @Autowired
    private EnderecoRepository enderecoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    private Usuario ana;
    private Usuario bruno;

    @BeforeEach
    void carregarUsuariosDoSeed() {
        ana = usuarioRepository.findByCpf("11144477735").orElseThrow();
        bruno = usuarioRepository.findByCpf("39053344705").orElseThrow();
    }

    @AfterEach
    void limparContexto() {
        SecurityContextHolder.clearContext();
    }

    private void autenticarComo(Usuario usuario) {
        var principal = new UsuarioAutenticado(usuario.getId(), usuario.getCpf(), usuario.getRole());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.authorities()));
    }

    private Usuario admin() {
        return usuarioRepository.findByCpf("52998224725").orElseThrow();
    }

    private void autenticarComoAdmin() {
        Usuario admin = admin();
        var principal = new UsuarioAutenticado(admin.getId(), admin.getCpf(), Role.ADMIN);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.authorities()));
    }

    private CriarEnderecoRequest pedido(String cep, String numero, Boolean principal) {
        return new CriarEnderecoRequest(cep, "Rua de Teste", numero, null,
                "Centro", "Sao Paulo", "SP", principal);
    }

    private long quantosPrincipais(Long usuarioId) {
        return enderecoRepository.findByUsuarioIdOrderByPrincipalDescIdAsc(usuarioId)
                .stream().filter(Endereco::isPrincipal).count();
    }

    // ==================================================================
    // REGRA 1 - no maximo um principal por usuario
    // ==================================================================

    @Test
    @DisplayName("REGRA 1: apos varias operacoes, o usuario nunca tem mais de um principal")
    void nuncaMaisDeUmPrincipal() {
        autenticarComo(ana);

        enderecoService.criar(ana.getId(), pedido("01310100", "100", true));
        enderecoService.criar(ana.getId(), pedido("04538133", "200", true));
        enderecoService.criar(ana.getId(), pedido("01001000", "300", false));

        assertThat(quantosPrincipais(ana.getId())).isEqualTo(1);
    }

    @Test
    @DisplayName("REGRA 1: o indice unico parcial permite N enderecos nao-principais")
    void permiteVariosNaoPrincipais() {
        autenticarComo(ana);

        enderecoService.criar(ana.getId(), pedido("01310100", "100", false));
        enderecoService.criar(ana.getId(), pedido("04538133", "200", false));
        enderecoService.criar(ana.getId(), pedido("01001000", "300", false));

        assertThat(enderecoRepository.countByUsuarioId(ana.getId())).isGreaterThanOrEqualTo(4);
        assertThat(quantosPrincipais(ana.getId())).isEqualTo(1);
    }

    // ==================================================================
    // REGRA 2 - marcar novo principal rebaixa o anterior
    // ==================================================================

    @Test
    @DisplayName("REGRA 2: definirPrincipal rebaixa o anterior automaticamente")
    void definirPrincipalRebaixaAnterior() {
        autenticarComo(ana);

        Long idAnterior = enderecoRepository.findByUsuarioIdAndPrincipalTrue(ana.getId())
                .orElseThrow().getId();

        EnderecoResponse novo = enderecoService.criar(ana.getId(), pedido("04538133", "200", false));
        assertThat(novo.principal()).isFalse();

        EnderecoResponse promovido = enderecoService.definirPrincipal(ana.getId(), novo.id());

        assertThat(promovido.principal()).isTrue();
        assertThat(enderecoRepository.findById(idAnterior).orElseThrow().isPrincipal()).isFalse();
        assertThat(quantosPrincipais(ana.getId())).isEqualTo(1);
    }

    @Test
    @DisplayName("REGRA 2: criar ja como principal rebaixa o anterior")
    void criarComoPrincipalRebaixaAnterior() {
        autenticarComo(ana);

        Long idAnterior = enderecoRepository.findByUsuarioIdAndPrincipalTrue(ana.getId())
                .orElseThrow().getId();

        EnderecoResponse novo = enderecoService.criar(ana.getId(), pedido("04538133", "200", true));

        assertThat(novo.principal()).isTrue();
        assertThat(enderecoRepository.findById(idAnterior).orElseThrow().isPrincipal()).isFalse();
        assertThat(quantosPrincipais(ana.getId())).isEqualTo(1);
    }

    @Test
    @DisplayName("REGRA 2: definir como principal quem ja e principal e idempotente")
    void definirPrincipalIdempotente() {
        autenticarComo(ana);

        Long idPrincipal = enderecoRepository.findByUsuarioIdAndPrincipalTrue(ana.getId())
                .orElseThrow().getId();

        EnderecoResponse resultado = enderecoService.definirPrincipal(ana.getId(), idPrincipal);

        assertThat(resultado.principal()).isTrue();
        assertThat(quantosPrincipais(ana.getId())).isEqualTo(1);
    }

    // ==================================================================
    // REGRA 3 - excluir o principal promove outro
    // ==================================================================

    @Test
    @DisplayName("REGRA 3: excluir o principal promove o endereco mais antigo restante")
    void excluirPrincipalPromoveSucessor() {
        autenticarComo(ana);

        Long idPrincipalOriginal = enderecoRepository.findByUsuarioIdAndPrincipalTrue(ana.getId())
                .orElseThrow().getId();

        EnderecoResponse segundo = enderecoService.criar(ana.getId(), pedido("04538133", "200", false));
        EnderecoResponse terceiro = enderecoService.criar(ana.getId(), pedido("01001000", "300", false));

        enderecoService.excluir(ana.getId(), idPrincipalOriginal);

        assertThat(enderecoRepository.findById(idPrincipalOriginal)).isEmpty();
        assertThat(quantosPrincipais(ana.getId())).isEqualTo(1);

        // O sucessor e o mais antigo restante, nao o mais recente.
        Endereco novoPrincipal = enderecoRepository
                .findByUsuarioIdAndPrincipalTrue(ana.getId()).orElseThrow();
        assertThat(novoPrincipal.getId()).isEqualTo(segundo.id());
        assertThat(novoPrincipal.getId()).isNotEqualTo(terceiro.id());
    }

    @Test
    @DisplayName("REGRA 3: excluir um endereco NAO principal nao promove ninguem")
    void excluirNaoPrincipalNaoPromove() {
        autenticarComo(ana);

        Long idPrincipal = enderecoRepository.findByUsuarioIdAndPrincipalTrue(ana.getId())
                .orElseThrow().getId();
        EnderecoResponse secundario = enderecoService.criar(ana.getId(), pedido("04538133", "200", false));

        enderecoService.excluir(ana.getId(), secundario.id());

        assertThat(enderecoRepository.findByUsuarioIdAndPrincipalTrue(ana.getId())
                .orElseThrow().getId()).isEqualTo(idPrincipal);
        assertThat(quantosPrincipais(ana.getId())).isEqualTo(1);
    }

    // ==================================================================
    // Decisoes registradas no PLAN.md
    // ==================================================================

    @Test
    @DisplayName("PLAN.md: o primeiro endereco de um usuario vira principal automaticamente")
    void primeiroEnderecoViraPrincipal() {
        autenticarComoAdmin();
        Long idAdmin = admin().getId();

        // O admin do seed nao tem endereco nenhum.
        assertThat(enderecoRepository.existsByUsuarioId(idAdmin)).isFalse();

        // Pedido explicitamente com principal=false.
        EnderecoResponse primeiro = enderecoService.criar(idAdmin, pedido("01310100", "1", false));

        assertThat(primeiro.principal())
                .as("primeiro endereco deve ser principal mesmo com principal=false no pedido")
                .isTrue();
    }

    @Test
    @DisplayName("PLAN.md: excluir o unico endereco deixa o usuario com zero, sem erro")
    void excluirUltimoEndereco() {
        autenticarComo(bruno);

        // Zera o estado em vez de assumir o seed: outro teste ou uma execucao
        // manual contra o mesmo banco pode ter mexido nos enderecos do Bruno.
        for (var e : enderecoService.listarDoUsuario(bruno.getId())) {
            enderecoService.excluir(bruno.getId(), e.id());
        }
        EnderecoResponse unico = enderecoService.criar(bruno.getId(), pedido("01001000", "1", false));
        assertThat(enderecoRepository.countByUsuarioId(bruno.getId())).isEqualTo(1);
        assertThat(unico.principal()).isTrue();

        enderecoService.excluir(bruno.getId(), unico.id());

        assertThat(enderecoRepository.countByUsuarioId(bruno.getId())).isZero();
        assertThat(enderecoRepository.findByUsuarioIdAndPrincipalTrue(bruno.getId())).isEmpty();
    }

    // ==================================================================
    // Autorizacao
    // ==================================================================

    @Test
    @DisplayName("admin cria endereco PARA OUTRO usuario pelas mesmas rotas")
    void adminCriaParaOutroUsuario() {
        autenticarComoAdmin();

        EnderecoResponse criado = enderecoService.criar(ana.getId(), pedido("04538133", "999", false));

        assertThat(criado.id()).isNotNull();
        assertThat(enderecoRepository.findById(criado.id()).orElseThrow()
                .getUsuario().getId()).isEqualTo(ana.getId());
    }

    @Test
    @DisplayName("usuario comum NAO cria endereco para outro usuario")
    void usuarioComumNaoCriaParaOutro() {
        autenticarComo(ana);

        assertThatThrownBy(() -> enderecoService.criar(bruno.getId(), pedido("04538133", "1", false)))
                .isInstanceOf(AcessoNegadoException.class);
    }

    @Test
    @DisplayName("usuario comum NAO exclui endereco de outro usuario")
    void usuarioComumNaoExcluiDeOutro() {
        Long idDeBruno = enderecoRepository.findByUsuarioIdAndPrincipalTrue(bruno.getId())
                .orElseThrow().getId();
        autenticarComo(ana);

        assertThatThrownBy(() -> enderecoService.excluir(bruno.getId(), idDeBruno))
                .isInstanceOf(AcessoNegadoException.class);
    }

    @Test
    @DisplayName("endereco de outro usuario nao e alcancavel nem pela rota do proprio dono")
    void idDeOutroUsuarioNaoEAlcancavel() {
        Long idDeBruno = enderecoRepository.findByUsuarioIdAndPrincipalTrue(bruno.getId())
                .orElseThrow().getId();
        autenticarComo(ana);

        // Ana pede, na PROPRIA rota, o id de um endereco do Bruno.
        assertThatThrownBy(() -> enderecoService.buscar(ana.getId(), idDeBruno))
                .isInstanceOf(RecursoNaoEncontradoException.class);
    }

    @Test
    @DisplayName("listagem global de enderecos e restrita a admin")
    void listagemGlobalSoAdmin() {
        autenticarComo(ana);

        assertThatThrownBy(() -> enderecoService.listarTodos(PageRequest.of(0, 20)))
                .isInstanceOf(AcessoNegadoException.class);
    }

    @Test
    @DisplayName("listagem global traz o dono de cada endereco")
    void listagemGlobalTrazDono() {
        autenticarComoAdmin();

        var pagina = enderecoService.listarTodos(PageRequest.of(0, 20));

        assertThat(pagina.conteudo()).isNotEmpty();
        assertThat(pagina.conteudo()).allSatisfy(e -> {
            assertThat(e.usuarioId()).isNotNull();
            assertThat(e.usuarioNome()).isNotBlank();
        });
    }

    // ==================================================================
    // Normalizacao e atualizacao
    // ==================================================================

    @Test
    @DisplayName("CEP com mascara e UF minuscula sao normalizados antes de gravar")
    void normalizaEntrada() {
        autenticarComo(ana);

        var comMascara = new CriarEnderecoRequest("01310-100", "Avenida Paulista", "1578",
                "   ", "Bela Vista", "Sao Paulo", "sp", false);

        EnderecoResponse criado = enderecoService.criar(ana.getId(), comMascara);

        assertThat(criado.cep()).isEqualTo("01310100");
        assertThat(criado.uf()).isEqualTo("SP");
        assertThat(criado.complemento()).as("complemento em branco vira nulo").isNull();
    }

    @Test
    @DisplayName("atualizar altera os dados sem mexer no principal")
    void atualizarNaoMexeNoPrincipal() {
        autenticarComo(ana);

        Long idPrincipal = enderecoRepository.findByUsuarioIdAndPrincipalTrue(ana.getId())
                .orElseThrow().getId();

        var req = new AtualizarEnderecoRequest("04538-133", "Avenida Brigadeiro Faria Lima",
                "3477", "Andar 10", "Itaim Bibi", "Sao Paulo", "sp");

        EnderecoResponse atualizado = enderecoService.atualizar(ana.getId(), idPrincipal, req);

        assertThat(atualizado.cep()).isEqualTo("04538133");
        assertThat(atualizado.numero()).isEqualTo("3477");
        assertThat(atualizado.complemento()).isEqualTo("Andar 10");
        assertThat(atualizado.principal()).as("atualizar nao altera principal").isTrue();
        assertThat(quantosPrincipais(ana.getId())).isEqualTo(1);
    }

    @Test
    @DisplayName("listagem do usuario devolve o principal primeiro")
    void principalPrimeiroNaListagem() {
        autenticarComo(ana);

        enderecoService.criar(ana.getId(), pedido("04538133", "200", false));
        enderecoService.criar(ana.getId(), pedido("01001000", "300", true));

        List<EnderecoResponse> lista = enderecoService.listarDoUsuario(ana.getId());

        assertThat(lista).hasSizeGreaterThanOrEqualTo(3);
        assertThat(lista.get(0).principal()).isTrue();
        assertThat(lista.subList(1, lista.size())).allMatch(e -> !e.principal());
    }
}
