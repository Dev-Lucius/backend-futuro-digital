-- ==========================================
-- AULA 0: CRIANDO O BANCO DE DADOS
-- ==========================================
-- Um "banco de dados" eh um container que agrupa tabelas,
-- usuarios, permissoes e regras. Pense nele como uma pasta
-- que guarda planilhas relacionadas entre si.

CREATE DATABASE lucas;

-- Conecte-se ao banco 'cadastro' antes de rodar o restante:
-- psql -h localhost -U postgres -d cadastro

-- ==========================================
-- AULA 1: CRIANDO A TABELA
-- ==========================================
-- TABELA = onde os dados ficam guardados em formato de linhas e colunas.
-- Cada linha eh um registro (ex: uma pessoa).
-- Cada coluna eh um campo (ex: nome, data de nascimento).

CREATE TABLE pessoa (
  -- SERIAL: tipo especial do PostgreSQL que gera numeros inteiros
  -- automaticamente (1, 2, 3...). Equivalente ao "auto increment".
  -- NOT NULL: esta coluna NAO pode ficar vazia.
  codigo SERIAL NOT NULL,

  -- VARCHAR(100): string com limite de 100 caracteres.
  nome VARCHAR(100) NOT NULL,

  -- DATE: armazena apenas data (YYYY-MM-DD), sem horario.
  -- O PostgreSQL valida se a data existe (ex: rejeita 2023-02-30).
  nascimento DATE NOT NULL,

  -- CHAR(1): string de EXATAMENTE 1 caractere.
  -- Usamos para 'M' ou 'F'.
  genero CHAR(1) NOT NULL,

  -- PRIMARY KEY: identificador unico da linha.
  -- O PostgreSQL cria um indice automaticamente para busca rapida.
  PRIMARY KEY (codigo)
);

-- ==========================================
-- AULA 2: INSERINDO DADOS
-- ==========================================
-- INSERT INTO: comando para adicionar uma nova linha na tabela.
-- VALUES: os dados na ordem das colunas.
-- RETURNING *: pede ao PostgreSQL para devolver a linha que acabou
-- de ser criada (inclusive o 'codigo' gerado pelo SERIAL).

INSERT INTO pessoa (nome, nascimento, genero)
VALUES ('fulano', '2000-12-31', 'M')
RETURNING *;

-- ==========================================
-- AULA 3: CONSULTANDO DADOS
-- ==========================================
-- SELECT: busca dados.
-- *: significa "todas as colunas".
-- WHERE: filtra as linhas (como o .filter() do JavaScript).

SELECT * FROM pessoa;
SELECT * FROM pessoa WHERE codigo = 1;

-- ==========================================
-- AULA 4: ATUALIZANDO DADOS
-- ==========================================
-- UPDATE: altera linhas existentes.
-- SET: define os novos valores.
-- WHERE: ESSENCIAL! Sem ele, voce altera TODAS as linhas da tabela.
-- RETURNING *: devolve a linha ja atualizada.

UPDATE pessoa
SET nome = 'beltrano', nascimento = '2000-07-31', genero = 'M'
WHERE codigo = 1
RETURNING *;

-- ==========================================
-- AULA 5: REMOVENDO DADOS
-- ==========================================
-- DELETE: remove linhas.
-- WHERE: ESSENCIAL! Sem ele, voce apaga a TABELA INTEIRA.
-- RETURNING *: devolve a linha que foi apagada (util para confirmar).

DELETE FROM pessoa WHERE codigo = 1 RETURNING *;