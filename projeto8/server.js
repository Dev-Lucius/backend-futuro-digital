const express = require('express');

const server = express();
const port = 8080;

// Middleware 1
server.use((request, response, next) => {
    console.log('midleware 1');
    console.log(new Date().toISOString());
    console.log(request);
    next();  // ← CHAMA O PRÓXIMO!
});

// Middleware 2
server.use((request, response, next) => {
    console.log('midleware 2');
    console.log(new Date().toISOString());
    next();  // ← CHAMA O PRÓXIMO!
});

// Rota final
server.get('/', (request, response) => {
    response.status(200).json('resposta');
});

server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});