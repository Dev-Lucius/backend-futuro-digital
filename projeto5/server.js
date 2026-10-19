const express = require('express');

const server = express();
const port = 8080;

server.get('/', (request, response) => {
	console.log(request.headers);
	response.status(200).json(`resposta ${request.headers.parametro1} ${request.headers.parametro2}`);
});

server.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});

