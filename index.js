import express from "express";
import {ler, inserir, lerUm, atualizar, excluir} from "./src/usuarios.js";
import cors from 'cors';
import conexao from "./src/banco.js";
import bcrypt from 'bcryptjs';

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


// Rota para login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    const sql = "SELECT * FROM usuarios WHERE email = ?";
    conexao.query(sql, [email], async (erro, resultados) => {
        if (erro) {
            console.error("Erro ao buscar usuário:", erro);
            res.status(500).json({ error: "Erro ao buscar usuário" });
            return;
        }

        if (resultados.length === 0) {
            res.status(401).json({ error: "Credenciais inválidas" });
            return;
        }

        const usuario = resultados[0];

        try {
            const senhaValida = await bcrypt.compare(senha, usuario.senha);

            if (senhaValida) {
                res.status(200).json({
                    message: "Login bem-sucedido",
                    usuario: {
                        id: usuario.id,
                        nome: usuario.nome,
                        email: usuario.email,
                        tipo: usuario.tipo
                    }
                });
            } else {
                res.status(401).json({ error: "Credenciais inválidas" });
            }
        } catch (erro) {
            console.error("Erro ao verificar senha:", erro);
            res.status(500).json({ error: "Erro ao verificar senha" });
        }
    });
});


// Executando o servidor 


app.listen(porta, () => {
    console.log(`Servidor NodeJS rodando na porta ${porta}`);
})