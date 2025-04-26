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
app.get('/api/pacientes', (req, res) => {
    connection.query(
        'SELECT id_usuario, nome FROM Usuario WHERE email != "nunescleusa1974@gmail.com"',
        (err, results) => {
            if (err) {
                console.error("Erro ao buscar pacientes:", err);
                return res.status(500).json({ mensagem: 'Erro ao buscar pacientes.' });
            }
            res.json(results);
        }
    );
});

// ====================
// Rota para salvar ficha de anamnese
app.post('/api/ficha', (req, res) => {
    const {
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
        observacoes
    } = req.body;

    // Validação simples
    if (!id_administrador || !id_paciente) {
        return res.status(400).json({ mensagem: 'Administrador e Paciente são obrigatórios.' });
    }

    // Inserir na tabela FichaPaciente
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
});

// ====================

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
