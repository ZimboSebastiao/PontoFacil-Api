import express from "express";
import { ler, inserir, lerUm, atualizar, excluir } from "./src/usuarios.js";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import conexao from "./src/banco.js";
import { autenticar } from "./src/auth.js";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
const porta = process.env.PORT || 8080;

// Adicionando suporte para o formato Json
app.use(express.json());

// Adicionando suporte a dados vindo de formulário
app.use(express.urlencoded({ extended: true }));

// permitindo acesso aos arquivos da API
app.use(cors());

// Criando as rotas
// raiz da aplicação
app.get("/", (req, res) => {
  res.redirect("https://documenter.getpostman.com/view/29885708/2s9YJZ34YJ");
});

// Exibindo dados de um usuario
app.get("/usuarios/:id", (req, res) => {
  //res.send(`Exibindo dados de um usuario`);
  const id = parseInt(req.params.id);
  lerUm(id, res);
});

// Exibindo dados de Todos os usuarios
app.get("/usuarios", (req, res) => {
  //res.send(`Exibindo dados de todos os usuarios`);
  ler(res);
});

// Adicionando um usuario
app.post("/usuarios", (req, res) => {
  //res.send(`Adicionando um usuario`);
  const novousuario = req.body;
  inserir(novousuario, res);
});

// Atualizando dados de um aluo
app.patch("/usuarios/:id", (req, res) => {
  //res.send(`Atualizando um usuario`);
  const id = parseInt(req.params.id);
  const usuario = req.body;
  atualizar(id, usuario, res);
});

// Atualizando dados de um aluo
app.delete("/usuarios/:id", (req, res) => {
  //res.send(`Excluindo um usuario`);
  const id = parseInt(req.params.id);
  excluir(id, res);
});

// Rota para login
app.post("/login", async (req, res) => {
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
        // Gerar o access token e refresh token
        const token = jwt.sign({ id: usuario.id }, JWT_SECRET, {
          expiresIn: "1h", // 1 hora para o access token
        });

        const refreshToken = jwt.sign({ id: usuario.id }, JWT_SECRET, {
          expiresIn: "7d", // 7 dias para o refresh token
        });

        res.status(200).json({
          message: "Login bem-sucedido",
          token, // Retorna o access token ao usuário
          refreshToken, // Retorna o refresh token ao usuário
          usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            tipo: usuario.tipo,
            data_criacao: usuario.data_criacao,
            funcao: usuario.funcao,
            empresa: usuario.empresa,
            nacionalidade: usuario.nacionalidade,
            endereco: usuario.endereco,
            cep: usuario.cep,
            celular: usuario.celular,
          },
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

// Função para verificar se o ponto já foi registrado
async function pontoJaRegistrado(usuario_id, tipo_registro, data_hora) {
  const data = new Date(data_hora);
  const dataInicio = new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate()
  );
  const dataFim = new Date(dataInicio);
  dataFim.setDate(dataFim.getDate() + 1);

  try {
    const [rows] = await conexao
      .promise()
      .query(
        "SELECT * FROM registros WHERE usuario_id = ? AND tipo_registro = ? AND data_hora BETWEEN ? AND ?",
        [usuario_id, tipo_registro, dataInicio, dataFim]
      );

    console.log("Resultado da consulta:", rows);

    if (!Array.isArray(rows)) {
      throw new Error("O formato de retorno da consulta está incorreto.");
    }

    return rows.length > 0;
  } catch (error) {
    console.error("Erro ao verificar ponto registrado:", error);
    throw error;
  }
}

// Rota para registrar ponto
app.post("/registros", async (req, res) => {
  const { usuario_id, tipo_registro, data_hora, localizacao } = req.body;

  try {
    const registrado = await pontoJaRegistrado(
      usuario_id,
      tipo_registro,
      data_hora
    );

    if (registrado) {
      return res.status(400).json({
        message: `Já existe um registro do tipo ${tipo_registro} para hoje.`,
      });
    }

    await conexao.execute(
      "INSERT INTO registros (usuario_id, tipo_registro, data_hora, localizacao) VALUES (?, ?, ?, ?)",
      [usuario_id, tipo_registro, data_hora, localizacao]
    );

    res.status(201).json({ message: "Registro realizado com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao registrar ponto." });
  }
});

// Rota para obter todos os registros do usuário logado
app.get("/registros", autenticar, async (req, res) => {
  const usuario_id = req.user.id;

  try {
    // Log para verificar o ID do usuário
    console.log("ID do usuário:", usuario_id);

    // Executa a consulta e obtém o resultado
    const [rows] = await conexao
      .promise()
      .query("SELECT * FROM registros WHERE usuario_id = ?", [usuario_id]);

    // Log para verificar o resultado da consulta
    console.log("Resultado da consulta:", rows);

    // Verifique a estrutura do resultado
    if (!Array.isArray(rows)) {
      throw new Error("O resultado da consulta não está no formato esperado.");
    }

    // Log para verificar os registros
    console.log("Registros obtidos:", rows);

    // Retorna os registros
    res.status(200).json(rows);
  } catch (error) {
    // Log para capturar e exibir o erro
    console.error("Erro ao obter registros:", error);
    res.status(500).json({ message: "Erro ao obter registros." });
  }
});

// Rota para obter registros do dia atual do usuário logado
app.get("/registros-dia-atual", autenticar, async (req, res) => {
  const usuario_id = req.user.id;

  try {
    // Adicione um log para verificar o ID do usuário
    console.log("ID do usuário:", usuario_id);

    // Obtém a data atual no formato 'YYYY-MM-DD'
    const hoje = new Date().toISOString().slice(0, 10);

    // Executa a consulta e obtém o resultado
    const [rows] = await conexao
      .promise()
      .query(
        "SELECT * FROM registros WHERE usuario_id = ? AND DATE(data_hora) = ?",
        [usuario_id, hoje]
      );

    // Adicione um log para verificar o resultado da consulta
    console.log("Resultado da consulta:", rows);

    // Verifique a estrutura do resultado
    if (!Array.isArray(rows)) {
      throw new Error("O resultado da consulta não está no formato esperado.");
    }

    // Adicione um log para verificar os registros
    console.log("Registros obtidos:", rows);

    // Retorna os registros
    res.status(200).json(rows);
  } catch (error) {
    // Adicione um log para capturar e exibir o erro
    console.error("Erro ao obter registros do dia atual:", error);
    res.status(500).json({ message: "Erro ao obter registros do dia atual." });
  }
});

// Rota para obter registros dos últimos 7 dias do usuário logado
app.get("/registros/ultimos-7-dias", autenticar, (req, res) => {
  const usuario_id = req.user.id; // Obtendo o ID do usuário da autenticação

  const dataFim = new Date();
  const dataInicio = new Date();
  dataInicio.setDate(dataFim.getDate() - 7);

  conexao.query(
    `SELECT * FROM registros 
     WHERE usuario_id = ? AND data_hora BETWEEN ? AND ?`,
    [
      usuario_id,
      dataInicio.toISOString().slice(0, 19).replace("T", " "),
      dataFim.toISOString().slice(0, 19).replace("T", " "),
    ],
    (error, resultados) => {
      if (error) {
        console.error("Erro ao obter registros:", error);
        return res.status(500).json({ message: "Erro ao obter registros." });
      }

      res.status(200).json(resultados);
    }
  );
});

// Executando o servidor
app.listen(porta, () => {
  console.log(`Servidor NodeJS rodando na porta ${porta}`);
});
