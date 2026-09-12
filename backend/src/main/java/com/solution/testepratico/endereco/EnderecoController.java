package com.solution.testepratico.endereco;

import com.solution.testepratico.endereco.dto.EnderecoResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Rota aninhada: o endereco so existe no contexto de um usuario, e a URL
 * carrega o dono. Isso torna a verificacao de propriedade obvia e obrigatoria
 * em todo endpoint deste controller.
 */
@RestController
@RequestMapping("/api/usuarios/{usuarioId}/enderecos")
public class EnderecoController {

    private final EnderecoService enderecoService;

    public EnderecoController(EnderecoService enderecoService) {
        this.enderecoService = enderecoService;
    }

    @GetMapping
    public ResponseEntity<List<EnderecoResponse>> listar(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(enderecoService.listarDoUsuario(usuarioId));
    }
}
