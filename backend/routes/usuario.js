const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const connection = require('../db');

// Rota de login - CORRIGIDA
router.post('/login', (req, res) => {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
        return res.status(400).json({ mensagem: 'Email e senha são obrigatórios.' });
    }
    
    // CORRIGIDO: nome da tabela para minúsculo
    connection.query(
        'SELECT * FROM usuario WHERE email = ? AND senha = ?',
        [email, senha],
        (err, results) => {
            if (err) {
                console.error('Erro ao fazer login:', err);
                return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
            }
            
            if (results.length === 0) {
                return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
            }
            
            const usuario = results[0];
            // Remover senha antes de enviar
            delete usuario.senha;
            
            res.json({ 
                sucesso: true, 
                usuario: usuario,
                mensagem: 'Login realizado com sucesso!' 
            });
        }
    );
});

// Rota de cadastro - CORRIGIDA
router.post('/cadastro', (req, res) => {
    const { nome, email, senha } = req.body;
    
    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: 'Nome, email e senha são obrigatórios.' });
    }
    
    // CORRIGIDO: nome da tabela para minúsculo
    connection.query(
        'SELECT * FROM usuario WHERE email = ?',
        [email],
        (err, results) => {
            if (err) {
                console.error('Erro ao verificar usuário:', err);
                return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
            }
            
            if (results.length > 0) {
                return res.status(409).json({ mensagem: 'Usuário já existe.' });
            }
            
            // CORRIGIDO: nome da tabela para minúsculo
            connection.query(
                'INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)',
                [nome, email, senha],
                (err, result) => {
                    if (err) {
                        console.error('Erro ao cadastrar usuário:', err);
                        return res.status(500).json({ mensagem: 'Erro ao cadastrar usuário.' });
                    }
                    
                    const userId = result.insertId;
                    
                    // CORRIGIDO: nome da tabela para minúsculo
                    connection.query(
                        'INSERT INTO paciente (id_usuario) VALUES (?)',
                        [userId],
                        (err, result) => {
                            if (err) {
                                console.error('Erro ao criar paciente:', err);
                            }
                        }
                    );
                    
                    res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
                }
            );
        }
    );
});

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/fotos_perfil');
        
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `foto_perfil_${uniqueSuffix}${extension}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos de imagem são permitidos'));
        }
    }
});

// Rota para upload de foto de perfil - CORRIGIDA
router.post('/upload-foto', upload.single('foto'), (req, res) => {
    const { email } = req.body;
    
    console.log('Upload foto - Email:', email);
    console.log('Upload foto - File:', req.file);
    
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email é obrigatório' 
        });
    }
    
    if (!req.file) {
        return res.status(400).json({ 
            success: false, 
            message: 'Nenhuma imagem foi enviada' 
        });
    }
    
    const caminhoFoto = `/uploads/fotos_perfil/${req.file.filename}`;
    
    connection.beginTransaction((err) => {
        if (err) {
            console.error('Erro ao iniciar transação:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }
        
        // CORRIGIDO: nome da tabela para minúsculo
        const getUserIdQuery = 'SELECT id_usuario FROM usuario WHERE email = ?';
        
        connection.query(getUserIdQuery, [email], (err, userResult) => {
            if (err || userResult.length === 0) {
                return connection.rollback(() => {
                    console.error('Erro ao buscar usuário:', err);
                    res.status(404).json({ 
                        success: false, 
                        message: 'Usuário não encontrado' 
                    });
                });
            }
            
            const id_usuario = userResult[0].id_usuario;
            
            // CORRIGIDO: nome da tabela para minúsculo
            const checkPacienteQuery = 'SELECT id_paciente, foto_perfil FROM paciente WHERE id_usuario = ?';
            
            connection.query(checkPacienteQuery, [id_usuario], (err, pacienteResult) => {
                if (err) {
                    return connection.rollback(() => {
                        console.error('Erro ao verificar paciente:', err);
                        res.status(500).json({ 
                            success: false, 
                            message: 'Erro ao verificar paciente' 
                        });
                    });
                }
                
                let pacienteQuery;
                let pacienteParams;
                let fotoAnterior = null;
                
                if (pacienteResult.length > 0) {
                    fotoAnterior = pacienteResult[0].foto_perfil;
                    pacienteQuery = 'UPDATE paciente SET foto_perfil = ? WHERE id_usuario = ?';
                    pacienteParams = [caminhoFoto, id_usuario];
                } else {
                    pacienteQuery = 'INSERT INTO paciente (id_usuario, foto_perfil) VALUES (?, ?)';
                    pacienteParams = [id_usuario, caminhoFoto];
                }
                
                connection.query(pacienteQuery, pacienteParams, (err, result) => {
                    if (err) {
                        return connection.rollback(() => {
                            console.error('Erro ao salvar foto:', err);
                            res.status(500).json({ 
                                success: false, 
                                message: 'Erro ao salvar foto de perfil' 
                            });
                        });
                    }
                    
                    connection.commit((err) => {
                        if (err) {
                            return connection.rollback(() => {
                                console.error('Erro ao fazer commit:', err);
                                res.status(500).json({ 
                                    success: false, 
                                    message: 'Erro ao salvar alterações' 
                                });
                            });
                        }
                        
                        if (fotoAnterior) {
                            const caminhoFotoAnterior = path.join(__dirname, '..', fotoAnterior);
                            if (fs.existsSync(caminhoFotoAnterior)) {
                                fs.unlink(caminhoFotoAnterior, (err) => {
                                    if (err) {
                                        console.error('Erro ao remover foto anterior:', err);
                                    }
                                });
                            }
                        }
                        
                        res.json({
                            success: true,
                            message: 'Foto de perfil atualizada com sucesso',
                            foto_perfil: caminhoFoto
                        });
                    });
                });
            });
        });
    });
});

// Rota para servir arquivos de imagem
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rota para buscar perfil do usuário - CORRIGIDA
router.post('/perfil', (req, res) => {
    const { email } = req.body;
    
    console.log('Buscando perfil para email:', email);
    
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email é obrigatório' 
        });
    }
    
    // CORRIGIDO: nome das tabelas para minúsculo
    const query = `
        SELECT u.id_usuario, u.nome, u.email, u.senha, 
               p.telefone, p.endereco, p.data_nascimento, p.foto_perfil
        FROM usuario u
        LEFT JOIN paciente p ON u.id_usuario = p.id_usuario
        WHERE u.email = ?
    `;
    
    connection.query(query, [email], (err, results) => {
        if (err) {
            console.error('Erro ao buscar usuário:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuário não encontrado' 
            });
        }
        
        const usuario = results[0];
        
        // Remover senha da resposta
        delete usuario.senha;
        
        console.log('Dados do usuário encontrados:', usuario);
        
        res.json({
            success: true,
            ...usuario
        });
    });
});

// Rota para atualizar perfil do usuário - CORRIGIDA
router.put('/atualizar', (req, res) => {
    const { email, nome, telefone, endereco, data_nascimento } = req.body;
    
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email é obrigatório' 
        });
    }
    
    connection.beginTransaction((err) => {
        if (err) {
            console.error('Erro ao iniciar transação:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }
        
        // CORRIGIDO: nome da tabela para minúsculo
        const updateUsuarioQuery = 'UPDATE usuario SET nome = ? WHERE email = ?';
        
        connection.query(updateUsuarioQuery, [nome, email], (err, result) => {
            if (err) {
                return connection.rollback(() => {
                    console.error('Erro ao atualizar usuário:', err);
                    res.status(500).json({ 
                        success: false, 
                        message: 'Erro ao atualizar usuário' 
                    });
                });
            }
            
            // CORRIGIDO: nome da tabela para minúsculo
            const getUserIdQuery = 'SELECT id_usuario FROM usuario WHERE email = ?';
            
            connection.query(getUserIdQuery, [email], (err, userResult) => {
                if (err || userResult.length === 0) {
                    return connection.rollback(() => {
                        console.error('Erro ao buscar ID do usuário:', err);
                        res.status(500).json({ 
                            success: false, 
                            message: 'Erro ao buscar usuário' 
                        });
                    });
                }
                
                const id_usuario = userResult[0].id_usuario;
                
                // CORRIGIDO: nome da tabela para minúsculo
                const checkPacienteQuery = 'SELECT id_paciente FROM paciente WHERE id_usuario = ?';
                
                connection.query(checkPacienteQuery, [id_usuario], (err, pacienteResult) => {
                    if (err) {
                        return connection.rollback(() => {
                            console.error('Erro ao verificar paciente:', err);
                            res.status(500).json({ 
                                success: false, 
                                message: 'Erro ao verificar paciente' 
                            });
                        });
                    }
                    
                    let pacienteQuery;
                    let pacienteParams;
                    
                    if (pacienteResult.length > 0) {
                        // CORRIGIDO: nome da tabela para minúsculo
                        pacienteQuery = `
                            UPDATE paciente 
                            SET telefone = ?, endereco = ?, data_nascimento = ?
                            WHERE id_usuario = ?
                        `;
                        pacienteParams = [telefone, endereco, data_nascimento, id_usuario];
                    } else {
                        // CORRIGIDO: nome da tabela para minúsculo
                        pacienteQuery = `
                            INSERT INTO paciente (id_usuario, telefone, endereco, data_nascimento)
                            VALUES (?, ?, ?, ?)
                        `;
                        pacienteParams = [id_usuario, telefone, endereco, data_nascimento];
                    }
                    
                    connection.query(pacienteQuery, pacienteParams, (err, result) => {
                        if (err) {
                            return connection.rollback(() => {
                                console.error('Erro ao atualizar paciente:', err);
                                res.status(500).json({ 
                                    success: false, 
                                    message: 'Erro ao atualizar dados do paciente' 
                                });
                            });
                        }
                        
                        connection.commit((err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    console.error('Erro ao fazer commit:', err);
                                    res.status(500).json({ 
                                        success: false, 
                                        message: 'Erro ao salvar alterações' 
                                    });
                                });
                            }
                            
                            res.json({
                                success: true,
                                message: 'Perfil atualizado com sucesso'
                            });
                        });
                    });
                });
            });
        });
    });
});

// Rota para buscar dicas - CORRIGIDA
router.get('/dicas', (req, res) => {
    const query = `
        SELECT d.id, d.titulo, d.descricao, d.data_publicacao, a.nome as autor
        FROM dica d
        LEFT JOIN administrador a ON d.id_administrador = a.id_administrador
        ORDER BY d.data_publicacao DESC
    `;
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar dicas:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar dicas' 
            });
        }
        
        res.json(results);
    });
});

// Rota para agendar consulta - CORRIGIDA
router.post('/agendar', (req, res) => {
    const { email, tipo_atendimento, data_atendimento, motivo_consulta } = req.body;
    
    if (!email || !tipo_atendimento || !data_atendimento) {
        return res.status(400).json({ 
            success: false, 
            message: 'Campos obrigatórios não preenchidos' 
        });
    }
    
    // CORRIGIDO: nome da tabela para minúsculo
    const getUserIdQuery = 'SELECT id_usuario FROM usuario WHERE email = ?';
    
    connection.query(getUserIdQuery, [email], (err, userResult) => {
        if (err) {
            console.error('Erro ao buscar usuário:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }
        
        if (userResult.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuário não encontrado' 
            });
        }
        
        const id_usuario = userResult[0].id_usuario;
        
        // CORRIGIDO: nome da tabela para minúsculo
        const getPacienteIdQuery = 'SELECT id_paciente FROM paciente WHERE id_usuario = ?';
        
        connection.query(getPacienteIdQuery, [id_usuario], (err, pacienteResult) => {
            if (err) {
                console.error('Erro ao buscar paciente:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao buscar paciente' 
                });
            }
            
            if (pacienteResult.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Paciente não encontrado' 
                });
            }
            
            const id_paciente = pacienteResult[0].id_paciente;
            
            // CORRIGIDO: nome da tabela para minúsculo
            const insertQuery = `
                INSERT INTO fichapaciente (id_paciente, tipo_atendimento, data_atendimento, motivo_consulta)
                VALUES (?, ?, ?, ?)
            `;
            
            connection.query(insertQuery, [id_paciente, tipo_atendimento, data_atendimento, motivo_consulta], (err, result) => {
                if (err) {
                    console.error('Erro ao agendar consulta:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Erro ao agendar consulta' 
                    });
                }
                
                res.json({
                    success: true,
                    message: 'Consulta agendada com sucesso',
                    id_agendamento: result.insertId
                });
            });
        });
    });
});

module.exports = router;