const express = require('express');
const validator = require('express-openapi-validator');
const bcrypt = require('bcrypt');

const server = express();
const port = 8080;

server.use(express.json());

server.use(validator.middleware({ apiSpec: 'api.yaml', validateRequests: true, validateResponses: false }));

server.post('/cadastro', (request, response) => {
	console.log(bcrypt.hashSync(request.body.senha, 10));
	response.status(200).json('resposta');
});

server.post('/autenticacao', (request, response) => {
	const hash = '$2b$10$gTpo7h3LRcs6JIq41pIiaOBd8cCmor0R/LsZxDzLc0Ig8I5jSRweS';
	if (!bcrypt.compareSync(request.body.senha, hash)) {
		response.status(401).json();
		return;
	}
	response.status(200).json('resposta');
});

server.use((error, request, response, next) => {
	console.log(error.stack);
	response.status(error.status || 500).json(error.message);
});

server.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});