const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const connection = require('../db');

// Middleware para logging de requisições
router.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Body:`, req.body);
    next();
});

// Middleware para CORS
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// ================================
// ROTAS DE AUTENTICAÇÃO
// ================================

// Rota de login
router.post('/login', (req, res) => {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email e senha são obrigatórios' 
        });
    }
    
    // Buscar usuário no banco
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
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciais inválidas' 
            });
        }
        
        const usuario = results[0];
        
        // Verificar senha (em produção, use bcrypt)
        if (usuario.senha !== senha) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciais inválidas' 
            });
        }
        
        // Verificar se é administrador
        const isAdmin = email === 'nunescleusa1974@gmail.com';
        
        // Remover senha da resposta
        delete usuario.senha;
        
        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            user: {
                ...usuario,
                is_admin: isAdmin
            }
        });
    });
});

// Rota de cadastro
router.post('/cadastro', (req, res) => {
    const { nome, email, senha, telefone, endereco, data_nascimento } = req.body;
    
    if (!nome || !email || !senha) {
        return res.status(400).json({ 
            success: false, 
            message: 'Nome, email e senha são obrigatórios' 
        });
    }
    
    // Verificar se o email já existe
    const checkEmailQuery = 'SELECT id_usuario FROM usuario WHERE email = ?';
    
    connection.query(checkEmailQuery, [email], (err, results) => {
        if (err) {
            console.error('Erro ao verificar email:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Este email já está cadastrado' 
            });
        }
        
        // Iniciar transação
        connection.beginTransaction((err) => {
            if (err) {
                console.error('Erro ao iniciar transação:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro interno do servidor' 
                });
            }
            
            // Inserir usuário
            const insertUserQuery = `
                INSERT INTO usuario (nome, email, senha) 
                VALUES (?, ?, ?)
            `;
            
            connection.query(insertUserQuery, [nome, email, senha], (err, result) => {
                if (err) {
                    return connection.rollback(() => {
                        console.error('Erro ao inserir usuário:', err);
                        res.status(500).json({ 
                            success: false, 
                            message: 'Erro ao criar usuário' 
                        });
                    });
                }
                
                const id_usuario = result.insertId;
                
                // Inserir paciente
                const insertPacienteQuery = `
                    INSERT INTO paciente (id_usuario, nome, telefone, endereco, data_nascimento)
                    VALUES (?, ?, ?, ?, ?)
                `;
                
                connection.query(insertPacienteQuery, [id_usuario, nome, telefone, endereco, data_nascimento], (err, result) => {
                    if (err) {
                        return connection.rollback(() => {
                            console.error('Erro ao inserir paciente:', err);
                            res.status(500).json({ 
                                success: false, 
                                message: 'Erro ao criar perfil do paciente' 
                            });
                        });
                    }
                    
                    // Commit da transação
                    connection.commit((err) => {
                        if (err) {
                            return connection.rollback(() => {
                                console.error('Erro ao fazer commit:', err);
                                res.status(500).json({ 
                                    success: false, 
                                    message: 'Erro ao salvar cadastro' 
                                });
                            });
                        }
                        
                        res.status(201).json({
                            success: true,
                            message: 'Cadastro realizado com sucesso',
                            user: {
                                id_usuario: id_usuario,
                                nome: nome,
                                email: email,
                                is_admin: false
                            }
                        });
                    });
                });
            });
        });
    });
});

// ================================
// CONFIGURAÇÃO DE UPLOAD DE FOTOS
// ================================

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

// Rota para servir arquivos de imagem
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rota para servir imagem placeholder
router.get('/images/user-placeholder.jpg', (req, res) => {
    const placeholderPath = path.join(__dirname, '../public/images/user-placeholder.jpg');
    
    if (!fs.existsSync(placeholderPath)) {
        const dir = path.dirname(placeholderPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(`
            <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
                <rect width="150" height="150" fill="#f0f0f0"/>
                <circle cx="75" cy="60" r="25" fill="#ccc"/>
                <path d="M30 120 Q30 100 75 100 Q120 100 120 120 L120 150 L30 150 Z" fill="#ccc"/>
                <text x="75" y="140" text-anchor="middle" fill="#666" font-size="12">Usuário</text>
            </svg>
        `);
    } else {
        res.sendFile(placeholderPath);
    }
});

// ================================
// ROTAS DE PERFIL DO USUÁRIO
// ================================

// Função auxiliar para buscar perfil
function buscarPerfilUsuario(email, res) {
    console.log('Buscando perfil para email:', email);
    
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email é obrigatório' 
        });
    }
    
    const query = `
        SELECT u.id_usuario, u.nome, u.email,
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
        
        console.log('Dados do usuário encontrados:', usuario);
        
        res.json({
            success: true,
            ...usuario
        });
    });
}

// Rota GET para buscar perfil do usuário
router.get('/perfil/:email', (req, res) => {
    const { email } = req.params;
    buscarPerfilUsuario(email, res);
});

// Rota POST para buscar perfil do usuário
router.post('/perfil', (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email é obrigatório no corpo da requisição' 
        });
    }
    
    buscarPerfilUsuario(email, res);
});

// Rota para atualizar perfil do usuário
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
        
        // Atualizar usuário
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
            
            // Buscar ID do usuário
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
                
                // Verificar se paciente existe
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
                        // Atualizar paciente existente
                        pacienteQuery = `
                            UPDATE paciente 
                            SET nome = ?, telefone = ?, endereco = ?, data_nascimento = ?
                            WHERE id_usuario = ?
                        `;
                        pacienteParams = [nome, telefone, endereco, data_nascimento, id_usuario];
                    } else {
                        // Inserir novo paciente
                        pacienteQuery = `
                            INSERT INTO paciente (id_usuario, nome, telefone, endereco, data_nascimento)
                            VALUES (?, ?, ?, ?, ?)
                        `;
                        pacienteParams = [id_usuario, nome, telefone, endereco, data_nascimento];
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

// ================================
// ROTAS DE UPLOAD DE FOTO
// ================================

// Rota para upload de foto de perfil
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
                        
                        // Remover foto anterior se existir
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

// ================================
// OUTRAS ROTAS
// ================================

// Rota para buscar dicas
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

// Rota para agendar consulta
router.post('/agendar', (req, res) => {
    const { email, tipo_atendimento, data_atendimento, motivo_consulta } = req.body;
    
    if (!email || !tipo_atendimento || !data_atendimento) {
        return res.status(400).json({ 
            success: false, 
            message: 'Campos obrigatórios não preenchidos' 
        });
    }
    
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

// ================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// ================================

router.use((err, req, res, next) => {
    console.error('Erro na rota:', err);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false, 
                message: 'Arquivo muito grande. Tamanho máximo: 5MB' 
            });
        }
    }
    
    if (err.message === 'Apenas arquivos de imagem são permitidos') {
        return res.status(400).json({ 
            success: false, 
            message: err.message 
        });
    }
    
    res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
    });
});

module.exports = router;