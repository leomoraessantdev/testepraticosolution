-- Corrige a acentuacao dos dados de demonstracao.
--
-- Os seeds V3 e V5 gravaram "Sao Paulo", "Praca da Se" e "Se" sem acento. Isso
-- aparece em TODA tela que lista endereco, numa interface que e acentuada em
-- todo o resto, e destoa do proprio ViaCEP: consultar 01001-000 devolve
-- "Praca da Se" com acento, entao um endereco vindo do seed e outro vindo da API
-- externa apareciam escritos de formas diferentes lado a lado.
--
-- Migration nova em vez de edicao do V3 e do V5 pelo mesmo motivo de sempre, que
-- agora pesa mais: o repositorio ja e publico. Editar migration publicada quebra
-- o checksum do Flyway para qualquer pessoa que ja tenha clonado e rodado.
--
-- UPDATE por valor, e nao por id: funciona tanto num banco recem-criado, onde os
-- ids vem da sequencia, quanto num que ja existia.

UPDATE enderecos SET cidade = 'São Paulo' WHERE cidade = 'Sao Paulo';

UPDATE enderecos SET logradouro = 'Praça da Sé' WHERE logradouro = 'Praca da Se';

UPDATE enderecos SET bairro = 'Sé' WHERE bairro = 'Se';
