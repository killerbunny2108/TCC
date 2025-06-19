// FUNCIONALIDADES DA PÁGINA DO USUÁRIO - VERSÃO CORRIGIDA

// Variáveis globais
let usuarioLogado = null;
let perfilEditando = false;
let dadosOriginais = {};

// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api/usuario';
const DICAS_API_URL = 'http://localhost:3000/api/dicas';

// Definir funções globais imediatamente
window.toggleEdicao = toggleEdicao;
window.cancelarEdicao = cancelarEdicao;
window.alterarFoto = alterarFoto;
window.abrirModalConsulta = abrirModalConsulta;
window.fecharModal = fecharModal;
window.fecharModalCrop = fecharModalCrop;
window.salvarFotoCropada = salvarFotoCropada;

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
            inicializarDicas()
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
            fotoHeader.src = `http://localhost:3000${usuarioLogado.foto_perfil}`;
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
        const imgUrl = `http://localhost:3000${fotoPerfil}`;
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

// Carregar dicas de saúde - CORRIGIDO para buscar do admin
// Função principal para carregar dicas com múltiplas tentativas
async function carregarDicas() {
    const container = document.getElementById('lista-dicas-clientes');
    const loading = document.getElementById('loading-dicas');
    
    if (!container) {
        console.log('Container lista-dicas-clientes não encontrado');
        return;
    }
    
    console.log('Iniciando carregamento de dicas...');
    
    if (loading) loading.style.display = 'block';
    
    // Array de URLs para tentar em ordem
    const urlsTentar = [
        'http://localhost:3000/api/dicas',           // Rota do admin
        'http://localhost:3000/api/usuario/dicas',   // Rota específica do usuário
        '/api/dicas',                                // Rota relativa 1
        '/api/usuario/dicas'                         // Rota relativa 2
    ];
    
    let dicasCarregadas = false;
    
    // Tentar cada URL até conseguir
    for (let i = 0; i < urlsTentar.length; i++) {
        const url = urlsTentar[i];
        console.log(`Tentativa ${i + 1}: Tentando carregar dicas de: ${url}`);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Adicionar headers para CORS se necessário
                    'Accept': 'application/json'
                },
                // Timeout de 10 segundos
                signal: AbortSignal.timeout(10000)
            });
            
            console.log(`Status da resposta para ${url}:`, response.status);
            
            if (response.ok) {
                const dicas = await response.json();
                console.log(`Dicas carregadas com sucesso de ${url}:`, dicas);
                
                if (loading) loading.style.display = 'none';
                renderizarDicas(dicas, container);
                dicasCarregadas = true;
                break; // Sucesso! Sair do loop
                
            } else {
                console.log(`Falha na URL ${url}:`, response.status, response.statusText);
                continue; // Tentar próxima URL
            }
            
        } catch (error) {
            console.log(`Erro ao tentar ${url}:`, error.message);
            continue; // Tentar próxima URL
        }
    }
    
    // Se nenhuma URL funcionou, mostrar dicas estáticas
    if (!dicasCarregadas) {
        console.log('Todas as tentativas falharam, carregando dicas estáticas');
        if (loading) loading.style.display = 'none';
        mostrarDicasEstaticas(container);
    }
}

// Função para verificar se o servidor está rodando
async function verificarServidor() {
    const urlsTestar = [
        'http://localhost:3000/api/dicas',
        'http://localhost:3000/api/usuario/dicas'
    ];
    
    console.log('Verificando conectividade com o servidor...');
    
    for (const url of urlsTestar) {
        try {
            const response = await fetch(url, { 
                method: 'HEAD',  // Apenas verificar se a rota existe
                signal: AbortSignal.timeout(5000) 
            });
            console.log(`✅ Servidor respondeu para ${url}:`, response.status);
            return true;
        } catch (error) {
            console.log(`❌ Servidor não respondeu para ${url}:`, error.message);
        }
    }
    
    console.log('⚠️ Servidor não está respondendo em nenhuma das rotas testadas');
    return false;
}

