// FUNCIONALIDADES DA PÁGINA DO USUÁRIO - PARTE 1: INICIALIZAÇÃO E CONFIGURAÇÃO

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
        
        // Verificar se temos ID do usuário
        if (!usuarioLogado.id_usuario && !usuarioLogado.id) {
            console.error('ID do usuário não encontrado no localStorage');
            redirecionarParaLogin();
            return;
        }

        // Garantir que temos o ID correto
        if (!usuarioLogado.id_usuario && usuarioLogado.id) {
            usuarioLogado.id_usuario = usuarioLogado.id;
        }
        
        // Inicializar componentes da página em sequência para melhor controle
        await atualizarInterface();
        await carregarPerfilUsuario();
        await carregarHistoricoCompleto();
        await inicializarDicas();
        
        configurarEventos();
        
        console.log('Página inicializada com sucesso');
        
    } catch (error) {
        console.error('Erro ao inicializar página:', error);
        mostrarAlerta('Erro ao carregar dados da página: ' + error.message, 'error');
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

    // Garantir que o email seja exibido corretamente
    const emailInput = document.getElementById('email');
    if (emailInput && usuarioLogado.email) {
        emailInput.value = usuarioLogado.email;
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

// Carregar dados do perfil do usuário - CORRIGIDO
async function carregarPerfilUsuario() {
    if (!usuarioLogado?.id_usuario) {
        console.error('ID do usuário não encontrado');
        mostrarAlerta('Erro: ID do usuário não encontrado', 'error');
        return;
    }
    
    console.log('Carregando perfil do usuário:', usuarioLogado.id_usuario);
    
    try {
        // Tentar diferentes endpoints para garantir compatibilidade
        let response;
        let perfil;
        
        // Primeira tentativa: endpoint específico para dados
        try {
            response = await fetch(`${API_BASE_URL}/dados/${usuarioLogado.id_usuario}`);
            if (response.ok) {
                perfil = await response.json();
                console.log('Perfil carregado via /dados:', perfil);
            }
        } catch (error) {
            console.log('Erro no endpoint /dados:', error.message);
        }
        
        // Segunda tentativa: endpoint de perfil
        if (!perfil) {
            try {
                response = await fetch(`${API_BASE_URL}/perfil/${usuarioLogado.id_usuario}`);
                if (response.ok) {
                    perfil = await response.json();
                    console.log('Perfil carregado via /perfil:', perfil);
                }
            } catch (error) {
                console.log('Erro no endpoint /perfil:', error.message);
            }
        }
        
        // Terceira tentativa: buscar por ID de paciente se existir
        if (!perfil && usuarioLogado.id_paciente) {
            try {
                response = await fetch(`${API_BASE_URL}/paciente/${usuarioLogado.id_paciente}`);
                if (response.ok) {
                    perfil = await response.json();
                    console.log('Perfil carregado via /paciente:', perfil);
                }
            } catch (error) {
                console.log('Erro no endpoint /paciente:', error.message);
            }
        }
        
        if (!perfil || !response.ok) {
            throw new Error(`Erro ao carregar perfil: ${response?.status || 'Servidor indisponível'}`);
        }
        
        // Garantir que o email do login seja preservado
        if (!perfil.email && usuarioLogado.email) {
            perfil.email = usuarioLogado.email;
            console.log('Email do login preservado:', perfil.email);
        }
        
        // Armazenar dados originais para cancelar edição
        dadosOriginais = { ...perfil };
        
        // Preencher formulário
        preencherFormularioPerfil(perfil);
        
        // Atualizar foto de perfil
        atualizarFotoPerfil(perfil.foto_perfil);
        
        // Atualizar dados do usuário logado
        usuarioLogado = { ...usuarioLogado, ...perfil };
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
        
        console.log('Perfil carregado e interface atualizada com sucesso');
        
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        mostrarAlerta('Erro ao carregar dados do perfil: ' + error.message, 'error');
        
        // Fallback: usar dados do localStorage se disponível
        if (usuarioLogado.email) {
            console.log('Usando dados do localStorage como fallback');
            preencherFormularioPerfil(usuarioLogado);
            dadosOriginais = { ...usuarioLogado };
        }
    }
}

// Preencher formulário do perfil - CORRIGIDO
function preencherFormularioPerfil(dados) {
    console.log('Preenchendo formulário com dados:', dados);
    
    const campos = [
        { id: 'nome', valor: dados.nome || dados.username || '' },
        { id: 'email', valor: dados.email || '' },
        { id: 'telefone', valor: dados.telefone || dados.phone || '' },
        { id: 'endereco', valor: dados.endereco || dados.address || '' },
        { id: 'data_nascimento', valor: dados.data_nascimento ? dados.data_nascimento.split('T')[0] : '' }
    ];

    campos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        if (elemento) {
            elemento.value = campo.valor;
            console.log(`Campo ${campo.id} preenchido com: ${campo.valor}`);
        } else {
            console.warn(`Elemento com ID ${campo.id} não encontrado`);
        }
    });
    
    // Garantir que o email seja readonly
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.setAttribute('readonly', true);
        emailInput.style.backgroundColor = '#f5f5f5';
        emailInput.style.border = '1px solid #ccc';
    }
}

