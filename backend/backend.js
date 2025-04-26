const express = require('express');
const app = express();
const cors = require('cors');

// Importando a conexão com o banco de dados
const connection = require('./db');

// Configuração do servidor
app.use(express.json());  // Para parsear JSON
app.use(cors());  // Para permitir requisições de diferentes origens (por exemplo, o frontend)

// Definindo a rota POST para salvar a ficha de anamnese
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

    // Validação simples para garantir que os campos obrigatórios estão preenchidos
    if (!id_administrador || !id_paciente) {
        return res.status(400).json({ mensagem: 'Administrador e Paciente são obrigatórios.' });
    }

    // Query SQL para inserir os dados na tabela FichaPaciente
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

// Rota para buscar os pacientes
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

// Configurando o servidor para escutar na porta 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
