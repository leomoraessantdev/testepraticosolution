package com.solution.testepratico.usuario;

import com.solution.testepratico.endereco.EnderecoService;
import com.solution.testepratico.seguranca.ControleAcesso;
import com.solution.testepratico.shared.CpfUtils;
import com.solution.testepratico.shared.exception.CpfDuplicadoException;
import com.solution.testepratico.shared.exception.RecursoNaoEncontradoException;
import com.solution.testepratico.usuario.dto.CriarUsuarioRequest;
import com.solution.testepratico.usuario.dto.UsuarioDetalheResponse;
import com.solution.testepratico.usuario.dto.UsuarioResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final EnderecoService enderecoService;
    private final ControleAcesso controleAcesso;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          EnderecoService enderecoService,
                          ControleAcesso controleAcesso,
                          PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.enderecoService = enderecoService;
        this.controleAcesso = controleAcesso;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Cadastro. Rota publica: quem se cadastra ainda nao tem token.
     *
     * O perfil e SEMPRE USUARIO_COMUM, fixo no codigo. O DTO de entrada nem tem
     * campo role, entao nao existe caminho para alguem se autopromover.
     *
     * A checagem de duplicidade acontece aqui para o cliente receber mensagem
     * util. O indice unico do banco continua sendo a garantia de verdade: entre
     * a consulta e o insert cabe outra requisicao gravando o mesmo CPF, e nesse
     * caso a violacao vira 409 pelo GlobalExceptionHandler. Mesma divisao de
     * sempre: o service cuida do caminho feliz, o banco da invariante.
     */
    @Transactional
    public UsuarioResponse criar(CriarUsuarioRequest request) {
        String cpf = CpfUtils.normalizar(request.cpf());

        if (usuarioRepository.existsByCpf(cpf)) {
            throw new CpfDuplicadoException();
        }

        Usuario usuario = new Usuario(
                request.nome().trim(),
                cpf,
                request.dataNascimento(),
                passwordEncoder.encode(request.senha()),
                Role.USUARIO_COMUM);

        // Usuario recem-criado nao tem endereco: a contagem e zero por definicao,
        // sem precisar consultar o banco para descobrir isso.
        return UsuarioResponse.de(usuarioRepository.save(usuario), 0L);
    }

    /**
     * Dados do usuario mais a lista de enderecos.
     *
     * Compoe via EnderecoService, e nao via EnderecoRepository, para o
     * repository seguir privado ao seu proprio pacote. A checagem de acesso
     * acaba rodando duas vezes, aqui e la dentro: e idempotente e barata, e o
     * custo de esquece-la seria alto demais para depender de quem chama.
     */
    @Transactional(readOnly = true)
    public UsuarioDetalheResponse buscarPorId(Long id) {
        // ============== A CHECAGEM DE PROPRIEDADE ACONTECE AQUI ==============
        controleAcesso.exigirAcessoAoUsuario(id);
        // =====================================================================

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Usuario " + id + " nao encontrado."));

        return UsuarioDetalheResponse.de(usuario, enderecoService.listarDoUsuario(id));
    }

    /** O proprio usuario logado, com enderecos. Nao recebe id: le do token. */
    @Transactional(readOnly = true)
    public UsuarioDetalheResponse buscarUsuarioAtual() {
        return buscarPorId(controleAcesso.idDoUsuarioAtual());
    }

    /**
     * Restrita a ADMIN. Ja barrada por rota na SecurityConfig; a chamada aqui
     * e a segunda barreira, para a regra nao depender do arquivo de rotas.
     *
     * Sem enderecos: listagem carrega o resumo, o detalhe carrega o todo.
     */
    @Transactional(readOnly = true)
    public List<UsuarioResponse> listarTodos() {
        controleAcesso.exigirAdmin();
        Map<Long, Long> enderecosPorUsuario = enderecoService.contarEnderecosPorUsuario();

        // Duas consultas no total: uma para os usuarios, uma agregada para as
        // contagens. Nunca uma por usuario - e o ponto da consulta com GROUP BY.
        return usuarioRepository.findAll().stream()
                .map(usuario -> UsuarioResponse.de(
                        usuario,
                        // Quem nao tem endereco nao aparece na agregacao.
                        enderecosPorUsuario.getOrDefault(usuario.getId(), 0L)))
                .toList();
    }
}
