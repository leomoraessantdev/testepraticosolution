package com.solution.testepratico.api;

import com.solution.testepratico.endereco.EnderecoRepository;
import com.solution.testepratico.seguranca.JwtService;
import com.solution.testepratico.usuario.Usuario;
import com.solution.testepratico.usuario.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * O contrato HTTP: qual STATUS cada regra produz.
 *
 * Por que esta classe existe, tendo ControleAcessoTest e EnderecoServiceIT:
 * aqueles provam que a regra lanca AcessoNegadoException. Nenhum dos dois prova
 * que a excecao virou 403 na resposta. Essa traducao mora no
 * GlobalExceptionHandler e nos handlers da SecurityConfig, e e exatamente o que
 * o frontend consome. Trocar FORBIDDEN por BAD_REQUEST no handler passaria
 * limpo por toda a suite anterior.
 *
 * Atravessa a pilha inteira - filtro JWT, autorizacao por rota, controller,
 * service, banco, serializacao do erro - com MockMvc em vez de porta TCP:
 * MockMvc roda na mesma thread do teste, entao a transacao do teste vale para a
 * requisicao e e revertida no final. Com TestRestTemplate em porta real, cada
 * requisicao correria em outra thread, commitaria de verdade e sujaria o banco.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ContratoHttpIT {

    private static final String CPF_DA_ANA = "11144477735";
    private static final String CPF_DO_BRUNO = "39053344705";
    private static final String CPF_LIVRE = "12345678909";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EnderecoRepository enderecoRepository;

    private Usuario ana;
    private Usuario bruno;
    private String tokenDaAna;
    private Long enderecoDoBruno;

    @BeforeEach
    void prepararAtores() {
        ana = usuarioRepository.findByCpf(CPF_DA_ANA).orElseThrow();
        bruno = usuarioRepository.findByCpf(CPF_DO_BRUNO).orElseThrow();

        // Token assinado de verdade pelo JwtService, e nao um @WithMockUser: o
        // objetivo e exercitar o JwtAuthenticationFilter junto com o resto.
        tokenDaAna = jwtService.gerarToken(ana);

        enderecoDoBruno = enderecoRepository
                .findByUsuarioIdAndPrincipalTrue(bruno.getId()).orElseThrow().getId();
    }

    private String comoAna() {
        return "Bearer " + tokenDaAna;
    }

    private String corpoDeCadastro(String cpf, String email) {
        return """
                {"nome":"Fulano de Tal","cpf":"%s","email":"%s",
                 "dataNascimento":"1990-05-20","senha":"senhaSegura123"}
                """.formatted(cpf, email);
    }

    // ==================================================================
    // 403 - usuario comum tocando dado de outro usuario
    // ==================================================================

    @Test
    @DisplayName("403: usuario comum listando os enderecos de OUTRO usuario")
    void listarEnderecoDeOutroUsuarioDa403() throws Exception {
        mockMvc.perform(get("/api/usuarios/{id}/enderecos", bruno.getId())
                        .header("Authorization", comoAna()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.erro").value("Acesso negado"))
                // O payload de erro segue o formato unico da API, e nao o
                // default do Spring: o frontend trata um shape so.
                .andExpect(jsonPath("$.caminho")
                        .value("/api/usuarios/" + bruno.getId() + "/enderecos"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @DisplayName("403: usuario comum GRAVANDO endereco para outro usuario")
    void criarEnderecoParaOutroUsuarioDa403() throws Exception {
        String corpo = """
                {"cep":"01310-100","logradouro":"Avenida Paulista","numero":"1578",
                 "bairro":"Bela Vista","cidade":"Sao Paulo","uf":"SP","principal":true}
                """;

        // Conta ANTES em vez de fixar o numero do seed: se alguem rodar a
        // aplicacao a mao contra o mesmo banco e cadastrar um endereco para o
        // Bruno, o teste deve continuar falhando so pela regra.
        long antes = enderecoRepository.countByUsuarioId(bruno.getId());

        mockMvc.perform(post("/api/usuarios/{id}/enderecos", bruno.getId())
                        .header("Authorization", comoAna())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isForbidden());

        // Leitura barrada importa; escrita barrada importa mais. Confirma que
        // nada foi gravado na conta do Bruno.
        assertThat(enderecoRepository.countByUsuarioId(bruno.getId())).isEqualTo(antes);
    }

    @Test
    @DisplayName("404: id de endereco de outro usuario, pedido na PROPRIA rota")
    void idDeOutroUsuarioNaPropriaRotaDa404() throws Exception {
        // Caminho de vazamento diferente do anterior: a URL e legitima (Ana
        // pedindo na rota da Ana), so o id do endereco e de outra pessoa. A
        // consulta filtra por dono, entao o registro nao existe para ela.
        // 404 e nao 403 de proposito: aqui um 403 confirmaria que aquele id
        // existe em alguma conta.
        mockMvc.perform(get("/api/usuarios/{usuarioId}/enderecos/{enderecoId}",
                        ana.getId(), enderecoDoBruno)
                        .header("Authorization", comoAna()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("200: a mesma rota funciona para o proprio dono")
    void proprioDonoAcessaNormalmente() throws Exception {
        // Controle positivo. Sem ele, um 403 causado por token quebrado ou
        // filtro mal configurado passaria como se fosse a regra funcionando.
        mockMvc.perform(get("/api/usuarios/{id}/enderecos", ana.getId())
                        .header("Authorization", comoAna()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].principal").value(true));
    }

    // ==================================================================
    // 401 x 403 - nao autenticado nao e o mesmo que sem permissao
    // ==================================================================

    @Test
    @DisplayName("401 sem token, 403 com token de quem nao pode: status diferentes")
    void distingue401De403() throws Exception {
        // Sem credencial nenhuma -> 401, com a semantica correta de
        // "autentique-se". Um 403 aqui diria ao cliente que nao vale a pena
        // tentar fazer login.
        mockMvc.perform(get("/api/usuarios/{id}/enderecos", bruno.getId()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));

        // Token valido, mas de quem nao tem permissao -> 403.
        mockMvc.perform(get("/api/usuarios/{id}/enderecos", bruno.getId())
                        .header("Authorization", comoAna()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("401: token com assinatura invalida nao autentica")
    void tokenForjadoDa401() throws Exception {
        mockMvc.perform(get("/api/usuarios/{id}/enderecos", ana.getId())
                        .header("Authorization", "Bearer nao.e.um.jwt.valido"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("403: usuario comum na rota administrativa, barrado antes do controller")
    void rotaDeAdminDa403ParaUsuarioComum() throws Exception {
        mockMvc.perform(get("/api/usuarios").header("Authorization", comoAna()))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/enderecos").header("Authorization", comoAna()))
                .andExpect(status().isForbidden());
    }

    // ==================================================================
    // Cadastro - 409 para conflito, 400 para corpo invalido
    // ==================================================================

    @Test
    @DisplayName("409: CPF duplicado e conflito de estado, nao erro de requisicao")
    void cpfDuplicadoDa409() throws Exception {
        // 409 e nao 400: o corpo enviado esta correto, o cliente nao tem o que
        // consertar nele. O conflito e com o estado atual do sistema.
        mockMvc.perform(post("/api/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDeCadastro(CPF_DA_ANA, "novo@exemplo.com")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    @DisplayName("409: CPF duplicado COM MASCARA tambem, pela mesma rota publica")
    void cpfDuplicadoComMascaraDa409() throws Exception {
        mockMvc.perform(post("/api/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDeCadastro("111.444.777-35", "novo@exemplo.com")))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("400: CPF com digito verificador errado, apontando o campo cpf")
    void cpfInvalidoDa400ComOCampoApontado() throws Exception {
        // 52998224724 passa em qualquer regex de 11 digitos e reprova no
        // calculo do digito verificador.
        mockMvc.perform(post("/api/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDeCadastro("52998224724", "novo@exemplo.com")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                // A lista de campos e o que permite o formulario marcar o input
                // errado, em vez de mostrar um alerta generico.
                .andExpect(jsonPath("$.campos[*].campo", hasItem("cpf")));
    }

    @Test
    @DisplayName("400: CPF de sequencia repetida nao passa so por ter 11 digitos")
    void cpfDeSequenciaRepetidaDa400() throws Exception {
        mockMvc.perform(post("/api/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDeCadastro("11111111111", "novo@exemplo.com")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos[*].campo", hasItem("cpf")));
    }

    // ==================================================================
    // O que nunca pode sair na resposta
    // ==================================================================

    @Test
    @DisplayName("a senha nunca aparece na resposta, nem em texto puro nem como hash")
    void senhaNuncaSaiNaResposta() throws Exception {
        String respostaDoCadastro = mockMvc.perform(post("/api/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoDeCadastro(CPF_LIVRE, "livre@exemplo.com")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.senha").doesNotExist())
                .andExpect(jsonPath("$.senhaHash").doesNotExist())
                .andReturn().getResponse().getContentAsString();

        // Checagem no texto cru tambem: um campo renomeado escaparia dos
        // jsonPath acima, mas nao do prefixo do BCrypt.
        assertThat(respostaDoCadastro)
                .doesNotContain("senhaSegura123")
                .doesNotContain("$2b$")
                .doesNotContain("$2a$");

        String respostaDoPerfil = mockMvc.perform(get("/api/usuarios/me")
                        .header("Authorization", comoAna()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertThat(respostaDoPerfil).doesNotContain("$2b$").doesNotContain("$2a$");
    }

    @Test
    @DisplayName("mandar role=ADMIN no corpo do cadastro NAO promove ninguem")
    void roleNoCorpoNaoPromove() throws Exception {
        // O DTO nao tem campo role e o Jackson ignora propriedade desconhecida,
        // entao o campo e descartado em silencio. Este teste existe para que
        // alguem que adicione "role" ao DTO no futuro quebre aqui.
        String corpoMalicioso = """
                {"nome":"Fulano de Tal","cpf":"12345678909","email":"livre@exemplo.com",
                 "dataNascimento":"1990-05-20","senha":"senhaSegura123","role":"ADMIN"}
                """;

        mockMvc.perform(post("/api/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoMalicioso))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("USUARIO_COMUM"));
    }

    @Test
    @DisplayName("404: URL que nao existe na API, e nao 500")
    void urlInexistenteDa404() throws Exception {
        // Antes do handler de NoResourceFoundException isto respondia 500: a
        // requisicao caia no @ExceptionHandler(Exception.class) e o cliente era
        // informado de uma falha do servidor quando o errado era o caminho.
        mockMvc.perform(get("/api/rota-que-nao-existe")
                        .header("Authorization", comoAna()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
