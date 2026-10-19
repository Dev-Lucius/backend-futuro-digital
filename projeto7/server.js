const express = require('express');

const server = express();
const port = 8080;

// Middleware essencial para ler JSON no body
server.use(express.json());

server.post('/', (request, response) => {
    console.log(request.body);           // ← acessa o corpo da requisição
    response.status(201).json(request.body);  // ← devolve o mesmo body com status 201
});

server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});