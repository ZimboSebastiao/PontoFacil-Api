// src/banco.js
import mysql2 from "mysql2";

// Armazenando os dados da conexão em uma constante
const conexao = mysql2.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "pontofacil",
});

// Banco de dados DB4Free
// const conexao = mysql2.createConnection({
//     host : '',
//     user : '',
//     password : '',
//     database : ''
// })

// Efetivando a conexão
conexao.connect();
conexao.connect((erro) => {
  if (erro) {
    console.error(`Erro ao conectar: ${erro.message}`);
  } else {
    console.log(`Banco de dados conectado em: ${conexao.config.host}`);
  }
});

export default conexao;
