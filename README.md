# Cadastro de Usuarios e Enderecos

Teste tecnico. API REST em Java 21 + Spring Boot com PostgreSQL, e frontend em
React + Vite + TypeScript.

> **Status:** backend com fundacao, autenticacao e autorizacao concluidos e
> verificados. CRUD completo, integracao ViaCEP e frontend em andamento.
> O checklist de requisitos esta em [PLAN.md](PLAN.md).

---

## Como rodar

Requisito unico: **Docker** com Compose.

```bash
cp .env.example .env      # o .env nao vai para o git
docker compose up --build
```

A API sobe em `http://localhost:8080`. O Postgres sobe em `localhost:5432`.

O primeiro boot leva alguns minutos (build Maven dentro do container). A API so
inicia depois que o healthcheck do Postgres passa, entao nao ha corrida entre o
Flyway e o banco.

Para recomecar do zero, apagando o volume do banco:

```bash
docker compose down -v && docker compose up --build
```

### Credenciais iniciais

Criadas pela migration `V3__seed_usuarios.sql`. **Login e por CPF.**

| Perfil | CPF | Senha | Observacao |
|---|---|---|---|
| ADMIN | `52998224725` | `admin123` | administrador inicial |
| USUARIO_COMUM | `11144477735` | `usuario123` | Ana, com 1 endereco |
| USUARIO_COMUM | `39053344705` | `usuario123` | Bruno, com 1 endereco |

Ana e Bruno existem para demonstrar o isolamento entre usuarios: autenticado
como Ana, tente ler os dados de Bruno e a API responde 403.

O CPF aceita mascara no login (`111.444.777-35` funciona); e normalizado para
digitos antes da consulta.

```bash
# login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"cpf\":\"52998224725\",\"senha\":\"admin123\"}"

# usar o token retornado
curl http://localhost:8080/api/usuarios -H "Authorization: Bearer SEU_TOKEN"
```

### Rodar os testes

```bash
docker run --rm -v "$PWD/backend:/app" -w /app maven:3.9-eclipse-temurin-21 mvn test
```

---

## Estrutura

```
.
├── backend/           API Java 21 + Spring Boot
├── frontend/          React + Vite + TypeScript (etapa 3)
├── docker-compose.yml Postgres + API
├── .env.example       template de variaveis
├── PLAN.md            checklist de requisitos + ambiguidades
└── README.md
```

O backend e organizado **por feature**, com as camadas explicitas dentro de
cada uma:

```
backend/src/main/java/com/solution/testepratico/
├── usuario/     entidade, repository, service, controller, dto
├── endereco/    idem
├── auth/        login e emissao de token
├── seguranca/   JWT, filtro, controle de acesso
├── config/      Spring Security, JPA
└── shared/      utilitarios e tratamento de erros
```

A alternativa seria agrupar por camada (`controller/`, `service/`, ...). As
camadas continuam existindo — apenas verticalmente, por dominio. Ganho
concreto: mexer em "endereco" toca um diretorio so, e o repository pode ficar
package-private, o que impede um controller de pular o service.

---

## Decisoes tecnicas

### Banco

**Flyway dono do schema, Hibernate so valida.** `ddl-auto: validate`: o
Hibernate confere no boot se as entidades batem com as tabelas e falha o
startup se divergirem. Ele nunca cria nem altera nada.

**Um endereco principal por usuario, garantido por indice unico parcial:**

```sql
CREATE UNIQUE INDEX uk_enderecos_um_principal_por_usuario
    ON enderecos (usuario_id) WHERE principal = TRUE;
```

O `WHERE` e o detalhe: so as linhas com `principal = TRUE` entram no indice, e
dentro desse subconjunto `usuario_id` precisa ser unico. Resultado: N enderecos
por usuario, no maximo 1 principal. Um `UNIQUE (usuario_id, principal)` comum
estaria errado — limitaria tambem a 1 o numero de enderecos nao-principais.

O indice e a **invariante**; o service e o **comportamento**. Ao trocar o
principal, o service rebaixa o atual e promove o novo na mesma transacao. Sem o
service, toda troca devolveria erro ao usuario; sem o indice, duas requisicoes
simultaneas deixariam o usuario com dois principais. Os dois sao necessarios.

**`numero VARCHAR`, nunca inteiro.** "s/n", "123-A", "45 Fundos" sao validos.
E identificador, nao quantidade.

**CPF e CEP sem mascara**, com `CHECK` de formato no banco. Uma representacao
so por valor.

**`TIMESTAMPTZ` + `Instant`**, nunca `TIMESTAMP`/`LocalDateTime`: instante
absoluto, sem ambiguidade de fuso ou horario de verao.

**E-mail unico ignorando caixa**, via indice funcional `lower(email)`. Evita
que `Leo@x.com` e `leo@x.com` virem duas contas.

### Seguranca

**Senha com BCrypt** (custo 10, salt aleatorio por senha). O custo fica gravado
dentro do hash, entao aumenta-lo depois nao invalida senhas existentes.

