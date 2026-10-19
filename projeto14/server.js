// ==========================================
// AULA 0: CONFIGURACAO INICIAL
// ==========================================
// Carregamos as variaveis do arquivo .env para a memoria do Node.
// Assim, usamos process.env.NOME_DA_VARIAVEL em vez de deixar
// valores fixos no codigo (boa pratica de seguranca e manutencao).
require('dotenv').config();

// Importamos o Express (framework de servidor) e o Validator
// (que le o api.yaml e valida automaticamente as requisicoes).
const express = require('express');
const validator = require('express-openapi-validator');

// Criamos a aplicacao Express e definimos a porta.
const server = express();
const port = process.env.EXPRESS_PORT;

// URL da API externa que vamos consumir (vem do .env).
// JSONPlaceholder eh uma API fake: ela simula um banco de dados real,
// mas nao persiste nada (se voce criar um post, ele devolve sucesso,
// mas na proxima listagem o post nao estara la).
const URL_EXTERNA = process.env.API_EXTERNA_URL;

// ==========================================
// AULA 1: MIDDLEWARES DE APLICACAO
// ==========================================
// Middleware = funcao que processa a requisicao ANTES de chegar
// na rota. Executam na ordem em que sao definidas.

// 1.1 - express.json()
// --------------------
// Habilita nosso servidor a entender JSON no body das requisicoes.
// Sem isso, request.body seria 'undefined'.
server.use(express.json());

// 1.2 - express-openapi-validator
// -------------------------------
// Esta eh a "magica" da especificacao OpenAPI. Ele le o arquivo
// api.yaml e cria um middleware que:
//   - Valida se query params sao do tipo certo (page: integer)
//   - Valida se path params existem (id: integer)
//   - Valida se o body do POST/PUT bate com o schema PostEntrada
//   - Retorna 400 automaticamente se algo estiver errado
server.use(
  validator.middleware({
    apiSpec: './api.yaml',      // caminho para nossa especificacao
    validateRequests: true,     // valida ENTRADAS (requisicoes)
    validateResponses: false    // nao valida SAIDAS (respostas)
  })
);

// ==========================================
// AULA 2: O CONCEITO DE PROXY / BFF
// ==========================================
// Nosso servidor nao tem banco de dados proprio. Ele funciona como
// um PROXY (intermediario) ou BFF (Backend for Frontend):
//
//   Voce (Postman)  --GET /posts-->  Nosso Servidor  --fetch GET-->  JSONPlaceholder
//                                         |
//                                    (processa/trata)
//                                         |
//   Voce (Postman)  <--JSON-----------  Nosso Servidor  <--JSON------  JSONPlaceholder
//
// Vantagens:
//   - Escondemos a URL real da API externa (seguranca)
//   - Podemos juntar dados de varias APIs em uma so resposta
//   - Podemos filtrar/tratar os dados antes de devolver
// ==========================================

