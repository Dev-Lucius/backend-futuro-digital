require('dotenv').config();
const express = require('express');
const validator = require('express-openapi-validator');

const server = express();
const port = process.env.EXPRESS_PORT;

server.use(express.json());

server.use(validator.middleware({ apiSpec: 'api.yaml', validateRequests: true, validateResponses: false }));

server.get('/', (request, response) => {
	console.log(process.env.VARIAVEL_1);
	console.log(process.env.VARIAVEL_2);
	console.log(process.env.VARIAVEL_3);
	response.status(200).json('resposta');
});

server.use((error, request, response, next) => {
	console.log(error.stack);
	response.status(error.status || 500).json(error.message);
});

server.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});