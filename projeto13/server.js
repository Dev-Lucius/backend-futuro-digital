require('dotenv').config();

const express = require('express');
const validator = require('express-openapi-validator');
const jwt = require('jsonwebtoken');

const server = express();
const port = process.env.EXPRESS_PORT;

server.use(express.json());

// 1. VALIDADOR OPENAPI (valida estrutura das requisições)
server.use(validator.middleware({
    apiSpec: 'api.yaml',
    validateRequests: true,
    validateResponses: false
}));

// 2. LOGIN — Gera o token
server.post('/autenticacao', (request, response) => {
    // Cria o token com payload (dados do usuário)
    const token = jwt.sign(
        { sub: request.body.usuario, role: 2 },      // payload
        process.env.JWT_SECRET,                      // chave secreta
        { expiresIn: '1m' }                          // expira em 1 minuto
    );

    console.log('Token gerado:', token);
    response.status(200).json({ token: token });
});

// 3. ROTA PROTEGIDA — Verifica o token
server.get('/', (request, response) => {
    let token = request.headers.authorization;

    try {
        // Remove o prefixo "Bearer " se existir
        if (token.startsWith('Bearer ')) {
            token = token.replace('Bearer ', '');
        } else {
            token = '';
        }

        // Verifica se o token é válido e não expirou
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        console.log('Token válido! Payload:', payload);
        response.status(200).json('resposta');

    } catch (error) {
        console.log(error.stack);
        response.status(401).json({ erro: error.message });
    }
});

// 4. MIDDLEWARE DE ERRO (captura erros do validator e do JWT)
server.use((error, request, response, next) => {
    console.log(error.stack);
    response.status(error.status || 500).json({ erro: error.message });
});

server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});