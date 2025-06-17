// FUNCIONALIDADES DA PÁGINA DO USUÁRIO

// Variáveis globais
let usuarioLogado = null;
let perfilEditando = false;

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    inicializarPagina();
    carregarUsuarioLogado();
    carregarPerfilUsuario();
    carregarHistoricoCompleto();
    configurarEventos();
});

// Função para inicializar a página
function inicializarPagina() {
    // Verificar se há usuário logado no localStorage
    const usuario = localStorage.getItem('usuarioLogado');
    if (usuario) {
        usuarioLogado = JSON.parse(usuario);
        atualizarBemVindo();
        atualizarHeaderUsuario();
    } else {
        // Redirecionar para login se não estiver logado
        window.location.href = 'inicio.html';
    }
}

// Configurar todos os eventos
function configurarEventos() {
    // Configurar input de foto
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.addEventListener('change', handleFileSelect);
    }

    // Configurar botão de alterar foto
    const btnFoto = document.querySelector('.btn-foto');
    if (btnFoto) {
        btnFoto.addEventListener('click', alterarFoto);
    }

    // Configurar botões do perfil
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    if (btnEditar) {
        btnEditar.addEventListener('click', toggleEdicao);
    }
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarEdicao);
    }

    // Fechar modal ao clicar fora
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('modal-consulta');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Atualizar mensagem de boas-vindas com nome do paciente
function atualizarBemVindo() {
    if (usuarioLogado && usuarioLogado.nome) {
        const welcomeElement = document.getElementById('welcome-message');
        if (welcomeElement) {
            welcomeElement.textContent = `Bem-vindo, ${usuarioLogado.nome}!`;
        }
    }
}

// Atualizar header com dados do usuário
function atualizarHeaderUsuario() {
    if (usuarioLogado) {
        // Atualizar foto se existir
        const fotoProfile = document.getElementById('header-foto');
        if (fotoProfile && usuarioLogado.foto_perfil) {
            fotoProfile.src = `http://localhost:3000${usuarioLogado.foto_perfil}`;
        }
    }
}

// Carregar dados do perfil
async function carregarPerfilUsuario() {
    if (!usuarioLogado) return;
    
    try {
        const response = await fetch(`http://localhost:3000/api/usuario/dados/${usuarioLogado.id_usuario}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const perfil = await response.json();
        
        // Preencher campos
        const nomeField = document.getElementById('nome');
        const emailField = document.getElementById('email');
        const telefoneField = document.getElementById('telefone');
        const enderecoField = document.getElementById('endereco');
        const dataNascimentoField = document.getElementById('data_nascimento');
        
        if (nomeField) nomeField.value = perfil.nome || '';
        if (emailField) emailField.value = perfil.email || '';
        if (telefoneField) telefoneField.value = perfil.telefone || '';
        if (enderecoField) enderecoField.value = perfil.endereco || '';
        if (dataNascimentoField) {
            dataNascimentoField.value = perfil.data_nascimento ? perfil.data_nascimento.split('T')[0] : '';
        }
        
        // Atualizar foto
        const fotoPreview = document.getElementById('foto-preview');
        if (fotoPreview) {
            if (perfil.foto_perfil) {
                fotoPreview.innerHTML = `<img src="http://localhost:3000${perfil.foto_perfil}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                fotoPreview.innerHTML = '<span class="foto-placeholder">👤</span>';
            }
        }
        
        // Atualizar usuarioLogado com dados mais recentes
        usuarioLogado = { ...usuarioLogado, ...perfil };
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
        
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        mostrarAlerta('Erro ao carregar dados do perfil', 'error');
    }
}

// Toggle edição do perfil
function toggleEdicao() {
    const inputs = document.querySelectorAll('.perfil-form input');
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    if (!perfilEditando) {
        // Entrar em modo de edição
        inputs.forEach(input => {
            if (input.id !== 'email') { // Email não pode ser editado
                input.removeAttribute('readonly');
                input.style.backgroundColor = 'white';
                input.style.border = '1px solid #ddd';
            }
        });
        
        if (btnEditar) {
            btnEditar.textContent = 'Salvar Alterações';
            btnEditar.onclick = salvarPerfil;
        }
        if (btnCancelar) {
            btnCancelar.style.display = 'inline-block';
        }
        perfilEditando = true;
        
    } else {
        // Sair do modo de edição
        salvarPerfil();
    }
}

