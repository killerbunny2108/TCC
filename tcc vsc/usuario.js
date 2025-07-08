// Variáveis globais
let usuarioAtual = null;
let modoEdicao = false;
let dadosOriginais = {};

// Aguardar o DOM estar carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando sistema...');
    
    // Verificar se o usuário está logado
    const emailUsuario = obterEmailUsuario();
    
    if (!emailUsuario) {
        console.error('Usuário não encontrado, redirecionando para login...');
        window.location.href = 'login.html';
        return;
    }
    
    // Inicializar o sistema
    inicializarSistema(emailUsuario);
});

// Função para obter email do usuário de diferentes fontes
function obterEmailUsuario() {
    // Tentar diferentes chaves de storage
    const possiveisChaves = [
        'emailUsuario',
        'email',
        'userEmail',
        'usuario_email',
        'loginEmail'
    ];
    
    // Verificar localStorage
    for (const chave of possiveisChaves) {
        const email = localStorage.getItem(chave);
        if (email) {
            console.log(`Email encontrado em localStorage[${chave}]: ${email}`);
            return email;
        }
    }
    
    // Verificar sessionStorage
    for (const chave of possiveisChaves) {
        const email = sessionStorage.getItem(chave);
        if (email) {
            console.log(`Email encontrado em sessionStorage[${chave}]: ${email}`);
            return email;
        }
    }
    
    console.error('Email não encontrado em nenhum storage');
    return null;
}

// Função principal para inicializar o sistema
async function inicializarSistema(email) {
    try {
        // Atualizar status
        atualizarStatus('Carregando dados do usuário...');
        
        // Carregar dados do usuário
        await carregarDadosUsuario(email);
        
        // Carregar dicas
        await carregarDicas();
        
        // Carregar histórico de consultas
        await carregarHistorico(email);
        
        // Configurar eventos
        configurarEventos();
        
        atualizarStatus('Sistema carregado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao inicializar sistema:', error);
        atualizarStatus('Erro ao carregar dados do usuário');
    }
}

// Função para atualizar status de debug
function atualizarStatus(mensagem) {
    const statusElement = document.getElementById('historico-status');
    if (statusElement) {
        statusElement.textContent = mensagem;
    }
    console.log('Status:', mensagem);
}

