package com.solution.testepratico.usuario;

import com.solution.testepratico.seguranca.ControleAcesso;
import com.solution.testepratico.shared.exception.RecursoNaoEncontradoException;
import com.solution.testepratico.usuario.dto.UsuarioResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final ControleAcesso controleAcesso;

    public UsuarioService(UsuarioRepository usuarioRepository, ControleAcesso controleAcesso) {
        this.usuarioRepository = usuarioRepository;
        this.controleAcesso = controleAcesso;
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscarPorId(Long id) {
        // ============== A CHECAGEM DE PROPRIEDADE ACONTECE AQUI ==============
        // Antes de qualquer ida ao banco. O parametro "id" veio da URL, mas
        // quem decide e o id de dentro do JWT assinado.
        controleAcesso.exigirAcessoAoUsuario(id);
        // =====================================================================

        return usuarioRepository.findById(id)
                .map(UsuarioResponse::de)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Usuario " + id + " nao encontrado."));
    }

    /** O proprio usuario logado. Nao recebe id: le do token. */
    @Transactional(readOnly = true)
    public UsuarioResponse buscarUsuarioAtual() {
        Long id = controleAcesso.idDoUsuarioAtual();
        return usuarioRepository.findById(id)
                .map(UsuarioResponse::de)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Usuario " + id + " nao encontrado."));
    }

    /**
     * Restrita a ADMIN. Ja barrada por rota na SecurityConfig; a chamada aqui
     * e a segunda barreira, para a regra nao depender do arquivo de rotas.
     */
    @Transactional(readOnly = true)
    public List<UsuarioResponse> listarTodos() {
        controleAcesso.exigirAdmin();
        return usuarioRepository.findAll().stream().map(UsuarioResponse::de).toList();
    }
}
