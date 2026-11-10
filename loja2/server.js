require('dotenv').config();
const express = require('express');
const validator = require('express-openapi-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('pg');
const { log } = require('console');
const { request } = require('http');
const { response } = require('express');

const server = express();
const port = process.env.EXPRESS_PORT;
const pool = new db.Pool({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	database: process.env.DB_DATABASE,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD
});

const rolesMiddleware = (roles) => (request, response, next) => {
    if(!roles.includes(request.jwtpayload.role)) {
        response.status(403).json();
        return;
    }
    next();
}

server.use(express.json());

server.use(
	validator.middleware({
		apiSpec: 'api.yaml',
		validateRequests: true,
		validateResponses: false,
		validateSecurity: {
			handlers: {
				bearer: (request, scopes, schema) => {
					request.jwtpayload = jwt.verify(request.headers.authorization.replace('Bearer ', ''), process.env.JWT_SECRET);
					return(true);
				}
			}
		}
	})
);

// Rotas de Funcionarios ==> /funcionario
// POST /funcionario/autenticacao
server.post('/funcionario/autenticacao', async (request, response) => {
	try {
		const result = await pool.query('SELECT * FROM funcionario WHERE codigo = $1', [ request.body.usuario ]);
		if ((result.rows.length == 0) || (!bcrypt.compareSync(request.body.senha, result.rows[0].senha))) {
			response.status(401).json();
			return;
		}
		const token = jwt.sign({ sub: request.body.usuario, role: result.rows[0].papel }, process.env.JWT_SECRET, { expiresIn: '5m' });
		response.status(200).json({ token: token });
	} catch (error) {
		console.log(error.stack);
		response.status(500).json(error.message);
	}
});

// POST /funcionario/autenticacao/renovacao
server.post('/funcionario/autenticacao/renovacao', async (request, response) => {
    try {
        // recupera o funcionario identificado pelo JWT]
        const codigo = request.jwtpayload.sub;

        const resultado = await pool.query(
            'SELECT codigo, papel FROM funcionario WHERE codigo = $1', [codigo]
        );

        // verifica se o funcionário ainda existe
        if(resultado.rows.length == 0){
            response.status(401).json('Funcionário não encontrado');
            return;
        }

        // Retorna o novo token
        const token = jwt.sign({ sub: request.body.usuario, role: resultado.rows[0].papel }, process.env.JWT_SECRET, { expiresIn: '5m' });
		response.status(200).json({ token: token });
    } catch (error) {
        console.log(error.stack);
        response.status(500).json(error.message);
    }
});

// GET /funcionario
server.get('/funcionario', async (request, response, error) => {
    try {
        let nameCaracters = '';
        let pagina = 0;
        if(request.query.nome != undefined){
            nameCaracters = request.query.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(' ', '%');
        }
        nameCaracters = '%'+ nameCaracters + '%';
        if(request.query.pagina != undefined){
            pagina = parseInt(request.query.pagina);
        }
        const resultado = await pool.query('SELECT codigo, nome, salario, papel FROM funcionario WHERE nome ILIKE $1 ORDER BY codigo ASC OFFSET $2 LIMIT 5', [nameCaracters, pagina*5]); 
        response.status(200).json(resultado.rows);
    } catch (error) {
        console.log(error.stack);
		response.status(500).json(error.message);
    }
});

// GET /funcionarios/{codigo}
server.get('/funcionario/:codigo', async (request, response) => {
    try {
        let codigo = parseInt(request.params.codigo);
        if(isNaN(codigo) || codigo < 0){
            response.status(400).json('código inválido');
            return;
        }
        const resultado = await pool.query('SELECT codigo, nome, salario, papel FROM funcionario WHERE codigo = $1', [codigo]);
        if(resultado.rows.length == 0){
            response.status(404).json('Usuário Não Encontrado');
            return;
        }
        response.status(200).json(resultado.rows[0]);
    } catch (error) {
        console.log(error.stack);
		response.status(500).json(error.message);
    }
});

// PUT /funcionario/{codigo}
server.put('/funcionario/:codigo', rolesMiddleware([1]), async (request, response) => {
    try {
        request.body.nome = request.body.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ +/g, ' ').trim();
        const resultado1 = await pool.query('SELECT * FROM funcionario WHERE nome = $1 AND codigo = $2', [request.body.nome, request.params.codigo]) 
        
        if(resultado1.rows.length != 0){
            response.status(409).json();
			return;
        }
        const resultado2 = await pool.query('UPDATE funcionario SET nome = $1, salario = $2, papel = $3  WHERE codigo = $4 RETURNING *', [request.body.nome, request.body.salario, request.body.papel, request.params.codigo]);
        response.status(201).json(resultado2.rows[0]);
    } catch (error) {
        console.log(error.stack);
		response.status(500).json(error.message);
    }
})

