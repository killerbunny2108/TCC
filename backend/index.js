const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const usuarioRoutes = require('./routes/usuario');
const connection = require('./db'); // <-- Adiciona esta linha

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/api/usuario', usuarioRoutes);

// Rota para listar pacientes (todos os usuários exceto o administrador)
// index.js
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


app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