// Carregar dados do usuário
async function carregarDadosUsuario(email) {
    try {
        console.log('Carregando dados do usuário:', email);
        
        const response = await fetch('/api/usuario/dados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const resultado = await response.json();
        
        if (resultado.sucesso) {
            usuarioAtual = resultado.usuario;
            preencherDadosUsuario(resultado.usuario);
            
            // Atualizar header
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Bem-vindo, ${resultado.usuario.nome || 'Cliente'}!`;
            }
            
            console.log('Dados do usuário carregados:', resultado.usuario);
        } else {
            throw new Error(resultado.erro || 'Erro ao carregar dados do usuário');
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        throw error;
    }
}

// Preencher formulário com dados do usuário
function preencherDadosUsuario(usuario) {
    const campos = ['nome', 'email', 'telefone', 'endereco', 'data_nascimento'];
    
    campos.forEach(campo => {
        const elemento = document.getElementById(campo);
        if (elemento && usuario[campo]) {
            elemento.value = usuario[campo];
        }
    });
    
    // Salvar dados originais para cancelamento
    dadosOriginais = { ...usuario };
    
    // Atualizar foto de perfil se existir
    if (usuario.foto_perfil) {
        const fotoPreview = document.getElementById('foto-preview');
        const headerFoto = document.getElementById('header-foto');
        
        if (fotoPreview) {
            fotoPreview.innerHTML = `<img src="${usuario.foto_perfil}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        }
        
        if (headerFoto) {
            headerFoto.src = usuario.foto_perfil;
        }
    }
}

// Carregar dicas do administrador
async function carregarDicas() {
    try {
        console.log('Carregando dicas...');
        
        const response = await fetch('/api/dicas');
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const resultado = await response.json();
        
        if (resultado.sucesso) {
            exibirDicas(resultado.dicas);
        } else {
            throw new Error(resultado.erro || 'Erro ao carregar dicas');
        }
        
    } catch (error) {
        console.error('Erro ao carregar dicas:', error);
        const container = document.getElementById('lista-dicas-clientes');
        if (container) {
            container.innerHTML = '<p>Erro ao carregar dicas. Tente novamente mais tarde.</p>';
        }
    }
}

// Exibir dicas na interface
function exibirDicas(dicas) {
    const container = document.getElementById('lista-dicas-clientes');
    
    if (!container) return;
    
    if (!dicas || dicas.length === 0) {
        container.innerHTML = '<p>Nenhuma dica disponível no momento.</p>';
        return;
    }
    
    container.innerHTML = dicas.map(dica => `
        <div class="dica-item">
            <h3>${dica.titulo}</h3>
            <p>${dica.descricao}</p>
            <small>Publicado em: ${formatarData(dica.data_publicacao)}</small>
        </div>
    `).join('');
}

// Carregar histórico de consultas
async function carregarHistorico(email) {
    try {
        console.log('Carregando histórico de consultas...');
        atualizarStatus('Carregando histórico de consultas...');
        
        const response = await fetch('/api/usuario/historico', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const resultado = await response.json();
        
        if (resultado.sucesso) {
            exibirHistorico(resultado.consultas);
            atualizarStatus('Histórico carregado com sucesso!');
        } else {
            throw new Error(resultado.erro || 'Erro ao carregar histórico');
        }
        
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        atualizarStatus('Erro ao carregar histórico');
        const container = document.getElementById('consultas-container');
        if (container) {
            container.innerHTML = '<p>Erro ao carregar histórico. Tente novamente mais tarde.</p>';
        }
    }
}

// Exibir histórico de consultas
function exibirHistorico(consultas) {
    const loadingElement = document.getElementById('historico-loading');
    const containerElement = document.getElementById('consultas-container');
    const semConsultasElement = document.getElementById('sem-consultas');
    
    // Ocultar loading
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    if (!consultas || consultas.length === 0) {
        if (semConsultasElement) {
            semConsultasElement.style.display = 'block';
        }
        return;
    }
    
    if (containerElement) {
        containerElement.style.display = 'block';
        containerElement.innerHTML = consultas.map(consulta => `
            <div class="consulta-item" onclick="exibirDetalhesConsulta(${consulta.id})">
                <div class="consulta-header">
                    <span class="consulta-data">${formatarData(consulta.data_atendimento)}</span>
                    <span class="consulta-tipo">${consulta.tipo_atendimento || 'Consulta'}</span>
                </div>
                <div class="consulta-info">
                    <p><strong>Motivo:</strong> ${consulta.motivo_consulta || 'Não informado'}</p>
                    ${consulta.data_atendimento ? `<p><strong>Data:</strong> ${formatarDataHora(consulta.data_atendimento)}</p>` : ''}
                </div>
                <div class="consulta-actions">
                    <button class="btn-detalhes" onclick="event.stopPropagation(); exibirDetalhesConsulta(${consulta.id})">
                        Ver Detalhes
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// Exibir detalhes da consulta em modal
async function exibirDetalhesConsulta(consultaId) {
    try {
        const response = await fetch(`/api/consulta/${consultaId}`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const resultado = await response.json();
        
        if (resultado.sucesso) {
            const consulta = resultado.consulta;
            const modalBody = document.getElementById('modal-body-consulta');
            
            if (modalBody) {
                modalBody.innerHTML = `
                    <div class="consulta-detalhes">
                        <h4>Informações da Consulta</h4>
                        <p><strong>Data:</strong> ${formatarDataHora(consulta.data_atendimento)}</p>
                        <p><strong>Tipo:</strong> ${consulta.tipo_atendimento || 'Consulta'}</p>
                        <p><strong>Motivo:</strong> ${consulta.motivo_consulta || 'Não informado'}</p>
                        
                        ${consulta.observacoes ? `
                            <h4>Observações</h4>
                            <p>${consulta.observacoes}</p>
                        ` : ''}
                        
                        <div class="consulta-meta">
                            <small>Consulta realizada em: ${formatarData(consulta.data_atendimento)}</small>
                        </div>
                    </div>
                `;
            }
            
            // Mostrar modal
            const modal = document.getElementById('modal-consulta');
            if (modal) {
                modal.style.display = 'block';
            }
        }
        
    } catch (error) {
        console.error('Erro ao carregar detalhes da consulta:', error);
        alert('Erro ao carregar detalhes da consulta');
    }
}

// Configurar eventos dos botões e elementos
function configurarEventos() {
    // Botão de agendar consulta
    const btnAgendar = document.getElementById('agendar');
    if (btnAgendar) {
        btnAgendar.addEventListener('click', function() {
            // Integração com Calendly
            if (typeof Calendly !== 'undefined') {
                Calendly.initPopupWidget({
                    url: 'https://calendly.com/seu-link-aqui' // Substitua pelo seu link do Calendly
                });
            } else {
                alert('Sistema de agendamento temporariamente indisponível. Entre em contato conosco.');
            }
        });
    }
    
    // Upload de foto
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.addEventListener('change', function(event) {
            const arquivo = event.target.files[0];
            if (arquivo) {
                processarFoto(arquivo);
            }
        });
    }
    
    // Fechar modal ao clicar no overlay
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                fecharModal();
            }
        });
    });
}

// Alternar modo de edição do perfil
function toggleEdicao() {
    modoEdicao = !modoEdicao;
    
    const campos = document.querySelectorAll('#nome, #telefone, #endereco, #data_nascimento');
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    if (modoEdicao) {
        // Entrar em modo de edição
        campos.forEach(campo => {
            campo.readOnly = false;
            campo.classList.add('editavel');
        });
        
        btnEditar.textContent = 'Salvar';
        btnCancelar.style.display = 'inline-block';
        
    } else {
        // Sair do modo de edição e salvar
        salvarPerfil();
    }
}

// Cancelar edição
function cancelarEdicao() {
    modoEdicao = false;
    
    // Restaurar dados originais
    preencherDadosUsuario(dadosOriginais);
    
    const campos = document.querySelectorAll('#nome, #telefone, #endereco, #data_nascimento');
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    campos.forEach(campo => {
        campo.readOnly = true;
        campo.classList.remove('editavel');
    });
    
    btnEditar.textContent = 'Editar Perfil';
    btnCancelar.style.display = 'none';
}

// Salvar perfil
async function salvarPerfil() {
    try {
        const dadosAtualizados = {
            nome: document.getElementById('nome').value,
            telefone: document.getElementById('telefone').value,
            endereco: document.getElementById('endereco').value,
            data_nascimento: document.getElementById('data_nascimento').value,
            email: usuarioAtual.email // Não permitir alteração do email
        };
        
        const response = await fetch('/api/usuario/atualizar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosAtualizados)
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const resultado = await response.json();
        
        if (resultado.sucesso) {
            // Atualizar dados locais
            usuarioAtual = { ...usuarioAtual, ...dadosAtualizados };
            dadosOriginais = { ...usuarioAtual };
            
            // Sair do modo de edição
            const campos = document.querySelectorAll('#nome, #telefone, #endereco, #data_nascimento');
            const btnEditar = document.getElementById('btn-editar');
            const btnCancelar = document.getElementById('btn-cancelar');
            
            campos.forEach(campo => {
                campo.readOnly = true;
                campo.classList.remove('editavel');
            });
            
            btnEditar.textContent = 'Editar Perfil';
            btnCancelar.style.display = 'none';
            
            alert('Perfil atualizado com sucesso!');
            
        } else {
            throw new Error(resultado.erro || 'Erro ao salvar perfil');
        }
        
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        alert('Erro ao salvar perfil. Tente novamente.');
    }
}

// Processar upload de foto
function processarFoto(arquivo) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const fotoPreview = document.getElementById('foto-preview');
        const headerFoto = document.getElementById('header-foto');
        
        // Criar elemento de imagem temporário
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '50%';
        
        // Atualizar preview
        if (fotoPreview) {
            fotoPreview.innerHTML = '';
            fotoPreview.appendChild(img);
        }
        
        // Atualizar header
        if (headerFoto) {
            headerFoto.src = e.target.result;
        }
        
        // Salvar foto no servidor
        salvarFoto(arquivo);
    };
    
    reader.readAsDataURL(arquivo);
}

// Salvar foto no servidor
async function salvarFoto(arquivo) {
    try {
        const formData = new FormData();
        formData.append('foto', arquivo);
        formData.append('email', usuarioAtual.email);
        
        const response = await fetch('/api/usuario/foto', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const resultado = await response.json();
        
        if (resultado.sucesso) {
            console.log('Foto salva com sucesso');
            // Atualizar dados locais
            usuarioAtual.foto_perfil = resultado.caminhoFoto;
        } else {
            throw new Error(resultado.erro || 'Erro ao salvar foto');
        }
        
    } catch (error) {
        console.error('Erro ao salvar foto:', error);
        alert('Erro ao salvar foto. Tente novamente.');
    }
}

// Função para alterar foto (chamada pelo botão)
function alterarFoto() {
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.click();
    }
}

// Fechar modal
function fecharModal() {
    const modal = document.getElementById('modal-consulta');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Utilitários para formatação de data
function formatarData(data) {
    if (!data) return 'Data não informada';
    
    const dataObj = new Date(data);
    return dataObj.toLocaleDateString('pt-BR');
}

function formatarDataHora(data) {
    if (!data) return 'Data não informada';
    
    const dataObj = new Date(data);
    return dataObj.toLocaleString('pt-BR');
}

// Função para logout
function logout() {
    // Limpar storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirecionar para página inicial
    window.location.href = 'inicio.html';
}

// Event listeners adicionais
document.addEventListener('keydown', function(event) {
    // Fechar modal com ESC
    if (event.key === 'Escape') {
        fecharModal();
    }
});

// Verificar se o usuário ainda está logado periodicamente
setInterval(function() {
    const email = obterEmailUsuario();
    if (!email) {
        console.log('Usuário não encontrado, fazendo logout...');
        logout();
    }
}, 60000); // Verificar a cada 1 minuto