# PLAN.md — Checklist de Requisitos do Teste Técnico

> ## STATUS: auditado contra o documento real
>
> O enunciado foi fornecido e cada item abaixo traz **citação literal** no campo
> `Fonte:`. As marcas `(INFERIDO)` foram removidas, junto com os itens que eu
> havia deduzido e que o documento **não** pede.
>
> **Itens que eu havia inventado e foram removidos:** editar usuário, excluir
> usuário, paginação na listagem de usuários, Swagger/OpenAPI, e-mail como campo
> de requisito, soft delete, limite de endereços. Nada disso aparece no
> enunciado.

**Legenda:** `[x]` implementado e verificado · `[~]` parcial · `[ ]` ausente

---

## 1. Cadastro de usuários

- [x] Campos nome, CPF, data de nascimento, senha
      `Fonte:` *"O sistema deve permitir cadastrar usuários contendo: • Nome • CPF • Data Nascimento • Senha (para autenticação)"*
      → `Usuario.java`, `CriarUsuarioRequest.java`, `V1__create_usuarios.sql`, `V4__add_data_nascimento.sql`
- [x] CPF com formato válido
      `Fonte:` *"O CPF deve possuir formato válido."*
      → `@Cpf` + `CpfValidator.java` (dígito verificador, não só tamanho); cliente em `validacao.ts:39`
- [x] Não pode haver dois usuários com o mesmo CPF
      `Fonte:` *"Não pode haver dois usuários com o mesmo CPF."*
      → `UsuarioService.java:56` + índice único `uk_usuarios_cpf` (`V1:21`); testes em `UsuarioServiceIT`

## 2. Administrador — as 6 capacidades

`Fonte:` *"Administrador • Pode visualizar todos os usuários cadastrados • Pode visualizar todos os endereços cadastrados • Pode cadastrar usuários • Pode cadastrar endereços • Pode editar endereços • Pode excluir endereços"*

- [x] Visualizar todos os usuários → `GET /api/usuarios` (`UsuarioController.java:44`, ADMIN em `SecurityConfig.java:78`) · tela `UsuariosPage.tsx`
- [x] Visualizar todos os endereços → `GET /api/enderecos` (`EnderecoAdminController.java:34`, ADMIN em `SecurityConfig.java:81`) · tela `EnderecosGlobaisPage.tsx`
- [x] Cadastrar usuários → `POST /api/usuarios` (`UsuarioController.java:36`) · tela `CadastroPage.tsx`
- [x] Cadastrar endereços → `POST /api/usuarios/{id}/enderecos` (`EnderecoController.java:55`) · `EnderecoFormDialog.tsx`
- [x] Editar endereços → `PUT .../{enderecoId}` (`EnderecoController.java:68`) · `EnderecoFormDialog.tsx`
- [x] Excluir endereços → `DELETE .../{enderecoId}` (`EnderecoController.java:86`) · `UsuarioDetalhePage.tsx`

O admin age sobre **outro** usuário pelas mesmas rotas: `ControleAcesso.java:48` libera ADMIN antes de comparar os ids. Provado em `EnderecoServiceIT.adminCriaParaOutroUsuario`.

## 3. Usuário comum — as 5 capacidades

`Fonte:` *"Usuário comum • Pode visualizar apenas seus próprios dados • Pode visualizar apenas seus próprios endereços • Pode editar seus próprios endereços • Pode definir qual endereço é o principal • Não pode visualizar ou alterar dados de outros usuários"*

