// FUNCIONALIDADES DA PÁGINA DO USUÁRIO - VERSÃO OTIMIZADA

// Variáveis globais
let usuarioLogado = null;
let perfilEditando = false;
let dadosOriginais = {};

// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api/usuario';

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando página...');
    inicializarPagina();
});

// Função para inicializar a página
async function inicializarPagina() {
    try {
        // Verificar se há usuário logado no localStorage
        const usuarioStorage = localStorage.getItem('usuarioLogado');
        console.log('Usuário no localStorage:', usuarioStorage);
        
        if (!usuarioStorage) {
            console.log('Nenhum usuário logado encontrado');
            redirecionarParaLogin();
            return;
        }

        usuarioLogado = JSON.parse(usuarioStorage);
        console.log('Usuário logado:', usuarioLogado);
        
        // Inicializar componentes da página
        await Promise.all([
            atualizarInterface(),
            carregarPerfilUsuario(),
            carregarHistoricoCompleto(),
            carregarDicas()
        ]);
        
        configurarEventos();
        
    } catch (error) {
        console.error('Erro ao inicializar página:', error);
        mostrarAlerta('Erro ao carregar dados da página', 'error');
    }
}

// Atualizar interface com dados do usuário
function atualizarInterface() {
    if (!usuarioLogado) return;
    
    // Atualizar mensagem de boas-vindas
    const welcomeElement = document.getElementById('welcome-message');
    if (welcomeElement && usuarioLogado.nome) {
        welcomeElement.textContent = `Bem-vindo, ${usuarioLogado.nome}!`;
    }
    
    // Atualizar foto do header
    const fotoHeader = document.getElementById('header-foto');
    if (fotoHeader) {
        if (usuarioLogado.foto_perfil) {
            fotoHeader.src = `${API_BASE_URL.replace('/api/usuario', '')}${usuarioLogado.foto_perfil}`;
            fotoHeader.onerror = () => {
                fotoHeader.src = 'images/user-placeholder.jpg';
            };
        } else {
            fotoHeader.src = 'images/user-placeholder.jpg';
        }
    }
}

// Configurar todos os eventos
function configurarEventos() {
    console.log('Configurando eventos...');
    
    // Input de foto
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.addEventListener('change', handleFileSelect);
    }

    // Botões do perfil
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    if (btnEditar) {
        btnEditar.addEventListener('click', toggleEdicao);
    }
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarEdicao);
    }

    // Modal de consulta
    const modal = document.getElementById('modal-consulta');
    if (modal) {
        // Fechar modal ao clicar no X
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', fecharModal);
        }
        
        // Fechar modal ao clicar fora
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                fecharModal();
            }
        });
    }

    // Botão de agendamento Calendly
    const btnAgendar = document.getElementById('agendar');
    if (btnAgendar && typeof Calendly !== 'undefined') {
        btnAgendar.addEventListener('click', function() {
            try {
                Calendly.initPopupWidget({ url: 'https://calendly.com/julianunesteixeira4' });
            } catch (error) {
                console.error('Erro ao abrir Calendly:', error);
                mostrarAlerta('Erro ao abrir agendamento. Tente novamente.', 'error');
            }
            return false;
        });
    }
    
    console.log('Eventos configurados com sucesso');
}

// Carregar dados do perfil do usuário
async function carregarPerfilUsuario() {
    if (!usuarioLogado?.id_usuario) {
        console.error('ID do usuário não encontrado');
        return;
    }
    
    console.log('Carregando perfil do usuário:', usuarioLogado.id_usuario);
    
    try {
        const response = await fetch(`${API_BASE_URL}/dados/${usuarioLogado.id_usuario}`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const perfil = await response.json();
        console.log('Perfil carregado:', perfil);
        
        // Armazenar dados originais para cancelar edição
        dadosOriginais = { ...perfil };
        
        // Preencher formulário
        preencherFormularioPerfil(perfil);
        
        // Atualizar foto de perfil
        atualizarFotoPerfil(perfil.foto_perfil);
        
        // Atualizar dados do usuário logado
        usuarioLogado = { ...usuarioLogado, ...perfil };
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
        
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        mostrarAlerta('Erro ao carregar dados do perfil', 'error');
    }
}

// Preencher formulário do perfil
function preencherFormularioPerfil(dados) {
    const campos = [
        { id: 'nome', valor: dados.nome || '' },
        { id: 'email', valor: dados.email || '' },
        { id: 'telefone', valor: dados.telefone || '' },
        { id: 'endereco', valor: dados.endereco || '' },
        { id: 'data_nascimento', valor: dados.data_nascimento ? dados.data_nascimento.split('T')[0] : '' }
    ];

    campos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        if (elemento) {
            elemento.value = campo.valor;
        }
    });
}

