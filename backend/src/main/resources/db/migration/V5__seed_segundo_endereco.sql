-- Cada usuario do seed passa a ter DOIS enderecos, exatamente um principal.
--
-- Migration nova em vez de edicao do V3, pelo mesmo motivo documentado no V4: o
-- V3 ja esta versionado e pode ter rodado no ambiente de quem clonou. Editar
-- migration publicada quebra o checksum do Flyway para todo mundo.
--
-- Aditiva de proposito. Nao apaga usuario nenhum: uma migration que remove
-- linhas de usuarios rodaria tambem em qualquer outro ambiente, e apagaria
-- cadastro de gente real. Registro de teste criado em runtime se limpa com
-- "docker compose down -v", documentado no README.
--
-- CEPs reais, com o logradouro e o bairro que o ViaCEP devolve para cada um.
-- Texto sem acento para seguir a convencao dos seeds anteriores.

-- Ana ja tem a Avenida Paulista como principal (V3). Ganha um secundario.
INSERT INTO enderecos (usuario_id, cep, logradouro, numero, complemento, bairro, cidade, uf, principal)
SELECT id, '01001000', 'Praca da Se', '111', 'Apto 52', 'Se', 'Sao Paulo', 'SP', FALSE
FROM usuarios WHERE cpf = '11144477735';

-- Bruno ja tem a Faria Lima como principal (V3). Ganha um secundario.
INSERT INTO enderecos (usuario_id, cep, logradouro, numero, complemento, bairro, cidade, uf, principal)
SELECT id, '01310100', 'Avenida Paulista', '900', NULL, 'Bela Vista', 'Sao Paulo', 'SP', FALSE
FROM usuarios WHERE cpf = '39053344705';

-- O administrador nao tinha endereco nenhum. Recebe os dois.
INSERT INTO enderecos (usuario_id, cep, logradouro, numero, complemento, bairro, cidade, uf, principal)
SELECT id, '04538133', 'Avenida Brigadeiro Faria Lima', '3477', 'Conjunto 141', 'Itaim Bibi', 'Sao Paulo', 'SP', TRUE
FROM usuarios WHERE cpf = '52998224725';

INSERT INTO enderecos (usuario_id, cep, logradouro, numero, complemento, bairro, cidade, uf, principal)
SELECT id, '01001000', 'Praca da Se', '200', NULL, 'Se', 'Sao Paulo', 'SP', FALSE
FROM usuarios WHERE cpf = '52998224725';
