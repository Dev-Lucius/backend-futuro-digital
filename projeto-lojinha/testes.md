# Casos de teste da API — Funcionários e Produtos

Este documento reúne os 30 casos de teste para validar a API usando o Postman.

## Configuração inicial

- **URL base:** `http://localhost:8080` (ajuste se sua aplicação usar outra porta).
- **Formato:** `JSON` (`Content-Type: application/json`).
- **Autenticação:** para rotas protegidas, envie o JWT no cabeçalho:
  ```http
  Authorization: Bearer <token>
  ```
- **Papéis considerados neste documento:**
  - `papel = 1`: gerente, com permissão para cadastrar/alterar/entrada de produtos.
  - `papel = 2`: vendedor, sem permissão para essas operações.
- **Atenção:** as senhas de `funcionario` precisam estar armazenadas como hashes BCrypt, pois a autenticação usa `bcrypt.compareSync()`. Senhas em texto puro não funcionarão.

> Os resultados descritos como “esperado” representam o comportamento desejado. Quando indicado, o código atual pode se comportar de outra forma por falta de validação ou por um problema na implementação.

---

## 1. Autenticação

### CT01 — Autenticação com credenciais válidas

**Requisição**
- Método: `POST`
- Endpoint: `/funcionario/autenticacao`

**Corpo JSON**
```json
{
  "usuario": 1,
  "senha": "senha-do-funcionario"
}
```

**Resultado esperado**
- Status `200 OK`.
- Resposta contém um campo `token` com um JWT válido.

**Observações**
- O funcionário de código `1` deve existir.
- A senha armazenada no banco deve ser um hash BCrypt correspondente à senha enviada.

---

### CT02 — Autenticação com senha incorreta

**Requisição**
- Método: `POST`
- Endpoint: `/funcionario/autenticacao`

**Corpo JSON**
```json
{
  "usuario": 1,
  "senha": "senha-incorreta"
}
```

**Resultado esperado**
- Status `401 Unauthorized`.
- Mensagem indicando falha de autenticação, conforme o formato adotado pela API.
- Nenhum token deve ser emitido.

---

### CT03 — Autenticação com funcionário inexistente

**Requisição**
- Método: `POST`
- Endpoint: `/funcionario/autenticacao`

**Corpo JSON**
```json
{
  "usuario": 999999,
  "senha": "qualquer-senha"
}
```

**Resultado esperado**
- Status `401 Unauthorized`.
- Nenhum token deve ser emitido.

---

### CT04 — Autenticação sem informar a senha

**Requisição**
- Método: `POST`
- Endpoint: `/funcionario/autenticacao`

**Corpo JSON**
```json
{
  "usuario": 1
}
```

**Resultado esperado**
- Idealmente, status `400 Bad Request`, informando que a senha é obrigatória.

**Verificação do código atual**
- Se o esquema OpenAPI não validar o campo obrigatório, a rota pode retornar outro status ou gerar erro. Confirme a resposta real e acrescente validação explícita, se necessário.

---

### CT05 — Validade e expiração do JWT

**Requisição**
1. Execute CT01 e copie o token.
2. Use o token em uma rota protegida.
3. Aguarde mais de cinco minutos e repita a requisição.

**Resultado esperado**
- Antes da expiração, um token válido deve ser aceito pela autenticação/middleware.
- Após a expiração, o token deve ser rejeitado, normalmente com `401 Unauthorized`.

**Observações**
- A criação do token usa `expiresIn: '5m'`.
- Esse teste também depende do middleware que verifica o JWT.

---

## 2. Consulta de produtos

### CT06 — Listar produtos sem filtros

**Requisição**
- Método: `GET`
- Endpoint: `/produto`

**Resultado esperado**
- Status `200 OK`.
- Corpo da resposta é uma lista de produtos.
- Cada item contém `descricao`, `preco` e `quantidade`.
- A consulta limita a resposta a cinco registros por página.

---

### CT07 — Buscar produto por parte da descrição

**Requisição**
- Método: `GET`
- Endpoint: `/produto?caracteristicas=teclado`

**Resultado esperado**
- Status `200 OK`.
- A lista contém os produtos cuja descrição corresponda ao termo, sem diferenciar maiúsculas de minúsculas.
- Se nenhum produto corresponder, a resposta deve ser uma lista vazia.

