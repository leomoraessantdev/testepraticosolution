package com.solution.testepratico.endereco;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EnderecoRepository extends JpaRepository<Endereco, Long> {

    /** Principal primeiro, depois ordem estavel de cadastro. */
    List<Endereco> findByUsuarioIdOrderByPrincipalDescIdAsc(Long usuarioId);

    /**
     * Busca com dono no filtro. Evita que um usuario leia ou edite endereco
     * de outro so por conhecer o id: o registro simplesmente nao e encontrado.
     */
    Optional<Endereco> findByIdAndUsuarioId(Long id, Long usuarioId);

    Optional<Endereco> findByUsuarioIdAndPrincipalTrue(Long usuarioId);

    boolean existsByUsuarioId(Long usuarioId);

    long countByUsuarioId(Long usuarioId);

    /**
     * Rebaixa o principal atual do usuario.
     *
     * flushAutomatically: descarrega alteracoes pendentes do contexto antes
     * do UPDATE, para o bulk nao passar na frente de escritas ja enfileiradas.
     * clearAutomatically: limpa o contexto depois, porque bulk update em JPQL
     * vai direto ao banco e deixaria em memoria objetos com principal=true
     * desatualizado.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Endereco e SET e.principal = false "
         + "WHERE e.usuario.id = :usuarioId AND e.principal = true")
    int rebaixarPrincipalAtual(@Param("usuarioId") Long usuarioId);
}
