package com.solution.testepratico.usuario;

import com.solution.testepratico.usuario.dto.UsuarioDetalheResponse;
import com.solution.testepratico.usuario.dto.UsuarioResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Leitura de usuario. O CRUD de usuario entra na proxima etapa; esta classe
 * cobre o GET de um usuario especifico com seus enderecos, pedido na 2.3.
 *
 * Sem verificacao de permissao aqui: o controller cuida de HTTP, o service
 * cuida da regra.
 */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public ResponseEntity<List<UsuarioResponse>> listar() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioDetalheResponse> eu() {
        return ResponseEntity.ok(usuarioService.buscarUsuarioAtual());
    }

    /** Dados do usuario mais a lista de enderecos dele. */
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioDetalheResponse> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.buscarPorId(id));
    }
}
