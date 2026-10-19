require('dotenv').config();

const express = require('express');
const validator = require('express-openapi-validator');
const db = require('pg');
const jwt = require('jsonwebtoken');

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

        validateSecurity: {
            handlers: {
                bearer: (request, scopes, schema) => {

                    const authorization =
                        request.headers.authorization ?? "";

                    console.log(
                        "Authorization recebido:",
                        authorization
                    );

                    const [scheme, token] =
                        authorization.split(" ");

                    if (scheme !== "Bearer" || !token) {
                        throw {
                            status: 401,
                            message: "Token ausente ou invalido"
                        };
                    }

                    try {
                        const funcionario = jwt.verify(
                            token,
                            process.env.JWT_SECRET
                        );

                        console.log(
                            "JWT VALIDADO:",
                            funcionario
                        );

                        request.funcionario = funcionario;

                        console.log(
                            "REQUEST FUNCIONARIO:",
                            request.funcionario
                        );

                        return true;

                    } catch (erro) {
                        console.log(
                            "Erro JWT:",
                            erro.message
                        );

                        throw {
                            status: 401,
                            message: "Token invalido ou expirado"
                        };
                    }
                }
            }
        }
    })
);

// Middleware --> Validando Papéis (403)
function exigirPapel(...papeis) {
    return (request, response, next) => {

        console.log("FUNCIONARIO NO exigirPapel:", request.funcionario);

        if (!request.funcionario) {
            return response.status(401).json({
                erro: "Funcionario não autenticado"
            });
        }

        if (!papeis.includes(request.funcionario.role)) {
            return response.status(403).json({
                erro: "Sem Permissão Para Esta Operação"
            });
        }

        next();
    };
}


// Rota --> POST /funcionario/autenticacao
server.post('/funcionario/autenticacao', async (request, response, next) => {
    try{
        const {usuario, senha} = request.body;
        const resultado = await pool.query(
            "SELECT codigo, senha, papel FROM funcionario WHERE codigo = $1",[usuario]
        );
        const funcionario = resultado.rows[0];

        if(!funcionario || funcionario.senha !== senha){
            return response.status(401).json({ erro: 'Usuario ou senha invalidos' });
        }

        const token = jwt.sign(
            { sub: usuario, role: funcionario.papel},
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        );

        console.log(`Login: ${funcionario} | Token Gerado`);
        response.status(200).json({token});
    } catch(erro){
        next(erro);
    }
});

// Rota -> GET /produto
const TAMANHO_PAGINA = 10;
server.get('/produto', async (request, response, next) => {
    try{
        // ?? "" faz a Busca virar %% --> Lista todos os Produtos
        const caracteristicas = request.query.caracteristicas ?? "";
        const caracteristicasNormalizadas = caracteristicas.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); 
        // ?? 0 Faz a busca começar na página 0
        const pagina = Number(request.query.pagina ?? 0);

        const resultado = await pool.query(
            `
            SELECT
                descricao,
                preco,
                quantidade
            FROM produto
            WHERE descricao ILIKE $1
            ORDER BY codigo
            LIMIT $2 OFFSET $3`, [`%${caracteristicasNormalizadas}%`, TAMANHO_PAGINA, pagina * TAMANHO_PAGINA]
        );
        const produto1 = resultado.rows;

        return response.status(200).json(produto1);
    } catch(erro){
        next(erro);
    }
});

// Rota -> GET /produto/{codigo}
server.get('/produto/:codigo', async (request, response, next) => {
    try{
        // O validador já garantiu que codigo é um inteiro (senão responde 400)
        const codigo = Number(request.params.codigo);

        const resultado = await pool.query(
            `
            SELECT
                descricao,
                preco,
                quantidade
            FROM produto
            WHERE codigo = $1
            `, [codigo]
        );

        const produto1 = resultado.rows[0];

        if(!produto1){
            return response.status(401).json({ erro: "Produto Não encontrado" });
        }

        return response.status(200).json(produto1);
    } catch(erro){
        next(erro);
    }
});

// Rota -> POST /produto
server.post('/produto', exigirPapel(1), async (request, response, next) => {
    try {

        const descricao = request.body.descricao ?? "";
        const descricaoNormalizada = descricao.ccc
        const {preco, comissao} = request.body;

        const resultado = await pool.query(
            `
            INSERT INTO produto (descricao, preco, comissao, quantidade)
            VALUES ($1, $2, $3, 0)
            RETURNING
                codigo,
                descricao,
                preco,
                quantidade,
                comissao

            `, [descricao, preco, comissao]
        );
        const produto2 = resultado.rows[0];
        return response.status(201).json(produto2);

    } catch (error) {
        // 23505 = violação de UNIQUE --> já existe outro produto com essa descrição
        if(error.code == "23505"){
            return response.status(409).json({ 
                error: "Produto ja cadastrado" 
            });
        }
        next(error);
    }
});

// Rota -> PUT/produto/{codigo}
server.put('/produto/:codigo', exigirPapel(1), async (request, response, next) => {

    try {
        const codigo = Number(request.params.codigo);
        const {preco, comissao} = request.body;

        // Descrição
        const descricao = request.body.descricao ?? "";
        const descricaoNormalizada = descricao.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        if(!descricaoNormalizada){
            return response.status(400).json({ erro: "descrição inválida "});
        }

        if(!preco){
            return response.status(400).json({ erro: "Preço inválida "});
        }

        if(!comissao){
            return response.status(400).json({ erro: "Comissão inválida "});
        }

        const resultado = await pool.query(
            `
            UPDATE produto
            SET descricao = $1,
                preco = $2,
                comissao = $3
            WHERE codigo = $4
            RETURNING
                codigo,
                descricao,
                preco,
                quantidade,
                comissao
            `, [descricaoNormalizada, preco, comissao, codigo]
        );

        if(resultado.rowCount === 0){
            return response.status(404).json({ erro: "Produto nao encontrado" });
        }

        return response.status(200).json(resultado.rows[0]);

    } catch (error) {
        if (error.code === "23505") {
            return response.status(409).json({ erro: "Ja existe um produto com esta descricao" });
        }
        next(error);

    }
});


// Rota -> PUT /produto/{codigo}/entrada/{quantidade}
server.put('/produto/:codigo/entrada/:quantidade', exigirPapel(1), async (request, response, next) => {

    try {
        
        const codigo = Number(request.params.codigo);
        const quantidade = Number(request.params.quantidade);

        const resultado = await pool.query(
            `
            UPDATE produto
            SET quantidade = quantidade + $1
            WHERE codigo = $2
            RETURNING
                codigo,
                descricao,
                preco,
                quantidade,
                comissao
            `, [quantidade, codigo]
        );

        if(resultado.rowCount === 0){
            return response.status(404).json({ erro: "Produto nao encontrado" });
        }

        return response.status(200).json(resultado.rows[0]);
    } catch (error) {
        next(error);
    }
});

// Rota -> GET /venda

server.use((erro, request, response, next) => {
    console.log(erro);
    response.status(erro.status || 500).json({ erro: erro.message });
});

server.listen(port, () => {
    console.log(`Servidor Rodando em: http://localhost:${port}`);
});

