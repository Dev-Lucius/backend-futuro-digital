const express = require('express');

const server = express(); // Cria a Aplicação / Servidor
const port = 8080;

// Cada rota corresponde a um path do OpenAPI. 
// O codigo define um parâmetro dinâmico de rota; 
// Assim, qualquer valor nessa posição da URL é capturado.
server.get('/', (request, response) => {
	console.log(request.params);
	response.status(200).json('resposta');
});

server.get('/:codigo', (request, response) => {
	console.log(request.params);
	response.status(200).json(`resposta ${request.params.codigo}`);
});

// inicia o servidor numa porta, executando o callback quando está pronto
// server.listen(port, callback)
server.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});

// Obs !
/*
	- request.params
	  * request.params é um objeto com os valores capturados das rotas dinâmicas. 
	  * Para a rota /:codigo, uma chamada a /123 gera request.params.codigo === '123'.

	- response.status().json()
    * .status(200) define o código HTTP da resposta.json(dado) serializa o dado 
    * como JSON e define o Content-Type automaticamente
*/


// No Postman ...
/* 
    [Object: null prototype] {}
    [Object: null prototype] { codigo: ':codigo' }
    [Object: null prototype] { codigo: '123' }
*/