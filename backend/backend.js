// Importando os módulos necessários
const express = require('express');
const app = express();
const mysql = require('mysql2');
const cors = require('cors');

// Configuração do servidor
app.use(express.json());  // Para parsear JSON
app.use(cors());  // Para permitir requisições de diferentes origens (por exemplo, o frontend)

// Conexão com o MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'cleo_nunes'  // Substitua pelo seu nome de banco de dados
});

connection.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
    } else {
        console.log('Conectado ao MySQL!');
    }
});

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

// Configurando o servidor para escutar na porta 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
app.get('/api/pacientes', (req, res) => {
    connection.query(
        'SELECT id_usuario, nome FROM Usuario WHERE email != "nunescleusa1974@gmail.com"',
        (err, results) => {
            if (err) {
                console.error("Erro ao buscar pacientes:", err);
                return res.status(500).json({ mensagem: 'Erro ao buscar pacientes.' });
            }
            console.log(results);  // Verifique os resultados no console
            res.json(results);
        }
    );
});