// Atualizar foto de perfil
function atualizarFotoPerfil(fotoPerfil) {
    const fotoPreview = document.getElementById('foto-preview');
    if (!fotoPreview) return;
    
    if (fotoPerfil) {
        const imgUrl = fotoPerfil.startsWith('http') ? fotoPerfil : `http://localhost:3000${fotoPerfil}`;
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

// Redirecionar para página de login
function redirecionarParaLogin() {
    alert('Você precisa fazer login para acessar esta página.');
    window.location.href = 'inicio.html';
}

// FUNCIONALIDADES DA PÁGINA DO USUÁRIO - PARTE 2: EDIÇÃO DE PERFIL E HISTÓRICO

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
        if (input.id !== 'email') { // Email sempre readonly
            input.setAttribute('readonly', true);
        }
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

// Carregar histórico de consultas - CORRIGIDO
async function carregarHistoricoCompleto() {
    const container = document.getElementById('historico-completo');
    if (!container) {
        console.log('Container historico-completo não encontrado');
        return;
    }
    
    if (!usuarioLogado?.id_usuario) {
        console.error('ID do usuário não encontrado para carregar histórico');
        container.innerHTML = '<div class="error"><p>Erro: usuário não identificado</p></div>';
        return;
    }
    
    console.log('Carregando histórico de consultas para usuário:', usuarioLogado.id_usuario);
    container.innerHTML = '<div class="loading">Carregando histórico...</div>';

    try {
        // Tentar múltiplos endpoints para carregar o histórico
        let response;
        let historico = null;
        
        const endpointsParaTentar = [
            `${API_BASE_URL}/fichas/${usuarioLogado.id_usuario}`,
            `${API_BASE_URL}/historico/${usuarioLogado.id_usuario}`,
            `${API_BASE_URL}/consultas/${usuarioLogado.id_usuario}`
        ];
        
        // Se tiver ID de paciente, adicionar endpoint específico
        if (usuarioLogado.id_paciente) {
            endpointsParaTentar.unshift(`${API_BASE_URL}/paciente/fichas/${usuarioLogado.id_paciente}`);
        }
        
        for (const endpoint of endpointsParaTentar) {
            try {
                console.log('Tentando endpoint:', endpoint);
                response = await fetch(endpoint);
                
                if (response.ok) {
                    historico = await response.json();
                    console.log('Histórico carregado de:', endpoint, historico);
                    break;
                } else {
                    console.log('Endpoint falhou:', endpoint, 'Status:', response.status);
                }
            } catch (error) {
                console.log('Erro no endpoint:', endpoint, error.message);
                continue;
            }
        }
        
        if (!historico) {
            throw new Error('Nenhum endpoint de histórico respondeu');
        }

        // Verificar se o histórico tem dados
        if (Array.isArray(historico) && historico.length > 0) {
            console.log(`Renderizando ${historico.length} consultas do histórico`);
            renderizarHistorico(historico, container);
        } else if (historico && historico.fichas && Array.isArray(historico.fichas)) {
            // Caso o histórico venha encapsulado
            console.log(`Renderizando ${historico.fichas.length} consultas do histórico (encapsulado)`);
            renderizarHistorico(historico.fichas, container);
        } else {
            console.log('Nenhuma consulta encontrada no histórico');
            container.innerHTML = `
                <div class="no-data">
                    <h3>📋 Histórico de Consultas</h3>
                    <p>Você ainda não possui consultas registradas.</p>
                    <p>Após suas consultas, elas aparecerão aqui para que você possa acompanhar seu histórico médico.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        container.innerHTML = `
            <div class="error">
                <h3>❌ Erro ao Carregar Histórico</h3>
                <p>Não foi possível carregar seu histórico de consultas.</p>
                <p>Detalhes: ${error.message}</p>
                <button onclick="carregarHistoricoCompleto()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🔄 Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Renderizar histórico de consultas - MELHORADO
function renderizarHistorico(historico, container) {
    if (!Array.isArray(historico) || historico.length === 0) {
        container.innerHTML = '<div class="no-data"><p>Nenhuma consulta encontrada no histórico.</p></div>';
        return;
    }
    
    let html = '<div class="historico-lista"><h3>📋 Seu Histórico de Consultas</h3>';
    
    // Ordenar por data mais recente primeiro
    const historicoOrdenado = historico.sort((a, b) => new Date(b.data_consulta) - new Date(a.data_consulta));
    
    historicoOrdenado.forEach((ficha, index) => {
        try {
            const dataConsulta = new Date(ficha.data_consulta);
            const dataFormatada = dataConsulta.toLocaleDateString('pt-BR');
            const horaFormatada = dataConsulta.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            const idFicha = ficha.id_ficha || ficha.id || index;
            const queixa = ficha.queixa_principal || ficha.queixa || 'Não informada';
            
            html += `
                <div class="historico-item" onclick="abrirModalConsulta(${idFicha})" style="cursor: pointer; margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
                    <div class="historico-header" style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: #333;">🩺 Consulta - ${dataFormatada}</h4>
                        <span class="historico-status" style="background: #28a745; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Concluída</span>
                    </div>
                    <div class="historico-info">
                        <p style="margin: 5px 0;"><strong>⏰ Horário:</strong> ${horaFormatada}</p>
                        <p style="margin: 5px 0;"><strong>🗣️ Queixa:</strong> ${queixa}</p>
                        <p class="click-detail" style="margin: 10px 0 0 0; font-size: 12px; color: #666; font-style: italic;">👆 Clique para ver detalhes completos</p>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Erro ao renderizar ficha:', ficha, error);
        }
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    console.log(`Histórico renderizado com ${historicoOrdenado.length} consultas`);
}

// Abrir modal com detalhes da consulta - CORRIGIDO
async function abrirModalConsulta(idFicha) {
    const modal = document.getElementById('modal-consulta');
    const modalBody = document.getElementById('modal-body-consulta');
    
    if (!modal || !modalBody) {
        console.error('Elementos do modal não encontrados');
        mostrarAlerta('Erro: modal não encontrado na página', 'error');
        return;
    }
    
    console.log('Abrindo modal para ficha:', idFicha);
    
    modalBody.innerHTML = '<div style="text-align: center; padding: 20px;"><p>🔄 Carregando detalhes da consulta...</p></div>';
    modal.style.display = 'block';

    try {
        // Tentar diferentes endpoints para buscar os detalhes
        let response;
        let detalhes = null;
        
        const endpointsParaTentar = [
            `${API_BASE_URL}/ficha/${idFicha}`,
            `${API_BASE_URL}/consulta/${idFicha}`,
            `${API_BASE_URL}/fichas/detalhes/${idFicha}`
        ];
        
        for (const endpoint of endpointsParaTentar) {
            try {
                console.log('Tentando buscar detalhes em:', endpoint);
                response = await fetch(endpoint);
                
                if (response.ok) {
                    detalhes = await response.json();
                    console.log('Detalhes carregados de:', endpoint, detalhes);
                    break;
                }
            } catch (error) {
                console.log('Erro no endpoint:', endpoint, error.message);
                continue;
            }
        }
        
        if (!detalhes) {
            throw new Error('Não foi possível carregar os detalhes da consulta');
        }

        renderizarDetalhesConsulta(detalhes, modalBody);
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        modalBody.innerHTML = `
            <div class="error" style="text-align: center; padding: 20px;">
                <h3>❌ Erro ao Carregar Detalhes</h3>
                <p>Não foi possível carregar os detalhes desta consulta.</p>
                <p style="font-size: 12px; color: #666;">Detalhes: ${error.message}</p>
                <button onclick="fecharModal()" style="margin-top: 15px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    ✖️ Fechar
                </button>
            </div>
        `;
    }
}

// Renderizar detalhes da consulta no modal
function renderizarDetalhesConsulta(detalhes, container) {
    try {
        const dataFormatada = new Date(detalhes.data_consulta).toLocaleDateString('pt-BR');
        const horaFormatada = new Date(detalhes.data_consulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        container.innerHTML = `
            <div class="consulta-detalhes" style="padding: 20px;">
                <h3 style="text-align: center; color: #333; margin-bottom: 20px;">📋 Detalhes da Consulta</h3>
                
                <div class="detalhe-item" style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                    <strong>📅 Data da Consulta:</strong>
                    <span style="margin-left: 10px;">${dataFormatada} às ${horaFormatada}</span>
                </div>
                
                <div class="detalhe-item" style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                    <strong>🩺 Queixa Principal:</strong>
                    <span style="margin-left: 10px;">${detalhes.queixa_principal || detalhes.queixa || 'Não informado'}</span>
                </div>
                
                <div class="detalhe-item" style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                    <strong>📋 Histórico Médico:</strong>
                    <span style="margin-left: 10px;">${detalhes.historico_medico || detalhes.historico || 'Não informado'}</span>
                </div>
                
                <div class="detalhe-item" style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                    <strong>📝 Observações:</strong>
                    <span style="margin-left: 10px;">${detalhes.observacoes || detalhes.observacao || 'Nenhuma observação registrada'}</span>
                </div>
                
                ${detalhes.prescricao ? `
                <div class="detalhe-item" style="margin-bottom: 15px; padding: 10px; background: #e8f5e8; border-radius: 5px;">
                    <strong>💊 Prescrição:</strong>
                    <span style="margin-left: 10px;">${detalhes.prescricao}</span>
                </div>
                ` : ''}
                
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="fecharModal()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        ✖️ Fechar
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao renderizar detalhes:', error);
        container.innerHTML = `
            <div class="error" style="text-align: center; padding: 20px;">
                <p>Erro ao exibir detalhes da consulta</p>
                <button onclick="fecharModal()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Fechar
                </button>
            </div>
        `;
    }
}

// Fechar modal de consulta
function fecharModal() {
    const modal = document.getElementById('modal-consulta');
    if (modal) {
        modal.style.display = 'none';
    }
}
// CORREÇÕES PARA HISTÓRICO E EMAIL - ADICIONAR AO FINAL DO ARQUIVO usuario.js

// Função corrigida para inicializar dados do usuário
async function inicializarDadosUsuario() {
    try {
        const usuarioStorage = localStorage.getItem('usuarioLogado');
        if (!usuarioStorage) {
            console.log('Nenhum usuário logado encontrado');
            redirecionarParaLogin();
            return false;
        }

        usuarioLogado = JSON.parse(usuarioStorage);
        console.log('Dados do usuário do localStorage:', usuarioLogado);
        
        // Garantir que temos o email do login
        if (!usuarioLogado.email && usuarioLogado.username) {
            usuarioLogado.email = usuarioLogado.username;
        }
        
        // Garantir que temos o ID correto
        if (!usuarioLogado.id_usuario) {
            if (usuarioLogado.id) {
                usuarioLogado.id_usuario = usuarioLogado.id;
            } else {
                console.error('ID do usuário não encontrado');
                redirecionarParaLogin();
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao inicializar dados do usuário:', error);
        redirecionarParaLogin();
        return false;
    }
}

// Função corrigida para carregar dados do perfil com preservação do email
async function carregarDadosPerfilCorrigido() {
    if (!usuarioLogado?.id_usuario) {
        console.error('ID do usuário não encontrado');
        return;
    }
    
    console.log('Carregando dados do perfil para usuário:', usuarioLogado.id_usuario);
    
    try {
        // Preservar email do login
        const emailOriginal = usuarioLogado.email;
        
        let response;
        let perfil = null;
        
        // Tentar endpoint de dados do usuário
        try {
            response = await fetch(`${API_BASE_URL}/${usuarioLogado.id_usuario}`);
            if (response.ok) {
                perfil = await response.json();
                console.log('Perfil carregado:', perfil);
            }
        } catch (error) {
            console.log('Erro ao carregar perfil:', error.message);
        }
        
        // Se não conseguiu carregar, usar dados do localStorage
        if (!perfil) {
            console.log('Usando dados do localStorage como fallback');
            perfil = { ...usuarioLogado };
        }
        
        // Garantir que o email do login seja mantido
        if (emailOriginal && !perfil.email) {
            perfil.email = emailOriginal;
            console.log('Email do login preservado:', emailOriginal);
        }
        
        // Atualizar dados globais
        usuarioLogado = { ...usuarioLogado, ...perfil };
        dadosOriginais = { ...perfil };
        
        // Preencher formulário
        preencherFormularioCorrigido(perfil);
        
        // Atualizar foto
        atualizarFotoPerfil(perfil.foto_perfil);
        
        console.log('Dados do perfil carregados com sucesso');
        
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        // Usar dados do localStorage mesmo com erro
        preencherFormularioCorrigido(usuarioLogado);
        dadosOriginais = { ...usuarioLogado };
    }
}

// Função corrigida para preencher formulário garantindo que email apareça
function preencherFormularioCorrigido(dados) {
    console.log('Preenchendo formulário com dados corrigidos:', dados);
    
    // Lista de campos com suas possíveis origens
    const campos = [
        { id: 'nome', valor: dados.nome || dados.username || dados.name || '' },
        { id: 'email', valor: dados.email || dados.username || '' },
        { id: 'telefone', valor: dados.telefone || dados.phone || dados.tel || '' },
        { id: 'endereco', valor: dados.endereco || dados.address || dados.addr || '' },
        { id: 'data_nascimento', valor: dados.data_nascimento ? dados.data_nascimento.split('T')[0] : (dados.birth_date ? dados.birth_date.split('T')[0] : '') }
    ];

    campos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        if (elemento) {
            elemento.value = campo.valor;
            console.log(`✓ Campo ${campo.id} preenchido: "${campo.valor}"`);
            
            // Configurar email como readonly
            if (campo.id === 'email') {
                elemento.setAttribute('readonly', true);
                elemento.style.backgroundColor = '#f8f9fa';
                elemento.style.border = '1px solid #ced4da';
                elemento.style.color = '#495057';
            }
        } else {
            console.warn(`⚠️ Elemento ${campo.id} não encontrado no DOM`);
        }
    });
}

// Função corrigida para carregar histórico com debug detalhado
async function carregarHistoricoCorrigido() {
    const container = document.getElementById('historico-completo');
    if (!container) {
        console.error('Container historico-completo não encontrado no DOM');
        return;
    }
    
    if (!usuarioLogado?.id_usuario) {
        console.error('ID do usuário não encontrado para carregar histórico');
        container.innerHTML = '<div class="error"><p>❌ Erro: usuário não identificado</p></div>';
        return;
    }
    
    console.log('🔄 Carregando histórico para usuário ID:', usuarioLogado.id_usuario);
    container.innerHTML = '<div class="loading" style="text-align: center; padding: 20px;"><p>🔄 Carregando histórico de consultas...</p></div>';

    try {
        const endpoints = [
            `${API_BASE_URL}/historico/${usuarioLogado.id_usuario}`,
            `${API_BASE_URL}/consultas/${usuarioLogado.id_usuario}`,
            `${API_BASE_URL}/fichas/${usuarioLogado.id_usuario}`,
            `http://localhost:3000/api/consultas/usuario/${usuarioLogado.id_usuario}`,
            `http://localhost:3000/api/fichas/usuario/${usuarioLogado.id_usuario}`
        ];
        
        let historico = null;
        let endpointUsado = null;
        
        for (const endpoint of endpoints) {
            try {
                console.log(`🔍 Tentando endpoint: ${endpoint}`);
                const response = await fetch(endpoint);
                console.log(`📡 Response status: ${response.status} para ${endpoint}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Dados recebidos de ${endpoint}:`, data);
                    
                    if (Array.isArray(data) && data.length > 0) {
                        historico = data;
                        endpointUsado = endpoint;
                        break;
                    } else if (data && data.historico && Array.isArray(data.historico)) {
                        historico = data.historico;
                        endpointUsado = endpoint;
                        break;
                    } else if (data && data.consultas && Array.isArray(data.consultas)) {
                        historico = data.consultas;
                        endpointUsado = endpoint;
                        break;
                    } else {
                        console.log(`📄 Endpoint ${endpoint} retornou dados vazios ou inválidos`);
                    }
                } else {
                    console.log(`❌ Endpoint ${endpoint} falhou com status: ${response.status}`);
                }
            } catch (error) {
                console.log(`💥 Erro no endpoint ${endpoint}:`, error.message);
                continue;
            }
        }
        
        if (historico && historico.length > 0) {
            console.log(`✅ Histórico carregado com sucesso de ${endpointUsado}:`, historico.length, 'consultas');
            renderizarHistoricoCorrigido(historico, container);
        } else {
            console.log('📋 Nenhuma consulta encontrada no histórico');
            container.innerHTML = `
                <div class="no-data" style="text-align: center; padding: 30px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;">
                    <h3 style="color: #6c757d; margin-bottom: 15px;">📋 Histórico de Consultas</h3>
                    <p style="color: #6c757d; margin-bottom: 10px;">Você ainda não possui consultas registradas.</p>
                    <p style="color: #6c757d; font-size: 14px;">Após suas primeiras consultas, elas aparecerão aqui para acompanhamento.</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('💥 Erro geral ao carregar histórico:', error);
        container.innerHTML = `
            <div class="error" style="text-align: center; padding: 20px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; color: #721c24;">
                <h3>❌ Erro ao Carregar Histórico</h3>
                <p>Não foi possível carregar seu histórico de consultas.</p>
                <p style="font-size: 12px; margin-top: 10px;">Detalhes técnicos: ${error.message}</p>
                <button onclick="carregarHistoricoCorrigido()" style="margin-top: 15px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🔄 Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Função corrigida para renderizar histórico com melhor formatação
function renderizarHistoricoCorrigido(historico, container) {
    if (!Array.isArray(historico) || historico.length === 0) {
        container.innerHTML = '<div class="no-data"><p>Nenhuma consulta encontrada.</p></div>';
        return;
    }
    
    console.log(`🎨 Renderizando ${historico.length} consultas do histórico`);
    
    let html = `
        <div class="historico-lista" style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="text-align: center; color: #333; margin-bottom: 25px; font-size: 24px;">📋 Seu Histórico de Consultas</h3>
    `;
    
    // Ordenar por data mais recente
    const historicoOrdenado = historico.sort((a, b) => {
        const dataA = new Date(a.data_consulta || a.data || a.created_at);
        const dataB = new Date(b.data_consulta || b.data || b.created_at);
        return dataB - dataA;
    });
    
    historicoOrdenado.forEach((consulta, index) => {
        try {
            const dataConsulta = new Date(consulta.data_consulta || consulta.data || consulta.created_at);
            const dataFormatada = dataConsulta.toLocaleDateString('pt-BR');
            const horaFormatada = dataConsulta.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            const idConsulta = consulta.id_ficha || consulta.id_consulta || consulta.id || index;
            const queixa = consulta.queixa_principal || consulta.queixa || consulta.motivo || 'Consulta de rotina';
            const status = consulta.status || 'Concluída';
            
            html += `
                <div class="historico-item" onclick="abrirModalConsulta(${idConsulta})" 
                     style="cursor: pointer; margin-bottom: 15px; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; background: #f8f9fa; transition: all 0.3s ease; hover: background-color: #e9ecef;">
                    <div class="historico-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h4 style="margin: 0; color: #495057; font-size: 18px;">🩺 Consulta - ${dataFormatada}</h4>
                        <span class="status-badge" style="background: #28a745; color: white; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: bold;">
                            ${status}
                        </span>
                    </div>
                    <div class="historico-info">
                        <p style="margin: 8px 0; color: #6c757d;"><strong>⏰ Horário:</strong> ${horaFormatada}</p>
                        <p style="margin: 8px 0; color: #6c757d;"><strong>🗣️ Motivo:</strong> ${queixa}</p>
                        <p class="click-hint" style="margin: 12px 0 0 0; font-size: 13px; color: #007bff; font-style: italic;">
                            👆 Clique para ver detalhes completos da consulta
                        </p>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Erro ao renderizar consulta:', consulta, error);
        }
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    console.log(`✅ Histórico renderizado com sucesso: ${historicoOrdenado.length} consultas`);
}

// Função para atualizar interface com email garantido
function atualizarInterfaceCorrigida() {
    if (!usuarioLogado) return;
    
    console.log('🔄 Atualizando interface com dados:', usuarioLogado);
    
    // Atualizar mensagem de boas-vindas
    const welcomeElement = document.getElementById('welcome-message');
    if (welcomeElement) {
        const nome = usuarioLogado.nome || usuarioLogado.username || 'Usuário';
        welcomeElement.textContent = `Bem-vindo, ${nome}!`;
        console.log('✅ Welcome message atualizada');
    }
    
    // Atualizar foto do header
    const fotoHeader = document.getElementById('header-foto');
    if (fotoHeader) {
        if (usuarioLogado.foto_perfil) {
            const fotoUrl = usuarioLogado.foto_perfil.startsWith('http') 
                ? usuarioLogado.foto_perfil 
                : `http://localhost:3000${usuarioLogado.foto_perfil}`;
            fotoHeader.src = fotoUrl;
            fotoHeader.onerror = () => {
                fotoHeader.src = 'images/user-placeholder.jpg';
            };
        } else {
            fotoHeader.src = 'images/user-placeholder.jpg';
        }
        console.log('✅ Foto do header atualizada');
    }

    // Garantir que o email seja exibido no campo
    const emailInput = document.getElementById('email');
    if (emailInput) {
        const email = usuarioLogado.email || usuarioLogado.username || '';
        emailInput.value = email;
        emailInput.setAttribute('readonly', true);
        emailInput.style.backgroundColor = '#f8f9fa';
        emailInput.style.border = '1px solid #ced4da';
        console.log('✅ Email atualizado no campo:', email);
    }
}

// Substituir a função de inicialização original
async function inicializarPaginaCorrigida() {
    try {
        console.log('🚀 Iniciando carregamento da página...');
        
        // 1. Inicializar dados do usuário
        const usuarioValido = await inicializarDadosUsuario();
        if (!usuarioValido) return;
        
        // 2. Atualizar interface básica
        atualizarInterfaceCorrigida();
        
        // 3. Carregar dados do perfil (com email preservado)
        await carregarDadosPerfilCorrigido();
        
        // 4. Carregar histórico corrigido
        await carregarHistoricoCorrigido();
        
        // 5. Carregar dicas se função existir
        if (typeof inicializarDicas === 'function') {
            await inicializarDicas();
        }
        
        // 6. Configurar eventos
        configurarEventos();
        
        console.log('✅ Página inicializada com sucesso!');
        
    } catch (error) {
        console.error('💥 Erro ao inicializar página:', error);
        mostrarAlerta('Erro ao carregar dados da página: ' + error.message, 'error');
    }
}

// Tornar funções globais
window.carregarHistoricoCorrigido = carregarHistoricoCorrigido;
window.inicializarPaginaCorrigida = inicializarPaginaCorrigida;

// Substituir o evento de inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando página corrigida...');
    inicializarPaginaCorrigida();
});