- [x] Visualizar apenas seus próprios dados → `GET /api/usuarios/me` (`:49`) e `GET /api/usuarios/{id}` (`:55`) · tela `UsuarioDetalhePage.tsx`
- [x] Visualizar apenas seus próprios endereços → `GET /api/usuarios/{id}/enderecos` (`EnderecoController.java:43`) · mesma tela
- [x] Editar seus próprios endereços → `PUT .../{enderecoId}` (`:68`) · `EnderecoFormDialog.tsx`
- [x] Definir qual endereço é o principal → `PATCH .../{enderecoId}/principal` (`:79` → `EnderecoService.java:176`) · botão em `UsuarioDetalhePage.tsx`
- [x] **Não** pode ver/alterar dados de outros → `ControleAcesso.java:48`; consulta filtrada por dono em `EnderecoRepository.findByIdAndUsuarioId`

- [x] As regras de acesso garantidas pelo backend
      `Fonte:` *"As regras de acesso devem ser garantidas pelo backend."*
      → duas camadas: por rota em `SecurityConfig` e por regra em `ControleAcesso`. O frontend só esconde o que a pessoa não pode — `RotaProtegida.tsx` e `ehAdmin` são UX, documentado no próprio código. Provado em `ControleAcessoTest`, `ContratoHttpIT` (403 e 404 nos dois caminhos de vazamento) e `EnderecoServiceIT`.

## 4. Autenticação

- [x] Mecanismo de autenticação
      `Fonte:` *"A estratégia de autenticação fica a critério do candidato. Exemplos: • Login com CPF e senha • Token de autenticação (ex: JWT) • Sessão"*
      → escolhido login por CPF + senha com JWT: `AuthController.java:26`, `JwtService.java:35`, BCrypt em `SecurityConfig.java:52`; tela `LoginPage.tsx`

## 5. Gerenciamento de endereços

- [x] Um ou mais endereços por usuário
      `Fonte:` *"Cada usuário pode possuir um ou mais endereços cadastrados."*
      → FK + `idx_enderecos_usuario_id` em `V2__create_enderecos.sql`
- [x] Campos CEP, Número, Complemento (opcional), Logradouro, Bairro, Cidade, Estado
      `Fonte:` *"Cada endereço deve conter: • CEP • Número • Complemento (opcional) • Logradouro • Bairro • Cidade • Estado"*
      → `Endereco.java`. O documento diz "Estado", a coluna é `uf VARCHAR(2)`; o rótulo do formulário segue o documento (`EnderecoFormDialog.tsx`)

## 6. Regras de negócio — endereços

- [x] CEP válido preenche os campos via ViaCEP
      `Fonte:` *"Ao informar um CEP válido, os campos de endereço devem ser preenchidos automaticamente utilizando a API ViaCEP."*
      → `CepService.java:44` / `CepController.java:27`; no cliente dispara no **blur** do campo CEP (`EnderecoFormDialog.tsx`, `preencherPeloCep`)
- [x] Cadastrar múltiplos endereços
      `Fonte:` *"O usuário deve poder cadastrar múltiplos endereços."*
- [x] Apenas um endereço principal
      `Fonte:` *"Cada usuário deve possuir apenas um endereço principal."*
      → índice único **parcial** `uk_enderecos_um_principal_por_usuario` (`V2`). Um `UNIQUE (usuario_id, principal)` comum estaria errado: limitaria também a 1 os não-principais
- [x] Novo principal atualiza o anterior
      `Fonte:` *"Caso um novo endereço seja definido como principal, o endereço principal anterior deve ser atualizado automaticamente."*
      → `EnderecoService.java:176`; rebaixa antes de promover, senão existiria um instante com dois principais e o índice abortaria a transação
- [x] Principal removido promove outro
      `Fonte:` *"Caso o endereço principal seja removido, outro endereço do usuário deve automaticamente se tornar o principal."*
      → `EnderecoService.java:221`, com `flush()` explícito para o DELETE chegar ao banco antes do UPDATE

## 7. Consulta de CEP

- [x] Consumir a API ViaCEP
      `Fonte:` *"A aplicação deve consumir a API ViaCEP para preenchimento automático dos dados de endereço."*
      → `ViaCepClient.java`, chamada pelo backend (o navegador nunca fala com o ViaCEP)
