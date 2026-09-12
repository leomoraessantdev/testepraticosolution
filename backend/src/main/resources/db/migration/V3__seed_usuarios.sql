-- Usuarios de demonstracao.
-- Hashes BCrypt gerados offline e travados pelo teste SeedDeUsuariosTest,
-- que falha se o hash deixar de conferir com a senha documentada aqui.
--
--   52998224725 / admin123    -> ADMIN
--   11144477735 / usuario123  -> USUARIO_COMUM  (Ana)
--   39053344705 / usuario123  -> USUARIO_COMUM  (Bruno)
--
-- Ana e Bruno existem para os testes de isolamento entre usuarios.

INSERT INTO usuarios (nome, cpf, email, senha_hash, role) VALUES
    ('Administrador', '52998224725', 'admin@exemplo.com',
     '$2b$10$0zUn26pyOoigm9roURyfYecNyh/zPkpqxg9CypmvOX/vbtZ/vyG9K', 'ADMIN'),
    ('Ana Souza',     '11144477735', 'ana@exemplo.com',
     '$2b$10$L/4LH62jpdD9INDm4asuTeG10.oSt9eG35qWwjhBYgXKUD3K5DYxm', 'USUARIO_COMUM'),
    ('Bruno Lima',    '39053344705', 'bruno@exemplo.com',
     '$2b$10$L/4LH62jpdD9INDm4asuTeG10.oSt9eG35qWwjhBYgXKUD3K5DYxm', 'USUARIO_COMUM');

INSERT INTO enderecos (usuario_id, cep, logradouro, numero, bairro, cidade, uf, principal)
SELECT id, '01310100', 'Avenida Paulista', '1578', 'Bela Vista', 'Sao Paulo', 'SP', TRUE
FROM usuarios WHERE cpf = '11144477735';

INSERT INTO enderecos (usuario_id, cep, logradouro, numero, bairro, cidade, uf, principal)
SELECT id, '04538133', 'Avenida Brigadeiro Faria Lima', '3477', 'Itaim Bibi', 'Sao Paulo', 'SP', TRUE
FROM usuarios WHERE cpf = '39053344705';
