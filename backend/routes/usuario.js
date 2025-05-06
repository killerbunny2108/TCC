// Importar o Express e a conexão com banco de dados
const express = require('express');
const router = express.Router();
const connection = require('../db');

// Rota de login
router.post('/login', (req, res) => {
    const { email, senha } = req.body;

    // Validação básica
    if (!email || !senha) {
        return res.status(400).json({ mensagem: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário pelo email
    connection.query(
        'SELECT * FROM Usuario WHERE email = ?',
        [email],
        (err, results) => {
            if (err) {
                console.error('Erro ao buscar usuário:', err);
                return res.status(500).json({ mensagem: 'Erro ao buscar usuário' });
            }

            if (results.length === 0) {
                return res.status(401).json({ mensagem: 'Email ou senha incorretos' });
            }

            const usuario = results[0];

           
            if (senha !== usuario.senha) { 
                return res.status(401).json({ mensagem: 'Email ou senha incorretos' });
            }

            // Remover a senha antes de enviar o usuário
            delete usuario.senha;

            res.json({ mensagem: 'Login bem-sucedido', usuario });
        }
    );
});

// Rota de cadastro - CORRIGIDA
router.post('/cadastro', (req, res) => {
    const { nome, email, senha } = req.body;

    // Validação básica
    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: 'Nome, email e senha são obrigatórios' });
    }

    // Verificar se o email já existe
    connection.query(
        'SELECT * FROM Usuario WHERE email = ?',
        [email],
        (err, results) => {
            if (err) {
                console.error('Erro ao verificar email:', err);
                return res.status(500).json({ mensagem: 'Erro ao verificar email' });
            }

            if (results.length > 0) {
                return res.status(400).json({ mensagem: 'Este email já está em uso' });
            }

            // Na prática, você deveria usar bcrypt.hash aqui
            // const senhaHash = await bcrypt.hash(senha, 10);

            // Inserir na tabela Usuario
            connection.query(
                'INSERT INTO Usuario (nome, email, senha) VALUES (?, ?, ?)',
                [nome, email, senha], // Use senhaHash no lugar de senha quando implementar bcrypt
                (err, result) => {
                    if (err) {
                        console.error('Erro ao cadastrar usuário:', err);
                        return res.status(500).json({ mensagem: 'Erro ao cadastrar usuário' });
                    }

                    const id_usuario = result.insertId;

                    // CORREÇÃO: Inserir também na tabela Paciente
                    // Somente se não for o email do admin
                    if (email !== 'nunescleusa1974@gmail.com') {
                        connection.query(
                            'INSERT INTO Paciente (id_paciente, id_usuario) VALUES (?, ?)',
                            [id_usuario, id_usuario],
                            (err, result) => {
                                if (err) {
                                    console.error('Erro ao cadastrar paciente:', err);
                                    // Se falhar, ainda mantemos o usuário criado
                                    return res.status(500).json({ mensagem: 'Usuário criado mas erro ao registrar como paciente' });
                                }

                                res.status(201).json({ mensagem: 'Cadastro realizado com sucesso!' });
                            }
                        );
                    } else {
                        // Se for o email do admin, inserir na tabela Administrador
                        connection.query(
                            'INSERT INTO Administrador (id_administrador, is_usuario) VALUES (?, ?)',
                            [id_usuario, id_usuario],
                            (err, result) => {
                                if (err) {
                                    console.error('Erro ao cadastrar administrador:', err);
                                    return res.status(500).json({ mensagem: 'Usuário criado mas erro ao registrar como administrador' });
                                }

                                res.status(201).json({ mensagem: 'Administrador cadastrado com sucesso!' });
                            }
                        );
                    }
                }
            );
        }
    );
});

module.exports = router;