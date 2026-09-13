package com.solution.testepratico.endereco;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
     * Busca com o dono no filtro. Evita que um usuario leia ou edite endereco
     * de outro so por conhecer o id: o registro simplesmente nao e encontrado.
     */
    Optional<Endereco> findByIdAndUsuarioId(Long id, Long usuarioId);

    boolean existsByIdAndUsuarioId(Long id, Long usuarioId);

    Optional<Endereco> findByUsuarioIdAndPrincipalTrue(Long usuarioId);

    /**
     * O sucessor quando o principal e excluido: o mais antigo restante.
     * Criterio arbitrario porem estavel e explicavel — o alfabetico mudaria com
     * uma edicao de logradouro, o mais recente favoreceria um cadastro de teste.
     */
    Optional<Endereco> findFirstByUsuarioIdOrderByIdAsc(Long usuarioId);

    boolean existsByUsuarioId(Long usuarioId);

    long countByUsuarioId(Long usuarioId);

    /**
     * JOIN FETCH carrega o usuario na mesma consulta. Sem isso, montar a lista
     * do admin com nome do dono dispararia uma query por endereco (N+1).
     *
     * Paginar com JOIN FETCH e seguro aqui porque a associacao e ManyToOne e
     * nao multiplica linhas. Com colecao (OneToMany) o Hibernate teria de
     * paginar em memoria.
     *
     * O ORDER BY nao e cosmetico. Consulta paginada SEM ordenacao explicita nao
     * tem ordem garantida: o Postgres pode devolver as linhas em ordem
     * diferente a cada execucao, e entao a mesma linha aparece em duas paginas
     * enquanto outra nunca aparece. O criterio agrupa por dono e poe o
     * principal na frente, e termina em e.id, que e unico - sem esse desempate
     * final, linhas do mesmo usuario com o mesmo valor de principal voltariam a
     * ficar sem ordem definida.
     */
    @Query(value = "SELECT e FROM Endereco e JOIN FETCH e.usuario u "
                 + "ORDER BY u.nome ASC, e.principal DESC, e.id ASC",
           countQuery = "SELECT count(e) FROM Endereco e")
    Page<Endereco> buscarTodosComUsuario(Pageable pageable);

    /**
     * Rebaixa o principal atual do usuario.
     *
     * flushAutomatically: descarrega alteracoes pendentes do contexto antes do
     * UPDATE, para o bulk nao passar na frente de escritas ja enfileiradas.
     * clearAutomatically: limpa o contexto depois, porque bulk update em JPQL
     * vai direto ao banco e deixaria em memoria objetos com principal=true
     * desatualizado. Consequencia pratica: qualquer entidade carregada ANTES
     * desta chamada fica destacada, entao o codigo sempre carrega depois.
     */
    /**
     * Quantos enderecos cada usuario tem, em UMA consulta agregada.
     *
     * Existe para a listagem do admin mostrar a contagem por linha. A forma
     * ingenua - chamar countByUsuarioId dentro do laco que monta a lista - seria
     * um N+1 classico: 3 usuarios viram 4 consultas, 500 usuarios viram 501. O
     * GROUP BY resolve com uma so, independente do numero de usuarios.
     *
     * Usuario SEM endereco nao aparece no resultado, porque a agregacao parte da
     * tabela de enderecos. Quem consome trata a ausencia como zero.
     */
    @Query("SELECT e.usuario.id AS usuarioId, COUNT(e) AS total "
         + "FROM Endereco e GROUP BY e.usuario.id")
    List<ContagemDeEnderecos> contarPorUsuario();

    /** Projecao da consulta agregada acima. */
    interface ContagemDeEnderecos {
        Long getUsuarioId();

        long getTotal();
    }

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Endereco e SET e.principal = false "
         + "WHERE e.usuario.id = :usuarioId AND e.principal = true")
    int rebaixarPrincipalAtual(@Param("usuarioId") Long usuarioId);
}
