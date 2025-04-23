const express = require('express');
const router = express.Router();
const db = require('../db');

// Rota de cadastro
router.post('/cadastro', (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: 'Dados incompletos' });
    }

    const sql = 'INSERT INTO Usuario (nome, email, senha) VALUES (?, ?, ?)';
    db.query(sql, [nome, email, senha], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensagem: 'Erro ao cadastrar usuário' });
        }
        res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso' });
    });
});

// Rota de login
router.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ mensagem: 'Email e senha obrigatórios' });
    }

    const sql = 'SELECT * FROM Usuario WHERE email = ? AND senha = ?';
    db.query(sql, [email, senha], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensagem: 'Erro ao realizar login' });
        }

        if (results.length > 0) {
            res.status(200).json({ mensagem: 'Login bem-sucedido', usuario: results[0] });
        } else {
            res.status(401).json({ mensagem: 'Email ou senha inválidos' });
        }
    });
});

module.exports = router;
