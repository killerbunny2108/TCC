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

// Função para criar uma nova dica
async function criarDica() {
  const titulo = document.getElementById('titulo').value.trim();
  const descricao = document.getElementById('descricao').value.trim();

  if (!titulo || !descricao) {
    alert('Preencha todos os campos.');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/dicas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, descricao })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.mensagem || 'Erro ao criar dica');
    }

    const result = await response.json();
    alert(result.mensagem || 'Dica criada com sucesso!');
    
    // Limpar formulário
    document.getElementById('titulo').value = '';
    document.getElementById('descricao').value = '';
    
    // Atualizar o botão para modo de criação
    const botao = document.getElementById('btnDica');
    botao.textContent = 'Criar Dica';
    botao.onclick = criarDica;
    editandoDicaId = null;
    
    // Recarregar a lista de dicas
    carregarDicas();
  } catch (error) {
    console.error('Erro ao criar dica:', error);
    alert(error.message || 'Erro ao conectar com o servidor.');
  }
}

// Função para iniciar a edição de uma dica
function iniciarEdicaoDica(id, titulo, descricao) {
  // Preencher o formulário com os dados da dica
  document.getElementById('titulo').value = titulo;
  document.getElementById('descricao').value = descricao;
  
  // Guardar o ID da dica que está sendo editada
  editandoDicaId = id;
  
  // Mudar o botão para modo de edição
  const botao = document.getElementById('btnDica');
  botao.textContent = 'Salvar Alterações';
  botao.onclick = salvarEdicaoDica;
  
  // Rolar até o formulário
  document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
}

// Função para salvar a edição de uma dica
async function salvarEdicaoDica() {
  if (!editandoDicaId) {
    alert('Erro: ID da dica não encontrado');
    return;
  }
  
  const titulo = document.getElementById('titulo').value.trim();
  const descricao = document.getElementById('descricao').value.trim();
  
  if (!titulo || !descricao) {
    alert('Preencha todos os campos.');
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:3000/api/dicas/${editandoDicaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, descricao })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.mensagem || 'Erro ao atualizar dica');
    }
    
    const result = await response.json();
    alert(result.mensagem || 'Dica atualizada com sucesso!');
    
    // Limpar formulário
    document.getElementById('titulo').value = '';
    document.getElementById('descricao').value = '';
    
    // Voltar o botão para modo de criação
    const botao = document.getElementById('btnDica');
    botao.textContent = 'Criar Dica';
    botao.onclick = criarDica;
    editandoDicaId = null;
    
    // Recarregar a lista de dicas
    carregarDicas();
  } catch (error) {
    console.error('Erro ao atualizar dica:', error);
    alert(error.message || 'Erro ao conectar com o servidor.');
  }
}

// Função para excluir uma dica
async function excluirDica(id) {
  if (!confirm('Tem certeza que deseja excluir esta dica?')) {
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:3000/api/dicas/${id}`, { 
      method: 'DELETE' 
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.mensagem || 'Erro ao excluir dica');
    }
    
    const result = await response.json();
    alert(result.mensagem || 'Dica excluída com sucesso!');
    
    // Se estava editando a dica que foi excluída, limpar o formulário
    if (editandoDicaId === id) {
      document.getElementById('titulo').value = '';
      document.getElementById('descricao').value = '';
      
      const botao = document.getElementById('btnDica');
      botao.textContent = 'Criar Dica';
      botao.onclick = criarDica;
      editandoDicaId = null;
    }
    
    // Recarregar a lista de dicas
    carregarDicas();
  } catch (error) {
    console.error('Erro ao excluir dica:', error);
    alert(error.message || 'Erro ao conectar com o servidor.');
  }
}

// Carregar dicas quando a página for carregada
document.addEventListener('DOMContentLoaded', () => {
  carregarDicas();
  
  // Configurar o botão de criação de dica
  const botao = document.getElementById('btnDica');
  if (botao) {
    botao.onclick = criarDica;
  }
});