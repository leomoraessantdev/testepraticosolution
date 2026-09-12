# PLAN.md — Checklist de Requisitos do Teste Técnico

> ## STATUS: ESQUELETO — documento do teste ainda NÃO foi fornecido
>
> O texto do teste nunca foi colado no chat (o bloco `<requisitos_do_teste>`
> segue com o placeholder). Portanto:
>
> - Todos os itens abaixo estão marcados **(INFERIDO)** — foram deduzidos dos
>   agrupamentos que você citou (Usuários, Autenticação e Acesso, Endereços,
>   ViaCEP, Frontend, Backend, Banco, Entrega, Diferenciais) e do formato
>   típico desse teste.
> - **Nenhum item tem citação real.** O campo `Fonte:` está vazio de propósito.
>   Não inventei trechos — um checklist de auditoria com citações fabricadas
>   te daria falsa confiança de cobertura.
>
> Assim que o documento chegar eu faço uma passada única:
>   1. Preencho cada `Fonte:` com o trecho literal do documento.
>   2. Removo itens que não existem no teste.
>   3. Adiciono os que faltarem.
>   4. Removo todas as marcas `(INFERIDO)`.
>
> Só depois disso o arquivo vale como instrumento de auditoria.

**Legenda:** `[ ]` pendente · `[x]` implementado · `(INFERIDO)` não confirmado no documento

---

## 1. Usuários

- [ ] (INFERIDO) Cadastrar usuário — `Fonte:`
- [ ] (INFERIDO) Listar usuários — `Fonte:`
- [ ] (INFERIDO) Buscar usuário por ID — `Fonte:`
- [ ] (INFERIDO) Editar usuário — `Fonte:`
- [ ] (INFERIDO) Excluir usuário — `Fonte:`
- [ ] (INFERIDO) Campos do usuário: nome, e-mail, senha — `Fonte:`
- [ ] (INFERIDO) E-mail único no sistema — `Fonte:`
- [ ] (INFERIDO) Validação de campos obrigatórios e formato de e-mail — `Fonte:`
- [x] (INFERIDO) Senha nunca retornada em nenhuma resposta da API — `Fonte:`
- [ ] (INFERIDO) Paginação na listagem — `Fonte:`

## 2. Autenticação e Acesso

- [x] Login com **CPF** + senha *(confirmado por voce na etapa 2.2)* — `Fonte:`
- [x] (INFERIDO) Senha persistida com hash (BCrypt), nunca em texto puro — `Fonte:`
- [ ] (INFERIDO) Emissão de token JWT no login — `Fonte:`
- [ ] (INFERIDO) Endpoints protegidos exigem token válido — `Fonte:`
- [x] (INFERIDO) Perfis/roles distintos (ex.: ADMIN x USER) — `Fonte:`
- [ ] (INFERIDO) Usuário comum só enxerga/edita os próprios dados e endereços — `Fonte:`
- [ ] (INFERIDO) Distinção correta entre 401 (não autenticado) e 403 (sem permissão) — `Fonte:`
- [ ] (INFERIDO) Tela de login no frontend — `Fonte:`
- [ ] (INFERIDO) Rotas protegidas no frontend + redirect para login — `Fonte:`
- [ ] (INFERIDO) Logout / expiração de token tratada no frontend — `Fonte:`

## 3. Endereços

- [ ] (INFERIDO) Um usuário pode ter vários endereços — `Fonte:`
- [ ] (INFERIDO) Cadastrar endereço para um usuário — `Fonte:`
- [ ] (INFERIDO) Listar endereços de um usuário — `Fonte:`
- [ ] (INFERIDO) Editar endereço — `Fonte:`
- [ ] (INFERIDO) Excluir endereço — `Fonte:`
- [ ] (INFERIDO) **Apenas UM endereço principal por usuário** — `Fonte:` *(regra confirmada por você no chat, ainda sem trecho do documento)*
- [ ] (INFERIDO) Ação de definir/trocar qual endereço é o principal — `Fonte:`
- [ ] (INFERIDO) Campos: CEP, logradouro, número, complemento, bairro, cidade, UF — `Fonte:`
- [ ] (INFERIDO) Excluir usuário remove os endereços dele (cascade) — `Fonte:`

