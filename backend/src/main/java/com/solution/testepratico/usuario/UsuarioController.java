package com.solution.testepratico.usuario;

import com.solution.testepratico.usuario.dto.UsuarioResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Etapa 2.2: apenas leitura, para ancorar e testar o controle de acesso.
 * O CRUD completo entra na etapa 2.3.
 *
 * Note que NAO ha verificacao de permissao neste arquivo. E proposital: o
 * controller cuida de HTTP, o service cuida da regra. Se a checagem morasse
 * aqui, cada endpoint novo precisaria lembrar de repeti-la.
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
    public ResponseEntity<UsuarioResponse> eu() {
        return ResponseEntity.ok(usuarioService.buscarUsuarioAtual());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponse> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.buscarPorId(id));
    }
}
