const express = require('express');

const server = express();
const port = 8080;

server.get('/', (request, response) => {
	console.log(request.query);
	response.status(200).json(`resposta ${request.query.parametro1} ${request.query.parametro2}`);
});

server.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});

// No Postman..
// Server listening at http://localhost:8080
// [Object: null prototype] {}
// [Object: null prototype] { '1': [ '', '' ] }
// [Object: null prototype] { '1': [ '10', '10' ] }