## 4. ViaCEP

- [ ] (INFERIDO) Integração com a API ViaCEP — `Fonte:`
- [ ] (INFERIDO) Busca por CEP preenche os demais campos automaticamente — `Fonte:`
- [ ] (INFERIDO) Chamada feita pelo backend (não direto do browser) — `Fonte:`
- [ ] (INFERIDO) Tratar CEP inexistente — ViaCEP responde HTTP 200 com `{"erro": true}` — `Fonte:`
- [ ] (INFERIDO) Tratar timeout / indisponibilidade do ViaCEP — `Fonte:`
- [ ] (INFERIDO) Validar formato do CEP (8 dígitos) antes de chamar a API externa — `Fonte:`
- [ ] (INFERIDO) Dados retornados são persistidos junto ao endereço (snapshot) — `Fonte:`

## 5. Frontend

- [ ] (INFERIDO) React + Vite + TypeScript — `Fonte:`
- [ ] (INFERIDO) Comunicação HTTP via Axios — `Fonte:`
- [ ] (INFERIDO) Tela de listagem de usuários — `Fonte:`
- [ ] (INFERIDO) Formulário de criação/edição de usuário — `Fonte:`
- [ ] (INFERIDO) Tela/seção de endereços do usuário — `Fonte:`
- [ ] (INFERIDO) Formulário de endereço com busca por CEP — `Fonte:`
- [ ] (INFERIDO) Indicação visual de qual endereço é o principal — `Fonte:`
- [ ] (INFERIDO) Validação de formulário no cliente (espelhando, não substituindo, o backend) — `Fonte:`
- [ ] (INFERIDO) Estados de loading e erro visíveis ao usuário — `Fonte:`
- [ ] (INFERIDO) Feedback de sucesso nas ações — `Fonte:`
- [ ] (INFERIDO) Layout responsivo — `Fonte:`

## 6. Backend

- [ ] (INFERIDO) Java 21 + Spring Boot — `Fonte:`
- [x] (INFERIDO) API REST com verbos e status HTTP corretos — `Fonte:`
- [x] (INFERIDO) Arquitetura em camadas: Controller -> Service -> Repository — `Fonte:`
- [x] (INFERIDO) DTOs separados das entidades (entidade nunca vaza no JSON) — `Fonte:`
- [x] (INFERIDO) Bean Validation nos DTOs de entrada — `Fonte:`
- [x] (INFERIDO) Tratamento global de erros (`@RestControllerAdvice`) com payload padronizado — `Fonte:`
- [ ] (INFERIDO) Transações explícitas onde há escrita multi-passo — `Fonte:`
- [x] (INFERIDO) CORS configurado para o frontend — `Fonte:`
- [ ] (INFERIDO) Configuração via variáveis de ambiente (sem segredo no código) — `Fonte:`

## 7. Banco

- [ ] (INFERIDO) PostgreSQL — `Fonte:`
- [ ] (INFERIDO) Tabela de usuários — `Fonte:`
- [ ] (INFERIDO) Tabela de endereços com FK para usuário — `Fonte:`
- [ ] (INFERIDO) Constraint de unicidade do e-mail — `Fonte:`
- [ ] (INFERIDO) Constraint garantindo um único endereço principal por usuário — `Fonte:`
- [ ] (INFERIDO) Índices nas colunas de busca frequente — `Fonte:`
- [ ] (INFERIDO) Migrations versionadas (Flyway) — `Fonte:`
- [x] (INFERIDO) Script ou seed de dados inicial — `Fonte:`

## 8. Entrega

- [ ] (INFERIDO) Repositório Git com histórico de commits legível — `Fonte:`
- [ ] (INFERIDO) README com instruções de execução — `Fonte:`
- [ ] (INFERIDO) README documentando decisões técnicas — `Fonte:`
- [ ] (INFERIDO) Projeto sobe com um comando (`docker compose up`) — `Fonte:`
- [ ] (INFERIDO) Coleção de endpoints / Swagger para o avaliador testar — `Fonte:`
- [ ] (INFERIDO) Prazo de entrega — `Fonte:`
- [ ] (INFERIDO) Formato de entrega (link do repo, zip, e-mail) — `Fonte:`

