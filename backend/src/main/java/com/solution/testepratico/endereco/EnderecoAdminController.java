package com.solution.testepratico.endereco;

import com.solution.testepratico.endereco.dto.EnderecoAdminResponse;
import com.solution.testepratico.shared.PaginaResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Listagem global de enderecos, fora do contexto de um usuario. Restrita a
 * ADMIN em duas camadas: por rota na SecurityConfig e por
 * ControleAcesso.exigirAdmin dentro do service.
 *
 * Controller separado porque a raiz da rota e outra. Nao ha como colocar
 * /api/enderecos junto de /api/usuarios/{id}/enderecos na mesma classe.
 *
 * Paginado por ser a unica rota cujo volume cresce com o sistema inteiro, e nao
 * com um usuario so.
 */
@RestController
@RequestMapping("/api/enderecos")
public class EnderecoAdminController {

    private final EnderecoService enderecoService;

    public EnderecoAdminController(EnderecoService enderecoService) {
        this.enderecoService = enderecoService;
    }

    @GetMapping
    public ResponseEntity<PaginaResponse<EnderecoAdminResponse>> listarTodos(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC)
            Pageable pageable) {
        return ResponseEntity.ok(enderecoService.listarTodos(pageable));
    }
}
