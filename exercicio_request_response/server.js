// server.js
const express = require('express');

const server = express();
const port = 8080;

// ===================================================================
// CONFIGURAÇÕES
// ===================================================================

// Middleware essencial para ler JSON no body
server.use(express.json());

// Chave de acesso válida
const CHAVE_VALIDA = '12ab3-def45-xyz888ab90';

// Base de dados em memória (simula um banco)
let produtos = [
    { id: 1, descricao: 'Cadeira Gamer', preco: 850, altura: 120, largura: 60, profundidade: 60, peso: 12, cor: 'preto', validade: '2027-06-15', estoque: 50, tipo: 'cadeira' },
    { id: 2, descricao: 'Sofá 3 Lugares', preco: 1200, altura: 90, largura: 200, profundidade: 85, peso: 45, cor: 'cinza', validade: '2028-01-20', estoque: 15, tipo: 'sofa' },
    { id: 3, descricao: 'Sofá Retrátil', preco: 999, altura: 95, largura: 210, profundidade: 90, peso: 50, cor: 'branco', validade: '2027-11-30', estoque: 8, tipo: 'sofa' },
    { id: 4, descricao: 'Mesa de Jantar', preco: 450, altura: 75, largura: 150, profundidade: 90, peso: 25, cor: 'madeira', validade: '2029-03-10', estoque: 20, tipo: 'mesa' },
    { id: 5, descricao: 'Cadeira Escritório', preco: 320, altura: 110, largura: 55, profundidade: 55, peso: 8, cor: 'branco', validade: '2027-08-22', estoque: 35, tipo: 'cadeira' },
];

// Contador para gerar IDs automáticos
let proximoId = 6;

// ===================================================================
// MIDDLEWARES
// ===================================================================

// 1. Logger - registra todas as requisições
server.use((request, response, next) => {
    const horario = new Date().toISOString();
    console.log(`[${horario}] ${request.method} ${request.url}`);
    next();
});

// 2. Autenticação - valida o header chaveacesso
function validarChaveAcesso(request, response, next) {
    const chave = request.headers.chaveacesso;

    if (!chave || chave !== CHAVE_VALIDA) {
        return response.status(401).json({ erro: 'Acesso Negado - chaveacesso ausente ou inválida' });
    }

    next();
}

// ===================================================================
// ROTAS
// ===================================================================

// -------------------------------------------------------------------
// GET /produto → Lista produtos com filtros opcionais
// -------------------------------------------------------------------
server.get('/produto', validarChaveAcesso, (request, response) => {
    const { tipo, cor, minpreco, maxpreco } = request.query;

    let resultado = [...produtos]; // Cópia para não alterar o original

    // Filtro por tipo (aceita múltiplos: ?tipo=cadeira&tipo=mesa)
    if (tipo !== undefined) {
        const tipos = Array.isArray(tipo) ? tipo : [tipo];
        resultado = resultado.filter(p => tipos.includes(p.tipo));
    }

    // Filtro por cor (aceita múltiplas: ?cor=branco&cor=preto)
    if (cor !== undefined) {
        const cores = Array.isArray(cor) ? cor : [cor];
        resultado = resultado.filter(p => cores.includes(p.cor));
    }

    // Filtro por preço mínimo
    if (minpreco !== undefined) {
        const min = Number(minpreco);
        if (isNaN(min)) {
            return response.status(400).json({ erro: 'minpreco deve ser um número válido' });
        }
        resultado = resultado.filter(p => p.preco >= min);
    }

    // Filtro por preço máximo
    if (maxpreco !== undefined) {
        const max = Number(maxpreco);
        if (isNaN(max)) {
            return response.status(400).json({ erro: 'maxpreco deve ser um número válido' });
        }
        resultado = resultado.filter(p => p.preco <= max);
    }

    response.status(200).json(resultado);
});

// -------------------------------------------------------------------
// GET /produto/:codigo → Busca produto específico
// -------------------------------------------------------------------
server.get('/produto/:codigo', validarChaveAcesso, (request, response) => {
    const codigo = Number(request.params.codigo);

    // Valida se o código é um número
    if (isNaN(codigo)) {
        return response.status(400).json({ erro: 'codigo deve ser um número inteiro' });
    }

    const produto = produtos.find(p => p.id === codigo);

    if (!produto) {
        return response.status(404).json({ erro: `Produto ${codigo} não encontrado` });
    }

    response.status(200).json(produto);
});

