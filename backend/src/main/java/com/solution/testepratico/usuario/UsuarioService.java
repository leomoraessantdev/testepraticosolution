package com.solution.testepratico.usuario;

import com.solution.testepratico.endereco.EnderecoService;
import com.solution.testepratico.seguranca.ControleAcesso;
import com.solution.testepratico.shared.exception.RecursoNaoEncontradoException;
import com.solution.testepratico.usuario.dto.UsuarioDetalheResponse;
import com.solution.testepratico.usuario.dto.UsuarioResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final EnderecoService enderecoService;
    private final ControleAcesso controleAcesso;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          EnderecoService enderecoService,
                          ControleAcesso controleAcesso) {
        this.usuarioRepository = usuarioRepository;
        this.enderecoService = enderecoService;
        this.controleAcesso = controleAcesso;
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
        return usuarioRepository.findAll().stream().map(UsuarioResponse::de).toList();
    }
}