// Atualizar foto de perfil
function atualizarFotoPerfil(fotoPerfil) {
    const fotoPreview = document.getElementById('foto-preview');
    if (!fotoPreview) return;
    
    if (fotoPerfil) {
        const imgUrl = `${API_BASE_URL.replace('/api/usuario', '')}${fotoPerfil}`;
        fotoPreview.innerHTML = `
            <img src="${imgUrl}" 
                 alt="Foto de perfil" 
                 style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
                 onerror="this.parentElement.innerHTML='<span class=\\'foto-placeholder\\'>👤</span>'">
        `;
    } else {
        fotoPreview.innerHTML = '<span class="foto-placeholder">👤</span>';
    }
}

// Toggle entre modo de edição e visualização
function toggleEdicao() {
    if (!perfilEditando) {
        iniciarEdicao();
    } else {
        salvarPerfil();
    }
}

// Iniciar modo de edição
function iniciarEdicao() {
    const inputs = document.querySelectorAll('.perfil-form input:not(#email)');
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    // Habilitar inputs (exceto email)
    inputs.forEach(input => {
        input.removeAttribute('readonly');
        input.style.backgroundColor = 'white';
        input.style.border = '1px solid #ddd';
    });
    
    // Atualizar botões
    if (btnEditar) btnEditar.textContent = 'Salvar Alterações';
    if (btnCancelar) btnCancelar.style.display = 'inline-block';
    
    perfilEditando = true;
    console.log('Modo de edição ativado');
}

// Cancelar edição
function cancelarEdicao() {
    console.log('Cancelando edição...');
    
    // Restaurar dados originais
    preencherFormularioPerfil(dadosOriginais);
    
    // Restaurar foto original
    atualizarFotoPerfil(dadosOriginais.foto_perfil);
    
    // Limpar input de arquivo
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) inputFoto.value = '';
    
    // Sair do modo de edição
    finalizarEdicao();
}

// Finalizar modo de edição
function finalizarEdicao() {
    const inputs = document.querySelectorAll('.perfil-form input');
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    // Desabilitar inputs
    inputs.forEach(input => {
        input.setAttribute('readonly', true);
        input.style.backgroundColor = '#f5f5f5';
        input.style.border = '1px solid #ccc';
    });
    
    // Restaurar botões
    if (btnEditar) btnEditar.textContent = 'Editar Perfil';
    if (btnCancelar) btnCancelar.style.display = 'none';
    
    perfilEditando = false;
    console.log('Modo de edição desativado');
}

// Salvar alterações do perfil
async function salvarPerfil() {
    if (!usuarioLogado?.id_usuario) {
        console.error('Usuário não identificado');
        return;
    }

    console.log('Salvando perfil...');
    
    try {
        const formData = new FormData();
        formData.append('nome', document.getElementById('nome').value.trim());
        formData.append('telefone', document.getElementById('telefone').value.trim());
        formData.append('endereco', document.getElementById('endereco').value.trim());
        formData.append('data_nascimento', document.getElementById('data_nascimento').value);

        // Adicionar foto se selecionada
        const inputFoto = document.getElementById('input-foto');
        if (inputFoto?.files[0]) {
            formData.append('foto', inputFoto.files[0]);
        }

        // Determinar endpoint correto
        const endpoint = usuarioLogado.tipo === 'paciente' && usuarioLogado.id_paciente
            ? `${API_BASE_URL}/paciente/perfil/${usuarioLogado.id_paciente}`
            : `${API_BASE_URL}/perfil/${usuarioLogado.id_usuario}`;

        console.log('Enviando para:', endpoint);

        const response = await fetch(endpoint, {
            method: 'PUT',
            body: formData
        });

        const resultado = await response.json();

        if (response.ok) {
            mostrarAlerta('Perfil atualizado com sucesso!', 'success');
            
            // Recarregar dados atualizados
            await carregarPerfilUsuario();
            atualizarInterface();
            
            // Finalizar edição
            finalizarEdicao();
        } else {
            throw new Error(resultado.mensagem || 'Erro ao salvar perfil');
        }
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        mostrarAlerta('Erro ao salvar perfil: ' + error.message, 'error');
    }
}

// Carregar histórico de consultas
async function carregarHistoricoCompleto() {
    const container = document.getElementById('historico-completo');
    if (!container || !usuarioLogado?.id_usuario) return;
    
    console.log('Carregando histórico de consultas...');
    container.innerHTML = '<div class="loading">Carregando histórico...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/fichas/${usuarioLogado.id_usuario}`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const historico = await response.json();
        console.log('Histórico carregado:', historico);

        if (Array.isArray(historico) && historico.length > 0) {
            renderizarHistorico(historico, container);
        } else {
            container.innerHTML = '<div class="no-data"><p>Não há consultas anteriores registradas.</p></div>';
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        container.innerHTML = '<div class="error"><p>Erro ao carregar histórico de consultas</p></div>';
    }
}

// Renderizar histórico de consultas
function renderizarHistorico(historico, container) {
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
}

