package com.solution.testepratico.endereco;

import com.solution.testepratico.endereco.dto.AtualizarEnderecoRequest;
import com.solution.testepratico.endereco.dto.CriarEnderecoRequest;
import com.solution.testepratico.endereco.dto.EnderecoResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

/**
 * Rota aninhada: o endereco so existe no contexto de um usuario, e a URL
 * carrega o dono. Isso torna a verificacao de propriedade obrigatoria e obvia
 * em todo endpoint deste controller.
 *
 * O admin usa exatamente estas mesmas rotas para operar sobre outro usuario.
 * Nao existe endpoint paralelo de administracao: quem decide e o ControleAcesso
 * dentro do service, que libera ADMIN antes de comparar os ids.
 *
 * Nenhum metodo aqui tem regra de negocio ou verificacao de permissao. O
 * controller traduz HTTP; o service decide.
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

    @GetMapping("/{enderecoId}")
    public ResponseEntity<EnderecoResponse> buscar(@PathVariable Long usuarioId,
                                                   @PathVariable Long enderecoId) {
        return ResponseEntity.ok(enderecoService.buscar(usuarioId, enderecoId));
    }

    /** 201 com Location apontando para o recurso criado, como manda REST. */
    @PostMapping
    public ResponseEntity<EnderecoResponse> criar(@PathVariable Long usuarioId,
                                                  @Valid @RequestBody CriarEnderecoRequest request,
                                                  UriComponentsBuilder uriBuilder) {
        EnderecoResponse criado = enderecoService.criar(usuarioId, request);

        var uri = uriBuilder.path("/api/usuarios/{usuarioId}/enderecos/{enderecoId}")
                .buildAndExpand(usuarioId, criado.id())
                .toUri();

        return ResponseEntity.created(uri).body(criado);
    }

    @PutMapping("/{enderecoId}")
    public ResponseEntity<EnderecoResponse> atualizar(@PathVariable Long usuarioId,
                                                      @PathVariable Long enderecoId,
                                                      @Valid @RequestBody AtualizarEnderecoRequest request) {
        return ResponseEntity.ok(enderecoService.atualizar(usuarioId, enderecoId, request));
    }

    /**
     * PATCH, nao PUT: altera um unico atributo, nao substitui o recurso.
     * Sem corpo, porque a URL ja diz tudo: este endereco passa a ser o principal.
     */
    @PatchMapping("/{enderecoId}/principal")
    public ResponseEntity<EnderecoResponse> definirPrincipal(@PathVariable Long usuarioId,
                                                             @PathVariable Long enderecoId) {
        return ResponseEntity.ok(enderecoService.definirPrincipal(usuarioId, enderecoId));
    }

    /** 204 sem corpo: nao ha o que devolver depois de remover. */
    @DeleteMapping("/{enderecoId}")
    public ResponseEntity<Void> excluir(@PathVariable Long usuarioId,
                                        @PathVariable Long enderecoId) {
        enderecoService.excluir(usuarioId, enderecoId);
        return ResponseEntity.noContent().build();
    }
}
