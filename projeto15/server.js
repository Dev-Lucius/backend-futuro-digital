// ==========================================
// AULA 0: IMPORTACOES E CONFIGURACAO INICIAL
// ==========================================

// Carrega as variaveis do arquivo .env para o objeto process.env.
// Assim nao deixamos senhas e ports fixos no codigo.
require("dotenv").config();

const express = require("express");
const validator = require("express-openapi-validator");

// 'pg' eh o driver oficial do Node.js para PostgreSQL.
// Ele fornece Pool (conjunto de conexoes reutilizaveis)
// e Client (conexao individual).
const db = require("pg");

const server = express();
const port = process.env.EXPRESS_PORT;

// ==========================================
// AULA 1: POOL DE CONEXOES
// ==========================================
// O Pool mantem varias conexoes abertas com o PostgreSQL.
// Quando uma requisicao precisa do banco, ele pega uma conexao pronta,
// usa e devolve. Isso eh muito mais rapido que abrir do zero a cada vez.
// ==========================================
const pool = new db.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ==========================================
// AULA 2: MIDDLEWARES BASICOS
// ==========================================

// Habilita o servidor a entender JSON no body das requisicoes.
// Sem isso, request.body seria 'undefined'.
server.use(express.json());

// O express-openapi-validator le o 'api.yaml' e cria um middleware
// que valida automaticamente:
// - Se o body tem origem, destino e valor (required)
// - Se valor eh number e >= 0.01 (minimum)
// - Se origem e destino sao integers
// Se algo estiver errado, ele retorna 400 ANTES de chegar na sua rota.
server.use(
  validator.middleware({
    apiSpec: "api.yaml",
    validateRequests: true,
    validateResponses: false,
  })
);

// ==========================================
// AULA 3: A TRANSACAO BANCARIA (CORACAO DO PROJETO)
// ==========================================
// O QUE EH UMA TRANSACAO?
// -----------------------
// Uma transferencia envolve NO MINIMO duas operacoes no banco:
//   1) Diminuir o saldo da conta de origem (debito)
//   2) Aumentar o saldo da conta de destino (credito)
//
// Se o servidor CAIR entre o passo 1 e o passo 2, o dinheiro some
// da origem mas nunca chega ao destino. O banco ficou inconsistente.
//
// A transacao resolve isso com a regra: "TUDO OU NADA".
// - Se todos os comandos derem certo -> COMMIT (confirma para sempre)
// - Se QUALQUER comando falhar -> ROLLBACK (desfaz tudo)
//
// POR QUE USAR pool.connect() EM VEZ DE pool.query()?
// ----------------------------------------------------
// pool.query() pega uma conexao qualquer, executa UM comando e devolve.
// Uma transacao precisa que TODOS os comandos (BEGIN, SELECTs, UPDATEs,
// COMMIT) sejam executados pela MESMA conexao fisica.
// Por isso usamos pool.connect() para "pegar uma conexao exclusiva"
// e so a devolvermos no final.
// ==========================================