---

### CT08 — Buscar descrição com acentos

**Requisição**
- Método: `GET`
- Endpoint: `/produto?caracteristicas=memória`

**Resultado esperado**
- Idealmente, produtos como `Memória RAM 16GB` devem aparecer mesmo que o usuário digite a busca com ou sem acento.

**Verificação do código atual**
- O código normaliza o termo recebido, mas a consulta SQL compara com a descrição armazenada usando `ILIKE`. Isso pode não encontrar descrições que contenham acentos se o termo normalizado não tiver o mesmo acento.
- Teste tanto `memória` quanto `memoria`. Se necessário, normalize também o campo consultado no banco ou utilize uma estratégia de busca que ignore acentos.

---

### CT09 — Buscar descrição inexistente

**Requisição**
- Método: `GET`
- Endpoint: `/produto?caracteristicas=produto-inexistente-xyz`

**Resultado esperado**
- Status `200 OK`.
- Corpo da resposta é uma lista vazia (`[]`).

---

### CT10 — Paginação de produtos

**Requisições**
- `GET /produto?pagina=0`
- `GET /produto?pagina=1`
- `GET /produto?pagina=2`

**Resultado esperado**
- Cada resposta contém no máximo cinco produtos.
- A página `0` começa no início dos resultados; a página `1` pula os cinco primeiros; a página `2` pula os dez primeiros.

**Verificação do código atual**
- A consulta usa `OFFSET` e `LIMIT 5`, mas não define `ORDER BY`. Sem ordenação, os registros podem não aparecer sempre na mesma sequência. Para resultados previsíveis, ordene por uma coluna estável, por exemplo `ORDER BY codigo`.

---

### CT11 — Consultar produto existente pelo código

**Requisição**
- Método: `GET`
- Endpoint: `/produto/1`

**Resultado esperado**
- Status `200 OK`.
- Corpo contém um produto, com `descricao`, `preco` e `quantidade`.

**Pré-condição**
- Deve existir um produto com código `1`.

---

### CT12 — Consultar produto inexistente pelo código

**Requisição**
- Método: `GET`
- Endpoint: `/produto/999999`

**Resultado esperado**
- Status `404 Not Found`.
- Resposta informa que o produto não foi encontrado.

---

## 3. Cadastro de produtos

### CT13 — Cadastrar produto válido

**Requisição**
- Método: `POST`
- Endpoint: `/produto`
- Cabeçalho: `Authorization: Bearer <token-de-gerente>`

**Corpo JSON**
```json
{
  "descricao": "Cadeira Gamer",
  "preco": 1200,
  "comissao": 80
}
```

**Resultado esperado**
- Status `201 Created`.
- A descrição é normalizada pelo código atual, por exemplo, para `cadeira gamer`.
- A quantidade inicial é `0`.
- A resposta contém o produto cadastrado.

**Pré-condição**
- O token pertence a um funcionário com `papel = 1`.
- A descrição ainda não existe.

---

### CT14 — Cadastrar produto com descrição duplicada

**Requisição**
- Método: `POST`
- Endpoint: `/produto`
- Cabeçalho: `Authorization: Bearer <token-de-gerente>`

**Corpo JSON**
```json
{
  "descricao": "  CADEIRA   GAMER ",
  "preco": 1300,
  "comissao": 90
}
```

**Resultado esperado**
- Status `409 Conflict`.
- A API informa que já existe produto com a mesma descrição normalizada.

**Pré-condição**
- Um produto com descrição equivalente a `cadeira gamer` já deve existir.

---

### CT15 — Cadastrar produto sem descrição

**Requisição**
- Método: `POST`
- Endpoint: `/produto`
- Cabeçalho: `Authorization: Bearer <token-de-gerente>`

**Corpo JSON**
```json
{
  "preco": 100,
  "comissao": 10
}
```

**Resultado esperado**
- Status `400 Bad Request`, informando que `descricao` é obrigatória.

**Verificação do código atual**
- Se não houver validação no OpenAPI, chamar `.normalize()` em um valor ausente pode gerar erro. Verifique se a rota responde com `400` e adicione validação explícita caso necessário.

---