// Função melhorada para renderizar dicas
function renderizarDicas(dicas, container) {
    if (!container) {
        console.error('Container não fornecido para renderizarDicas');
        return;
    }
    
    if (!Array.isArray(dicas)) {
        console.log('Dicas não é um array:', dicas);
        mostrarDicasEstaticas(container);
        return;
    }
    
    if (dicas.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <p>📝 Nenhuma dica disponível no momento.</p>
                <p>O administrador ainda não adicionou dicas.</p>
            </div>
        `;
        return;
    }
    
    console.log(`Renderizando ${dicas.length} dicas`);
    container.innerHTML = '';
    
    dicas.forEach((dica, index) => {
        const div = document.createElement('div');
        div.className = 'dicas-item';
        
        // Garantir que os campos existam
        const titulo = dica.titulo || dica.title || `Dica ${index + 1}`;
        const descricao = dica.descricao || dica.description || 'Descrição não disponível';
        
        div.innerHTML = `
            <span class="dica-icon">💡</span>
            <h3>${titulo}</h3>
            <p>${descricao}</p>
        `;
        container.appendChild(div);
    });
    
    console.log('Dicas renderizadas com sucesso');
}

// Dicas estáticas melhoradas como fallback
function mostrarDicasEstaticas(container) {
    console.log('Carregando dicas estáticas como fallback');
    
    const dicasEstaticas = [
        {
            titulo: "💧 Hidratação Adequada",
            descricao: "Beba pelo menos 2 litros de água por dia para manter seu corpo hidratado e auxiliar no bom funcionamento dos órgãos."
        },
        {
            titulo: "🏃 Exercícios Regulares",
            descricao: "Pratique pelo menos 30 minutos de atividade física por dia para manter sua saúde física e mental em dia."
        },
        {
            titulo: "🥗 Alimentação Equilibrada",
            descricao: "Mantenha uma dieta rica em frutas, vegetais, proteínas magras e grãos integrais para nutrir seu corpo adequadamente."
        },
        {
            titulo: "😴 Sono Reparador",
            descricao: "Durma entre 7 a 8 horas por noite para permitir que seu corpo e mente se recuperem adequadamente."
        },
        {
            titulo: "🧘 Gerenciamento do Estresse",
            descricao: "Pratique técnicas de relaxamento como meditação, respiração profunda ou yoga para reduzir o estresse diário."
        },
        {
            titulo: "☀️ Exposição Solar Moderada",
            descricao: "Tome sol por 15-20 minutos diários para produção de vitamina D, sempre com proteção adequada."
        }
    ];
    
    // Adicionar aviso de que são dicas padrão
    container.innerHTML = `
        <div class="dicas-fallback-notice">
            <p><i>⚠️ Conectando com o servidor... Exibindo dicas padrão por enquanto.</i></p>
        </div>
    `;
    
    renderizarDicas(dicasEstaticas, container);
}

// Função de inicialização melhorada
async function inicializarDicas() {
    console.log('=== INICIANDO CARREGAMENTO DE DICAS ===');
    
    // Primeiro verificar se o servidor está rodando
    const servidorOK = await verificarServidor();
    
    if (servidorOK) {
        console.log('✅ Servidor está online, carregando dicas...');
        await carregarDicas();
    } else {
        console.log('❌ Servidor offline, mostrando dicas estáticas');
        const container = document.getElementById('lista-dicas-clientes');
        if (container) {
            mostrarDicasEstaticas(container);
        }
    }
    
    console.log('=== CARREGAMENTO DE DICAS FINALIZADO ===');
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

// Funções para modal de crop (se necessário)
function fecharModalCrop() {
    const modal = document.getElementById('modal-crop');
    if (modal) {
        modal.style.display = 'none';
    }
}

function salvarFotoCropada() {
    // Implementar se necessário
    console.log('Salvar foto cropada não implementado');
    fecharModalCrop();
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