// ==========================================
// AULA 3: PROXY GET - LISTAR POSTS (COM PAGINACAO)
// ==========================================
// Metodo HTTP: GET
// Funcao: Buscar dados (nao altera nada na API externa)
//
// O cliente envia: GET /posts?page=2&limit=3
// Nos repassamos: GET https://jsonplaceholder.../posts?_page=2&_limit=3
// ==========================================
server.get('/posts', async (request, response) => {
  try {
    // Recuperamos os query params que o cliente enviou.
    // O validator ja garantiu que sao integers (ou usamos o padrao).
    const page = request.query.page || 1;
    const limit = request.query.limit || 5;

    // fetch() = funcao nativa do Node.js 18+ para fazer requisicoes HTTP.
    // Ela retorna uma "Promise" que resolve em uma resposta HTTP.
    const fetchResponse = await fetch(
      `${URL_EXTERNA}?_page=${pagina}&_limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    // ATENCAO: fetch() NAO lanca erro quando a API externa retorna
    // 404 ou 500. Ele so lanca erro em problemas de REDE (sem internet).
    // Por isso precisamos verificar manualmente o status HTTP.
    if (!fetchResponse.ok) {
      // .ok = true se status for 200-299. Se for 404, 500, etc., eh false.
      return response.status(502).json({
        erro: 'A API externa retornou um erro',
        statusExterno: fetchResponse.status
      });
    }

    // .json() converte o corpo da resposta (texto JSON) em objeto JavaScript.
    // Tambem retorna uma Promise, por isso usamos await.
    const dados = await fetchResponse.json();

    // Logamos no terminal do servidor para voce ver o que veio.
    console.log(`[GET /get] Pagina ${pagina}, Limit ${limit}. Recebidos ${dados.length} posts.`);
    console.log(dados);

    // Devolvemos os dados reais para o cliente (nao a palavra "resposta").
    response.status(200).json({
      origem: 'JSONPlaceholder (via nosso proxy)',
      pagina: Number(page),
      limite: Number(limit),
      quantidade: dados.length,
      posts: dados
    });

  } catch (error) {
    // Este catch pega erros de REDE: sem internet, DNS nao encontrado,
    // timeout, etc.
    console.error('--- ERRO DE REDE NO GET ---');
    console.error(error.stack);

    response.status(500).json({
      erro: 'Falha ao conectar com a API externa',
      detalhes: error.message
    });
  }
});

// ==========================================
// AULA 4: PROXY POST - CRIAR UM POST
// ==========================================
// Metodo HTTP: POST
// Funcao: Enviar dados para criar um novo recurso
//
// O cliente envia: POST /posts  Body: { title, body }
// Nos repassamos: POST https://jsonplaceholder.../posts  Body: JSON
// ==========================================
server.post('/post', async (request, response) => {
    try {
      // Desestruturamos os campos recebidos em portugues
      const { usuario, titulo, conteudo } = request.body;
  
      const fetchResponse = await fetch(URL_EXTERNA, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        
        
        body: JSON.stringify({
          userId: usuario,
          title: titulo,
          body: conteudo
        })
      });
  
      if (!fetchResponse.ok) {
        return response.status(502).json({
          erro: 'A API externa nao conseguiu criar o post',
          statusExterno: fetchResponse.status
        });
      }
  
      const dados = await fetchResponse.json();
  
      console.log('[POST /post] Post criado na API externa (simulado):');
      console.log(dados);
  
      response.status(201).json({
        mensagem: 'Post criado com sucesso (na API externa)',
        post: dados
      });
  
    } catch (error) {
      console.error('--- ERRO DE REDE NO POST ---');
      console.error(error.stack);
  
      response.status(500).json({
        erro: 'Falha ao criar post na API externa',
        detalhes: error.message
      });
    }
  });

// ==========================================
// AULA 5: PROXY PUT - ATUALIZAR UM POST COMPLETO
// ==========================================
// Metodo HTTP: PUT
// Funcao: Substituir um recurso existente inteiro
//
// O cliente envia: PUT /posts/1  Body: { title, body }
// Nos repassamos: PUT https://jsonplaceholder.../posts/1  Body: JSON
// ==========================================
server.put('/posts/:id', async (request, response) => {
  try {
    // O validator ja garantiu que :id eh um integer.
    const id = Number(request.params.id);

    const { title, body } = request.body;

    const fetchResponse = await fetch(`${URL_EXTERNA}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // PUT exige que enviemos TODOS os campos do recurso.
      // Aqui enviamos id, userId fixo, title e body.
      body: JSON.stringify({
        id: id,
        userId: 1,      // JSONPlaceholder exige userId em PUT
        title: title,
        body: body
      })
    });

    if (!fetchResponse.ok) {
      return response.status(502).json({
        erro: `A API externa nao conseguiu atualizar o post ${id}`,
        statusExterno: fetchResponse.status
      });
    }

    const dados = await fetchResponse.json();

    console.log(`[PUT /posts/${id}] Post atualizado (simulado):`);
    console.log(dados);

    response.status(200).json({
      mensagem: `Post ${id} atualizado com sucesso`,
      post: dados
    });

  } catch (error) {
    console.error('--- ERRO DE REDE NO PUT ---');
    console.error(error.stack);

    response.status(500).json({
      erro: 'Falha ao atualizar post na API externa',
      detalhes: error.message
    });
  }
});

// ==========================================
// AULA 6: PROXY DELETE - REMOVER UM POST
// ==========================================
// Metodo HTTP: DELETE
// Funcao: Solicitar a remocao de um recurso
//
// O cliente envia: DELETE /posts/1
// Nos repassamos: DELETE https://jsonplaceholder.../posts/1
// ==========================================
server.delete('/posts/:id', async (request, response) => {
  try {
    const id = Number(request.params.id);

    const fetchResponse = await fetch(`${URL_EXTERNA}/${id}`, {
      method: 'DELETE'
      // DELETE geralmente nao envia body nem Content-Type
    });

    if (!fetchResponse.ok) {
      return response.status(502).json({
        erro: `A API externa nao conseguiu remover o post ${id}`,
        statusExterno: fetchResponse.status
      });
    }

    // JSONPlaceholder retorna {} (objeto vazio) no DELETE.
    const dados = await fetchResponse.json();

    console.log(`[DELETE /posts/${id}] Post removido (simulado). Resposta:`, dados);

    response.status(200).json({
      mensagem: `Post ${id} removido com sucesso`,
      respostaDaApiExterna: dados
    });

  } catch (error) {
    console.error('--- ERRO DE REDE NO DELETE ---');
    console.error(error.stack);

    response.status(500).json({
      erro: 'Falha ao remover post na API externa',
      detalhes: error.message
    });
  }
});

// ==========================================
// AULA 7: MIDDLEWARE DE ERRO (SEMPRE POR ULTIMO!)
// ==========================================
// Captura:
//   - Erros do express-openapi-validator (400 Bad Request)
//   - Erros nao tratados nas rotas (500 Internal Server Error)
// ==========================================
server.use((error, request, response, next) => {
  console.error('--- ERRO CAPTURADO PELO MIDDLEWARE GLOBAL ---');
  console.error(error.stack);

  // Se o erro veio do validator, ele ja tem 'status'. Senao, usamos 500.
  const status = error.status || 500;

  response.status(status).json({
    erro: error.message || 'Erro interno do servidor'
  });
});

// ==========================================
// AULA 8: INICIALIZACAO DO SERVIDOR
// ==========================================
server.listen(port, () => {
  console.log(`  Servidor rodando em: http://localhost:${port}`);
});