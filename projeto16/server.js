// ==========================================
// AULA 0: IMPORTACOES E CONFIGURACAO
// ==========================================

// Carrega as variaveis do .env (EXPRESS_PORT, DB_HOST, DB_PASSWORD...)
require("dotenv").config();

const express = require("express");
const validator = require("express-openapi-validator");

// ------------------------------------------
// IMPORTANDO O DRIVER DO POSTGRESQL
// ------------------------------------------
// 'pg' eh o modulo oficial do Node.js para conectar ao PostgreSQL.
// Ele fornece a classe Pool (e tambem Client).
const db = require("pg");

const server = express();
const port = process.env.EXPRESS_PORT;

// ==========================================
// AULA 1: POOL DE CONEXOES
// ==========================================
// O QUE EH UM POOL?
// -----------------
// Imagine que cada requisicao ao seu servidor precisa acessar o banco.
// Abrir uma conexao com o banco eh lento (handshake, autenticacao...).
// Em vez de abrir e fechar a conexao a cada requisicao, o POOL mantem
// varias conexoes ABERTAS e REUTILIZA elas.
//
// Analogia: o pool eh como um estacionamento de taxis. Em vez de voce
// comprar um novo taxi para cada corrida, voce pega um que ja esta
// pronto e o devolve quando termina.
//
// BENEFICIOS:
// - Mais rapido (nao abre conexao do zero toda vez)
// - Escalavel (suporta varias requisicoes simultaneas)
// - Seguro (limite maximo de conexoes evita sobrecarga no PostgreSQL)

const pool = new db.Pool({
  host: process.env.DB_HOST, // onde o PostgreSQL esta rodando
  port: process.env.DB_PORT, // porta (padrao 5432)
  database: process.env.DB_DATABASE, // nome do banco
  user: process.env.DB_USER, // usuario
  password: process.env.DB_PASSWORD, // senha
});

// ==========================================
// AULA 2: MIDDLEWARES BASICOS
// ==========================================

// Habilita leitura de JSON no body das requisicoes
server.use(express.json());

// Valida automaticamente as requisicoes contra o api.yaml
server.use(
  validator.middleware({
    apiSpec: "api.yaml",
    validateRequests: true,
    validateResponses: false,
  })
);

// ==========================================
// AULA 3: LISTAR TODAS AS PESSOAS (GET /)
// ==========================================
// SQL: SELECT * FROM pessoa
// Significado: "Selecione todas as colunas de todas as linhas da tabela pessoa"
// ==========================================
server.get("/", async (request, response) => {
  try {
    // pool.query() envia o comando SQL ao PostgreSQL.
    // O resultado vem como um objeto com varias propriedades.
    // A mais importante para nos eh 'result.rows' (array de objetos).
    const result = await pool.query("SELECT * FROM pessoa");

    // result.rows = [ { codigo: 1, nome: 'fulano', ... }, { ... } ]
    console.log("SELECT * FROM pessoa:");
    console.log(result.rows);

    // Devolvemos o array direto. O Express converte para JSON automaticamente.
    response.status(200).json(result.rows);
  } catch (error) {
    // Erros comuns aqui:
    // - PostgreSQL nao esta rodando
    // - Senha errada
    // - Banco 'cadastro' nao existe
    console.error("--- ERRO NO GET / ---");
    console.error(error.stack);
    response.status(500).json({ erro: error.message });
  }
});

// ==========================================
// AULA 4: CRIAR PESSOA (POST /)
// ==========================================
// SQL: INSERT INTO ... VALUES ... RETURNING *
// ==========================================
// O QUE EH "RETURNING *"?
// -----------------------
// Normalmente, INSERT nao devolve nada (so insere).
// "RETURNING *" eh uma superpoder do PostgreSQL: ele devolve
// a linha que acabou de ser criada, INCLUSIVE o 'codigo' gerado
// pelo SERIAL. Sem isso, nao saberiamos qual ID foi atribuido!
//
// O QUE SAO "$1, $2, $3"?
// -----------------------
// Sao PLACEHOLDERS (parametros posicionais). Eles protegem contra
// SQL INJECTION (ataque onde o usuario envia codigo malicioso no body).
// O driver 'pg' escapa os valores automaticamente.
//
// NUNCA concatene strings direto no SQL:
//   ERRADO:  `INSERT ... VALUES ('${nome}', ...)`  <-- vulneravel!
//   CERTO:   `INSERT ... VALUES ($1, $2, $3)`      <-- seguro!
// ==========================================
server.post("/", async (request, response) => {
  try {
    const { nome, nascimento, genero } = request.body;

    // Array de valores: [ 'sicrano', '2000-06-30', 'M' ]
    // O PostgreSQL substitui $1 pelo 1o item, $2 pelo 2o, etc.
    const result = await pool.query(
      "INSERT INTO pessoa (nome, nascimento, genero) VALUES ($1, $2, $3) RETURNING *",
      [nome, nascimento, genero]
    );

    // result.rows[0] = { codigo: 2, nome: 'sicrano', nascimento: '2000-06-30', genero: 'M' }
    console.log("INSERT realizado:");
    console.log(result.rows[0]);

    // Status 201 = Created (recurso novo persistido no banco)
    response.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("--- ERRO NO POST / ---");
    console.error(error.stack);
    response.status(500).json({ erro: error.message });
  }
});

