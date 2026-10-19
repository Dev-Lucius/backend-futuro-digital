const express = require('express');

const server = express();
const port = 8080;

server.get('/', (request, response) => {
    response.status(200).json([
        { nome: 'fulano', nascimento: '2000-12-31', genero: 'M' },
        { nome: 'beltrano', nascimento: '2000-12-31', genero: 'M' },
        { nome: 'ciclano', nascimento: '2005-06-10', genero: 'F' }
    ]);
});

server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});