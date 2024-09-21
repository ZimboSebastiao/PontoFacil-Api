// index.js

import express from "express";
import {
  ler,
  inserir,
  lerUm,
  atualizar,
  excluir,
  listarEmpresas,
} from "./src/usuarios.js";
import folhaPonto from "./src/folhaPonto.js";
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

// Atualizando dados de um usuario
app.patch("/usuarios/:id", (req, res) => {
  //res.send(`Atualizando um usuario`);
  const id = parseInt(req.params.id);
  const usuario = req.body;
  atualizar(id, usuario, res);
});

// Deletando dados de um usuario
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
            data_nascimento: usuario.data_nascimento,
            senha: usuario.senha,
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

// Rota para criar funcionários (somente admin)
app.post("/funcionarios", autenticar, async (req, res) => {
  const adminId = req.user.id;
  const { nome, email, senha } = req.body; // Removido 'tipo' já que é fixo como 'funcionario'

  // Verificar se o usuário autenticado é um admin
  const sqlAdmin = "SELECT * FROM usuarios WHERE id = ? AND tipo = 'admin'";
  conexao.query(sqlAdmin, [adminId], async (err, results) => {
    if (err) {
      console.error("Erro ao verificar admin:", err);
      return res.status(500).json({ error: "Erro ao verificar admin" });
    }

    if (results.length === 0) {
      return res.status(403).json({
        error: "Acesso negado. Somente admins podem criar funcionários.",
      });
    }

    // Obter o empresa_id e nome da empresa
    const sqlEmpresaId = "SELECT empresa_id FROM usuarios WHERE id = ?";
    conexao.query(sqlEmpresaId, [adminId], async (error, empresaResults) => {
      if (error) {
        return res.status(500).json({ error: "Erro ao obter empresa_id" });
      }

      if (empresaResults.length === 0) {
        return res.status(400).json({ error: "Admin não encontrado" });
      }

      const empresaId = empresaResults[0].empresa_id;

      // Obter o nome da empresa
      const sqlNomeEmpresa = "SELECT nome FROM empresas WHERE id = ?";
      conexao.query(
        sqlNomeEmpresa,
        [empresaId],
        async (error, empresaNomeResults) => {
          if (error) {
            return res
              .status(500)
              .json({ error: "Erro ao obter nome da empresa" });
          }

          if (empresaNomeResults.length === 0) {
            return res.status(400).json({ error: "Empresa não encontrada" });
          }

          const nomeEmpresa = empresaNomeResults[0].nome;

          // Criptografar a senha
          try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(senha, saltRounds);

            // Inserir o novo funcionário no banco
            const sqlInsert =
              "INSERT INTO usuarios (nome, email, senha, tipo, empresa_id, empresa) VALUES (?, ?, ?, 'funcionario', ?, ?)";
            conexao.query(
              sqlInsert,
              [nome, email, hashedPassword, empresaId, nomeEmpresa],
              (error, results) => {
                if (error) {
                  if (error.code === "ER_DUP_ENTRY") {
                    res.status(400).json({ error: "Email já existe" });
                  } else {
                    res.status(400).json(error.code);
                  }
                } else {
                  res
                    .status(201)
                    .json({ status: "Funcionário criado com sucesso" });
                }
              }
            );
          } catch (error) {
            res.status(500).json({ error: "Erro ao criptografar a senha" });
          }
        }
      );
    });
  });
});

// Rota para listar todos os funcionários da mesma empresa
app.get("/funcionarios", autenticar, (req, res) => {
  const usuario_id = req.user.id;

  const sqlEmpresaId = "SELECT empresa_id FROM usuarios WHERE id = ?";
  conexao.query(sqlEmpresaId, [usuario_id], (error, results) => {
    if (error || results.length === 0 || !results[0].empresa_id) {
      return res.status(500).json({ error: "Erro ao obter empresa_id" });
    }

    const empresaId = results[0].empresa_id;

    const sqlUsuarios =
      "SELECT * FROM usuarios WHERE empresa_id = ? AND (tipo = 'funcionario' OR tipo = 'admin')";
    conexao.query(sqlUsuarios, [empresaId], (error, usuarios) => {
      if (error) {
        return res.status(500).json({ error: "Erro ao buscar usuários" });
      }
      res.status(200).json(usuarios);
    });
  });
});

// Rota para listar todas as empresas
app.get("/empresas", (req, res) => {
  listarEmpresas(res);
});

// Rota para gerar PDF
app.get("/folha-ponto/:id", autenticar, (req, res) => {
  const id = req.params.id;

  // Buscar os dados do usuário
  const sqlUsuario = "SELECT * FROM usuarios WHERE id = ?";
  const sqlRegistros = `
    SELECT * FROM registros 
    WHERE usuario_id = ? 
    AND MONTH(data_hora) = MONTH(CURRENT_DATE()) 
    AND YEAR(data_hora) = YEAR(CURRENT_DATE())
  `;

  // Verificar se o usuário existe
  conexao.query(sqlUsuario, [id], (erroUsuario, usuarioRes) => {
    if (erroUsuario || usuarioRes.length === 0) {
      console.log("Usuário não encontrado ou erro na consulta:", erroUsuario);
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const usuario = usuarioRes[0];

    // Buscar registros do mês atual
    conexao.query(sqlRegistros, [id], (erroRegistros, registrosRes) => {
      if (erroRegistros) {
        console.log("Erro ao buscar registros:", erroRegistros);
        return res.status(500).json({ message: "Erro ao buscar registros." });
      }

      if (registrosRes.length === 0) {
        console.log("Nenhum registro encontrado para o mês atual.");
        return res
          .status(404)
          .json({ message: "Nenhum registro encontrado para este mês." });
      }
      console.log("Registros encontrados:", registrosRes);

      // Processar os registros (somar horas e calcular pontos perdidos)
      const totalHoras = registrosRes.reduce(
        (acc, registro) => acc + (registro.horas_trabalhadas || 0),
        0
      );
      const totalPontos = registrosRes.reduce(
        (acc, registro) => acc + (registro.pontos_perdidos || 0),
        0
      );

      const registros = {
        totalHoras,
        totalPontos,
      };

      console.log("Dados do usuário:", usuario);
      console.log("Total de horas trabalhadas:", totalHoras);
      console.log("Total de pontos perdidos:", totalPontos);

      // Preencher o template e converter para PDF
      folhaPonto(usuario, registros, res);
    });
  });
});

// Executando o servidor
app.listen(porta, () => {
  console.log(`Servidor NodeJS rodando na porta ${porta}`);
});
