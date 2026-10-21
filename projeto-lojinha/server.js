require('dotenv').config();
const express = require('express');
const validator = require('express-openapi-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('pg');

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
	if (!roles.includes(request.jwtpayload.role)) {
		response.status(403).json();
		return;
	}
	next();
};

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

server.get('/produto', async (request, response) => {
	try {
		let caracteristicas = '';
		if (request.query.caracteristicas != undefined)
		{	caracteristicas = request.query.caracteristicas.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(' ', '%');
		}
		caracteristicas = '%'+caracteristicas+'%';
		let pagina = 0;
		if (request.query.pagina != undefined)
		{	pagina = parseInt(request.query.pagina);
		}
		const result = await pool.query('SELECT descricao, preco, quantidade FROM produto WHERE descricao ILIKE $1 OFFSET $2 LIMIT 5', [ caracteristicas, pagina*5 ]);
		response.status(200).json(result.rows);
	} catch (error) {
		console.log(error.stack);
		response.status(500).json(error.message);
	}
});

server.get('/produto/:codigo', async (request, response) => {
	try {
		const result = await pool.query('SELECT descricao, preco, quantidade FROM produto WHERE codigo = $1', [ request.params.codigo ]);
		if (result.rows.length == 0) {
			response.status(404).json();
			return;
		}
		response.status(200).json(result.rows[0]);
	} catch (error) {
		console.log(error.stack);
		response.status(500).json(error.message);
	}
});

server.post('/produto', rolesMiddleware([ 1 ]), async (request, response) => {
	try {
		request.body.descricao = request.body.descricao.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ +/g, ' ').trim();
		const result1 = await pool.query('SELECT * FROM produto WHERE descricao = $1', [ request.body.descricao ]);
		if (result1.rows.length > 0) {
			response.status(409).json();
			return;
		}
		const result2 = await pool.query('INSERT INTO produto (descricao, preco, comissao, quantidade) VALUES ($1, $2, $3, 0) RETURNING *', [ request.body.descricao, request.body.preco, request.body.comissao ]);
		response.status(201).json(result2.rows[0]);
	} catch (error) {
		console.log(error.stack);
		response.status(500).json(error.message);
	}
});

server.put('/produto/:codigo', rolesMiddleware([ 1 ]), async (request, response) => {
	try {
		request.body.descricao = request.body.descricao.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ +/g, ' ').trim();
		
        const result1 = await pool.query(
            'SELECT * FROM produto WHERE descricao = $1 AND codigo != $2', [ request.body.descricao, request.params.codigo ]);
		if (result1.rows.length != 0) {
			response.status(409).json();
			return;
		}

		const result2 = await pool.query(
            'UPDATE produto SET descricao = $1, preco = $2, comissao = $3 WHERE codigo = $4 RETURNING *', [ request.body.descricao, request.body.preco, request.body.comissao, request.params.codigo ]);
		if (result2.rows.length == 0) {
			response.status(404).json();
			return;
		}
        
		response.status(200).json(result2.rows[0]);
	} catch (error) {
		console.log(error.stack);
		response.status(500).json(error.message);
	}
});

server.use((error, request, response, next) => {
	console.log(error.stack);
	response.status(error.status || 500).json(error.message);
});

server.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});