### CT16 — Cadastrar produto com preço negativo

**Requisição**
- Método: `POST`
- Endpoint: `/produto`
- Cabeçalho: `Authorization: Bearer <token-de-gerente>`

**Corpo JSON**
```json
{
  "descricao": "Produto de Teste",
  "preco": -10,
  "comissao": 5
}
```

**Resultado esperado**
- Status `400 Bad Request`.
- A API rejeita preço negativo.

**Verificação do código atual**
- Esse comportamento depende de validações no esquema OpenAPI ou na própria rota. Se não existir validação, o valor pode ser aceito.

---

### CT17 — Cadastrar produto com usuário sem permissão

**Requisição**
- Método: `POST`
- Endpoint: `/produto`
- Cabeçalho: `Authorization: Bearer <token-de-vendedor>`

**Corpo JSON**
```json
{
  "descricao": "Produto Sem Permissao",
  "preco": 100,
  "comissao": 10
}
```

**Resultado esperado**
- `403 Forbidden` se o token for válido, mas o papel não tiver permissão.
- `401 Unauthorized` se não houver token ou se ele for inválido.
- O produto não deve ser cadastrado.

**Pré-condição**
- O token de vendedor pertence a funcionário com `papel = 2`.

---

## 4. Atualização de produtos

### CT18 — Atualizar produto existente

**Requisição**
- Método: `PUT`
- Endpoint: `/produto/1`
- Cabeçalho: `Authorization: Bearer <token-de-gerente>`

**Corpo JSON**
```json
{
  "descricao": "Teclado Mecânico Atualizado",
  "preco": 275,
  "comissao": 18
}
```

**Resultado esperado**
- Status `200 OK`.
- Os campos enviados são atualizados.
- A quantidade em estoque permanece inalterada.

**Pré-condição**
- O produto de código `1` existe.
- O token pertence a um gerente.

---

### CT19 — Atualizar descrição para uma já utilizada

**Requisição**
- Método: `PUT`
- Endpoint: `/produto/1`
- Cabeçalho: `Authorization: Bearer <token-de-gerente>`

**Corpo JSON**
```json
{
  "descricao": "Mouse Gamer",
  "preco": 275,
  "comissao": 18
}
```

**Resultado esperado**
- Status `409 Conflict`.
- A API rejeita a alteração porque outro produto já usa a mesma descrição normalizada.

**Pré-condição**
- Outro produto, por exemplo o de código `2`, já tem a descrição `Mouse Gamer`.

---

### CT20 — Atualizar produto inexistente

**Requisição**
- Método: `PUT`
- Endpoint: `/produto/999999`
- Cabeçalho: `Authorization: Bearer <token-de-gerente>`

**Corpo JSON**
```json
{
  "descricao": "Produto Inexistente",
  "preco": 100,
  "comissao": 10
}
```

**Resultado esperado**
- Status `404 Not Found`.
- Nenhum produto é criado ou alterado.

---

### CT21 — Atualizar produto sem permissão

**Requisição**
- Método: `PUT`
- Endpoint: `/produto/1`
- Cabeçalho: `Authorization: Bearer <token-de-vendedor>`

**Corpo JSON**
```json
{
  "descricao": "Alteracao Nao Permitida",
  "preco": 100,
  "comissao": 10
}
```

**Resultado esperado**
- `403 Forbidden` para token válido sem permissão.
- `401 Unauthorized` para token ausente ou inválido.
- Os dados do produto permanecem inalterados.

---

## 5. Entrada de estoque

### CT22 — Registrar entrada válida

**Requisição**
- Método: `PUT`
- Endpoint: `/produto/1/entrada/10`
- Cabeçalho: `Authorization: Bearer <token-de-gerente>`

**Pré-condição**
- Produto `1` existe e possui quantidade conhecida, por exemplo `20`.

**Resultado esperado**
- Status `200 OK`.
- A quantidade passa de `20` para `30`.

---

### CT23 — Registrar entrada para produto inexistente

**Requisição**
- Método: `PUT`
- Endpoint: `/produto/999999/entrada/10`
- Cabeçalho: `Authorization: Bearer <token-de-gerente>`

**Resultado esperado**
- Status `404 Not Found`.
- Nenhum estoque é alterado.

