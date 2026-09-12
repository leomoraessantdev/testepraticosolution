package com.solution.testepratico.shared.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

/**
 * Traduz excecao de dominio em resposta HTTP, num lugar so.
 *
 * Sem isso, ou cada controller repete try/catch, ou o Spring devolve 500 com
 * stack trace — vazando nome de tabela, de coluna e caminho de pacote.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(CredenciaisInvalidasException.class)
    public ResponseEntity<ApiError> credenciaisInvalidas(CredenciaisInvalidasException e,
                                                         HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, "Nao autorizado", e.getMessage(), req);
    }

    @ExceptionHandler(AcessoNegadoException.class)
    public ResponseEntity<ApiError> acessoNegado(AcessoNegadoException e,
                                                 HttpServletRequest req) {
        // WARN, nao ERROR: nao e defeito da aplicacao, mas deixa rastro de
        // tentativa de acesso indevido para auditoria.
        log.warn("Acesso negado em {}: {}", req.getRequestURI(), e.getMessage());
        return build(HttpStatus.FORBIDDEN, "Acesso negado", e.getMessage(), req);
    }

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<ApiError> naoEncontrado(RecursoNaoEncontradoException e,
                                                  HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, "Nao encontrado", e.getMessage(), req);
    }

    @ExceptionHandler(RegraDeNegocioException.class)
    public ResponseEntity<ApiError> regraDeNegocio(RegraDeNegocioException e,
                                                   HttpServletRequest req) {
        return build(HttpStatus.UNPROCESSABLE_ENTITY, "Regra de negocio", e.getMessage(), req);
    }

    /** Falhas de Bean Validation: 400 com a lista de campos que reprovaram. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validacao(MethodArgumentNotValidException e,
                                              HttpServletRequest req) {
        List<ApiError.CampoInvalido> campos = e.getBindingResult().getFieldErrors().stream()
                .map(f -> new ApiError.CampoInvalido(f.getField(), f.getDefaultMessage()))
                .toList();

        return ResponseEntity.badRequest().body(ApiError.comCampos(
                HttpStatus.BAD_REQUEST.value(), "Dados invalidos",
                "Um ou mais campos estao invalidos.", req.getRequestURI(), campos));
    }

    /**
     * Rede de seguranca das constraints do banco. Chega aqui, por exemplo, se
     * duas requisicoes simultaneas tentarem marcar enderecos diferentes como
     * principal: uma commita, a outra viola o indice unico parcial.
     * 409 Conflict e a traducao correta — o cliente pode simplesmente repetir.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> integridade(DataIntegrityViolationException e,
                                                HttpServletRequest req) {
        log.warn("Violacao de integridade em {}: {}", req.getRequestURI(), e.getMostSpecificCause().getMessage());
        return build(HttpStatus.CONFLICT, "Conflito",
                "A operacao conflita com o estado atual dos dados.", req);
    }

    /**
     * Ultimo recurso. Loga o stack trace no servidor e devolve mensagem
     * generica ao cliente: detalhe interno nao vaza pela API.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> inesperado(Exception e, HttpServletRequest req) {
        log.error("Erro nao tratado em {}", req.getRequestURI(), e);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno",
                "Ocorreu um erro inesperado.", req);
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String erro,
                                           String mensagem, HttpServletRequest req) {
        return ResponseEntity.status(status)
                .body(ApiError.de(status.value(), erro, mensagem, req.getRequestURI()));
    }
}