// Abrir modal com detalhes da consulta
async function abrirModalConsulta(idFicha) {
    const modal = document.getElementById('modal-consulta');
    const modalBody = document.getElementById('modal-body-consulta');
    
    if (!modal || !modalBody) {
        console.error('Elementos do modal não encontrados');
        return;
    }
    
    console.log('Abrindo modal para ficha:', idFicha);
    
    modalBody.innerHTML = '<p>Carregando detalhes da consulta...</p>';
    modal.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE_URL}/ficha/${idFicha}`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const detalhes = await response.json();
        console.log('Detalhes da consulta:', detalhes);

        renderizarDetalhesConsulta(detalhes, modalBody);
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        modalBody.innerHTML = '<div class="error"><p>Erro ao carregar detalhes da consulta</p></div>';
    }
}

// Renderizar detalhes da consulta no modal
function renderizarDetalhesConsulta(detalhes, container) {
    const dataFormatada = new Date(detalhes.data_consulta).toLocaleDateString('pt-BR');
    
    container.innerHTML = `
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
}

// Fechar modal de consulta
function fecharModal() {
    const modal = document.getElementById('modal-consulta');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Carregar dicas de saúde
async function carregarDicas() {
    const container = document.getElementById('lista-dicas-clientes');
    const loading = document.getElementById('loading-dicas');
    
    if (!container) return;
    
    console.log('Carregando dicas...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/dicas`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const dicas = await response.json();
        console.log('Dicas carregadas:', dicas);
        
        if (loading) loading.style.display = 'none';
        
        renderizarDicas(dicas, container);
        
    } catch (error) {
        console.error('Erro ao carregar dicas:', error);
        if (loading) loading.style.display = 'none';
        mostrarDicasEstaticas(container);
    }
}

// Renderizar dicas na interface
function renderizarDicas(dicas, container) {
    if (!Array.isArray(dicas) || dicas.length === 0) {
        container.innerHTML = '<p>Nenhuma dica disponível no momento.</p>';
        return;
    }
    
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
}

// Mostrar dicas estáticas como fallback
function mostrarDicasEstaticas(container) {
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
        },
        {
            titulo: "Gerenciamento do Estresse",
            descricao: "Pratique técnicas de relaxamento como meditação, respiração profunda ou yoga para reduzir o estresse."
        }
    ];
    
    renderizarDicas(dicasEstaticas, container);
}

// Handler para seleção de arquivo de foto
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('Arquivo selecionado:', file.name, file.size, file.type);
    
    // Validações
    if (!file.type.startsWith('image/')) {
        mostrarAlerta('Por favor, selecione apenas arquivos de imagem', 'error');
        event.target.value = '';
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
        mostrarAlerta('A imagem deve ter no máximo 5MB', 'error');
        event.target.value = '';
        return;
    }
    
    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = function(e) {
        const fotoPreview = document.getElementById('foto-preview');
        if (fotoPreview) {
            fotoPreview.innerHTML = `
                <img src="${e.target.result}" 
                     alt="Foto de perfil" 
                     style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
            `;
        }
    };
    reader.readAsDataURL(file);
}

// Função para alterar foto (chamada pelo botão)
function alterarFoto() {
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.click();
    }
}

// Mostrar alertas personalizados
function mostrarAlerta(mensagem, tipo = 'info') {
    console.log(`Alerta ${tipo}:`, mensagem);
    
    // Remover alertas existentes
    document.querySelectorAll('.custom-alert').forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert alert-${tipo}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };
    
    alertDiv.innerHTML = `
        <div class="alert-content">
            <span class="alert-icon">${icons[tipo] || icons.info}</span>
            <span class="alert-message">${mensagem}</span>
        </div>
    `;
    
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        background-color: ${colors[tipo] || colors.info};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease-out;
        cursor: pointer;
    `;
    
    // Adicionar animação CSS se não existir
    if (!document.querySelector('#alert-styles')) {
        const style = document.createElement('style');
        style.id = 'alert-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .custom-alert:hover {
                transform: translateX(-5px);
                transition: transform 0.2s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(alertDiv);
    
    // Remover após 5 segundos ou ao clicar
    const removeAlert = () => {
        if (alertDiv.parentNode) {
            alertDiv.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => alertDiv.remove(), 300);
        }
    };
    
    alertDiv.addEventListener('click', removeAlert);
    setTimeout(removeAlert, 5000);
}

// Redirecionar para página de login
function redirecionarParaLogin() {
    alert('Você precisa fazer login para acessar esta página.');
    window.location.href = 'inicio.html';
}

// Funções globais para serem chamadas do HTML
window.toggleEdicao = toggleEdicao;
window.cancelarEdicao = cancelarEdicao;
window.alterarFoto = alterarFoto;
window.abrirModalConsulta = abrirModalConsulta;
window.fecharModal = fecharModal;