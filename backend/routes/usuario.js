// Importar o Express e a conexão com banco de dados
const express = require('express');
const router = express.Router();
const connection = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do upload da foto (configurado uma única vez)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `foto_${Date.now()}${ext}`);
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos de imagem são permitidos!'));
        }
    }
});

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

            // Verificar senha (em produção, use bcrypt)
            if (senha !== usuario.senha) { 
                return res.status(401).json({ mensagem: 'Email ou senha incorretos' });
            }

            // Remover a senha antes de enviar o usuário
            delete usuario.senha;

            res.json({ mensagem: 'Login bem-sucedido', usuario });
        }
    );
});

// Rota de cadastro
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

            // Inserir na tabela Usuario
            connection.query(
                'INSERT INTO Usuario (nome, email, senha) VALUES (?, ?, ?)',
                [nome, email, senha], // Em produção, use hash da senha
                (err, result) => {
                    if (err) {
                        console.error('Erro ao cadastrar usuário:', err);
                        return res.status(500).json({ mensagem: 'Erro ao cadastrar usuário' });
                    }

                    const id_usuario = result.insertId;

                    // Inserir também na tabela Paciente se não for admin
                    if (email !== 'nunescleusa1974@gmail.com') {
                        connection.query(
                            'INSERT INTO Paciente (id_paciente, id_usuario) VALUES (?, ?)',
                            [id_usuario, id_usuario],
                            (err, result) => {
                                if (err) {
                                    console.error('Erro ao cadastrar paciente:', err);
                                    return res.status(500).json({ mensagem: 'Usuário criado mas erro ao registrar como paciente' });
                                }

                                res.status(201).json({ mensagem: 'Cadastro realizado com sucesso!' });
                            }
                        );
                    } else {
                        // Se for o email do admin, inserir na tabela Administrador
                        connection.query(
                            'INSERT INTO Administrador (id_administrador, id_usuario) VALUES (?, ?)',
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

// Rota para buscar perfil do usuário
router.get('/perfil/:id', (req, res) => {
    const { id } = req.params;

    connection.query(
        'SELECT nome, email, telefone, endereco, data_nascimento, foto_perfil FROM Usuario WHERE id_usuario = ?',
        [id],
        (err, results) => {
            if (err) {
                console.error('Erro ao buscar perfil:', err);
                return res.status(500).json({ mensagem: 'Erro ao buscar perfil' });
            }

            if (results.length === 0) {
                return res.status(404).json({ mensagem: 'Usuário não encontrado' });
            }

            res.json(results[0]);
        }
    );
});

// Rota para atualizar perfil do usuário
router.put('/perfil/:id', (req, res) => {
    const { id } = req.params;
    const { nome, telefone, endereco, data_nascimento } = req.body;

    connection.query(
        'UPDATE Usuario SET nome = ?, telefone = ?, endereco = ?, data_nascimento = ? WHERE id_usuario = ?',
        [nome, telefone, endereco, data_nascimento, id],
        (err, result) => {
            if (err) {
                console.error('Erro ao atualizar perfil:', err);
                return res.status(500).json({ mensagem: 'Erro ao atualizar perfil' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ mensagem: 'Usuário não encontrado' });
            }

            res.json({ mensagem: 'Perfil atualizado com sucesso' });
        }
    );
});

// Rota para buscar histórico de fichas/consultas do paciente
router.get('/fichas/:id_usuario', (req, res) => {
    const { id_usuario } = req.params;

    // Buscar fichas de anamnese do paciente
    connection.query(
        `SELECT 
            f.id_ficha, 
            f.data_consulta,
            f.queixa_principal,
            f.observacoes
         FROM Ficha_Anamnese f 
         INNER JOIN Paciente p ON f.id_paciente = p.id_paciente 
         WHERE p.id_usuario = ? 
         ORDER BY f.data_consulta DESC`,
        [id_usuario],
        (err, results) => {
            if (err) {
                console.error('Erro ao buscar fichas:', err);
                return res.status(500).json({ mensagem: 'Erro ao buscar histórico' });
            }

            res.json(results);
        }
    );
});

// Rota para buscar detalhes de uma ficha específica
router.get('/ficha/:id_ficha', (req, res) => {
    const { id_ficha } = req.params;

    connection.query(
        'SELECT * FROM Ficha_Anamnese WHERE id_ficha = ?',
        [id_ficha],
        (err, results) => {
            if (err) {
                console.error('Erro ao buscar ficha:', err);
                return res.status(500).json({ mensagem: 'Erro ao buscar detalhes da consulta' });
            }

            if (results.length === 0) {
                return res.status(404).json({ mensagem: 'Consulta não encontrada' });
            }

            res.json(results[0]);
        }
    );
});

// Rota para buscar dados completos do usuário
router.get('/dados/:id', (req, res) => {
    const { id } = req.params;

    // Primeiro buscar os dados do usuário
    connection.query(
        'SELECT id_usuario, nome, email, telefone, endereco, data_nascimento, foto_perfil FROM Usuario WHERE id_usuario = ?',
        [id],
        (err, userResults) => {
            if (err) {
                console.error('Erro ao buscar usuário:', err);
                return res.status(500).json({ mensagem: 'Erro ao buscar dados do usuário' });
            }

            if (userResults.length === 0) {
                return res.status(404).json({ mensagem: 'Usuário não encontrado' });
            }

            const usuario = userResults[0];

            // Verificar se é paciente
            connection.query(
                'SELECT id_paciente FROM Paciente WHERE id_usuario = ?',
                [id],
                (err, pacienteResults) => {
                    if (err) {
                        console.error('Erro ao verificar paciente:', err);
                        return res.status(500).json({ mensagem: 'Erro ao verificar tipo de usuário' });
                    }

                    if (pacienteResults.length > 0) {
                        // É um paciente
                        usuario.tipo = 'paciente';
                        usuario.id_paciente = pacienteResults[0].id_paciente;
                        return res.json(usuario);
                    }

                    // Verificar se é administrador
                    connection.query(
                        'SELECT id_administrador FROM Administrador WHERE id_usuario = ?',
                        [id],
                        (err, adminResults) => {
                            if (err) {
                                console.error('Erro ao verificar administrador:', err);
                                return res.status(500).json({ mensagem: 'Erro ao verificar tipo de usuário' });
                            }

                            if (adminResults.length > 0) {
                                // É um administrador
                                usuario.tipo = 'admin';
                                usuario.id_administrador = adminResults[0].id_administrador;
                            } else {
                                // Usuário sem tipo específico
                                usuario.tipo = 'usuario';
                            }

                            res.json(usuario);
                        }
                    );
                }
            );
        }
    );
});

// Rota para atualizar perfil do paciente com upload de foto
router.put('/paciente/perfil/:id', upload.single('foto'), (req, res) => {
    const id = req.params.id;
    const { nome, telefone, endereco, data_nascimento } = req.body;
    const foto_perfil = req.file ? `/uploads/${req.file.filename}` : null;

    // Primeiro, atualizar a tabela Usuario
    let sqlUsuario = `
        UPDATE Usuario 
        SET nome = ?, telefone = ?, endereco = ?, data_nascimento = ?
        ${foto_perfil ? ', foto_perfil = ?' : ''}
        WHERE id_usuario = (SELECT id_usuario FROM Paciente WHERE id_paciente = ?)
    `;

    const paramsUsuario = foto_perfil
        ? [nome, telefone, endereco, data_nascimento, foto_perfil, id]
        : [nome, telefone, endereco, data_nascimento, id];

    connection.query(sqlUsuario, paramsUsuario, (err, results) => {
        if (err) {
            console.error('Erro ao atualizar perfil do usuário:', err);
            return res.status(500).json({ mensagem: 'Erro ao atualizar perfil' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Paciente não encontrado' });
        }
        
        res.json({ mensagem: 'Perfil atualizado com sucesso!' });
    });
});

// Rota para buscar dicas
router.get('/dicas', (req, res) => {
    // Verificar se existe tabela Dica no banco
    connection.query(
        'SELECT * FROM Dica ORDER BY id DESC LIMIT 10',
        (err, results) => {
            if (err) {
                console.error('Erro ao buscar dicas da tabela Dica:', err);
                
                // Se não existir tabela Dica, tentar tabela Dicas
                connection.query(
                    'SELECT * FROM Dica ORDER BY id_dica DESC LIMIT 10',
                    (err2, results2) => {
                        if (err2) {
                            console.error('Erro ao buscar dicas da tabela Dicas:', err2);
                            
                            // Se não existir nenhuma tabela, retornar dicas estáticas
                            const dicasEstaticas = [
                                {
                                    id: 1,
                                    titulo: "Hidratação",
                                    descricao: "Beba pelo menos 2 litros de água por dia para manter-se hidratado e auxiliar no funcionamento do organismo."
                                },
                                {
                                    id: 2,
                                    titulo: "Exercícios Regulares",
                                    descricao: "Pratique pelo menos 30 minutos de atividade física por dia para manter a saúde física e mental."
                                },
                                {
                                    id: 3,
                                    titulo: "Alimentação Equilibrada",
                                    descricao: "Mantenha uma dieta rica em frutas, vegetais, grãos integrais e proteínas magras."
                                },
                                {
                                    id: 4,
                                    titulo: "Sono Reparador",
                                    descricao: "Durma de 7 a 8 horas por noite para permitir que seu corpo se recupere adequadamente."
                                },
                                {
                                    id: 5,
                                    titulo: "Gerenciamento do Estresse",
                                    descricao: "Pratique técnicas de relaxamento como meditação, respiração profunda ou yoga."
                                }
                            ];
                            return res.json(dicasEstaticas);
                        }
                        res.json(results2);
                    }
                );
            } else {
                res.json(results);
            }
        }
    );
});

// Middleware de tratamento de erros do multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ mensagem: 'Arquivo muito grande. Máximo 5MB.' });
        }
    }
    if (error.message === 'Apenas arquivos de imagem são permitidos!') {
        return res.status(400).json({ mensagem: error.message });
    }
    next(error);
});

module.exports = router;