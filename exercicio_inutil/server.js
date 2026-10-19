const express = require("express");

const server = express();
const port = 8080;

server.get("/produto/", (request, response) => {
  if (request.headers.chaveacesso == "12ab3-def45-xyz888ab90") {
    response.status(200).json(`resposta ${request.query.tipo}`);
    response.status(200).json(`resposta ${request.query.cor}`);
    response.status(200).json(`resposta ${request.query.minpreco}`);
    response.status(200).json(`resposta ${request.query.maxpreco}`);
  } else {
    response.status(401).json();
  }
});

server.get("/produto/:codigo", (request, response) => {
  if (request.headers.chaveacesso == "12ab3-def45-xyz888ab90") {
    response.status(200).json('resposta');

  } else {
    response.status(401).json();
  }
});

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});