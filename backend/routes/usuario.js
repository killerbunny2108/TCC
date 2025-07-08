// server.js (ou app.js) - Backend Node.js
const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Configuração do banco de dados
const dbConfig = {
    host: 'localhost',
    user: 'seu_usuario',
    password: 'sua_senha',
    database: 'seu_banco',
    charset: 'utf8mb4'
};

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/perfil';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'perfil-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido. Use apenas JPEG, PNG ou GIF.'));
        }
    }
});

// Função para conectar ao banco
async function conectarBanco() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        return connection;
    } catch (error) {
        console.error('Erro ao conectar ao banco:', error);
        throw error;
    }
}

// ROTAS DA API

// Rota para buscar dados do usuário
app.post('/api/usuario/dados', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email é obrigatório'
            });
        }
        
        const connection = await conectarBanco();
        
        // Buscar dados do usuário na tabela 'usuario'
        const [usuarios] = await connection.execute(
            'SELECT id_usuario, nome, email, senha FROM usuario WHERE email = ?',
            [email]
        );
        
        if (usuarios.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        
        const idUsuario = usuarios[0].id_usuario;
        
        // Construir URL da foto
        const fotoUrl = `/uploads/perfil/${req.file.filename}`;
        
        // Verificar se existe registro na tabela paciente
        const [pacientes] = await connection.execute(
            'SELECT id_paciente, foto_perfil FROM paciente WHERE id_usuario = ?',
            [idUsuario]
        );
        
        if (pacientes.length > 0) {
            // Remover foto anterior se existir
            if (pacientes[0].foto_perfil) {
                const fotoAnterior = path.join(__dirname, 'uploads', 'perfil', path.basename(pacientes[0].foto_perfil));
                if (fs.existsSync(fotoAnterior)) {
                    fs.unlinkSync(fotoAnterior);
                }
            }
            
            // Atualizar foto na tabela paciente
            await connection.execute(
                'UPDATE paciente SET foto_perfil = ? WHERE id_usuario = ?',
                [fotoUrl, idUsuario]
            );
        } else {
            // Inserir novo registro na tabela paciente com foto
            await connection.execute(
                'INSERT INTO paciente (id_usuario, foto_perfil) VALUES (?, ?)',
                [idUsuario, fotoUrl]
            );
        }
        
        await connection.end();
        
        res.json({
            success: true,
            message: 'Foto atualizada com sucesso',
            fotoUrl: fotoUrl
        });
        
    } catch (error) {
        console.error('Erro ao fazer upload da foto:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para login (caso não exista)
app.post('/api/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        if (!email || !senha) {
            return res.status(400).json({
                success: false,
                message: 'Email e senha são obrigatórios'
            });
        }
        
        const connection = await conectarBanco();
        
        // Buscar usuário pelo email
        const [usuarios] = await connection.execute(
            'SELECT id_usuario, nome, email, senha FROM usuario WHERE email = ?',
            [email]
        );
        
        if (usuarios.length === 0) {
            await connection.end();
            return res.status(401).json({
                success: false,
                message: 'Email ou senha incorretos'
            });
        }
        
        const usuario = usuarios[0];
        
        // Verificar senha (em produção, usar bcrypt para hash)
        if (usuario.senha !== senha) {
            await connection.end();
            return res.status(401).json({
                success: false,
                message: 'Email ou senha incorretos'
            });
        }
        
        await connection.end();
        
        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            usuario: {
                id_usuario: usuario.id_usuario,
                nome: usuario.nome,
                email: usuario.email
            }
        });
        
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Middleware para tratamento de erros do Multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Arquivo muito grande. Tamanho máximo: 5MB'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;end();
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        
        const usuario = usuarios[0];
        
        // Buscar dados complementares na tabela 'paciente'
        const [pacientes] = await connection.execute(
            'SELECT nome, telefone, endereco, data_nascimento, foto_perfil FROM paciente WHERE id_usuario = ?',
            [usuario.id_usuario]
        );
        
        let dadosCompletos = {
            id_usuario: usuario.id_usuario,
            email: usuario.email,
            nome: usuario.nome,
            telefone: '',
            endereco: '',
            data_nascimento: null,
            foto_perfil: null
        };
        
        // Se existe registro na tabela paciente, usar esses dados
        if (pacientes.length > 0) {
            const paciente = pacientes[0];
            dadosCompletos = {
                ...dadosCompletos,
                nome: paciente.nome || usuario.nome,
                telefone: paciente.telefone || '',
                endereco: paciente.endereco || '',
                data_nascimento: paciente.data_nascimento,
                foto_perfil: paciente.foto_perfil
            };
        }
        
        await connection.end();
        
        res.json({
            success: true,
            usuario: dadosCompletos
        });
        
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para buscar dicas publicadas pelo administrador
app.get('/api/dicas', async (req, res) => {
    try {
        const connection = await conectarBanco();
        
        const [dicas] = await connection.execute(
            'SELECT id, titulo, descricao, data_publicacao FROM dica ORDER BY data_publicacao DESC'
        );
        
        await connection.end();
        
        res.json({
            success: true,
            dicas: dicas
        });
        
    } catch (error) {
        console.error('Erro ao buscar dicas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para buscar histórico de consultas do usuário
app.post('/api/usuario/historico', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email é obrigatório'
            });
        }
        
        const connection = await conectarBanco();
        
        // Primeiro, buscar o id_usuario pelo email
        const [usuarios] = await connection.execute(
            'SELECT id_usuario FROM usuario WHERE email = ?',
            [email]
        );
        
        if (usuarios.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        
        const idUsuario = usuarios[0].id_usuario;
        
        // Buscar o id_paciente
        const [pacientes] = await connection.execute(
            'SELECT id_paciente FROM paciente WHERE id_usuario = ?',
            [idUsuario]
        );
        
        if (pacientes.length === 0) {
            await connection.end();
            return res.json({
                success: true,
                consultas: []
            });
        }
        
        const idPaciente = pacientes[0].id_paciente;
        
        // Buscar consultas do paciente
        const [consultas] = await connection.execute(
            `SELECT 
                id, 
                tipo_atendimento, 
                data_atendimento, 
                motivo_consulta 
            FROM fichapaciente 
            WHERE id_paciente = ? 
            ORDER BY data_atendimento DESC`,
            [idPaciente]
        );
        
        await connection.end();
        
        res.json({
            success: true,
            consultas: consultas
        });
        
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para buscar detalhes de uma consulta específica
app.get('/api/consulta/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const connection = await conectarBanco();
        
        const [consultas] = await connection.execute(
            `SELECT 
                id, 
                tipo_atendimento, 
                data_atendimento, 
                motivo_consulta 
            FROM fichapaciente 
            WHERE id = ?`,
            [id]
        );
        
        await connection.end();
        
        if (consultas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Consulta não encontrada'
            });
        }
        
        res.json({
            success: true,
            consulta: consultas[0]
        });
        
    } catch (error) {
        console.error('Erro ao buscar detalhes da consulta:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para atualizar dados do usuário
app.put('/api/usuario/atualizar', async (req, res) => {
    try {
        const { email, nome, telefone, endereco, data_nascimento } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email é obrigatório'
            });
        }
        
        const connection = await conectarBanco();
        
        // Buscar o id_usuario pelo email
        const [usuarios] = await connection.execute(
            'SELECT id_usuario FROM usuario WHERE email = ?',
            [email]
        );
        
        if (usuarios.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        
        const idUsuario = usuarios[0].id_usuario;
        
        // Atualizar nome na tabela usuario
        await connection.execute(
            'UPDATE usuario SET nome = ? WHERE id_usuario = ?',
            [nome, idUsuario]
        );
        
        // Verificar se existe registro na tabela paciente
        const [pacientes] = await connection.execute(
            'SELECT id_paciente FROM paciente WHERE id_usuario = ?',
            [idUsuario]
        );
        
        if (pacientes.length > 0) {
            // Atualizar dados existentes na tabela paciente
            await connection.execute(
                'UPDATE paciente SET nome = ?, telefone = ?, endereco = ?, data_nascimento = ? WHERE id_usuario = ?',
                [nome, telefone, endereco, data_nascimento || null, idUsuario]
            );
        } else {
            // Inserir novo registro na tabela paciente
            await connection.execute(
                'INSERT INTO paciente (id_usuario, nome, telefone, endereco, data_nascimento) VALUES (?, ?, ?, ?, ?)',
                [idUsuario, nome, telefone, endereco, data_nascimento || null]
            );
        }
        
        await connection.end();
        
        res.json({
            success: true,
            message: 'Dados atualizados com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao atualizar dados:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para upload de foto de perfil
app.post('/api/usuario/foto', upload.single('foto'), async (req, res) => {
    try {
        const { email } = req.body;
        
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
        
        const connection = await conectarBanco();
        
        // Buscar o id_usuario pelo email
        const [usuarios] = await connection.execute(
            'SELECT id_usuario FROM usuario WHERE email = ?',
            [email]
        );
        
        if (usuarios.length === 0) {
            await connection.