// -------------------------------------------------------------------
// POST /produto → Cadastra múltiplos produtos (array no body)
// -------------------------------------------------------------------
server.post('/produto', validarChaveAcesso, (request, response) => {
    const body = request.body;

    // 1. Valida se o body existe e é um array
    if (!body || !Array.isArray(body)) {
        return response.status(400).json({ erro: 'O body deve ser um array de produtos' });
    }

    // 2. Valida se o array não está vazio
    if (body.length === 0) {
        return response.status(400).json({ erro: 'O array de produtos não pode estar vazio' });
    }

    const coresValidas = ['branco', 'preto', 'cinza'];
    const produtosCriados = [];
    const erros = [];

    // 3. Valida cada produto do array
    body.forEach((item, index) => {
        // Verifica se é um objeto
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            erros.push({ posicao: index, erro: 'Deve ser um objeto' });
            return;
        }

        // Campos obrigatórios
        const camposObrigatorios = ['descricao', 'preco', 'altura', 'largura', 'profundidade', 'peso', 'cor', 'validade', 'estoque'];
        for (const campo of camposObrigatorios) {
            if (item[campo] === undefined || item[campo] === null) {
                erros.push({ posicao: index, campo, erro: `Campo obrigatório ausente` });
                return;
            }
        }

        // Validação de tipos numéricos
        const camposNumericos = ['preco', 'altura', 'largura', 'profundidade', 'peso'];
        for (const campo of camposNumericos) {
            if (isNaN(Number(item[campo]))) {
                erros.push({ posicao: index, campo, erro: `Deve ser um número` });
                return;
            }
        }

        // Validação de estoque (inteiro)
        if (!Number.isInteger(Number(item.estoque))) {
            erros.push({ posicao: index, campo: 'estoque', erro: 'Deve ser um número inteiro' });
            return;
        }

        // Validação do enum de cor
        if (!coresValidas.includes(item.cor)) {
            erros.push({ posicao: index, campo: 'cor', erro: `Deve ser: branco, preto ou cinza` });
            return;
        }

        // Validação do formato da data (YYYY-MM-DD)
        const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dataRegex.test(item.validade)) {
            erros.push({ posicao: index, campo: 'validade', erro: 'Deve estar no formato YYYY-MM-DD' });
            return;
        }

        // Valida se a data é realmente válida (ex: não aceita 2023-99-99)
        const dataObj = new Date(item.validade);
        if (isNaN(dataObj.getTime())) {
            erros.push({ posicao: index, campo: 'validade', erro: 'Data inválida' });
            return;
        }

        // Se chegou aqui, o produto é válido → cria o objeto completo
        const novoProduto = {
            id: proximoId++,
            descricao: String(item.descricao),
            preco: Number(item.preco),
            altura: Number(item.altura),
            largura: Number(item.largura),
            profundidade: Number(item.profundidade),
            peso: Number(item.peso),
            cor: String(item.cor),
            validade: String(item.validade),
            estoque: Number(item.estoque),
            tipo: String(item.tipo || 'geral') // tipo opcional, padrão 'geral'
        };

        produtos.push(novoProduto);
        produtosCriados.push(novoProduto);
    });

    // Se houve erros, retorna 400 com detalhes (e não salva nada — all-or-nothing)
    if (erros.length > 0) {
        // Remove os produtos que já foram adicionados (rollback manual)
        produtos = produtos.filter(p => !produtosCriados.find(pc => pc.id === p.id));
        proximoId -= produtosCriados.length;
        
        return response.status(400).json({
            erro: 'Erros de validação encontrados',
            detalhes: erros
        });
    }

    // Sucesso: retorna 201 com os produtos criados
    response.status(201).json({
        mensagem: `${produtosCriados.length} produto(s) criado(s) com sucesso`,
        produtos: produtosCriados
    });
});

// ===================================================================
// MIDDLEWARE DE ERRO (sempre por último!)
// ===================================================================
server.use((erro, request, response, next) => {
    console.error('Erro no servidor:', erro.message);
    response.status(500).json({ erro: 'Erro interno do servidor' });
});

// ===================================================================
// INICIALIZAÇÃO
// ===================================================================
server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`Total de produtos iniciais: ${produtos.length}`);
});