server.post("/", async (request, response) => {
  // ------------------------------------------
  // DECLARANDO 'client' FORA DO try
  // ------------------------------------------
  // Precisamos que 'client' exista no escopo do catch e do finally tambem.
  // Se declarasse dentro do try, o catch nao conseguiria acessar para
  // fazer ROLLBACK nem release().
  let client;

  try {
    // ------------------------------------------
    // PASSO 1: PEGAR UMA CONEXAO EXCLUSIVA
    // ------------------------------------------
    // pool.connect() retorna uma conexao individual do pool.
    // A partir daqui, esse 'client' eh "seu" ate voce devolver.
    client = await pool.connect();

    // ------------------------------------------
    // PASSO 2: INICIAR A TRANSACAO
    // ------------------------------------------
    // 'BEGIN' avisa ao PostgreSQL: "a partir de agora, tudo que eu
    // fizer eh provisorio. Nao salve no disco ainda."
    // O banco comeca a anotar tudo em um "rascunho" isolado.
    await client.query("BEGIN");

    // ------------------------------------------
    // PASSO 3: TRAVAR E VERIFICAR A CONTA DE ORIGEM
    // ------------------------------------------
    // 'SELECT ... FOR UPDATE' faz duas coisas:
    //   1) Busca os dados da conta
    //   2) TRAVA a linha no banco (coloca um cadeado)
    //
    // Por que travar? Se outra pessoa tentar transferir do mesmo
    // dinheiro ao mesmo tempo, ela vai esperar na fila ate que
    // NOSSA transacao termine (COMMIT ou ROLLBACK).
    // Isso evita que duas pessoas gastem o mesmo dinheiro.
    const result1 = await client.query(
      "SELECT * FROM contacorrente WHERE codigo = $1 FOR UPDATE",
      [request.body.origem]
    );

    // Se o SELECT nao retornou nenhuma linha, a conta nao existe.
    // Criamos um erro personalizado e jogamos (throw).
    // O 'throw' vai direto para o bloco 'catch', que fara ROLLBACK.
    if (result1.rows.length == 0) {
      const error = new Error("conta origem nao encontrada");
      error.status = 404; // 404 = Not Found (nao existe)
      throw error;
    }

    // Verifica se tem saldo suficiente.
    // Se nao tiver, jogamos erro com status 409 (Conflict).
    // 409 significa: "a requisicao esta correta, mas conflita com
    // o estado atual do recurso" (no caso, saldo insuficiente).
    if (result1.rows[0].saldo < request.body.valor) {
      const error = new Error("saldo insuficiente");
      error.status = 409;
      throw error;
    }

    // ------------------------------------------
    // PASSO 4: TRAVAR E VERIFICAR A CONTA DE DESTINO
    // ------------------------------------------
    // Mesma logica da origem: travamos a linha do destino para
    // garantir que ele nao seja removido ou alterado no meio
    // da nossa transferencia.
    const result2 = await client.query(
      "SELECT * FROM contacorrente WHERE codigo = $1 FOR UPDATE",
      [request.body.destino]
    );

    if (result2.rows.length == 0) {
      const error = new Error("conta destino nao encontrada");
      error.status = 404;
      throw error;
    }

    // ------------------------------------------
    // PASSO 5: DEBITAR DA CONTA DE ORIGEM
    // ------------------------------------------
    // 'UPDATE ... SET saldo = saldo - $1' usa o proprio valor do
    // banco para calcular. Nao lemos, calculamos no JS e gravamos.
    // Isso evita race condition (condicao de corrida).
    // RETURNING * devolve a linha ja atualizada para confirmarmos.
    const result3 = await client.query(
      "UPDATE contacorrente SET saldo = saldo-$1 WHERE codigo = $2 RETURNING *",
      [request.body.valor, request.body.origem]
    );
    console.log("Debito realizado:", result3.rows[0]);

    // ------------------------------------------
    // PASSO 6: CREDITAR NA CONTA DE DESTINO
    // ------------------------------------------
    const result4 = await client.query(
      "UPDATE contacorrente SET saldo = saldo+$1 WHERE codigo = $2 RETURNING *",
      [request.body.valor, request.body.destino]
    );
    console.log("Credito realizado:", result4.rows[0]);

    // ------------------------------------------
    // PASSO 7: CONFIRMAR A TRANSACAO (COMMIT)
    // ------------------------------------------
    // 'COMMIT' diz ao PostgreSQL: "tudo certo, agora sim salve
    // definitivamente no disco. Libere os cadeados (FOR UPDATE)
    // para que outros processos possam usar essas linhas."
    await client.query("COMMIT");

    // ------------------------------------------
    // PASSO 8: RESPOSTA DE SUCESSO
    // ------------------------------------------
    // Status 201 = Created (a operacao foi criada/registrada).
    // Em um sistema real, 'operacao' e 'autorizacao' viriam do banco.
    response.status(201).json({
      operacao: 123,
      origem: request.body.origem,
      destino: request.body.destino,
      valor: request.body.valor,
      autorizacao: "AB.CD.EF.12.34",
    });
  } catch (error) {
    // ------------------------------------------
    // PASSO 9: DESFAZER TUDO SE ALGO DEU ERRADO (ROLLBACK)
    // ------------------------------------------
    // Se QUALQUER 'throw' aconteceu (conta nao existe, saldo
    // insuficiente, erro de conexao), caimos aqui.
    // O ROLLBACK manda o PostgreSQL: "descarte tudo que fizemos
    // desde o BEGIN. Volte o banco ao estado anterior."
    //
    // Verificamos 'if (client)' porque se o erro aconteceu ANTES
    // de conseguir uma conexao, nao faz sentido tentar ROLLBACK.
    if (client) {
      await client.query("ROLLBACK");
    }

    console.log(error.stack);
    response.status(error.status || 500).json(error.message);
  } finally {
    // ------------------------------------------
    // PASSO 10: SEMPRE DEVOLVER A CONEXAO AO POOL
    // ------------------------------------------
    // O bloco 'finally' executa SEMPRE, independente de sucesso
    // ou erro. Se nao devolvermos a conexao (release), o pool
    // vai esgotar: todas as conexoes ficam presas e novas
    // requisicoes travam eternamente.
    if (client) {
      client.release();
    }
  }
});

// ==========================================
// AULA 4: MIDDLEWARE DE ERRO GLOBAL
// ==========================================
// Captura erros que nao foram tratados nas rotas (ex: erro do validator).
// ==========================================
server.use((error, request, response, next) => {
  console.log(error.stack);
  response.status(error.status || 500).json(error.message);
});

// ==========================================
// AULA 5: INICIALIZACAO
// ==========================================
server.listen(port, () => {
  console.log("==================================================");
  console.log(`  API de Transferencias rodando na porta ${port}`);
  console.log("==================================================");
});