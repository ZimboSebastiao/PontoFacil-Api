import express from "express";
import {ler, inserir, lerUm, atualizar, excluir} from "./src/usuarios.js";
import cors from 'cors';

const app = express();
const porta = process.env.PORT || 8080;

// Adicionando suporte para o formato Json
app.use(express.json());

// Adicionando suporte a dados vindo de formulário
app.use(express.urlencoded({extended : true}));

// permitindo acesso aos arquivos da API
app.use(cors())

// Criando as rotas
// raiz da aplicação
app.get('/', (req, res) => {
    res.redirect('https://documenter.getpostman.com/view/29885708/2s9YJZ34YJ');
});

// Exibindo dados de um usuario
app.get('/usuarios/:id', (req, res) => {
    //res.send(`Exibindo dados de um usuario`);
    const id = parseInt(req.params.id);
    lerUm(id, res);
});

// Exibindo dados de Todos os usuarios
app.get('/usuarios', (req, res) => {
    //res.send(`Exibindo dados de todos os usuarios`);
    ler(res);
});

// Adicionando um usuario
app.post('/usuarios', (req, res) => {
    //res.send(`Adicionando um usuario`);
    const novousuario = req.body;
    inserir(novousuario, res);
});

// Atualizando dados de um aluo
app.patch('/usuarios/:id', (req, res) => {
    //res.send(`Atualizando um usuario`);
    const id = parseInt(req.params.id);
    const usuario = req.body;
    atualizar(id, usuario, res);
});

// Atualizando dados de um aluo
app.delete('/usuarios/:id', (req, res) => {
    //res.send(`Excluindo um usuario`);
    const id = parseInt(req.params.id);
    excluir(id, res);
});

// Executando o servidor 


app.listen(porta, () => {
    console.log(`Servidor NodeJS rodando na porta ${porta}`);
})