- [x] Evitar consultas repetidas desnecessárias
      `Fonte:` *"Sempre que possível, a aplicação deve evitar consultas repetidas desnecessárias à API externa."*
      → **duas camadas**: `@Cacheable` em `CepService.java:36` (Caffeine, TTL 24h) poupa a chamada ao ViaCEP; `queryClient.fetchQuery` com `staleTime: Infinity` em `api/cep.ts` poupa até a chamada ao nosso backend. Testado em `CepServiceIT`

## 8. Funcionalidades da aplicação — os 7 itens

`Fonte:` *"1. Cadastro de usuários / 2. Listagem de usuários / 3. Visualização de usuário / 4. Cadastro de endereços / 5. Edição de endereços / 6. Definição de endereço principal / 7. Exclusão de endereço"*

- [x] 1. Cadastro de usuários → `CadastroPage.tsx`
- [x] 2. Listagem de usuários, restrita ao administrador → `UsuariosPage.tsx`
- [x] 3. Visualização de usuário com dados **e** lista de endereços → `UsuarioDetalhePage.tsx` (uma única requisição: o backend compõe em `UsuarioService.java:80`)
- [x] 4. Cadastro de endereços → `EnderecoFormDialog.tsx`
- [x] 5. Edição de endereços → mesmo componente, modo edição
- [x] 6. Definição de endereço principal → `UsuarioDetalhePage.tsx`
- [x] 7. Exclusão de endereço → `UsuarioDetalhePage.tsx`, com confirmação que avisa quando o excluído é o principal

## 9. Frontend

- [x] Utilizar React — `Fonte:` *"Utilizar React."* → React 19 + Vite + TypeScript
- [x] Formulário de cadastro de usuário (Nome, CPF, Senha) → `CadastroPage.tsx`. Traz também data de nascimento (ver decisão 1) e e-mail (decisão 2)
- [x] Formulário de cadastro de endereço (CEP, Número, Complemento) → `EnderecoFormDialog.tsx`
- [x] Campos preenchidos automaticamente após consulta do CEP
      `Fonte:` *"Os campos de endereço devem ser preenchidos automaticamente após consulta do CEP."*
- [x] Lista de usuários → `UsuariosPage.tsx`
- [x] Lista de endereços por usuário → `UsuarioDetalhePage.tsx`
- [x] Validações: campos obrigatórios, formato válido de CPF, CEP válido
      `Fonte:` *"Validações: • Campos obrigatórios • Formato válido de CPF • CEP válido"*
      → zod + `lib/validacao.ts`. O cabeçalho do arquivo lista cada regra com o par dela no servidor: é validação de UX, e o backend valida de novo
- [~] Interface responsiva
      `Fonte:` *"A interface deve ser responsiva."*
      → escrita para isso (grades que empilham, tabelas em `overflow-x-auto`, colunas secundárias ocultas no telefone, nav com `flex-wrap`). **Não verificada em navegador: não há Chrome na máquina de desenvolvimento.**

## 10. Backend

- [x] Java + Spring Boot, API REST — `Fonte:` *"Utilizar Java + Spring Boot ou então Groovy + Grails para construção de uma API REST."*
- [x] Criar usuários · Listar usuários · Buscar dados de um usuário → `UsuarioController.java:36, :44, :55`
- [x] Criar · Atualizar · Excluir endereços → `EnderecoController.java:55, :68, :86`
- [x] Garantir todas as regras de negócio — `Fonte:` *"O backend deve garantir todas as regras de negócio definidas."*

O documento **não** pede editar nem excluir usuário; a lista da API é exatamente a acima.

## 11. Banco de dados

- [x] Banco relacional — `Fonte:` *"Utilizar um banco de dados relacional, como: • MySQL • PostgreSQL • SQLite"* → PostgreSQL 16
- [x] Estrutura definida pelo candidato → 4 migrations Flyway, constraints e índices documentados em cada arquivo

