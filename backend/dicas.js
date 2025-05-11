// Script melhorado para gestão de dicas
let editandoDicaId = null;

// Função para carregar todas as dicas
async function carregarDicas() {
  try {
    console.log("Iniciando carregamento de dicas...");
    const response = await fetch('http://localhost:3000/api/dicas');
    if (!response.ok) {
      throw new Error(`Erro ao buscar dicas: ${response.status} ${response.statusText}`);
    }
    
    const dicas = await response.json();
    console.log(`Carregadas ${dicas.length} dicas do servidor`);
    
    const container = document.getElementById('lista-dicas');
    if (!container) {
      console.error("Elemento 'lista-dicas' não encontrado no DOM!");
      return;
    }
    
    container.innerHTML = '';

    if (dicas.length === 0) {
      container.innerHTML = '<p>Nenhuma dica cadastrada.</p>';
      return;
    }

    dicas.forEach(dica => {
      // Escapar aspas e possíveis caracteres problemáticos para os atributos data-*
      const tituloEscapado = dica.titulo.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      const descricaoEscapada = dica.descricao.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      
      const div = document.createElement('div');
      div.className = 'dica-item';
      div.innerHTML = `
        <h3>${dica.titulo}</h3>
        <p>${dica.descricao}</p>
        <div class="dica-actions">
          <button class="btn-editar" data-id="${dica.id}" data-titulo="${tituloEscapado}" data-descricao="${descricaoEscapada}">Editar</button>
          <button class="btn-excluir" data-id="${dica.id}">Excluir</button>
        </div>
      `;
      container.appendChild(div);
    });
    
    console.log("Adicionando eventos aos botões das dicas...");
    
    // Adicionar eventos aos botões usando Event Delegation para melhor performance
    container.addEventListener('click', function(event) {
      // Botões de editar
      if (event.target.classList.contains('btn-editar')) {
        const btnEditar = event.target;
        const id = btnEditar.getAttribute('data-id');
        const titulo = btnEditar.getAttribute('data-titulo');
        const descricao = btnEditar.getAttribute('data-descricao');
        
        console.log(`Iniciando edição da dica ID: ${id}`);
        
        const tituloInput = document.getElementById('titulo');
        const descricaoInput = document.getElementById('descricao');
        const btnDica = document.getElementById('btnDica');
        
        if (tituloInput && descricaoInput && btnDica) {
          tituloInput.value = titulo;
          descricaoInput.value = descricao;
          
          btnDica.textContent = 'Atualizar Dica';
          btnDica.setAttribute('data-id', id);
          btnDica.setAttribute('data-editing', 'true');
          
          // Scroll até o formulário
          document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
        } else {
          console.error("Elementos do formulário não encontrados!");
        }
      }
      
      // Botões de excluir
      if (event.target.classList.contains('btn-excluir')) {
        const id = event.target.getAttribute('data-id');
        console.log(`Solicitada exclusão da dica ID: ${id}`);
        
        // Usar o modal de confirmação personalizado em vez do confirm nativo
        exibirModalConfirmacao(
          'Excluir Dica', 
          'Tem certeza que deseja excluir esta dica?', 
          function() {
            excluirDica(id);
          }
        );
      }
    });
    
    console.log("Dicas carregadas e eventos adicionados com sucesso!");
  } catch (error) {
    console.error('Erro ao carregar dicas:', error);
    document.getElementById('lista-dicas').innerHTML = 
      `<p style="color: red;">Erro ao carregar dicas. ${error.message}</p>
       <button onclick="carregarDicas()">Tentar novamente</button>`;
  }
}

// Função para criar/atualizar dica
async function salvarDica(event) {
  if (event) event.preventDefault();
  
  const titulo = document.getElementById('titulo').value;
  const descricao = document.getElementById('descricao').value;
  
  if (!titulo || !descricao) {
    alert('Preencha todos os campos.');
    return;
  }
  
  const btnDica = document.getElementById('btnDica');
  const isEditing = btnDica.getAttribute('data-editing') === 'true';
  
  try {
    let url = 'http://localhost:3000/api/dicas';
    let method = 'POST';
    
    if (isEditing) {
      const id = btnDica.getAttribute('data-id');
      url = `http://localhost:3000/api/dicas/${id}`;
      method = 'PUT';
    }
    
    console.log(`Enviando requisição ${method} para ${url}`);
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ titulo, descricao })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.mensagem || 'Erro na requisição');
    }
    
    // Limpar formulário
    document.getElementById('titulo').value = '';
    document.getElementById('descricao').value = '';
    
    // Resetar o botão
    btnDica.textContent = 'Criar Dica';
    btnDica.removeAttribute('data-id');
    btnDica.setAttribute('data-editing', 'false');
    
    // Recarregar lista de dicas
    await carregarDicas();
    
    alert(isEditing ? 'Dica atualizada com sucesso!' : 'Dica criada com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar dica:', error);
    alert(`Erro ao salvar dica: ${error.message}`);
  }
}

// Função para excluir dica
async function excluirDica(id) {
  try {
    console.log(`Excluindo dica ID: ${id}`);
    const response = await fetch(`http://localhost:3000/api/dicas/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.mensagem || 'Erro ao excluir dica');
    }
    
    console.log("Dica excluída com sucesso, recarregando lista...");
    await carregarDicas();
    alert('Dica excluída com sucesso!');
    
    // Resetar o formulário caso esteja editando a dica que foi excluída
    const btnDica = document.getElementById('btnDica');
    if (btnDica && btnDica.getAttribute('data-id') === id) {
      document.getElementById('titulo').value = '';
      document.getElementById('descricao').value = '';
      btnDica.textContent = 'Criar Dica';
      btnDica.removeAttribute('data-id');
      btnDica.setAttribute('data-editing', 'false');
    }
  } catch (error) {
    console.error('Erro ao excluir dica:', error);
    alert(`Erro ao excluir dica: ${error.message}`);
  }
}

// Verificar se a função exibirModalConfirmacao existe, caso não exista, criar uma versão própria
if (typeof exibirModalConfirmacao !== 'function') {
  function exibirModalConfirmacao(titulo, mensagem, callbackConfirmar) {
    if (confirm(mensagem)) {
      callbackConfirmar();
    }
  }
}

// Configuração inicial quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM carregado, inicializando script de dicas...");
  
  // Carregar a lista de dicas
  carregarDicas();
  
  // Configurar o botão de criação/atualização de dica
  const btnDica = document.getElementById('btnDica');
  if (btnDica) {
    btnDica.addEventListener('click', function(event) {
      event.preventDefault();
      console.log("Botão Criar/Atualizar Dica clicado!");
      salvarDica(event);
    });
    btnDica.setAttribute('data-editing', 'false');
  } else {
    console.error("Elemento com ID 'btnDica' não encontrado!");
  }
  
  console.log("Script dicas.js carregado com sucesso!");
});