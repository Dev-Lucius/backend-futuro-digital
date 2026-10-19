const express = require('express');

const server = express();
const port = 8080;

server.get('/', (request, response) => {
	console.log(new Date('abc').toISOString());
	response.status(200).json('resposta');
});

server.use((error, request, response, next) => {
	console.log(error.stack);
	response.status(500).json("Error: " + error.message);
});

server.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});