## 12. Integração

- [x] Frontend consome a API para cadastro, listagem e atualização — `Fonte:` *"O frontend deve consumir a API backend"*
- [x] Axios ou Fetch — `Fonte:` *"Utilizar Axios ou Fetch API para comunicação HTTP."* → Axios em `lib/api.ts`, com interceptors de token e de 401

## 13. Entrega

- [x] **Repositório público no GitHub**
      `Fonte:` *"Todo o código deve ser disponibilizado em um repositório público no GitHub."*
      → https://github.com/leomoraessantdev/testepraticosolution (visibilidade `PUBLIC` confirmada)
- [x] Código do frontend e do backend no repositório
- [x] README com descrição do projeto → `README.md:1`
- [x] README com instruções para rodar → `README.md:12`

## 14. Diferenciais

- [x] React Query — `useQuery` nas listagens (`api/usuarios.ts`, `api/enderecos.ts`), mutations com invalidação por chave centralizada (`api/chaves.ts`)
- [x] shadCN — 14 componentes
- [x] Docker para subir o projeto — `docker compose up` sobe **db + api + web**; o frontend tem `Dockerfile` multi-stage e nginx com fallback de SPA
- [x] Organização do backend em camadas — Controller → Service → Repository, agrupado por feature
- [x] Tratamento adequado de erros da API — `GlobalExceptionHandler` no backend, formato único `ApiError`; no cliente `lib/erros.ts` traduz status e erros de campo
- [x] Testes automatizados — **130 no total**: 89 no backend (`mvn verify`) e 41 no frontend (`npm test`), estes cobrindo o algoritmo de CPF com os mesmos vetores do backend, a armadilha de fuso na formatacao de data, a normalizacao de erro da API e o preenchimento automatico pelo CEP

---

# Ambiguidades e decisões

Pontos em que o documento é omisso, ambíguo ou se contradiz. Cada um tem a
decisão tomada e a justificativa. Esta seção vai para o README na entrega.

## 1. "Data Nascimento" está nos requisitos mas sai do formulário

**Contradição dentro do próprio documento.**

`Fonte (requisitos):` *"O sistema deve permitir cadastrar usuários contendo: • Nome • CPF • Data Nascimento • Senha"*
`Fonte (frontend):` *"Formulário de cadastro de usuário: • Nome • CPF • Senha"*

**Decisão: seguir os requisitos — implementar no backend e incluir no
formulário.** A seção de requisitos é o contrato; a de frontend enumera o
mínimo da tela. Entregar um campo a mais é erro menor do que deixar de fora um
requisito escrito.

Coluna `data_nascimento DATE`, mapeada para `LocalDate`: data de calendário não
tem hora nem fuso, então `Instant` estaria errado. Validação `@PastOrPresent`;
idade mínima não foi mencionada e não inventei.

## 2. O e-mail não está no documento, mas o backend exige

**Divergência que eu mesmo introduzi.** O enunciado **não menciona e-mail em
nenhum lugar** — nem nos requisitos, nem no formulário. O backend exige:
`@NotBlank @Email` em `CriarUsuarioRequest`, coluna `email NOT NULL` em `V1:7`
e índice único funcional `uk_usuarios_email` em `V1:25`.

**Decisão: manter o campo, exibindo-o no formulário.** O documento não proíbe
campo adicional, e e-mail é dado de contato esperado num cadastro. Remover
custaria uma migration para derrubar o `NOT NULL` e ajustar o índice único, com
risco desproporcional ao ganho.

**Registro honesto:** esta não é uma exigência do teste, é uma escolha minha. Se
o avaliador considerar escopo extra, a correção é uma migration `V5` tornando a
coluna opcional.

## 3. O primeiro endereço vira principal automaticamente?

**Omisso.** **Decisão: sim.** Sem isso, um usuário com exatamente um endereço
ficaria sem principal — estado inútil que obrigaria todo consumidor de "endereço
principal" a tratar nulo. `EnderecoService.java:103`.

