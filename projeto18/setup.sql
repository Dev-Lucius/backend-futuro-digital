CREATE DATABASE banco;

CREATE TABLE contacorrente (
  codigo integer NOT NULL,
  saldo real NOT NULL,
  PRIMARY KEY (codigo)
);

INSERT INTO contacorrente (codigo, saldo) VALUES (1, 100), (2, 100) RETURNING *;
