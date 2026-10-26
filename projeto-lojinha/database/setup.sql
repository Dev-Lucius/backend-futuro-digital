CREATE DATABASE lojinha;

\c lojinha;


CREATE TABLE funcionario(
    codigo serial PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    salario REAL NOT NULL,
    senha VARCHAR(200) NOT NULL,
    papel INTEGER NOT NULL
);

CREATE TABLE produto(
    codigo serial PRIMARY KEY,
    descricao TEXT NOT NULL,
    preco REAL NOT NULL,
    comissao REAL NOT NULL,
    quantidade INTEGER NOT NULL
);

CREATE TABLE venda(
    codigo serial PRIMARY KEY,
    vendedor INTEGER REFERENCES funcionario(codigo),
    produto INTEGER REFERENCES produto(codigo),
    quando TIMESTAMP,
    quantidade INTEGER NOT NULL
);

