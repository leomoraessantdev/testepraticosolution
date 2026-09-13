-- Remove o e-mail do cadastro de usuario.
--
-- O enunciado do teste lista exatamente quatro campos: Nome, CPF, Data
-- Nascimento e Senha. O e-mail nunca apareceu nele - foi acrescentado por
-- decisao minha e, revisando a entrega, nao ha por que entregar um campo
-- obrigatorio que ninguem pediu. A decisao 2 do PLAN.md registra a reversao.
--
-- Migration nova em vez de edicao do V1, pelo mesmo motivo de sempre: o V1 ja
-- esta versionado e publicado, e editar migration publicada quebra o checksum do
-- Flyway para quem ja clonou e rodou.
--
-- O indice unico uk_usuarios_email cai junto com a coluna: no Postgres, DROP
-- COLUMN remove automaticamente os indices que dependem dela. Deixar explicito
-- aqui seria redundante, mas fica o registro de que a unicidade de e-mail deixa
-- de existir.

ALTER TABLE usuarios DROP COLUMN email;