// Cancelar edição
function cancelarEdicao() {
    carregarPerfilUsuario(); // Recarregar dados originais
    
    const inputs = document.querySelectorAll('.perfil-form input');
    inputs.forEach(input => {
        input.setAttribute('readonly', true);
        input.style.backgroundColor = '#f5f5f5';
        input.style.border = '1px solid #ccc';
    });
    
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    if (btnEditar) {
        btnEditar.textContent = 'Editar Perfil';
        btnEditar.onclick = toggleEdicao;
    }
    if (btnCancelar) {
        btnCancelar.style.display = 'none';
    }
    perfilEditando = false;
}

// Salvar perfil
async function salvarPerfil() {
    if (!usuarioLogado) return;

    const formData = new FormData();
    formData.append('nome', document.getElementById('nome').value);
    formData.append('telefone', document.getElementById('telefone').value);
    formData.append('endereco', document.getElementById('endereco').value);
    formData.append('data_nascimento', document.getElementById('data_nascimento').value);

    const file = document.getElementById('input-foto').files[0];
    if (file) {
        formData.append('foto', file);
    }

    try {
        // Usar endpoint correto baseado no tipo de usuário
        let endpoint;
        if (usuarioLogado.tipo === 'paciente' && usuarioLogado.id_paciente) {
            endpoint = `http://localhost:3000/api/usuario/paciente/perfil/${usuarioLogado.id_paciente}`;
        } else {
            endpoint = `http://localhost:3000/api/usuario/perfil/${usuarioLogado.id_usuario}`;
        }

        const response = await fetch(endpoint, {
            method: 'PUT',
            body: formData
        });

        const resultado = await response.json();

        if (response.ok) {
            mostrarAlerta('Perfil atualizado com sucesso!', 'success');
            
            // Atualizar dados locais
            usuarioLogado.nome = document.getElementById('nome').value;
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            
            // Recarregar perfil e atualizar interface
            await carregarPerfilUsuario();
            atualizarBemVindo();
            atualizarHeaderUsuario();
            
            // Sair do modo de edição
            cancelarEdicao();
        } else {
            mostrarAlerta(resultado.mensagem || 'Erro ao salvar perfil', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        mostrarAlerta('Erro ao salvar perfil', 'error');
    }
}

// Carregar histórico completo de consultas
async function carregarHistoricoCompleto() {
    if (!usuarioLogado) return;
    
    const container = document.getElementById('historico-completo');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Carregando histórico...</div>';

    try {
        const response = await fetch(`http://localhost:3000/api/usuario/fichas/${usuarioLogado.id_usuario}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const historico = await response.json();

        if (Array.isArray(historico) && historico.length > 0) {
            let html = '<div class="historico-lista">';
            historico.forEach(ficha => {
                const dataConsulta = new Date(ficha.data_consulta).toLocaleDateString('pt-BR');
                html += `
                    <div class="historico-item" onclick="abrirModalConsulta(${ficha.id_ficha})">
                        <div class="historico-header">
                            <h3>Consulta - ${dataConsulta}</h3>
                            <span class="historico-status">Concluída</span>
                        </div>
                        <div class="historico-info">
                            <p><strong>Queixa:</strong> ${ficha.queixa_principal || 'Não informada'}</p>
                            <p class="click-detail">Clique para ver detalhes completos</p>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="no-data"><p>Não há consultas anteriores registradas.</p></div>';
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        container.innerHTML = '<div class="error"><p>Erro ao carregar histórico de consultas. Tente novamente mais tarde.</p></div>';
    }
}

// Abrir modal com detalhes da consulta
async function abrirModalConsulta(idFicha) {
    const modal = document.getElementById('modal-consulta');
    const modalBody = document.getElementById('modal-body-consulta');
    
    if (!modal || !modalBody) return;
    
    modalBody.innerHTML = '<p>Carregando detalhes da consulta...</p>';
    modal.style.display = 'block';

    try {
        const response = await fetch(`http://localhost:3000/api/usuario/ficha/${idFicha}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const detalhes = await response.json();

        const dataFormatada = new Date(detalhes.data_consulta).toLocaleDateString('pt-BR');
        modalBody.innerHTML = `
            <div class="consulta-detalhes">
                <div class="detalhe-item">
                    <strong>📅 Data da Consulta:</strong>
                    <span>${dataFormatada}</span>
                </div>
                <div class="detalhe-item">
                    <strong>🩺 Queixa Principal:</strong>
                    <span>${detalhes.queixa_principal || 'Não informado'}</span>
                </div>
                <div class="detalhe-item">
                    <strong>📋 Histórico Médico:</strong>
                    <span>${detalhes.historico_medico || 'Não informado'}</span>
                </div>
                <div class="detalhe-item">
                    <strong>📝 Observações:</strong>
                    <span>${detalhes.observacoes || 'Nenhuma observação registrada'}</span>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        modalBody.innerHTML = '<div class="error"><p>Erro ao carregar detalhes da consulta.</p></div>';
    }
}

// Fechar modal de consulta
function fecharModal() {
    const modal = document.getElementById('modal-consulta');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Função auxiliar para carregar usuário logado
function carregarUsuarioLogado() {
    console.log('Usuário carregado:', usuarioLogado);
}

// Função auxiliar para mostrar alertas
function mostrarAlerta(mensagem, tipo = 'info') {
    // Criar um alerta personalizado mais elegante
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert alert-${tipo}`;
    alertDiv.innerHTML = `
        <div class="alert-content">
            <span class="alert-icon">${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="alert-message">${mensagem}</span>
        </div>
    `;
    
    // Adicionar estilos inline para funcionar independente do CSS
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        background-color: ${tipo === 'success' ? '#4CAF50' : tipo === 'error' ? '#f44336' : '#2196F3'};
    `;
    
    document.body.appendChild(alertDiv);
    
    // Remover após 3 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 3000);
}

// Função para alterar foto
function alterarFoto() {
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.click();
    }
}

// Handler para seleção de arquivo
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            mostrarAlerta('Por favor, selecione apenas arquivos de imagem', 'error');
            return;
        }
        
        // Validar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            mostrarAlerta('A imagem deve ter no máximo 5MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const fotoPreview = document.getElementById('foto-preview');
            if (fotoPreview) {
                fotoPreview.innerHTML = `<img src="${e.target.result}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            }
        };
        reader.readAsDataURL(file);
    }
}

// Função para carregar dicas (se existir o endpoint)
async function carregarDicas() {
    const container = document.getElementById('lista-dicas-clientes');
    const loading = document.getElementById('loading-dicas');
    
    if (!container) return;
    
    try {
        const response = await fetch('http://localhost:3000/api/dicas');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const dicas = await response.json();
        
        if (loading) loading.style.display = 'none';

        if (Array.isArray(dicas) && dicas.length > 0) {
            container.innerHTML = '';
            dicas.forEach(dica => {
                const div = document.createElement('div');
                div.className = 'dicas-item';
                div.innerHTML = `
                    <span class="dica-icon">💡</span>
                    <h3>${dica.titulo}</h3>
                    <p>${dica.descricao}</p>
                `;
                container.appendChild(div);
            });
        } else {
            container.innerHTML = '<p>Nenhuma dica disponível no momento.</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar dicas:', error);
        if (loading) loading.style.display = 'none';
        if (container) {
            container.innerHTML = '<p class="erro">Não foi possível carregar as dicas. Tente novamente mais tarde.</p>';
        }
    }
}

// Carregar dicas quando a página carregar (se existir o container)
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('lista-dicas-clientes')) {
        carregarDicas();
    }
});

// Função para debugar - remover em produção
function debug() {
    console.log('Usuario logado:', usuarioLogado);
    console.log('Perfil editando:', perfilEditando);
}