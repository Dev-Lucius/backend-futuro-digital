const express = require('express');

const server = express();
const port = 8080;

server.get('/', (request, response) => {
	response.status(200).json('resposta');
});

server.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});