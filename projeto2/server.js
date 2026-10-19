const express = require('express');
const server = express();
const port = 8080;

// 1. GET - Leitura
server.get('/', (request, response) => {
    response.status(200).json('resposta GET');
});

// 2. POST - Criação
server.post('/', (request, response) => {
    response.status(200).json('resposta POST');
});

// 3. PUT - Atualização Completa
server.put('/', (request, response) => {
    response.status(200).json('resposta PUT');
});

// 4. DELETE - Remoção
server.delete('/', (request, response) => {
    response.status(200).json('resposta DELETE');
});

// 5. O "Catch-All" para Métodos Não Permitidos
server.all('/', (request, response) => {
    response.status(405).json();
});

server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

/*
	GET http://localhost:8080 200 Ok
	POST http://localhost:8080 200 Ok
	PUT http://localhost:8080 200 Ok
	DELETE http://localhost:8080 200 Ok
	PATCH http://localhost:8080 405 Method Not Allowed
*/