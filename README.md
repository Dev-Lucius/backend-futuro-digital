# 🚀 Jornada BackEnd com Node.js

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-5.x-black?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?logo=postgresql)
![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-green?logo=swagger)
![JWT](https://img.shields.io/badge/JWT-Auth-orange?logo=jsonwebtokens)

&gt; Repositório de estudos dedicado ao desenvolvimento **BackEnd com Node.js + Express + PostgreSQL**.  
&gt; Cada pasta representa um módulo prático com conceitos, código comentado e aplicações reais.

---

## 📚 O que estou estudando

Este repositório documenta minha evolução como desenvolvedor back-end, partindo dos fundamentos HTTP até transações bancárias com PostgreSQL.

| Área | Status |
|------|--------|
| Fundamentos HTTP (Path/Query/Header Params) | ✅ |
| Request/Response Body e JSON | ✅ |
| Middlewares no Express | ✅ |
| Documentação com OpenAPI 3.0 | ✅ |
| Validação automática com `express-openapi-validator` | ✅ |
| Autenticação e Autorização com JWT | ✅ |
| Roles e permissões (RBAC) | ✅ |
| Consumo de APIs externas com `fetch` | ✅ |
| Agregação de dados (Proxy / BFF) | ✅ |
| PostgreSQL e SQL | ✅ |
| Transações ACID (`BEGIN`, `COMMIT`, `ROLLBACK`) | ✅ |
| Pool de conexões e `SELECT ... FOR UPDATE` | ✅ |

---

## 🗂️ Módulos

### 01 — Fundamentos HTTP
**Conceitos:** Path Params, Query Params, Headers, Request/Response Body, status HTTP.  
**Destaque:** Primeira API funcional com Express entendendo de onde vêm os dados.

---

### 02 — Middlewares no Express
**Conceitos:** `next()`, ordem de execução, middleware de aplicação, roteador, erro.  
**Destaque:** Criação de middlewares reutilizáveis de log e autenticação.

---

### 03 — OpenAPI + Validator
**Conceitos:** Especificação `api.yaml`, `securitySchemes`, validação automática de entrada.  
**Destaque:** A documentação vira código ativo — a spec valida a requisição antes de chegar na rota.

---

### 04 — JWT: Autenticação
**Conceitos:** `jwt.sign()`, `jwt.verify()`, `Bearer token`, `.env`, expiração.  
**Destaque:** Sistema de login que gera tokens assinados digitalmente.

---

### 05 — JWT: Autorização com Roles
**Conceitos:** RBAC, `security: bearer`, `403 Forbidden` vs `401 Unauthorized`, payload com `role`.  
**Destaque:** Middleware `requerRole([2, 3])` que protege rotas por papel do usuário.

---

### 06 — Fetch Proxy
**Conceitos:** `fetch` no Node.js, `try/catch`, `.ok`, `JSON.stringify()`, integração com API externa.  
**Destaque:** Servidor Express como cliente HTTP consumindo JSONPlaceholder.

---

### 07 — Proxy Agregador Multi-API
**Conceitos:** `Promise.all()`, agregação sequencial vs paralela, BFF (Backend for Frontend).  
**Destaque:** Endpoint único que junta dados de JSONPlaceholder + ViaCEP + Open-Meteo.

---

### 08 — PostgreSQL: CRUD Persistente
**Conceitos:** `pg.Pool`, placeholders `$1`, `RETURNING *`, `SERIAL`, conexão com banco real.  
**Destaque:** Substituição do "array em memória" por um banco de dados relacional.

---

### 09 — Transações Bancárias
**Conceitos:** ACID, `BEGIN`, `COMMIT`, `ROLLBACK`, `SELECT ... FOR UPDATE`, `pool.connect()`.  
**Destaque:** Transferência entre contas com garantia de atomicidade — o dinheiro nunca some no meio do caminho.

---

## 🛠️ Tecnologias e Ferramentas

| Tecnologia | Uso |
|------------|-----|
| **Node.js** | Runtime JavaScript no servidor |
| **Express.js** | Framework web para rotas e middlewares |
| **PostgreSQL** | Banco de dados relacional persistente |
| **pg** | Driver oficial do PostgreSQL para Node |
| **express-openapi-validator** | Validação automática via OpenAPI |
| **jsonwebtoken** | Geração e verificação de tokens JWT |
| **dotenv** | Gerenciamento de variáveis de ambiente |
| **Postman / Thunder Client** | Teste manual de endpoints |
| **psql** | CLI do PostgreSQL para SQL puro |

---

## 🎯 Como usar este repositório

Cada pasta é um **projeto independente** com seu próprio:

- `api.yaml` — especificação OpenAPI
- `server.js` — código comentado didaticamente
- `.env` — variáveis de ambiente (não commitadas)
- `package.json` — dependências

```bash
# Exemplo: rodar o módulo de transações
cd 09-transacoes-bancarias
npm install
# configure o .env e o PostgreSQL
npm run dev
```

---

## 💡 Resumo dos Conteúdos 

[Notion](https://app.notion.com/p/Back-End-Bolsa-Digital-Futuro-3927c6764d4881bab842ed1a40e6df41?source=copy_link)
