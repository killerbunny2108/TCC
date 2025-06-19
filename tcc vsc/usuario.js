// FUNCIONALIDADES DA PÁGINA DO USUÁRIO - VERSÃO CORRIGIDA

// Variáveis globais
let usuarioLogado = null;
let perfilEditando = false;

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando página...');
    inicializarPagina();
});

// Função para inicializar a página
function inicializarPagina() {
    // Verificar se há usuário logado no localStorage
    const usuarioStorage = localStorage.getItem('usuarioLogado');
    console.log('Usuário no localStorage:', usuarioStorage);
    
    if (usuarioStorage) {
        try {
            usuarioLogado = JSON.parse(usuarioStorage);
            console.log('Usuário logado:', usuarioLogado);
            
            atualizarBemVindo();
            atualizarHeaderUsuario();
            carregarPerfilUsuario();
            carregarHistoricoCompleto();
            configurarEventos();
            
            // Carregar dicas se o container existir
            if (document.getElementById('lista-dicas-clientes')) {
                carregarDicas();
            }
        } catch (error) {
            console.error('Erro ao parsear usuário do localStorage:', error);
            redirecionarParaLogin();
        }
    } else {
        console.log('Nenhum usuário logado encontrado');
        redirecionarParaLogin();
    }
}

// Função para redirecionar para login
function redirecionarParaLogin() {
    alert('Você precisa fazer login para acessar esta página.');
    window.location.href = 'inicio.html';
}

// Configurar todos os eventos
function configurarEventos() {
    console.log('Configurando eventos...');
    
    // Configurar input de foto
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.addEventListener('change', handleFileSelect);
        console.log('Event listener para input-foto configurado');
    }

    // Configurar botão de alterar foto
    const btnFoto = document.querySelector('.btn-foto');
    if (btnFoto) {
        btnFoto.addEventListener('click', alterarFoto);
        console.log('Event listener para btn-foto configurado');
    }

    // Configurar botões do perfil
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    if (btnEditar) {
        btnEditar.addEventListener('click', toggleEdicao);
        console.log('Event listener para btn-editar configurado');
    }
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarEdicao);
        console.log('Event listener para btn-cancelar configurado');
    }

    // Fechar modal ao clicar fora
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('modal-consulta');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Configurar botão de agendamento se existir
    const btnAgendar = document.getElementById('agendar');
    if (btnAgendar && typeof Calendly !== 'undefined') {
        btnAgendar.addEventListener('click', function() {
            Calendly.initPopupWidget({ url: 'https://calendly.com/julianunesteixeira4' });
            return false;
        });
        console.log('Event listener para agendamento configurado');
    }
}

// Atualizar mensagem de boas-vindas com nome do usuário
function atualizarBemVindo() {
    if (usuarioLogado && usuarioLogado.nome) {
        const welcomeElement = document.getElementById('welcome-message');
        if (welcomeElement) {
            welcomeElement.textContent = `Bem-vindo, ${usuarioLogado.nome}!`;
            console.log('Mensagem de boas-vindas atualizada');
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
            fotoProfile.onerror = function() {
                this.src = 'images/user-placeholder.jpg';
            };
            console.log('Foto do header atualizada');
        }
    }
}

// Carregar dados do perfil
async function carregarPerfilUsuario() {
    if (!usuarioLogado) {
        console.error('Usuário não logado');
        return;
    }
    
    console.log('Carregando perfil do usuário:', usuarioLogado.id_usuario);
    
    try {
        const response = await fetch(`http://localhost:3000/api/usuario/dados/${usuarioLogado.id_usuario}`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const perfil = await response.json();
        console.log('Perfil carregado:', perfil);
        
        // Preencher campos do formulário
        preencherCamposPerfil(perfil);
        
        // Atualizar foto de perfil
        atualizarFotoPerfil(perfil.foto_perfil);
        
        // Atualizar usuarioLogado com dados mais recentes
        usuarioLogado = { ...usuarioLogado, ...perfil };
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
        
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        mostrarAlerta('Erro ao carregar dados do perfil: ' + error.message, 'error');
    }
}

// Função auxiliar para preencher campos do perfil
function preencherCamposPerfil(perfil) {
    const campos = [
        { id: 'nome', valor: perfil.nome },
        { id: 'email', valor: perfil.email },
        { id: 'telefone', valor: perfil.telefone },
        { id: 'endereco', valor: perfil.endereco },
        { id: 'data_nascimento', valor: perfil.data_nascimento ? perfil.data_nascimento.split('T')[0] : '' }
    ];

    campos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        if (elemento) {
            elemento.value = campo.valor || '';
        }
    });
}