## 4. Excluir o único endereço do usuário

**Omisso.** Não há outro para promover.

**Decisão: permitir; o usuário fica com zero endereços e sem principal.** A
regra do documento é *"apenas um endereço principal"*, nunca "no mínimo um
endereço". Bloquear prenderia quem digitou errado. O índice único parcial aceita
zero principais naturalmente.

## 5. Qual endereço assume quando o principal é excluído?

`Fonte:` *"outro endereço do usuário deve automaticamente se tornar o
principal"* — o documento não diz qual.

**Decisão: o mais antigo restante** (`findFirstByUsuarioIdOrderByIdAsc`).
Critério arbitrário, porém estável e explicável: o alfabético mudaria com uma
edição de logradouro, e o mais recente favoreceria um cadastro de teste.

## 6. O admin pode definir o endereço principal de um usuário?

**Ambíguo:** *"definir qual endereço é o principal"* aparece só na lista do
usuário comum.

**Decisão: sim.** O admin já cadastra, edita e exclui endereços pelo próprio
documento; tornar "definir principal" a única exceção seria arbitrário.
`ControleAcesso.exigirAcessoAoUsuario` libera ADMIN antes de comparar os ids.

## 7. Como nasce o primeiro administrador?

**Omisso.** O documento exige dois perfis mas não diz como o primeiro admin
aparece.

**Decisão: migration de seed (`V3__seed_usuarios.sql`), com CPF e senha
documentados no README.** Precisa existir antes da primeira requisição, então
não pode depender de endpoint.

O ponto de segurança que sustenta isso: **o campo `role` nunca é aceito no corpo
do cadastro público** — `CriarUsuarioRequest` não tem o campo, e
`UsuarioService.java:64` fixa `USUARIO_COMUM`. Provado em
`ContratoHttpIT.roleNoCorpoNaoPromove` e `ValidacaoCadastroTest.semCampoRole`.

## 8. CPF e CEP: guardar com ou sem máscara?

**Omisso.** **Decisão: sem máscara, só dígitos; formatar na exibição.** Guardar
mascarado criaria duas representações do mesmo valor e quebraria busca por
igualdade e unicidade. Garantido por `CHECK` no banco, não só no service. No
cliente, `mascararCpf`/`mascararCep` atuam apenas na tela.

## 9. Existe auto-cadastro público, ou só o admin cadastra?

**Ambíguo:** o documento lista *"Pode cadastrar usuários"* como capacidade do
admin e, separadamente, *"1. Cadastro de usuários"* como funcionalidade.

**Decisão: `POST /api/usuarios` público, criando sempre `USUARIO_COMUM`.** Sem
isso não haveria como um usuário novo entrar no sistema, e o requisito de CPF
duplicado não teria onde acontecer. O admin usa a mesma rota.

## 10. Usuário inativo consegue logar?

**Omisso.** A coluna `ativo` existe. **Decisão: não.** `AuthService` filtra por
`isAtivo` antes de emitir o token, e responde o mesmo 401 genérico — não revela
que a conta existe mas está desativada.

## 11. Exclusão física ou lógica?

**Omisso.** **Decisão: exclusão física, com `ON DELETE CASCADE` nos endereços.**
Nada no documento menciona histórico ou auditoria. Observação: como o documento
não pede exclusão de usuário, o cascade não é alcançável pela API hoje — existe
como garantia de integridade do schema.

## 12. 403 ou 404 ao pedir recurso de outro usuário?

**Omisso.** **Decisão: os dois, conforme o caminho.**

- URL de outro usuário (`/api/usuarios/{outro}/enderecos`) → **403**: é
  semanticamente honesto, "existe e você não pode".
- Id de endereço alheio na própria rota → **404**, porque a consulta filtra por
  dono. Aqui um 403 confirmaria que aquele id existe em alguma conta.

