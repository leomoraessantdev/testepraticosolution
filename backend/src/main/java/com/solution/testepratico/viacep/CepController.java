package com.solution.testepratico.viacep;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * A consulta de CEP passa pelo backend, e nao direto do navegador para o
 * ViaCEP. Tres motivos:
 *
 * 1. Cache compartilhado. No navegador, cada usuario consultaria de novo.
 * 2. O formato de resposta fica sob nosso controle e casa com o de Endereco.
 * 3. Trocar de provedor nao exige mexer no frontend.
 */
@RestController
@RequestMapping("/api/cep")
public class CepController {

    private final CepService cepService;

    public CepController(CepService cepService) {
        this.cepService = cepService;
    }

    @GetMapping("/{cep}")
    public ResponseEntity<CepResponse> consultar(@PathVariable String cep) {
        return ResponseEntity.ok(cepService.consultar(cep));
    }
}