// Função auxiliar para atualizar foto de perfil
function atualizarFotoPerfil(fotoPerfil) {
    const fotoPreview = document.getElementById('foto-preview');
    if (fotoPreview) {
        if (fotoPerfil) {
            fotoPreview.innerHTML = `<img src="http://localhost:3000${fotoPerfil}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.parentElement.innerHTML='<span class=\\'foto-placeholder\\'>👤</span>'">`;
        } else {
            fotoPreview.innerHTML = '<span class="foto-placeholder">👤</span>';
        }
    }
}

// Toggle edição do perfil
function toggleEdicao() {
    console.log('Toggle edição, estado atual:', perfilEditando);
    
    if (!perfilEditando) {
        iniciarEdicao();
    } else {
        salvarPerfil();
    }
}

// Iniciar modo de edição
function iniciarEdicao() {
    const inputs = document.querySelectorAll('.perfil-form input');
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    inputs.forEach(input => {
        if (input.id !== 'email') { // Email não pode ser editado
            input.removeAttribute('readonly');
            input.style.backgroundColor = 'white';
            input.style.border = '1px solid #ddd';
        }
    });
    
    if (btnEditar) {
        btnEditar.textContent = 'Salvar Alterações';
    }
    if (btnCancelar) {
        btnCancelar.style.display = 'inline-block';
    }
    
    perfilEditando = true;
    console.log('Modo de edição ativado');
}

// Cancelar edição
function cancelarEdicao() {
    console.log('Cancelando edição...');
    
    // Recarregar dados originais
    carregarPerfilUsuario();
    
    // Sair do modo de edição
    finalizarEdicao();
}

// Finalizar modo de edição
function finalizarEdicao() {
    const inputs = document.querySelectorAll('.perfil-form input');
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    inputs.forEach(input => {
        input.setAttribute('readonly', true);
        input.style.backgroundColor = '#f5f5f5';
        input.style.border = '1px solid #ccc';
    });
    
    if (btnEditar) {
        btnEditar.textContent = 'Editar Perfil';
    }
    if (btnCancelar) {
        btnCancelar.style.display = 'none';
    }
    
    perfilEditando = false;
    console.log('Modo de edição desativado');
}

