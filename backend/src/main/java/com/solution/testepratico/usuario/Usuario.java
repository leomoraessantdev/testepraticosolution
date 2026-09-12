package com.solution.testepratico.usuario;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "usuarios")
@EntityListeners(AuditingEntityListener.class)
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nome;

    /** Somente digitos, sem mascara. E a credencial de login. */
    @Column(nullable = false, length = 11)
    private String cpf;

    @Column(nullable = false, length = 255)
    private String email;

    /**
     * Data de calendario: sem hora e sem fuso, entao LocalDate e nao Instant.
     * A data de nascimento de alguem nao muda conforme o fuso de quem le.
     */
    @Column(name = "data_nascimento", nullable = false)
    private LocalDate dataNascimento;

    @Column(name = "senha_hash", nullable = false, length = 72)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.USUARIO_COMUM;

    @Column(nullable = false)
    private boolean ativo = true;

    @CreatedDate
    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    @LastModifiedDate
    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;

    /** Exigido pela JPA. Nao usar no codigo da aplicacao. */
    protected Usuario() {
    }

    public Usuario(String nome, String cpf, String email, LocalDate dataNascimento,
                   String senhaHash, Role role) {
        this.nome = nome;
        this.cpf = cpf;
        this.email = email;
        this.dataNascimento = dataNascimento;
        this.senhaHash = senhaHash;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public void setSenhaHash(String senhaHash) {
        this.senhaHash = senhaHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public LocalDate getDataNascimento() {
        return dataNascimento;
    }

    public void setDataNascimento(LocalDate dataNascimento) {
        this.dataNascimento = dataNascimento;
    }

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }

    public Instant getAtualizadoEm() {
        return atualizadoEm;
    }

    /**
     * Igualdade por identidade persistida: duas instancias so sao iguais
     * se forem da mesma entidade e ja tiverem id atribuido pelo banco.
     * Entidade nova (id nulo) nunca e igual a nada alem dela mesma.
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Usuario outro)) {
            return false;
        }
        return id != null && id.equals(outro.id);
    }

    /**
     * hashCode constante e proposital: o id muda de nulo para um valor
     * quando a entidade e persistida, e um hash baseado nele quebraria
     * qualquer HashSet que ja contivesse o objeto.
     */
    @Override
    public int hashCode() {
        return Objects.hash(getClass().hashCode());
    }

    @Override
    public String toString() {
        return "Usuario{id=" + id + ", email='" + email + "'}";
    }
}
