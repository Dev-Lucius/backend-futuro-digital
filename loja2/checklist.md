# 🛒 API Lojinha — Checklist de Desenvolvimento

## 1. Configuração e infraestrutura

- [x] Configuração de variáveis de ambiente com `dotenv`.
- [x] Inicialização do servidor utilizando Express.
- [x] Configuração da porta por variável de ambiente (`EXPRESS_PORT`).
- [x] Configuração da conexão com PostgreSQL utilizando `pg`.
- [x] Criação de um pool de conexões com o banco de dados.
- [x] Configuração do middleware `express.json()`.
- [x] Integração com `express-openapi-validator`.
- [x] Configuração do arquivo de especificação `api.yaml`.
- [x] Validação de requisições através do OpenAPI.
- [x] Configuração do segredo JWT através de variável de ambiente.

## 2. Autenticação e autorização

### 2.1. Middleware de autorização por papel

- [x] Implementação da função `rolesMiddleware`.
- [x] Recebimento de uma lista de papéis autorizados.
- [x] Verificação do papel armazenado no payload JWT.
- [x] Retorno HTTP 403 quando o funcionário não possui permissão.
- [x] Continuação da execução da rota quando o funcionário possui autorização.

### 2.2. Validação de tokens JWT

- [x] Configuração do esquema de autenticação Bearer.
- [x] Recuperação do token através do cabeçalho `Authorization`.
- [x] Validação do token utilizando `jwt.verify()`.
- [x] Verificação da assinatura utilizando `JWT_SECRET`.
- [x] Disponibilização dos dados do token através de `request.jwtpayload`.
- [x] Tratamento de erros relacionados à validação do JWT pelo mecanismo de validação da API.

### 2.3. POST `/funcionario/autenticacao`

- [x] Recebimento de usuário e senha através do corpo da requisição.
- [x] Consulta do funcionário pelo código no PostgreSQL.
- [x] Verificação da existência do funcionário.
- [x] Comparação da senha utilizando `bcrypt.compareSync()`.
- [x] Retorno HTTP 401 para credenciais inválidas.
- [x] Geração de token JWT utilizando `jwt.sign()`.
- [x] Inclusão do identificador do funcionário (`sub`) no payload.
- [x] Inclusão do papel do funcionário (`role`) no payload.
- [x] Configuração da validade do token para cinco minutos.
- [x] Retorno HTTP 200 com o token JWT.
- [x] Tratamento de erros internos com HTTP 500.

### 2.4. POST `/funcionario/autenticacao/renovacao`

- [x] Implementação inicial do endpoint.
- [x] Recuperação do identificador do funcionário através do JWT.
- [x] Consulta do funcionário no PostgreSQL.
- [x] Verificação da existência do funcionário.
- [x] Corrigir a referência de `result` para `resultado` na geração do token.
- [x] Utilizar o código e o papel recuperados do banco na geração do novo JWT.
- [x] Testar a renovação utilizando um token válido.
- [x] Validar o comportamento quando o token estiver expirado.

## 3. Funcionários

### 3.1. GET `/funcionario`

**Consulta e listagem de funcionários.**

- [x] Implementação do endpoint GET.
- [x] Consulta dos funcionários no PostgreSQL.
- [x] Seleção dos campos `codigo`, `nome`, `salario` e `papel`.
- [x] Implementação do filtro por nome através de `request.query.nome`.
- [x] Normalização de caracteres especiais utilizando `normalize('NFD')`.
- [x] Remoção de acentos utilizando expressão regular.
- [x] Substituição de espaços por `%` para pesquisa parcial.
- [x] Utilização de `ILIKE` para pesquisa sem diferenciação entre maiúsculas e minúsculas.
- [x] Implementação de paginação através do parâmetro `pagina`.
- [x] Limitação de cinco funcionários por página utilizando `LIMIT 5`.
- [x] Cálculo do deslocamento utilizando `OFFSET`.
- [x] Retorno dos registros através de `resultado.rows`.
- [x] Tratamento de erros internos com HTTP 500.
- [x] Validar se o parâmetro `pagina` é um número inteiro não negativo.
- [x] Avaliar a necessidade de ordenação dos resultados para garantir paginação consistente.

### 3.2. GET `/funcionario/:codigo`

**Consulta de um funcionário específico.**

