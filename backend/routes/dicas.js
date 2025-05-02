const express = require('express');
const router = express.Router();
const connection = require('../db');

// Listar dicas
router.get('/api/dicas', (req, res) => {
    connection.query(
        'SELECT id, titulo, descricao, data_publicacao FROM dica ORDER BY data_publicacao DESC',
        (err, results) => {
            if (err) {
                console.error('Erro ao buscar dicas:', err);
                return res.status(500).json({ mensagem: 'Erro ao buscar dicas.' });
            }
            res.json(results);
        }
    );
});

// Criar dica
router.post('/api/dicas', (req, res) => {
    const { titulo, descricao } = req.body;

    if (!titulo || !descricao) {
        return res.status(400).json({ mensagem: 'Título e descrição são obrigatórios.' });
    }

    connection.query(
        'INSERT INTO dica (titulo, descricao, data_publicacao) VALUES (?, ?, NOW())',
        [titulo, descricao],
        (err, result) => {
            if (err) {
                console.error('Erro ao salvar dica:', err);
                return res.status(500).json({ mensagem: 'Erro ao salvar dica.' });
            }
            res.status(201).json({ 
                mensagem: 'Dica salva com sucesso!',
                id: result.insertId 
            });
        }
    );
});
3
// Atualizar dica
router.put('/api/dicas/:id', (req, res) => {
    const { id } = req.params;
    const { titulo, descricao } = req.body;

    if (!titulo || !descricao) {
        return res.status(400).json({ mensagem: 'Título e descrição são obrigatórios.' });
    }

    connection.query(
        'UPDATE dica SET titulo = ?, descricao = ? WHERE id = ?',
        [titulo, descricao, id],
        (err, result) => {
            if (err) {
                console.error('Erro ao atualizar dica:', err);
                return res.status(500).json({ mensagem: 'Erro ao atualizar dica.' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ mensagem: 'Dica não encontrada.' });
            }
            
            res.json({ mensagem: 'Dica atualizada com sucesso!' });
        }
    );
});

// Excluir dica
router.delete('/api/dicas/:id', (req, res) => {
    const { id } = req.params;
    
    connection.query(
        'DELETE FROM dica WHERE id = ?',
        [id],
        (err, result) => {
            if (err) {
                console.error('Erro ao excluir dica:', err);
                return res.status(500).json({ mensagem: 'Erro ao excluir dica.' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ mensagem: 'Dica não encontrada.' });
            }
            
            res.json({ mensagem: 'Dica excluída com sucesso!' });
        }
    );
});

module.exports = router;

// Script para gestão de dicas
let editandoDicaId = null;

// Função para carregar todas as dicas
async function carregarDicas() {
  try {
    const response = await fetch('http://localhost:3000/api/dicas');
    if (!response.ok) {
      throw new Error('Erro ao recuperar dicas do servidor');
    }
    
    const dicas = await response.json();
    const container = document.getElementById('lista-dicas');
    container.innerHTML = '';

    if (dicas.length === 0) {
      container.innerHTML = '<p>Nenhuma dica cadastrada.</p>';
      return;
    }

    dicas.forEach(dica => {
      const div = document.createElement('div');
      div.className = 'card dica-item';
      div.innerHTML = `
        <h3>${dica.titulo}</h3>
        <p>${dica.descricao}</p>
        <div class="dica-actions">
          <button class="edit-btn" onclick="iniciarEdicaoDica(${dica.id}, '${dica.titulo.replace(/'/g, "\\'")}', '${dica.descricao.replace(/'/g, "\\'")}')">Editar</button>
          <button class="delete-btn" onclick="excluirDica(${dica.id})">Excluir</button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Erro ao carregar dicas:', error);
    alert('Não foi possível carregar as dicas. Verifique o console para mais detalhes.');
  }
}