Ambos provados em `ContratoHttpIT`.

## 13. Os campos preenchidos pelo ViaCEP podem ser editados depois?

**Omisso.** **Decisão: sim, são editáveis.** O ViaCEP devolve logradouro
genérico ou vazio para CEP de faixa única, e número e complemento nunca vêm de
lá. Os dados são gravados como snapshot no nosso banco — não dependemos do
ViaCEP estar no ar para exibir um endereço já cadastrado.

## 14. Formato de data e fuso na API

**Omisso.** **Decisão: ISO-8601 em UTC**, colunas `TIMESTAMPTZ` e `Instant` em
Java. `data_nascimento` é a exceção: `DATE`/`LocalDate`, sem fuso, porque data
de nascimento não muda conforme o fuso de quem lê. No cliente,
`formato.ts:formatarData` quebra a string em vez de usar `new Date(iso)`, que
interpretaria como UTC e exibiria o dia anterior em fuso negativo.

## 15. Onde o token fica guardado no cliente

**Omisso** — o documento deixa a estratégia a critério do candidato.

**Decisão: `localStorage`.** Trade-off assumido em `lib/token.ts`: é legível por
JavaScript, então um XSS consegue roubá-lo. Cookie `httpOnly` seria mais seguro,
mas exigiria o backend ler cookie em vez do header `Authorization` e reativar a
proteção CSRF — hoje desligada justamente porque não há cookie. Mitigações: o
token expira em 120 minutos e não carrega nada sensível além de id, CPF e role.

## 16. O usuário comum pode EXCLUIR os próprios endereços?

**Ambíguo, e é a ambiguidade mais sutil do documento.**

`Fonte (Administrador):` *"Pode excluir endereços"*
`Fonte (Usuário comum):` *"Pode visualizar apenas seus próprios dados • Pode
visualizar apenas seus próprios endereços • Pode editar seus próprios endereços •
Pode definir qual endereço é o principal"* — **exclusão não aparece.**

Três trechos puxam para lados diferentes:

1. A lista de capacidades do usuário comum **não** concede exclusão.
2. A funcionalidade 7 é genérica: *"Exclusão de endereço — Permitir remover
   endereços cadastrados"*, sem dizer quem remove.
3. A regra de negócio *"Caso o endereço principal seja removido, outro endereço
   do usuário deve automaticamente se tornar o principal"* está na voz passiva,
   também sem ator.

**Decisão: o usuário comum exclui os próprios endereços.** A lista de
capacidades enumera o que cada perfil alcança, e a do comum já o torna dono do
seu cadastro — cadastrar (garantido por *"O usuário deve poder cadastrar
múltiplos endereços"*) e editar. Deixar criar e editar mas proibir apagar
produziria um acúmulo que só um administrador poderia limpar, o que contraria
a intenção de autonomia do resto da lista.

**Risco assumido, e fácil de reverter:** se o avaliador ler a lista do usuário
comum como exaustiva, esta é uma permissão a mais. A correção é uma linha — um
`exigirAdmin()` em `EnderecoService.excluir` — mais esconder o botão em
`UsuarioDetalhePage`. **Nota:** *criar* endereço pelo usuário comum NÃO tem esse
risco, porque a seção de regras de negócio concede explicitamente.

## 17. Resolvido: URL inexistente respondia 500

Defeito encontrado na auditoria, **já corrigido**. `SecurityConfig` liberava
`/actuator/health`, mas o starter do actuator não estava no `pom.xml`: a rota
não existia, a requisição caía no `@ExceptionHandler(Exception.class)` e voltava
**500** em vez de 404 — qualquer erro de digitação numa URL produzia 500.

Correção: starter do actuator adicionado (habilita também o healthcheck do
compose) e `@ExceptionHandler(NoResourceFoundException.class)` devolvendo 404.
Regressão coberta por `ContratoHttpIT.urlInexistenteDa404`.
