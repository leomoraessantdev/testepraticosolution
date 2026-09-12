package com.solution.testepratico.auth;

import com.solution.testepratico.auth.dto.LoginRequest;
import com.solution.testepratico.auth.dto.LoginResponse;
import com.solution.testepratico.seguranca.JwtService;
import com.solution.testepratico.shared.CpfUtils;
import com.solution.testepratico.shared.exception.CredenciaisInvalidasException;
import com.solution.testepratico.usuario.Usuario;
import com.solution.testepratico.usuario.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    /**
     * Hash descartavel de um valor qualquer, usado quando o CPF nao existe.
     * Ver comentario em autenticar(): serve para igualar o tempo de resposta.
     */
    private static final String HASH_FALSO =
            "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResponse autenticar(LoginRequest request) {
        String cpf = CpfUtils.normalizar(request.cpf());

        Optional<Usuario> encontrado = usuarioRepository.findByCpf(cpf);

        // Compara a senha SEMPRE, mesmo sem usuario encontrado.
        //
        // BCrypt e deliberadamente lento (~100ms). Se o codigo retornasse cedo
        // quando o CPF nao existe, a resposta viria em ~1ms nesse caso e em
        // ~100ms quando o CPF existe. Medindo o tempo, um atacante descobriria
        // quais CPFs estao cadastrados sem nunca acertar uma senha.
        String hashParaComparar = encontrado.map(Usuario::getSenhaHash).orElse(HASH_FALSO);
        boolean senhaConfere = passwordEncoder.matches(request.senha(), hashParaComparar);

        Usuario usuario = encontrado
                .filter(u -> senhaConfere)
                .filter(Usuario::isAtivo)
                .orElseThrow(CredenciaisInvalidasException::new);

        String token = jwtService.gerarToken(usuario);

        return LoginResponse.bearer(token, jwtService.expiracaoEmSegundos(),
                usuario.getId(), usuario.getNome(), usuario.getRole());
    }
}
