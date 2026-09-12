package com.solution.testepratico.auth.dto;

import com.solution.testepratico.usuario.Role;

public record LoginResponse(
        String token,
        String tipo,
        long expiraEmSegundos,
        Long usuarioId,
        String nome,
        Role role) {

    public static LoginResponse bearer(String token, long expiraEmSegundos,
                                       Long usuarioId, String nome, Role role) {
        return new LoginResponse(token, "Bearer", expiraEmSegundos, usuarioId, nome, role);
    }
}