// Salvar perfil
async function salvarPerfil() {
    if (!usuarioLogado) {
        console.error('Usuário não logado');
        return;
    }

    console.log('Salvando perfil...');
    
    const formData = new FormData();
    formData.append('nome', document.getElementById('nome').value);
    formData.append('telefone', document.getElementById('telefone').value);
    formData.append('endereco', document.getElementById('endereco').value);
    formData.append('data_nascimento', document.getElementById('data_nascimento').value);

    const file = document.getElementById('input-foto').files[0];
    if (file) {
        formData.append('foto', file);
        console.log('Arquivo de foto adicionado ao FormData');
    }

    try {
        // Determinar endpoint correto
        let endpoint;
        if (usuarioLogado.tipo === 'paciente' && usuarioLogado.id_paciente) {
            endpoint = `http://localhost:3000/api/usuario/paciente/perfil/${usuarioLogado.id_paciente}`;
        } else {
            endpoint = `http://localhost:3000/api/usuario/perfil/${usuarioLogado.id_usuario}`;
        }

        console.log('Enviando para endpoint:', endpoint);

        const response = await fetch(endpoint, {
            method: 'PUT',
            body: formData
        });

        const resultado = await response.json();
        console.log('Resposta do servidor:', resultado);

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
            finalizarEdicao();
        } else {
            mostrarAlerta(resultado.mensagem || 'Erro ao salvar perfil', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        mostrarAlerta('Erro ao salvar perfil: ' + error.message, 'error');
    }
}

// Carregar histórico completo de consultas
async function carregarHistoricoCompleto() {
    if (!usuarioLogado) {
        console.error('Usuário não logado');
        return;
    }
    
    const container = document.getElementById('historico-completo');
    if (!container) {
        console.log('Container historico-completo não encontrado');
        return;
    }
    
    console.log('Carregando histórico de consultas...');
    container.innerHTML = '<div class="loading">Carregando histórico...</div>';

    try {
        const response = await fetch(`http://localhost:3000/api/usuario/fichas/${usuarioLogado.id_usuario}`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const historico = await response.json();
        console.log('Histórico carregado:', historico);

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
        container.innerHTML = '<div class="error"><p>Erro ao carregar histórico de consultas: ' + error.message + '</p></div>';
    }
}

// Abrir modal com detalhes da consulta
async function abrirModalConsulta(idFicha) {
    console.log('Abrindo modal para ficha:', idFicha);
    
    const modal = document.getElementById('modal-consulta');
    const modalBody = document.getElementById('modal-body-consulta');
    
    if (!modal || !modalBody) {
        console.error('Modal ou modal-body não encontrado');
        return;
    }
    
    modalBody.innerHTML = '<p>Carregando detalhes da consulta...</p>';
    modal.style.display = 'block';

    try {
        const response = await fetch(`http://localhost:3000/api/usuario/ficha/${idFicha}`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const detalhes = await response.json();
        console.log('Detalhes da consulta:', detalhes);

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
        modalBody.innerHTML = '<div class="error"><p>Erro ao carregar detalhes da consulta: ' + error.message + '</p></div>';
    }
}

// Fechar modal de consulta
function fecharModal() {
    const modal = document.getElementById('modal-consulta');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Função para mostrar alertas
function mostrarAlerta(mensagem, tipo = 'info') {
    console.log(`Alerta ${tipo}:`, mensagem);
    
    // Remover alertas existentes
    const alertasExistentes = document.querySelectorAll('.custom-alert');
    alertasExistentes.forEach(alerta => alerta.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert alert-${tipo}`;
    alertDiv.innerHTML = `
        <div class="alert-content">
            <span class="alert-icon">${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="alert-message">${mensagem}</span>
        </div>
    `;
    
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        max-width: 400px;
        background-color: ${tipo === 'success' ? '#4CAF50' : tipo === 'error' ? '#f44336' : '#2196F3'};
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 4000);
}

// Função para alterar foto
function alterarFoto() {
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.click();
    } else {
        console.error('Input de foto não encontrado');
    }
}

// Handler para seleção de arquivo
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        console.log('Arquivo selecionado:', file.name, file.size, file.type);
        
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
                console.log('Preview da foto atualizado');
            }
        };
        reader.readAsDataURL(file);
    }
}

// Função para carregar dicas
async function carregarDicas() {
    const container = document.getElementById('lista-dicas-clientes');
    const loading = document.getElementById('loading-dicas');
    
    if (!container) {
        console.log('Container de dicas não encontrado');
        return;
    }
    
    console.log('Carregando dicas...');
    
    try {
        const response = await fetch('http://localhost:3000/api/usuario/dicas');
        
        if (!response.ok) {
            // Se a rota não existir, mostrar dicas estáticas
            if (response.status === 404) {
                mostrarDicasEstaticas(container, loading);
                return;
            }
            throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const dicas = await response.json();
        console.log('Dicas carregadas:', dicas);
        
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
        mostrarDicasEstaticas(container, loading);
    }
}

// Função para mostrar dicas estáticas como fallback
function mostrarDicasEstaticas(container, loading) {
    console.log('Mostrando dicas estáticas como fallback');
    
    if (loading) loading.style.display = 'none';
    
    const dicasEstaticas = [
        {
            titulo: "Hidratação",
            descricao: "Beba pelo menos 2 litros de água por dia para manter-se hidratado e auxiliar no funcionamento do organismo."
        },
        {
            titulo: "Exercícios Regulares",
            descricao: "Pratique pelo menos 30 minutos de atividade física por dia para manter sua saúde física e mental."
        },
        {
            titulo: "Alimentação Equilibrada",
            descricao: "Mantenha uma dieta rica em frutas, vegetais, proteínas magras e grãos integrais."
        },
        {
            titulo: "Sono Reparador",
            descricao: "Durma de 7 a 8 horas por noite para permitir a recuperação adequada do corpo e mente."
        }
    ];
    
    container.innerHTML = '';
    dicasEstaticas.forEach(dica => {
        const div = document.createElement('div');
        div.className = 'dicas-item';
        div.innerHTML = `
            <span class="dica-icon">💡</span>
            <h3>${dica.titulo}</h3>
            <p>${dica.descricao}</p>
        `;
        container.appendChild(div);
    });
}

// Adicionar estilos para o alert se não existirem
if (!document.querySelector('style[data-usuario-alerts]')) {
    const style = document.createElement('style');
    style.setAttribute('data-usuario-alerts', 'true');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        
        .custom-alert {
            animation: slideIn 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
}