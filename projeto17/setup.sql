-- ==========================================
-- AULA 0: CRIANDO O BANCO DE DADOS
-- ==========================================
-- O banco 'banco' (sim, o nome eh 'banco') vai guardar as contas
-- correntes que serao usadas nas transferencias.

CREATE DATABASE banco;

-- Conecte-se ao banco antes de continuar:
-- psql -U postgres -d banco

-- ==========================================
-- AULA 1: CRIANDO A TABELA DE CONTAS
-- ==========================================
-- 'codigo' = numero da conta (1, 2, 3...)
-- 'saldo'  = quanto de dinheiro tem nela (tipo REAL = numero decimal)
-- PRIMARY KEY garante que nao existem dois codigos iguais.

CREATE TABLE contacorrente (
  codigo integer NOT NULL,
  saldo real NOT NULL,
  PRIMARY KEY (codigo)
);

-- ==========================================
-- AULA 2: INSERINDO CONTAS INICIAIS
-- ==========================================
-- Criamos duas contas com saldo 100 cada.
-- RETURNING * mostra no terminal o que foi inserido.

INSERT INTO contacorrente (codigo, saldo) VALUES (1, 100), (2, 100) RETURNING *;