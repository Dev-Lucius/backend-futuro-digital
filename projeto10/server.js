const express = require('express');
const validator = require('express-openapi-validator');

const server = express();
const port = 8080;

server.use(express.json());

server.use(validator.middleware({ apiSpec: 'api.yaml', validateRequests: true, validateResponses: false }));

server.put('/:codigo', (request, response) => {
	response.status(200).json({ codigo: request.params.codigo, nome: request.body.nome, nascimento: request.body.nascimento, genero: request.body.genero });
});

server.use((error, request, response, next) => {
	console.log(error.stack);
	response.status(error.status || 500).json(error.message);
});

server.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});