-- Data de nascimento: exigida na secao de requisitos do documento, ainda que
-- ausente do desenho do formulario. Decisao registrada no PLAN.md.
--
-- Migration NOVA em vez de alteracao da V1: a V1 ja esta versionada no git e
-- pode ter rodado no ambiente de quem clonou. Editar migration ja publicada
-- quebra o checksum do Flyway para todo mundo. (Na etapa 2.2 eu editei a V1
-- porque ela so tinha rodado na minha maquina e nao existia repositorio.)

-- Tres passos, e nao um ALTER com NOT NULL direto: a tabela ja tem linhas, e
-- adicionar coluna obrigatoria sem valor falharia.
ALTER TABLE usuarios ADD COLUMN data_nascimento DATE;

UPDATE usuarios SET data_nascimento = DATE '1985-03-12' WHERE cpf = '52998224725';
UPDATE usuarios SET data_nascimento = DATE '1995-06-15' WHERE cpf = '11144477735';
UPDATE usuarios SET data_nascimento = DATE '1988-11-02' WHERE cpf = '39053344705';

ALTER TABLE usuarios ALTER COLUMN data_nascimento SET NOT NULL;

-- Limite inferior de sanidade. Nao existe CHECK para "nao pode ser futura":
-- o Postgres exige funcoes IMMUTABLE em constraint, e CURRENT_DATE e STABLE.
-- Faz sentido: uma linha valida hoje seria reavaliada amanha com outro
-- resultado. Essa regra vive no Bean Validation (@PastOrPresent).
ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_data_nascimento
    CHECK (data_nascimento >= DATE '1900-01-01');

COMMENT ON COLUMN usuarios.data_nascimento IS 'Data de calendario, sem hora nem fuso. LocalDate em Java.';