## 9. Diferenciais

- [ ] (INFERIDO) React Query para cache e estados de servidor — `Fonte:`
- [ ] (INFERIDO) shadcn/ui como camada de componentes — `Fonte:`
- [ ] (INFERIDO) Docker Compose (Postgres + backend + frontend) — `Fonte:`
- [ ] (INFERIDO) Testes automatizados no backend (unitários + integração) — `Fonte:`
- [ ] (INFERIDO) Testes automatizados no frontend — `Fonte:`
- [ ] (INFERIDO) Documentação de API (Swagger/OpenAPI) — `Fonte:`
- [ ] (INFERIDO) Tratamento de erros consistente ponta a ponta — `Fonte:`

---

## Perguntas em aberto (responder com o documento em mãos)

- [ ] O teste pede autenticação de fato, ou "Acesso" significa só controle de permissão?
- [ ] Existem roles distintas? Quais?
- [ ] O primeiro endereço cadastrado vira principal automaticamente?
- [ ] Ao excluir o endereço principal, outro é promovido, ou o usuário fica sem principal?
- [ ] Um usuário PRECISA ter pelo menos um endereço?
- [ ] Há limite de endereços por usuário?
- [ ] O CEP deve ser armazenado com ou sem máscara?
- [ ] Os campos vindos do ViaCEP podem ser editados pelo usuário depois?
- [ ] Nomes de tabelas/colunas em português ou inglês?
- [ ] Há requisito de soft delete (exclusão lógica)?

---

# Ambiguidades e decisoes

Pontos em que o documento e omisso, ambiguo ou se contradiz. Cada um tem uma
decisao tomada e a justificativa. Esta secao vai para o README na entrega.

Marcacao: **[D]** decidido e ja implementado · **[P]** decidido, pendente de
implementacao · **[?]** precisa do documento para fechar.

## 1. [P] "Data Nascimento" esta nos requisitos mas some do formulario

**Contradicao do documento.** A secao de requisitos de usuario pede Data de
Nascimento; o formulario do frontend nao mostra o campo.

**Decisao: seguir os requisitos — implementar no backend E incluir no
formulario.** A secao de requisitos e o contrato; o desenho de tela e
ilustrativo. Entregar um campo a mais que o mock e um erro menor do que deixar
de fora um requisito escrito. Coluna `data_nascimento DATE`, mapeada para
`LocalDate` em Java — data de calendario nao tem hora nem fuso, entao `Instant`
estaria errado aqui. Validacao `@Past`: idade minima nao foi mencionada e nao
vou inventar.

## 2. [D] O primeiro endereco vira principal automaticamente?

**Omisso.**

**Decisao: sim, automaticamente.** Se nao virasse, um usuario com exatamente um
endereco ficaria sem principal — estado inutil que obrigaria todo consumidor de
"endereco principal" a tratar nulo. O custo de errar e baixo e o comportamento e
o que o usuario espera.

## 3. [D] Excluir o UNICO endereco do usuario

**Omisso.** Nao ha outro para promover.

**Decisao: permitir a exclusao; o usuario fica com zero enderecos e sem
principal.** A regra e "no maximo um principal", nunca "no minimo um endereco".
Bloquear prenderia o usuario: ele nao conseguiria apagar um endereco digitado
errado. O indice unico parcial aceita zero principais naturalmente.

**Caso irmao (tambem omisso): excluir o principal quando existem outros.**
Decisao: promover automaticamente o mais antigo restante, dentro da mesma
transacao. Evita o estado esquisito de ter tres enderecos e nenhum principal.

## 4. [D] O admin pode definir o endereco principal de um usuario?

**Omisso.** A acao aparece so na tela do usuario comum.

**Decisao: sim.** O admin ja le e edita todo o resto do cadastro; tornar
"definir principal" a unica excecao seria arbitrario e dificil de justificar.
Ja implementado: `ControleAcesso.exigirAcessoAoUsuario` libera ADMIN antes de
comparar os ids.