**JWT HS256, stateless.** O token carrega id, CPF e role. A assinatura e
validada antes do conteudo ser lido, entao adulterar a role no payload nao
funciona sem o segredo do servidor.

**Isolamento entre usuarios em um ponto unico** —
`seguranca/ControleAcesso.java`:

```java
public void exigirAcessoAoUsuario(Long idAlvo) {
    UsuarioAutenticado atual = usuarioAtual();   // id vem do JWT assinado
    if (atual.isAdmin()) return;
    if (!atual.id().equals(idAlvo)) {            // idAlvo veio da URL
        throw new AcessoNegadoException(...);
    }
}
```

`idAlvo` e o que o cliente digitou na URL; `atual.id()` vem do token assinado.
O cliente controla o primeiro, nao o segundo. Concentrar a regra aqui a torna
auditavel: para saber quem pode ver o que, basta ver quem chama este metodo.

**Tres camadas de defesa:** rota (`SecurityConfig`, com
`anyRequest().authenticated()` — rota nova nasce protegida), service
(`ControleAcesso`), e repository (queries ja filtradas por dono, entao mesmo um
bug na camada 2 nao vaza dados de outro usuario).

**Login nao revela se o CPF existe.** A senha e comparada mesmo quando o CPF
nao e encontrado, contra um hash descartavel. BCrypt leva ~100ms; sem isso, a
diferenca de tempo entre "CPF inexistente" e "senha errada" permitiria enumerar
quais CPFs estao cadastrados. A mensagem de erro e a mesma nos dois casos.

**`role` nunca vem do corpo da requisicao.** Se viesse, qualquer um se
cadastraria como ADMIN. O admin inicial nasce por seed; promocao so por outro
admin.

**Segredo do JWT sem valor padrao.** `secret: ${JWT_SECRET}` sem fallback: a
aplicacao nao sobe sem o segredo vir do ambiente. Um default no
`application.yml` seria um segredo versionado no git.

### API

**Entidade nunca e serializada.** Toda resposta passa por um `record` de DTO.
`UsuarioResponse` nao tem campo de senha — nao ha como vazar o hash por
esquecimento, porque a classe nao tem onde guardar.

**DTOs sao `record` do Java 21**, nao classes com Lombok: imutaveis, com
`equals`/`hashCode`/`toString` automaticos e uma dependencia a menos.

**Erros centralizados** em `@RestControllerAdvice`, com payload unico. Sem
isso, ou cada controller repete `try/catch`, ou o Spring devolve 500 com stack
trace vazando nome de tabela e caminho de pacote.

| Situacao | Status |
|---|---|
| Campo invalido (Bean Validation) | 400 |
| Token ausente, invalido ou credenciais erradas | 401 |
| Autenticado, sem permissao no recurso | 403 |
| Recurso inexistente | 404 |
| Conflito com o estado atual (violacao de constraint) | 409 |
| Requisicao valida que viola regra de negocio | 422 |

**`open-in-view: false`.** O padrao do Spring Boot e `true`, o que mantem a
sessao JPA aberta durante a resposta HTTP — esconde problemas de lazy loading e
segura conexao do pool alem do necessario.

---

## Ambiguidades do documento

O enunciado e omisso ou se contradiz em alguns pontos. Optei por explicitar
cada um com a decisao tomada, em vez de escolher em silencio. A lista completa,
com justificativas, esta em [PLAN.md](PLAN.md). Os principais:

| Ponto | Decisao |
|---|---|
| "Data Nascimento" esta nos requisitos mas some do formulario | Seguir os requisitos: implementar no backend e incluir no formulario |
| Primeiro endereco vira principal automaticamente? | Sim — senao o usuario com um unico endereco fica sem principal |
| Excluir o unico endereco do usuario | Permitido; fica com zero enderecos. A regra e "no maximo um principal", nao "no minimo um endereco" |
| Excluir o principal havendo outros | Promove o mais antigo restante, na mesma transacao |
| Admin pode definir o principal de um usuario? | Sim — ele ja edita todo o resto; abrir excecao seria arbitrario |
| Como nasce o primeiro admin? | Migration de seed, com credenciais documentadas acima |
| CPF/CEP com ou sem mascara no banco | Sem mascara, com `CHECK` de formato |
| 403 ou 404 ao pedir recurso de outro usuario | 403 |

---

## Testes

28 testes unitarios, cobrindo validacao de CPF, ciclo do JWT (incluindo token
adulterado e expirado), a regra de isolamento entre usuarios, e a conferencia
dos hashes do seed contra as senhas documentadas.

Testes de integracao com Testcontainers entram na etapa de testes.

---

## Stack

| Camada | Escolha |
|---|---|
| Linguagem | Java 21 |
| Framework | Spring Boot 3.5 |
| Persistencia | Spring Data JPA + Hibernate 6.6 |
| Migrations | Flyway |
| Banco | PostgreSQL 16 |
| Seguranca | Spring Security + JJWT 0.12 |
| Build | Maven |
| Frontend | React + Vite + TypeScript (etapa 3) |
| Infra | Docker Compose |
