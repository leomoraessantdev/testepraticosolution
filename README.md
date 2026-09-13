# Cadastro de Usuarios e Enderecos

Teste tecnico. API REST em Java 21 + Spring Boot com PostgreSQL, e frontend em
React + Vite + TypeScript.

> **Status:** backend e frontend implementados e verificados contra o
> enunciado. 130 testes automatizados — 89 no backend (`mvn verify`) e 41 no
> frontend (`npm test`).
>
> O checklist item por item, com citacao literal do documento, esta em
> [PLAN.md](PLAN.md) — inclusive o unico requisito ainda pendente: publicar o
> repositorio no GitHub.

---

## Como rodar

Requisito unico: **Docker** com Compose.

```bash
cp .env.example .env      # o .env nao vai para o git
docker compose up --build
```

Sobem tres servicos:

| Servico | URL | Container |
|---|---|---|
| Frontend | http://localhost:5173 | `teste-web` (nginx) |
| API | http://localhost:8080 | `teste-api` |
| Postgres | localhost:5432 | `teste-db` |

Abra **http://localhost:5173** e entre com uma das credenciais abaixo.

A porta 5173 do frontend nao e arbitraria: e a origem que o backend libera no
CORS (`CORS_ORIGENS`). O `web` so sobe depois que o healthcheck da API passa,
que por sua vez espera o healthcheck do Postgres — entao nao ha corrida entre o
Flyway e o banco.

O primeiro boot leva alguns minutos (build Maven dentro do container). A API so
inicia depois que o healthcheck do Postgres passa, entao nao ha corrida entre o
Flyway e o banco.

Para recomecar do zero, apagando o volume do banco:

```bash
docker compose down -v && docker compose up --build
```

### Credenciais iniciais

Criadas pelas migrations `V3__seed_usuarios.sql` e `V5__seed_segundo_endereco.sql`.
**Login e por CPF.**

Os tres usuarios do seed tem **dois enderecos cada, exatamente um principal** —
o suficiente para exercitar as tres regras do endereco principal sem cadastrar
nada a mao.

| Perfil | CPF | Senha | Observacao |
|---|---|---|---|
| ADMIN | `52998224725` | `admin123` | administrador inicial, 2 enderecos |
| USUARIO_COMUM | `11144477735` | `usuario123` | Ana Souza, 2 enderecos |
| USUARIO_COMUM | `39053344705` | `usuario123` | Bruno Lima, 2 enderecos |

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
├── frontend/          React + Vite + TypeScript (nginx no Docker)
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
| Campo invalido, CPF invalido, data futura, JSON malformado | 400 |
| Token ausente, invalido ou credenciais erradas | 401 |
| Autenticado, sem permissao no recurso | 403 |
| Recurso inexistente, CEP nao encontrado | 404 |
| CPF ou e-mail ja cadastrado, violacao de constraint | 409 |
| Requisicao valida que viola regra de negocio | 422 |
| ViaCEP fora do ar ou lento demais | 503 |

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

## Endpoints

Todos exigem `Authorization: Bearer <token>`, exceto o login.

| Metodo | Rota | Quem pode |
|---|---|---|
| POST | `/api/auth/login` | publico |
| POST | `/api/usuarios` | publico (cadastro) |
| GET | `/api/cep/{cep}` | autenticado |
| GET | `/api/usuarios` | ADMIN |
| GET | `/api/usuarios/me` | proprio |
| GET | `/api/usuarios/{id}` | proprio ou ADMIN |
| GET | `/api/usuarios/{id}/enderecos` | proprio ou ADMIN |
| POST | `/api/usuarios/{id}/enderecos` | proprio ou ADMIN |
| GET | `/api/usuarios/{id}/enderecos/{enderecoId}` | proprio ou ADMIN |
| PUT | `/api/usuarios/{id}/enderecos/{enderecoId}` | proprio ou ADMIN |
| PATCH | `/api/usuarios/{id}/enderecos/{enderecoId}/principal` | proprio ou ADMIN |
| DELETE | `/api/usuarios/{id}/enderecos/{enderecoId}` | proprio ou ADMIN |
| GET | `/api/enderecos` | ADMIN |

`GET /api/usuarios/{id}` devolve os dados do usuario com a lista de enderecos.
O admin opera sobre outro usuario pelas MESMAS rotas: nao ha endpoint paralelo
de administracao. Quem decide e o ControleAcesso dentro do service.

### ViaCEP e cache

A consulta passa pelo backend, nunca do navegador direto para o ViaCEP: o cache
fica compartilhado entre usuarios, o formato de resposta fica sob nosso controle
e casa com os campos de `Endereco`, e trocar de provedor nao exige mexer no
frontend.

Cache em memoria com Caffeine, TTL de 24h, no maximo 10.000 entradas. Nao usei
Redis: o dado e publico, pequeno e reconstruivel com uma requisicao HTTP; subir
um servico externo so para isso adicionaria ponto de falha sem resolver problema
que exista aqui.

Tres detalhes que fazem o cache funcionar de verdade:

- **A chave e o CEP normalizado.** `01310-100` e `01310100` caem na mesma
  entrada. Com a string crua como chave, a mesma consulta com e sem mascara
  guardaria duas entradas e erraria o cache metade das vezes.
