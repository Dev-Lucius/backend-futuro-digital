let p = {
    nome: "Maria Da Graça Meneghel Da Silva",
    nascimento: "1963-03-27",
    genero:"F"
}

// Verificação
if(p.nome.includes("  ")){
    console.log("Nome Inválido");
}

if((p.genero != "M") && (p.genero != "F")){
    console.log("Gênero Inválido");
}

// Verificação Data
let p1 = p.nascimento.indexOf("-");
let p2 = p.nascimento.indexOf("-", p1 + 1);

if((p1 == -1) || (p2 == -1)){
    console.log("Data de Nascimento Inválida");
}

console.log(p);
