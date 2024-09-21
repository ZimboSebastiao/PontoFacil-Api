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

-- Alterar a tabela usuarios para adicionar as novas colunas
ALTER TABLE `usuarios`
ADD COLUMN `empresa` VARCHAR(90);
ADD COLUMN `nacionalidade` VARCHAR(50);
ADD COLUMN `endereco` VARCHAR(85);
ADD COLUMN `cep` VARCHAR(8);
ADD COLUMN `celular` VARCHAR(12);
ADD COLUMN `data-nascimento` VARCHAR(12);

ALTER TABLE 'usuarios' CHANGE `data-nascimento` `data_nascimento` VARCHAR(12);


-- Cria a tabela empresas
CREATE TABLE `empresas` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(90) NOT NULL,
  `endereco` VARCHAR(255),
  `cep` VARCHAR(8),
  `telefone` VARCHAR(15)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- Adiciona a coluna empresa_id à tabela usuarios
ALTER TABLE `usuarios`
ADD COLUMN `empresa_id` INT,
ADD FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`);


INSERT INTO `empresas` (nome, endereco, cep, telefone)
VALUES ('klandula Transportes', 'Rua Exemplo, 123', '12345-678', '11987654321');

UPDATE `empresas` SET `nome` = 'kalandula Transportes' WHERE `empresas`.`id` = 1;
