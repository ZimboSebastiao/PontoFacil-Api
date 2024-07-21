import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware de autenticação
export const autenticar = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Obtém o token do header Authorization

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido.' });
    }

    req.user = decoded; // Adiciona os dados do usuário ao req
    next();
  });
};