---

### CT24 — Registrar entrada com quantidade zero

**Requisição**
- Método: `PUT`
- Endpoint: `/produto/1/entrada/0`
- Cabeçalho: `Authorization: Bearer <token-de-gerente>`

**Resultado esperado recomendado**
- Status `400 Bad Request`, pois a quantidade de entrada deve ser maior que zero.

**Verificação do código atual**
- Sem validação explícita, a rota pode aceitar a operação e responder `200 OK` sem alterar a quantidade.

---

### CT25 — Registrar entrada com quantidade negativa

**Requisição**
- Método: `PUT`
- Endpoint: `/produto/1/entrada/-5`
- Cabeçalho: `Authorization: Bearer <token-de-gerente>`

**Resultado esperado**
- Status `400 Bad Request`.
- A API rejeita quantidades negativas.

**Verificação do código atual**
- Sem validação explícita, a operação pode diminuir o estoque em vez de registrar uma entrada.

---

## 6. Saída de estoque

### CT26 — Registrar saída válida

**Requisição**
- Método: `PUT`
- Endpoint: `/produto/1/saida/5`

**Pré-condição**
- Produto `1` existe e tem quantidade `20`.

**Resultado esperado**
- Status `200 OK`.
- A quantidade passa de `20` para `15`.

**Verificação de autorização**
- A rota apresentada não usa `rolesMiddleware`. Recomenda-se definir se a saída deve exigir autenticação e permissão e, se sim, aplicar o middleware correspondente.

---

### CT27 — Registrar saída de todo o estoque disponível

**Requisição**
- Método: `PUT`
- Endpoint: `/produto/1/saida/20`

**Pré-condição**
- Produto `1` tem quantidade `20`.

**Resultado esperado**
- Status `200 OK`.
- A quantidade passa para `0`.
- O estoque não fica negativo.

---

### CT28 — Registrar saída maior que o estoque disponível

**Requisição**
- Método: `PUT`
- Endpoint: `/produto/1/saida/25`

**Pré-condição**
- Produto `1` tem quantidade `20`.

**Resultado esperado**
- Status `409 Conflict`.
- A API informa que não há estoque suficiente.
- A quantidade permanece em `20`.

**Problema conhecido no código atual**
- A condição consulta `result1.rows[0].estoque`, mas a coluna da tabela é `quantidade`. Como `estoque` não existe no resultado, a comparação não protege corretamente contra saldo insuficiente. Troque para `result1.rows[0].quantidade` e teste novamente.

---

### CT29 — Registrar saída de produto inexistente

**Requisição**
- Método: `PUT`
- Endpoint: `/produto/999999/saida/5`

**Resultado esperado**
- Status `404 Not Found`.
- Nenhum estoque é alterado.

---

### CT30 — Registrar saída com quantidade negativa

**Requisição**
- Método: `PUT`
- Endpoint: `/produto/1/saida/-5`

**Pré-condição**
- Produto `1` existe e tem quantidade conhecida.

**Resultado esperado**
- Status `400 Bad Request`.
- A API rejeita a quantidade negativa.

**Problema conhecido no código atual**
- Sem validação, subtrair uma quantidade negativa pode aumentar o estoque. A validação deve exigir um inteiro maior que zero.

---

## Recomendações de correção encontradas durante a elaboração dos testes

1. **Validar os dados de entrada:** exigir descrição, preço e comissão válidos; preço e comissão não negativos; quantidade inteira maior que zero nas rotas de entrada e saída.
2. **Corrigir a verificação do estoque:** usar a coluna `quantidade`, não `estoque`.
3. **Proteger a rota de saída:** aplicar autenticação e autorização se a regra de negócio exigir que somente usuários autorizados registrem saídas.
4. **Ordenar a listagem paginada:** adicionar `ORDER BY` para tornar os resultados estáveis entre páginas.
5. **Tratar busca sem acentos:** normalizar tanto o termo pesquisado quanto a descrição comparada, se esse for o comportamento desejado.
6. **Testar os estados reais do banco:** antes e depois de operações de entrada/saída, consulte a quantidade para confirmar que a alteração foi persistida.
7. **Executar os testes em ambiente de desenvolvimento:** use registros de teste para evitar modificar dados de produção.


