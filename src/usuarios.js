import bcrypt from 'bcrypt';
import conexao from "./banco.js";

// Função para validar o tipo de usuário
function validarTipo(tipo) {
    const tiposValidos = ['admin', 'funcionario'];
    return tiposValidos.includes(tipo);
}

// CRUD

// Ler/exibir todos os usuarios
function ler(res) {
    const sql = "SELECT * FROM usuarios ORDER BY nome";

    conexao.query(sql, (erro, resultados) => {
        if (erro) {
            res.status(400).json(erro.code); // 400 = BAD Request
        } else if (resultados.length === 0) {
            res.status(204).end(); // 204 = Sem conteúdo
        } else {
            res.status(200).json(resultados);
        }
    });
}

// Inserindo usuarios no banco de dados
async function inserir(usuario, res) {
    if (!validarTipo(usuario.tipo)) {
        res.status(400).json({ error: "Tipo de usuário inválido" });
        return;
    }

    // Criptografar a senha
    try {
        const saltRounds = 10;
        usuario.senha = await bcrypt.hash(usuario.senha, saltRounds);
    } catch (erro) {
        res.status(500).json({ error: "Erro ao criptografar a senha" });
        return;
    }

    const sql = "INSERT INTO usuarios SET ?";
    conexao.query(sql, usuario, (erro, resultados) => {
        if (erro) {
            if (erro.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: "Email já existe" });
            } else {
                res.status(400).json(erro.code);
            }
        } else {
            const insertedId = resultados.insertId;
            res.status(201).json({ "status": "usuario inserido", "id": insertedId });
        }
    });
}

// Ler um usuario
function lerUm(id, res) {
    const sql = "SELECT * FROM usuarios WHERE id = ?";

    conexao.query(sql, id, (erro, resultados) => {
        if (erro) {
            res.status(400).json(erro.code); // 400 = BAD Request
        } else if (resultados.length === 0) {
            res.status(204).end(); // 204 = Sem conteúdo
        } else {
            res.status(200).json(resultados[0]);
        }
    });
}

// Atualizar todos ou alguns dados de um usuario
async function atualizar(id, usuario, res) {
    if (usuario.tipo && !validarTipo(usuario.tipo)) {
        res.status(400).json({ error: "Tipo de usuário inválido" });
        return;
    }

    // Se a senha for fornecida, criptografe-a
    if (usuario.senha) {
        try {
            const saltRounds = 10;
            usuario.senha = await bcrypt.hash(usuario.senha, saltRounds);
        } catch (erro) {
            res.status(500).json({ error: "Erro ao criptografar a senha" });
            return;
        }
    }

    const sql = "UPDATE usuarios SET ? WHERE id = ?";
    conexao.query(sql, [usuario, id], (erro, resultados) => {
        if (erro) {
            if (erro.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: "Email já existe" });
            } else {
                res.status(400).json(erro.code);
            }
        } else {
            res.status(200).json({ ...usuario, id });
        }
    });
}

// Excluir usuario da base de dados
function excluir(id, res) {
    const sql = "DELETE FROM usuarios WHERE id = ?";

    conexao.query(sql, id, (erro, resultados) => {
        if (erro) {
            res.status(400).json(erro.code);
        } else {
            res.status(200).json({ "Status": "usuario Excluido", id });
        }
    });
}

export { ler, inserir, lerUm, atualizar, excluir };
