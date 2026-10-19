require("dotenv").config();
const express = require("express");
const validator = require("express-openapi-validator");
const db = require("pg");

const server = express();
const port = process.env.EXPRESS_PORT;
const pool = new db.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

server.use(express.json());

server.use(
  validator.middleware({
    apiSpec: "api.yaml",
    validateRequests: true,
    validateResponses: false,
  })
);

server.put("/produto/:codigo/saida/:quantidade", async (request, response) => {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const result1 = await client.query(
      "SELECT * FROM produto WHERE codigo = $1 FOR UPDATE",
      [request.params.codigo]
    );
    if (result1.rows.length == 0) {
      const error = new Error("produto nao encontado");
      error.status = 404;
      throw error;
    }
    console.log(result1.rows[0]);
    if (result1.rows[0].estoque < request.params.quantidade) {
      const error = new Error("produto sem estoque");
      error.status = 409;
      throw error;
    }
    const result2 = await client.query(
      "UPDATE produto SET estoque = estoque - $1 WHERE codigo = $2 RETURNING *",
      [request.params.quantidade, request.params.codigo]
    );
    console.log(result2.rows[0]);
    await client.query("COMMIT");
    response
      .status(200)
      .json({
        operacao: "saida",
        produto: request.params.codigo,
        quantidade: request.params.quantidade,
        quando: new Date().toISOString(),
      });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.log(error.stack);
    response.status(error.status || 500).json(error.message);
  } finally {
    if (client) {
      client.release();
    }
  }
});


server.use((error, request, response, next) => {
  console.log(error.stack);
  response.status(error.status || 500).json(error.message);
});

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});