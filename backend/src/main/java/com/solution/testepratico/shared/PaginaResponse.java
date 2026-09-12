package com.solution.testepratico.shared;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * Envelope de paginacao proprio.
 *
 * Serializar o Page do Spring Data direto no JSON amarra o contrato da API a
 * uma classe interna do framework, cujo formato ja mudou entre versoes. Um
 * record de cinco campos deixa o contrato estavel e obvio para o frontend.
 */
public record PaginaResponse<T>(
        List<T> conteudo,
        int pagina,
        int tamanho,
        long totalElementos,
        int totalPaginas) {

    public static <E, T> PaginaResponse<T> de(Page<E> page, Function<E, T> mapeador) {
        return new PaginaResponse<>(
                page.getContent().stream().map(mapeador).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }
}
