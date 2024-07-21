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


CREATE TABLE `registros` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` SMALLINT NOT NULL,
  `tipo_registro` ENUM('entrada', 'intervalo', 'fim_intervalo', 'saida') NOT NULL,
  `data_hora` DATETIME NOT NULL,
  `localizacao` VARCHAR(255) NULL,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Conectar-se ao banco de dados pontofacil
USE pontofacil;

-- Alterar a tabela usuarios para adicionar as novas colunas
ALTER TABLE `usuarios`
ADD COLUMN `data_criacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN `funcao` VARCHAR(45);
