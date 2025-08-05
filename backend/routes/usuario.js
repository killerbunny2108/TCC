const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const connection = require('../db');

<<<<<<< HEAD
// Configuração do banco de dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'cleo_nunes'
});

// ================================
// ROTAS DE AUTENTICAÇÃO
// ================================

// Rota para login
=======
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

// Rota de login - CORRIGIDA
>>>>>>> c1732a4f2711ac4775c21dc5f36b143c857ff992
router.post('/login', (req, res) => {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
<<<<<<< HEAD
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
    
    db.query(query, [email], (err, results) => {
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

// Rota para cadastro
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
    
    db.query(checkEmailQuery, [email], (err, results) => {
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
        db.beginTransaction((err) => {
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
            
            db.query(insertUserQuery, [nome, email, senha], (err, result) => {
                if (err) {
                    return db.rollback(() => {
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
                
                db.query(insertPacienteQuery, [id_usuario, nome, telefone, endereco, data_nascimento], (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Erro ao inserir paciente:', err);
                            res.status(500).json({ 
                                success: false, 
                                message: 'Erro ao criar perfil do paciente' 
                            });
                        });
                    }
                    
                    // Commit da transação
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
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
// ROTAS EXISTENTES (mantidas)
// ================================
=======
        return res.status(400).json({ mensagem: 'Email e senha são obrigatórios.' });
    }
    
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
            
            connection.query(
                'INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)',
                [nome, email, senha],
                (err, result) => {
                    if (err) {
                        console.error('Erro ao cadastrar usuário:', err);
                        return res.status(500).json({ mensagem: 'Erro ao cadastrar usuário.' });
                    }
                    
                    const userId = result.insertId;
                    
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
>>>>>>> c1732a4f2711ac4775c21dc5f36b143c857ff992

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

// Rota para servir arquivos de imagem - MOVIDA PARA CIMA
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rota para servir imagem placeholder
router.get('/images/user-placeholder.jpg', (req, res) => {
    const placeholderPath = path.join(__dirname, '../public/images/user-placeholder.jpg');
    
    // Se não existir, cria uma imagem placeholder simples
    if (!fs.existsSync(placeholderPath)) {
        const dir = path.dirname(placeholderPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Retorna uma resposta SVG simples como placeholder
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

// CORRIGIDO: Rota para buscar perfil do usuário - Aceita GET e POST
router.get('/perfil/:email', (req, res) => {
    const { email } = req.params;
    buscarPerfilUsuario(email, res);
});

<<<<<<< HEAD
// Rota para buscar perfil do usuário
=======
>>>>>>> c1732a4f2711ac4775c21dc5f36b143c857ff992
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
        delete usuario.senha;
        
        console.log('Dados do usuário encontrados:', usuario);
        
        res.json({
            success: true,
            ...usuario
        });
    });
}

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
                        pacienteQuery = `
                            UPDATE paciente 
                            SET telefone = ?, endereco = ?, data_nascimento = ?
                            WHERE id_usuario = ?
                        `;
                        pacienteParams = [telefone, endereco, data_nascimento, id_usuario];
                    } else {
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

// Middleware para tratamento de erros
router.use((err, req, res, next) => {
    console.error('Erro na rota:', err);
    
    // Tratamento específico para erros do multer
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false, 
                message: 'Arquivo muito grande. Tamanho máximo: 5MB' 
            });
        }
    }
    
    // Tratamento para erro de tipo de arquivo
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