// POST /funcionario
server.post('/funcionario', rolesMiddleware([1]), async (request, response) => {
    try {
        request.body.nome = request.body.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ +/g, ' ').trim();
        const resultado = await pool.query('SELECT * FROM funcionario WHERE nome = $1', [request.body.nome]);

        if(resultado.rows.length > 0){
            response.status(409).json();
			return;
        }

        const senha = request.body.senha;
        const senhaHash = await bcrypt.hash(senha, 10);

        const resultado2 = await pool.query(
            'INSERT INTO funcionario (nome, salario, senha, papel) VALUES ($1, $2, $3, $4) RETURNING *', [request.body.nome, request.body.salario, senhaHash, request.body.papel]);
        response.status(201).json(resultado2.rows[0]);
    } catch (error) {
        console.log(error.stack);
        response.status(500).json(error.message);
    }
});

// Rotas de Produto ==> /produto
// GET /produto
server.get('/produto', async (request, response) => {
    try {
        let descricao = '';
        let pagina = 0;

        if(request.query.descricao != undefined){
            descricao = request.query.descricao.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(' ', '%');
        }
        descricao = '%'+descricao +'%';

        if(request.query.pagina != undefined){
            pagina = parseInt(request.query.pagina);
        }

        const resultado = await pool.query('SELECT descricao, preco, quantidade FROM produto WHERE descricao ILIKE $1 OFFSET $2 LIMIT 5', [descricao, pagina*5]);
        response.status(200).json(resultado.rows);
    } catch (error) {
        console.log(error.stack);
        response.status(500).json(error.message);
    }
});

// GET /produto/{codigo}
server.get('/produto/:codigo', async (request, response) => {
    try {
		const result = await pool.query('SELECT descricao, preco, quantidade FROM produto WHERE codigo = $1', [ request.params.codigo ]);
		if (result.rows.length == 0) {
			response.status(404).json('Produto não Encontrado');
			return;
		}
		response.status(200).json(result.rows[0]);
	} catch (error) {
		console.log(error.stack);
		response.status(500).json(error.message);
	}
});

// POST /produto
server.post('/produto', rolesMiddleware([1]), async (request, response) => {
    try {
        const descricao = request.body.descricao.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ +/g, ' ').trim();
        const resultado = await pool.query('SELECT * FROM produto WHERE descricao = $1', [descricao]);
        if (resultado.rows.length > 0) {
			response.status(409).json();
			return;
		}

        const resultado2 = await pool.query('INSERT INTO produto (descricao, preco, comissao, quantidade) VALUES ($1, $2, $3, 0) RETURNING *', [ descricao, request.body.preco, request.body.comissao ]);
        response.status(201).json(resultado2.rows[0]);
    } catch (error) {
        console.log(error.stack);
		response.status(500).json(error.message);   
    }
});

// PUT /produto/{codigo}/entrada/{quantidade}
server.put('/produto/:codigo/entrada/:quantidade', rolesMiddleware([ 1 ]), async (request, response) => {
    let connection;
	try {
		connection = await pool.connect();
		await connection.query('BEGIN');
		const result1 = await connection.query('SELECT * FROM produto WHERE codigo = $1 FOR UPDATE', [request.params.codigo]);

		if(result1.rows.length == 0) {
			const error = new Error('produto nao encontado');
			error.status = 404;
			throw error;
		}
		console.log(result1.rows[0]);

		const result2 = await connection.query('UPDATE produto SET quantidade = quantidade + $1 WHERE codigo = $2 RETURNING *', [ request.params.quantidade, request.params.codigo ]);
		console.log(result2.rows[0]);

		await connection.query('COMMIT');
		response.status(200).json(result2.rows[0]);
	} catch (error) {
		if (connection) {
			await connection.query('ROLLBACK');
		}
		console.log(error.stack);
		response.status(error.status || 500).json(error.message);
	} finally {
		if (connection) {
			connection.release();
		}
	}
});

// PUT /produto/{codigo}/saida/{quantidade}
server.put("/produto/:codigo/saida/:quantidade", async (request, response) => {
    let connection;
    try {
      connection = await pool.connect();
      await connection.query("BEGIN");
      const result1 = await connection.query(
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
      const result2 = await connection.query(
        "UPDATE produto SET quantidade = quantidade - $1 WHERE codigo = $2 RETURNING *",
        [request.params.quantidade, request.params.codigo]
      );
      console.log(result2.rows[0]);
      await connection.query("COMMIT");
      response
        .status(200)
        .json(result2.rows[0]);
    } catch (error) {
      if (connection) {
        await connection.query("ROLLBACK");
      }
      console.log(error.stack);
      response.status(error.status || 500).json(error.message);
    } finally {
      if (connection) {
        connection.release();
      }
    }
});

// Teste de backend
server.get('/teste', (request, response) => {
    response.status(200).json("Hello World");
});

server.use((error, request, response, next) => {
	console.log(error.stack);
	response.status(error.status || 500).json(error.message);
});

server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
})