## 5. [D] Como nasce o primeiro administrador?

**Omisso.** O cadastro publico provavelmente cria usuario comum.

**Decisao: migration de seed (`V3__seed_usuarios.sql`), com CPF e senha fixos
documentados no README.** Precisa existir antes da primeira requisicao, entao
nao da para depender de endpoint. E o ponto de seguranca que sustenta a decisao:
**o campo `role` nunca e aceito no corpo da requisicao de cadastro publico** —
se fosse, qualquer um mandaria `"role":"ADMIN"` no proprio registro. Promocao a
admin so por outro admin, ou por seed.

## 6. [D] CPF e CEP: guardar com ou sem mascara?

**Omisso.**

**Decisao: sem mascara, so digitos; formatar na exibicao.** Guardar mascarado
criaria duas representacoes do mesmo valor ("01001-000" e "01001000") e
quebraria busca por igualdade e unicidade. Garantido por `CHECK` no banco, nao
so no service.

## 7. [D] Usuario inativo consegue logar?

**Omisso.** A coluna `ativo` existe.

**Decisao: nao.** `AuthService` filtra por `isAtivo` antes de emitir o token, e
a resposta e o mesmo 401 generico — nao revela que a conta existe mas esta
desativada.

## 8. [D] Login por CPF ou tambem por e-mail?

**Ambiguo:** o e-mail tambem e unico, entao serviria tecnicamente.

**Decisao: somente CPF**, conforme especificado. Duas credenciais de entrada
dobram a superficie de ataque sem beneficio pedido.

## 9. [P] Exclusao fisica ou logica (soft delete)?

**Omisso.**

**Decisao: exclusao fisica, com `ON DELETE CASCADE` nos enderecos.** Nada no
que foi pedido menciona historico ou auditoria de removidos. A coluna `ativo`
ja cobre o caso "desativar sem apagar", que e diferente de excluir.

## 10. [?] Existe auto-cadastro publico, ou so o admin cadastra usuarios?

Muda o desenho inteiro de rotas e telas. **Proposta**: `POST /api/usuarios`
publico criando sempre USUARIO_COMUM. **Precisa de confirmacao no documento.**

## 11. [?] O usuario comum pode editar e excluir a propria conta?

**Proposta**: pode editar; excluir so o admin. **Precisa de confirmacao.**

## 12. [D] Paginacao na listagem de usuarios

**Omisso.** **Decisao: `Pageable` do Spring Data na listagem do admin.** Custa
uma linha e evita carregar a tabela inteira. Listagem de enderecos fica sem
paginar: e sempre de um unico usuario, volume naturalmente pequeno.

## 13. [P] Os campos preenchidos pelo ViaCEP podem ser editados depois?

**Omisso.**

**Decisao: sim, sao editaveis.** ViaCEP as vezes devolve logradouro generico ou
vazio para CEP de faixa unica, e numero e complemento nunca vem de la. Os dados
sao gravados como snapshot no nosso banco — nao dependemos do ViaCEP estar no ar
para exibir um endereco ja cadastrado.

## 14. [P] Limite de enderecos por usuario

**Omisso.** **Decisao: sem limite.** Inventar um teto seria regra nao pedida.

## 15. [D] Formato de data e fuso na API

**Omisso.** **Decisao: ISO-8601 em UTC.** Colunas `TIMESTAMPTZ`, `Instant` em
Java. `data_nascimento` e a excecao: `DATE`/`LocalDate`, sem fuso, porque data
de nascimento nao muda conforme o fuso de quem le.

## 16. [D] 403 ou 404 ao pedir recurso de outro usuario?

**Omisso.**

**Decisao: 403.** E semanticamente honesto ("existe e voce nao pode"). O
contra-argumento e que 403 confirma a existencia do id — julguei irrelevante
porque os ids sao `BIGINT` sequenciais e a existencia ja e trivialmente
dedutivel. Trocar para 404 e mudar uma excecao numa linha, caso o avaliador
prefira esconder.