- **`@Cacheable` esta no metodo publico**, nao num metodo interno chamado por
  ele. O cache funciona por proxy: chamada de um metodo da classe para outro da
  mesma classe nao passa pelo proxy e o cache simplesmente nao acontece.
- **Falha nao e cacheada.** `@Cacheable` nao armazena quando o metodo lanca
  excecao. Um ViaCEP fora do ar por um minuto nao pode deixar o CEP inacessivel
  pelas 24 horas seguintes.

Medido na API rodando: primeira consulta 807ms, segunda 7ms.

**A armadilha do ViaCEP:** CEP inexistente nao devolve 404. Devolve **HTTP 200**
com corpo `{"erro": "true"}`. Quem checa so o status code grava um endereco
vazio achando que deu certo. O client inspeciona o corpo.

**Timeouts explicitos** (3s conexao, 5s leitura). Sem eles o padrao e esperar
para sempre: o ViaCEP travado prenderia threads do Tomcat ate esgotar o pool e
derrubar a aplicacao inteira por causa de um preenchimento de formulario.

### Validacao de data de nascimento

Obrigatoria, formato ISO `aaaa-mm-dd`, nao pode ser futura (`@PastOrPresent`).
`LocalDate` e coluna `DATE`: data de calendario nao tem hora nem fuso.

Nao existe `CHECK` no banco para "nao pode ser futura": o Postgres exige funcoes
`IMMUTABLE` em constraint e `CURRENT_DATE` e `STABLE`. Faz sentido — uma linha
valida hoje seria reavaliada amanha com outro resultado. O banco guarda so um
limite inferior de sanidade (`>= 1900-01-01`).

### As tres regras do endereco principal

| Regra | Onde vive |
|---|---|
| No maximo um principal por usuario | indice unico parcial `uk_enderecos_um_principal_por_usuario` (migration V2) |
| Novo principal rebaixa o anterior | `EnderecoService.definirPrincipal()` e `EnderecoService.criar()` |
| Excluir o principal promove outro | `EnderecoService.excluir()` |

A primeira e invariante de dados e nao mora em metodo nenhum: e o banco que a
garante, inclusive sob concorrencia. As outras duas sao comportamento, e cada
uma roda dentro de uma unica transacao, porque sao dois passos que precisam
valer juntos.

---

## Testes

**130 testes: 89 no backend e 41 no frontend.**

No backend sao 43 unitarios e 46 de integracao contra um Postgres de verdade.

**Rode `mvn verify`, nao `mvn test`.** O Surefire roda apenas os `*Test`; os
`*IT` — onde vivem as regras de negocio — sao do Failsafe, na fase `verify`.
`mvn test` passa sem exercitar nenhuma regra de endereco. Os unitarios cobrem validacao de CPF, ciclo do JWT (incluindo token
adulterado e expirado), a regra de isolamento entre usuarios, e a conferencia
dos hashes do seed contra as senhas documentadas.

Os testes de integracao existem porque as regras do endereco principal nao
podem ser provadas com mock: uma e constraint do banco, outra depende da ordem
em que o Hibernate emite DELETE e UPDATE. Um repositorio simulado concordaria
com qualquer implementacao, inclusive com a errada.

```bash
docker compose up -d db      # integracao precisa do Postgres de pe
docker run --rm --network testepraticosolution_default \n  -e DB_URL=jdbc:postgresql://db:5432/teste_pratico \n  -e JWT_SECRET=qualquer-segredo-de-teste-com-32-bytes-ou-mais \n  -v "$PWD/backend:/app" -w /app maven:3.9-eclipse-temurin-21 mvn verify
```

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

### Testes do frontend

```bash
cd frontend && npm test
```

41 testes, e a escolha do que testar segue a mesma regra do backend: regra de
negocio, nao cobertura.

- `validacao.test.ts` usa **os mesmos vetores de CPF do CpfUtilsTest do
  backend**. O arquivo `lib/validacao.ts` e uma reimplementacao do
  `CpfUtils.java`, e duas implementacoes da mesma regra em linguagens
  diferentes divergem em silencio com o tempo. Se um dia discordarem, um dos
  dois quebra.
- `formato.test.ts` prova a armadilha de fuso: `new Date("1995-06-15")` e
  meia-noite UTC e, em qualquer fuso do Brasil, exibiria **14/06**. O teste
  força `America/Sao_Paulo` e compara as duas formas.
- `EnderecoFormDialog.test.tsx` cobre o requisito central da tela: o
  preenchimento automatico ao sair do campo CEP, o CEP incompleto que **nao**
  chama a API, a segunda consulta do mesmo CEP absorvida pelo cache, e o CEP
  inexistente que avisa sem travar o cadastro.

Esse ultimo arquivo encontrou um defeito real assim que foi escrito: o
`FormControl` do shadcn e um `Slot` e injeta o `id` no filho direto; como o
`Input` do CEP estava dentro de uma `div` de posicionamento, o `id` ia para a
`div` e o `<label for>` apontava para ela. Clicar no rotulo nao focava o campo.