- [x] Implementação do endpoint GET com parâmetro dinâmico.
- [x] Recuperação do código através de `request.params.codigo`.
- [x] Conversão do código para inteiro utilizando `parseInt()`.
- [x] Validação do código informado.
- [x] Retorno HTTP 400 para códigos inválidos.
- [x] Consulta do funcionário pelo código no PostgreSQL.
- [x] Verificação da existência do funcionário através de `resultado.rows.length`.
- [x] Retorno HTTP 404 quando o funcionário não é encontrado.
- [x] Retorno HTTP 200 quando o funcionário é encontrado.
- [x] Retorno apenas do registro encontrado através de `resultado.rows[0]`.
- [x] Seleção explícita dos campos, evitando exposição da senha.
- [x] Tratamento de erros internos com HTTP 500.

### 3.3. PUT `/funcionario/:codigo`

**Atualização dos dados de um funcionário.**

- [x] Implementação do endpoint PUT.
- [x] Proteção da rota através de `rolesMiddleware([1])`.
- [x] Restrição de acesso aos funcionários com papel 1.
- [x] Recuperação do código através de `request.params.codigo`.
- [x] Normalização do nome informado.
- [x] Remoção de acentos.
- [x] Conversão do nome para letras minúsculas.
- [x] Remoção de espaços duplicados.
- [x] Verificação de existência de funcionário com nome correspondente.
- [x] Atualização do nome.
- [x] Atualização do salário.
- [x] Atualização do papel.
- [x] Utilização de `UPDATE` no PostgreSQL.
- [x] Utilização de `RETURNING` para recuperar o registro atualizado.
- [x] Retorno HTTP 403 quando o funcionário não possui autorização.
- [x] Corrigir a consulta de duplicidade para verificar outros funcionários, excluindo o próprio código.
- [x] Verificar se o funcionário existe antes de atualizar.
- [x] Retornar HTTP 404 quando o funcionário não existir.
- [x] Avaliar o código HTTP de sucesso: atualização normalmente utiliza 200.
- [x] Substituir `RETURNING *` por campos específicos para não expor o hash da senha.
- [x] Validar os dados recebidos no corpo da requisição.

### 3.4. POST `/funcionario`

**Cadastro de funcionários.**

- [x] Implementar endpoint POST.
- [x] Validar os dados recebidos.
- [x] Verificar os campos obrigatórios.
- [x] Validar nome, salário e papel.
- [x] Gerar hash da senha utilizando `bcrypt.hash()`.
- [x] Armazenar a senha com hash no PostgreSQL.
- [x] Retornar os dados do funcionário cadastrado sem expor a senha.
- [x] Retornar HTTP 201 após o cadastro.
- [x] Implementar tratamento de conflitos.
- [x] Implementar tratamento de erros internos.

## 4. Produtos

**Recursos previstos na especificação OpenAPI, ainda não implementados no código apresentado.**

### 4.1. GET `/produto`

- [x] Consultar produtos cadastrados.
- [x] Implementar filtro por características.
- [x] Implementar paginação.
- [x] Retornar os produtos encontrados.

### 4.2. GET `/produto/:codigo`

- [x] Consultar produto pelo código.
- [x] Validar o código informado.
- [x] Verificar a existência do produto.
- [x] Retornar HTTP 404 quando não encontrado.
- [x] Retornar os dados do produto.

### 4.3. POST `/produto`

- [ ] Implementar cadastro de produtos.
- [ ] Validar descrição.
- [ ] Validar preço.
- [ ] Validar comissão.
- [ ] Inserir produto no PostgreSQL.
- [ ] Retornar o produto cadastrado.

### 4.4. PUT `/produto/:codigo`

- [x] Implementar atualização de produtos.
- [x] Validar os dados recebidos.
- [x] Verificar a existência do produto.
- [x] Atualizar descrição.
- [x] Atualizar preço.
- [x] Atualizar comissão.
- [x] Retornar o produto atualizado.

### 4.5. PUT `/produto/:codigo/entrada/:quantidade`

- [x] Implementar entrada de estoque.
- [x] Validar o código do produto.
- [x] Validar a quantidade informada.
- [x] Incrementar a quantidade disponível.
- [x] Retornar o produto atualizado.

### 4.6. PUT `/produto/:codigo/saida/:quantidade`

- [x] Implementar saída de estoque.
- [x] Validar o código do produto.
- [x] Validar a quantidade informada.
- [x] Verificar disponibilidade de estoque.
- [x] Impedir saída superior à quantidade disponível.
- [x] Decrementar a quantidade disponível.
- [x] Retornar o produto atualizado.

## 5. Vendas

**Recursos previstos na especificação OpenAPI, ainda não implementados no código apresentado.**

### 5.1. GET `/venda`

- [x] Implementar consulta de vendas.
- [x] Implementar filtro por data inicial.
- [x] Implementar filtro por data final.
- [x] Implementar filtro por vendedor.
- [x] Implementar paginação.
- [x] Retornar as vendas encontradas.

