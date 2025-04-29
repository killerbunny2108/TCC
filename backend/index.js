const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Importações
const usuarioRoutes = require('./routes/usuario');
const connection = require('./db'); // Conexão com banco de dados

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Rotas de usuário
app.use('/api/usuario', usuarioRoutes);

// ====================
// Rota para listar pacientes (para o combo box)
// Correção da rota de listar pacientes
app.get('/api/pacientes', (req, res) => {
    connection.query(
        `SELECT p.id_paciente, u.id_usuario, u.nome 
         FROM Paciente p
         JOIN Usuario u ON p.id_paciente = u.id_usuario
         WHERE u.email != "nunescleusa1974@gmail.com"`, 
        (err, results) => {
            if (err) {
                console.error("Erro ao buscar pacientes:", err);
                return res.status(500).json({ mensagem: 'Erro ao buscar pacientes.' });
            }
            console.log("Pacientes encontrados:", results);
            res.json(results);
        }
    );
});


// Rota para salvar ficha de anamnese
app.post('/api/ficha', (req, res) => {
    const {
        id_administrador, // Este é o id_usuario do administrador
        id_paciente,
        tipo_atendimento,
        data_atendimento,
        motivo_consulta,
        relacao_pais,
        fato_marcante,
        incomodo_atual,
        estado_civil,
        filhos,
        profissao,
        fumante,
        consome_alcool,
        acompanhamento_medico,
        doencas,
        medicacoes,
        cirurgias,
        observacoes
    } = req.body;

    // Validação simples
    if (!id_administrador || !id_paciente) {
        return res.status(400).json({ mensagem: 'Administrador e Paciente são obrigatórios.' });
    }

    // Primeiro, verificar se o id_usuario corresponde ao email do administrador
    connection.query(
        'SELECT * FROM Usuario WHERE id_usuario = ? AND email = "nunescleusa1974@gmail.com"',
        [id_administrador],
        (err, results) => {
            if (err) {
                console.error('Erro ao verificar administrador:', err);
                return res.status(500).json({ mensagem: 'Erro ao verificar administrador.' });
            }

            if (results.length === 0) {
                return res.status(400).json({ mensagem: 'Usuário não é um administrador válido.' });
            }

            // Agora, buscar o ID correto na tabela Administrador
            connection.query(
                'SELECT id_administrador FROM Administrador WHERE id_usuario = ?',
                [id_administrador],
                (err, adminResults) => {
                    if (err) {
                        console.error('Erro ao buscar ID de administrador:', err);
                        return res.status(500).json({ mensagem: 'Erro ao buscar ID de administrador.' });
                    }

                    if (adminResults.length === 0) {
                        return res.status(400).json({ mensagem: 'ID de administrador não encontrado.' });
                    }

                    const admin_id = adminResults[0].id_administrador;

                    // Inserir na tabela FichaPaciente com o ID correto
                    connection.query(
                        `INSERT INTO FichaPaciente (
                            id_administrador, 
                            id_paciente, 
                            tipo_atendimento, 
                            data_atendimento, 
                            motivo_consulta, 
                            relacao_pais, 
                            fato_marcante, 
                            incomodo_atual, 
                            estado_civil, 
                            filhos, 
                            profissao, 
                            fumante, 
                            consome_alcool, 
                            acompanhamento_medico, 
                            doencas, 
                            medicacoes, 
                            cirurgias, 
                            observacoes, 
                            data_criacao
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                        [
                            admin_id, // Usando o ID da tabela Administrador
                            id_paciente, 
                            tipo_atendimento, 
                            data_atendimento, 
                            motivo_consulta, 
                            relacao_pais, 
                            fato_marcante, 
                            incomodo_atual, 
                            estado_civil, 
                            filhos, 
                            profissao, 
                            fumante, 
                            consome_alcool, 
                            acompanhamento_medico, 
                            doencas, 
                            medicacoes, 
                            cirurgias, 
                            observacoes
                        ],
                        (err, result) => {
                            if (err) {
                                console.error('Erro ao salvar ficha:', err);
                                return res.status(500).json({ mensagem: 'Erro ao salvar ficha.' });
                            }

                            res.status(201).json({ mensagem: 'Ficha salva com sucesso!' });
                        }
                    );
                }
            );
        }
    );
});

// ====================

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// Rota para salvar uma dica geral
app.post('/api/dicas', (req, res) => {
    const { titulo, descricao } = req.body;

    if (!titulo || !descricao) {
        return res.status(400).json({ mensagem: 'Título e descrição são obrigatórios.' });
    }

    connection.query(
        'INSERT INTO Dica (titulo, descricao) VALUES (?, ?)',
        [titulo, descricao],
        (err, result) => {
            if (err) {
                console.error('Erro ao salvar dica:', err);
                return res.status(500).json({ mensagem: 'Erro ao salvar dica.' });
            }
            res.status(201).json({ mensagem: 'Dica salva com sucesso!' });
        }
    );
});

// Rota para buscar todas as dicas gerais
app.get('/api/dicas', (req, res) => {
    connection.query(
        'SELECT titulo, descricao FROM Dica ORDER BY data_criacao DESC',
        (err, results) => {
            if (err) {
                console.error('Erro ao buscar dicas:', err);
                return res.status(500).json({ mensagem: 'Erro ao buscar dicas.' });
            }
            res.json(results);
        }
    );
});