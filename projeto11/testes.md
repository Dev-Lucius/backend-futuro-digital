```bash
POST http://localhost:8080/cadastro 200 Ok 
{ "usuario": "fulano", "senha": "12345" }

POST http://localhost:8080/autenticacao 200 Ok
{ "usuario": "fulano", "senha": "12345" }

POST http://localhost:8080/autenticacao 401 Unauthorized
{ "usuario": "fulano", "senha": "23456" }
```