-- Criar o banco de dados pontofacil
CREATE DATABASE pontofacil;

-- Conectar-se ao banco de dados pontofacil
USE pontofacil;

CREATE TABLE `usuarios` (
  `id` smallint(6) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `nome` varchar(45) NOT NULL,
  `email` varchar(45) NOT NULL UNIQUE,
  `senha` varchar(255) NOT NULL,
  `tipo` enum('admin','funcionario') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


