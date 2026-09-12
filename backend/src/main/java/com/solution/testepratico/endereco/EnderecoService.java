package com.solution.testepratico.endereco;

import com.solution.testepratico.endereco.dto.EnderecoResponse;
import com.solution.testepratico.seguranca.ControleAcesso;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EnderecoService {

    private final EnderecoRepository enderecoRepository;
    private final ControleAcesso controleAcesso;

    public EnderecoService(EnderecoRepository enderecoRepository, ControleAcesso controleAcesso) {
        this.enderecoRepository = enderecoRepository;
        this.controleAcesso = controleAcesso;
    }

    @Transactional(readOnly = true)
    public List<EnderecoResponse> listarDoUsuario(Long usuarioId) {
        // ================= A MESMA CHECAGEM, O MESMO METODO =================
        controleAcesso.exigirAcessoAoUsuario(usuarioId);
        // ====================================================================

        // Defesa em profundidade: a consulta ja filtra por dono. Mesmo que a
        // linha acima fosse removida por engano, esta query nunca devolveria
        // endereco de outro usuario — no maximo uma lista vazia.
        return enderecoRepository.findByUsuarioIdOrderByPrincipalDescIdAsc(usuarioId)
                .stream().map(EnderecoResponse::de).toList();
    }
}