// ==========================================
// AULA 5: BUSCAR PESSOA POR ID (GET /:codigo)
// ==========================================
// SQL: SELECT * FROM pessoa WHERE codigo = $1
// ==========================================
server.get("/:codigo", async (request, response) => {
  try {
    // request.params.codigo vem como string. O PostgreSQL converte
    // automaticamente, mas o OpenAPI ja validou que eh integer.
    const result = await pool.query("SELECT * FROM pessoa WHERE codigo = $1", [
      request.params.codigo,
    ]);

    // IMPORTANTE: Se o SELECT nao encontrar nada, result.rows eh um
    // array VAZIO [], nao um erro. Precisamos verificar manualmente.
    if (result.rows.length === 0) {
      return response.status(404).json({ erro: "Pessoa nao encontrada" });
    }

    // result.rows[0] = unica linha encontrada (codigo eh PRIMARY KEY,
    // entao nunca havera mais de uma).
    response.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("--- ERRO NO GET /:codigo ---");
    console.error(error.stack);
    response.status(500).json({ erro: error.message });
  }
});

// ==========================================
// AULA 6: ATUALIZAR PESSOA (PUT /:codigo)
// ==========================================
// SQL: UPDATE ... SET ... WHERE codigo = $4 RETURNING *
// ==========================================
// ATENCAO: SEMPRE use WHERE em UPDATE e DELETE!
// Sem WHERE, voce atualiza TODAS as linhas da tabela.
// ==========================================
server.put("/:codigo", async (request, response) => {
  try {
    const { nome, nascimento, genero } = request.body;

    const result = await pool.query(
      "UPDATE pessoa SET nome = $1, nascimento = $2, genero = $3 WHERE codigo = $4 RETURNING *",
      [nome, nascimento, genero, request.params.codigo]
    );

    // Se nenhuma linha foi atualizada, o codigo nao existe.
    if (result.rows.length === 0) {
      return response
        .status(404)
        .json({ erro: "Pessoa nao encontrada para atualizar" });
    }

    console.log("UPDATE realizado:");
    console.log(result.rows[0]);

    response.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("--- ERRO NO PUT /:codigo ---");
    console.error(error.stack);
    response.status(500).json({ erro: error.message });
  }
});

// ==========================================
// AULA 7: REMOVER PESSOA (DELETE /:codigo)
// ==========================================
// SQL: DELETE FROM pessoa WHERE codigo = $1 RETURNING *
// ==========================================
server.delete("/:codigo", async (request, response) => {
  try {
    const result = await pool.query(
      "DELETE FROM pessoa WHERE codigo = $1 RETURNING *",
      [request.params.codigo]
    );

    if (result.rows.length === 0) {
      return response
        .status(404)
        .json({ erro: "Pessoa nao encontrada para remover" });
    }

    console.log("DELETE realizado:");
    console.log(result.rows[0]);

    // 204 No Content = sucesso, mas sem corpo na resposta.
    // Como a pessoa foi apagada, nao faz sentido devolver os dados dela.
    response.status(204).send();
  } catch (error) {
    console.error("--- ERRO NO DELETE /:codigo ---");
    console.error(error.stack);
    response.status(500).json({ erro: error.message });
  }
});

// ==========================================
// AULA 8: MIDDLEWARE DE ERRO GLOBAL
// ==========================================
server.use((error, request, response, next) => {
  console.error("--- ERRO GLOBAL CAPTURADO ---");
  console.error(error.stack);
  response.status(error.status || 500).json({
    erro: error.message || "Erro interno do servidor",
  });
});

// ==========================================
// AULA 9: INICIALIZACAO
// ==========================================
server.listen(port, () => {
  console.log(`  API conectada ao PostgreSQL`);
  console.log(`  Servidor: http://localhost:${port}`);
});