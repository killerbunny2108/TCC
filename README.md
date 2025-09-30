---Pré-requisitos: Liste todos os softwares, bibliotecas e dependências necessárias para rodar o projeto (ex: versão do Java, Node.js, Python, frameworks específicos, etc.).
*Node.js - versão 14.0 ou superior
*npm - gerenciador de pacotes (incluído com Node.js)
*MySQL - versão 8.0 ou superior
*Navegador Web - Chrome, Firefox, Safari ou Edge (versões atuais)

---Passo a Passo da Instalação: Forneça um guia sequencial de comandos e procedimentos para configurar o ambiente e instalar o projeto a partir do zero.
1. Preparação do Ambiente
    1.1. Clone ou baixe o projeto
        git clone [URL_DO_REPOSITORIO]
        cd "tcc vsc"

#Ou extraia os arquivos para uma pasta chamada "tcc vsc"
    1.2. Instale as dependências do Node.js
        bashnpm init -y
        npm install express mysql2 cors body-parser bcrypt multer path fs
2. Configuração do Banco de Dados
    2.1. Acesse o MySQL
        bashmysql -u root -p
    2.2. Crie o banco de dados e as tabelas necessárias
CREATE DATABASE cleo_nunes;
USE cleo_nunes;

CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100),
    email VARCHAR(100),
    senha VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE administrador (
    id_administrador INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    nome VARCHAR(255),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE paciente (
    id_paciente INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    nome VARCHAR(255),
    telefone VARCHAR(20),
    endereco TEXT,
    data_nascimento DATE,
    foto_perfil VARCHAR(255),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ficha (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_administrador INT,
    titulo VARCHAR(255),
    descricao TEXT,
    data_publicacao TIMESTAMP,
    FOREIGN KEY (id_administrador) REFERENCES administrador(id_administrador)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fichapaciente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_administrador INT,
    id_paciente INT,
    tipo_atendimento TEXT,
    data_atendimento DATE,
    motivo_consulta TEXT,
    relacao_pais TEXT,
    fato_marcante TEXT,
    incomodo_atual TEXT,
    estado_civil TEXT,
    filhos INT,
    profissao TEXT,
    fumante TINYINT(1),
    consome_alcool TINYINT(1),
    acompanhamento_medico TEXT,
    doencas TEXT,
    medicacoes TEXT,
    cirurgias TEXT,
    observacoes TEXT,
    data_criacao TIMESTAMP,
    FOREIGN KEY (id_administrador) REFERENCES administrador(id_administrador),
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    2.3. Insira o usuário administrador
        INSERT INTO usuario (nome, email, senha) 
        VALUES ('Cléo Nunes', 'nunescleusa1974@gmail.com', '1234');

3. Configuração do Servidor Backend
3.1. Crie o arquivo server.js na raiz do projeto com o seguinte conteúdo:server.jsCódigo const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
con3.2. Ajuste a senha do MySQL no código
No arquivo server.js, na linha com a configuração do MySQL, altere o campo password para sua senha do MySQL:
javascriptconst db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root', 
    database: 'cleonunes',
});

---Instruções de Execução: Descreva como iniciar a aplicação/sistema/jogo. Se houver diferentes modos de execução (ex: desenvolvimento e produção), explique ambos.
1. Modo de Desenvolvimento
    1.1. Inicie o servidor backend
        #No terminal, dentro da pasta do projeto
        node server.js

Você deve ver as mensagens:
Conectado ao MySQL!
Servidor rodando em http://localhost:3000
    1.2. Acesse a aplicação
    Abra seu navegador e navegue para:
    http://localhost:3000/inicio.html
    2. Testando o Sistema
    2.1. Acesse a página inicial

URL: http://localhost:3000/inicio.html
Explore as seções sobre a terapeuta e terapias

    2.2. Faça login como administrador

Clique em "Login/Cadastro" no menu
Use as credenciais:

Email: nunescleusa1974@gmail.com
Senha: 1234


Será redirecionado para a área administrativa

2.3. Teste como usuário comum

Na página de login, clique em "Crie uma conta"
Preencha os dados de cadastro
Após cadastrar, faça login
Será redirecionado para a área do cliente

3. Funcionalidades Disponíveis
Área do Administrador (admin.html):

✅ Gerenciar horários (link externo para Calendly)
✅ Criar fichas de anamnese
✅ Visualizar, editar e excluir fichas existentes
✅ Pesquisar fichas por nome do paciente
✅ Criar, editar e excluir dicas personalizadas

Área do Cliente (usuario.html):

✅ Visualizar perfil pessoal
✅ Editar informações do perfil
✅ Upload e edição de foto de perfil
✅ Visualizar dicas personalizadas
✅ Botão para agendamento (em desenvolvimento)