### 5.2. GET `/venda/:codigo`

- [x] Implementar consulta de venda pelo código.
- [x] Validar o código informado.
- [x] Verificar a existência da venda.
- [x] Retornar HTTP 404 quando não encontrada.
- [x] Retornar os dados da venda.

### 5.3. POST `/venda`

- [x] Implementar registro de vendas.
- [x] Recuperar o vendedor através do JWT.
- [x] Receber o código do produto.
- [x] Receber a quantidade vendida.
- [x] Verificar a existência do produto.
- [x] Verificar a disponibilidade de estoque.
- [x] Calcular o valor da venda.
- [x] Calcular a comissão do vendedor.
- [x] Registrar a venda no PostgreSQL.
- [x] Atualizar a quantidade disponível do produto.
- [x] Garantir consistência entre registro da venda e atualização do estoque através de transação.
- [x] Retornar a venda cadastrada.

### 5.4. DELETE `/venda/:codigo`

- [x] Implementar exclusão de vendas.
- [x] Validar o código informado.
- [x] Verificar a existência da venda.
- [x] Avaliar as regras de negócio para exclusão.
- [x] Retornar HTTP 204 após a exclusão.

### 5.5. PUT `/venda/:codigo/extorno`

- [x] Implementar estorno de vendas.
- [x] Verificar a existência da venda.
- [x] Verificar se a venda já foi estornada.
- [x] Recuperar o produto relacionado à venda.
- [x] Devolver a quantidade ao estoque.
- [x] Registrar o estorno.
- [x] Garantir consistência utilizando transação no PostgreSQL.
- [x] Impedir estornos duplicados.
- [x] Retornar a venda atualizada.

## 6. Rotas auxiliares e tratamento de erros

### 6.1. GET `/teste`

- [x] Implementação de uma rota de teste.
- [x] Retorno HTTP 200.
- [x] Retorno de uma mensagem simples em JSON (`Hello World`).

### 6.2. Tratamento global de erros

- [x] Implementação de middleware global de tratamento de erros.
- [x] Captura de erros através de `error`.
- [x] Registro do rastreamento do erro utilizando `error.stack`.
- [x] Retorno do status HTTP correspondente através de `error.status`.
- [x] Utilização de HTTP 500 como status padrão.
- [x] Retorno da mensagem de erro em JSON.

## 7. Segurança e validações gerais

- [x] Utilização de consultas parametrizadas no PostgreSQL.
- [x] Utilização de bcrypt para comparação de senhas.
- [x] Utilização de hash para armazenamento de senhas.
- [x] Utilização de JWT para autenticação.
- [x] Proteção de operações através de papéis de acesso.
- [x] Separação entre autenticação e autorização.
- [x] Utilização de variáveis de ambiente para informações sensíveis.
- [x] Remoção do campo senha nas respostas das consultas GET de funcionários.
- [ ] Revisar todas as respostas para garantir que hashes de senhas nunca sejam expostos.
- [ ] Implementar validações completas dos parâmetros de entrada.
- [ ] Revisar as permissões de acesso de todas as rotas protegidas.
- [ ] Validar a existência e o formato do cabeçalho Authorization.
- [ ] Implementar estratégia adequada de renovação e revogação de tokens.
- [x] Revisar o tratamento de erros de autenticação e autorização.
- [x] Garantir que operações que alteram múltiplos registros utilizem transações quando necessário.

---

## 8. Resumo do desenvolvimento

| Módulo | Situação |
|---|---|
| Configuração do servidor | Implementado |
| Conexão com PostgreSQL | Implementado |
| Integração OpenAPI | Implementado |
| Autenticação JWT | Implementado |
| Autorização por papéis | Implementado |
| Renovação de tokens | Em desenvolvimento |
| Consulta de funcionários | Implementado |
| Consulta de funcionário por código | Implementado |
| Atualização de funcionários | Implementado, necessita ajustes |
| Cadastro de funcionários | Pendente |
| Consulta de produtos | Pendente |
| Cadastro de produtos | Pendente |
| Atualização de produtos | Pendente |
| Controle de estoque | Pendente |
| Consulta de vendas | Pendente |
| Registro de vendas | Pendente |
| Exclusão de vendas | Pendente |
| Estorno de vendas | Pendente |
| Tratamento global de erros | Implementado |
| Rota de teste | Implementado |

**Legenda:**
- `[x]` Implementado no código apresentado.
- `[ ]` Pendente ou necessita de correção/complementação.
- `Em desenvolvimento` Implementação iniciada, mas ainda não finalizada.
