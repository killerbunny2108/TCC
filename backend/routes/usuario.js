// Variáveis globais
let editandoPerfil = false;
let dadosOriginais = {};
let imagemSelecionada = null;
let cropper;
let imagemOriginal;
let emailUsuario = null;
let dadosUsuarioLogado = null;

// Configuração da API
const API_BASE_URL = 'http://localhost:3000';

// URL do Calendly
const CALENDLY_URL = 'https://calendly.com/julianunesteixeira4/reflexoterapia';

// Aguardar o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando página...');
    inicializarPagina();
    carregarCropperJS();
});

// Inicializar a página
function inicializarPagina() {
    console.log('Inicializando página...');
    
    if (!verificarAutenticacao()) {
        return;
    }
    
    Promise.all([
        carregarDadosUsuario(),
        carregarDicas()
    ]).then(() => {
        console.log('Dados carregados com sucesso');
        configurarEventListeners();
    }).catch(error => {
        console.error('Erro ao carregar dados:', error);
        configurarEventListeners();
    });
}

// Verificar se o usuário está autenticado
function verificarAutenticacao() {
    console.log('=== VERIFICAÇÃO DE AUTENTICAÇÃO ===');
    
    const possiveisEmails = [
        localStorage.getItem('emailUsuario'),
        localStorage.getItem('email'),
        sessionStorage.getItem('emailUsuario'),
        sessionStorage.getItem('email')
    ];
    
    const possiveisDadosJson = [
        localStorage.getItem('usuarioLogado'),
        sessionStorage.getItem('usuarioLogado'),
        localStorage.getItem('dadosUsuario'),
        sessionStorage.getItem('dadosUsuario')
    ];
    
    console.log('Possíveis emails encontrados:', possiveisEmails);
    
    for (let email of possiveisEmails) {
        if (email && email.trim() !== '' && email !== 'null' && email !== 'undefined') {
            emailUsuario = email.trim();
            console.log('Email encontrado diretamente:', emailUsuario);
            break;
        }
    }
    
    if (!emailUsuario) {
        for (let dadosJson of possiveisDadosJson) {
            if (dadosJson && dadosJson.trim() !== '' && dadosJson !== 'null') {
                try {
                    const dados = JSON.parse(dadosJson);
                    if (dados.email && dados.email.trim() !== '') {
                        emailUsuario = dados.email.trim();
                        dadosUsuarioLogado = dados;
                        console.log('Email encontrado no JSON:', emailUsuario);
                        break;
                    }
                } catch (e) {
                    console.log('Erro ao parse JSON:', e);
                }
            }
        }
    }
    
    console.log('Email final encontrado:', emailUsuario);
    
    if (!emailUsuario || !isValidEmail(emailUsuario)) {
        console.error('Email inválido ou não encontrado');
        mostrarErroAutenticacao();
        return false;
    }
    
    salvarDadosAutenticacao(emailUsuario, dadosUsuarioLogado || {});
    
    console.log('Autenticação válida para:', emailUsuario);
    return true;
}

// Validar formato de email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Mostrar erro de autenticação
function mostrarErroAutenticacao() {
    console.log('Erro de autenticação detectado');
    limparDadosAutenticacao();
    alert('Sessão expirada ou inválida. Faça login novamente.');
    setTimeout(() => {
        window.location.href = 'inicio.html';
    }, 1000);
}

// Salvar dados de autenticação
function salvarDadosAutenticacao(email, dadosUsuario = {}) {
    try {
        console.log('Salvando dados de autenticação:', email);
        
        if (!email || !isValidEmail(email)) {
            console.error('Tentativa de salvar email inválido:', email);
            return false;
        }
        
        const dadosParaSalvar = {
            email: email,
            nome: dadosUsuario.nome || '',
            telefone: dadosUsuario.telefone || '',
            endereco: dadosUsuario.endereco || '',
            data_nascimento: dadosUsuario.data_nascimento || '',
            foto_perfil: dadosUsuario.foto_perfil || '',
            id_usuario: dadosUsuario.id_usuario || '',
            timestampLogin: new Date().toISOString()
        };
        
        localStorage.setItem('emailUsuario', email);
        localStorage.setItem('email', email);
        localStorage.setItem('dadosUsuario', JSON.stringify(dadosParaSalvar));
        localStorage.setItem('usuarioLogado', JSON.stringify(dadosParaSalvar));
        
        sessionStorage.setItem('emailUsuario', email);
        sessionStorage.setItem('email', email);
        
        emailUsuario = email;
        dadosUsuarioLogado = dadosParaSalvar;
        
        console.log('Dados salvos com sucesso');
        return true;
        
    } catch (error) {
        console.error('Erro ao salvar dados de autenticação:', error);
        return false;
    }
}

// Carregar dados do usuário
async function carregarDadosUsuario() {
    try {
        console.log('=== CARREGANDO DADOS DO USUÁRIO ===');
        console.log('Email do usuário:', emailUsuario);
        
        if (!emailUsuario) {
            console.error('Email não disponível para carregar dados');
            mostrarErroAutenticacao();
            return;
        }
        
        const url = `${API_BASE_URL}/api/usuario/perfil/${encodeURIComponent(emailUsuario)}`;
        console.log('URL da requisição:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log('Status da resposta:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const dados = await response.json();
        console.log('Dados recebidos do servidor:', dados);
        
        if (dados.success === false) {
            console.error('Erro retornado pelo servidor:', dados.message);
            alert(dados.message || 'Erro ao carregar dados do usuário');
            return;
        }
        
        const dadosUsuario = dados.user || dados;
        dadosUsuario.email = emailUsuario;
        
        console.log('Dados processados:', dadosUsuario);
        
        salvarDadosAutenticacao(emailUsuario, dadosUsuario);
        preencherDadosUsuario(dadosUsuario);
        
        dadosOriginais = {
            nome: dadosUsuario.nome || '',
            telefone: dadosUsuario.telefone || '',
            endereco: dadosUsuario.endereco || '',
            data_nascimento: dadosUsuario.data_nascimento || ''
        };
        
        console.log('Dados do usuário carregados e preenchidos com sucesso');
        
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            alert('Erro de conexão com o servidor. Verifique se o backend está rodando em ' + API_BASE_URL);
        } else if (error.message.includes('404')) {
            alert('Usuário não encontrado no sistema.');
            mostrarErroAutenticacao();
        } else if (error.message.includes('401')) {
            alert('Sessão expirada. Faça login novamente.');
            mostrarErroAutenticacao();
        } else {
            alert('Erro ao carregar dados do usuário: ' + error.message);
        }
    }
}

// Carregar dicas do administrador
async function carregarDicas() {
    try {
        console.log('=== CARREGANDO DICAS ===');
        
        const url = `${API_BASE_URL}/api/usuario/dicas`;
        console.log('URL da requisição:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log('Status da resposta dicas:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const dicas = await response.json();
        console.log('Dicas recebidas:', dicas);
        
        exibirDicas(dicas);
        
    } catch (error) {
        console.error('Erro ao carregar dicas:', error);
        const container = document.getElementById('dicas-container');
        if (container) {
            container.innerHTML = '<p class="erro-dicas">Erro ao carregar dicas. Tente recarregar a página.</p>';
        }
    }
}

// Exibir dicas na interface
function exibirDicas(dicas) {
    const container = document.getElementById('dicas-container');
    
    if (!container) {
        console.log('Container de dicas não encontrado');
        return;
    }
    
    const loadingElement = document.getElementById('loading-dicas');
    if (loadingElement) {
        loadingElement.remove();
    }
    
    if (!dicas || dicas.length === 0) {
        container.innerHTML = '<p class="sem-dicas">Nenhuma dica disponível no momento.</p>';
        return;
    }
    
    let html = '';
    dicas.forEach(dica => {
        let dataPublicacao = 'Data não disponível';
        if (dica.data_publicacao) {
            try {
                dataPublicacao = new Date(dica.data_publicacao).toLocaleDateString('pt-BR');
            } catch (e) {
                console.error('Erro ao formatar data:', e);
            }
        }
        
        const autor = dica.autor || 'Administrador';
        const titulo = dica.titulo || 'Sem título';
        const descricao = dica.descricao || '';
        
        html += `
            <div class="dica-card">
                <h3>${titulo}</h3>
                <p>${descricao}</p>
                <div class="dica-info">
                    <span class="autor">Por: ${autor}</span>
                    <span class="data-publicacao">${dataPublicacao}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    console.log(`${dicas.length} dicas exibidas com sucesso`);
}

// Limpar dados de autenticação
function limparDadosAutenticacao() {
    console.log('Limpando dados de autenticação...');
    
    const chaves = [
        'emailUsuario', 'email', 'dadosUsuario', 'usuarioLogado',
        'nomeUsuario', 'telefoneUsuario', 'enderecoUsuario', 'dataNascimentoUsuario'
    ];
    
    chaves.forEach(chave => {
        localStorage.removeItem(chave);
    });
    
    sessionStorage.clear();
    
    emailUsuario = null;
    dadosUsuarioLogado = null;
    dadosOriginais = {};
    
    console.log('Dados de autenticação limpos');
}

// Preencher dados do usuário na interface
function preencherDadosUsuario(dados) {
    console.log('=== PREENCHENDO INTERFACE ===');
    console.log('Dados recebidos:', dados);
    
    const campos = {
        'nome': dados.nome || '',
        'telefone': dados.telefone || '',
        'endereco': dados.endereco || '',
        'data_nascimento': dados.data_nascimento || ''
    };
    
    Object.keys(campos).forEach(campo => {
        const element = document.getElementById(campo);
        if (element) {
            element.value = campos[campo];
            console.log(`✓ Campo ${campo} preenchido:`, campos[campo]);
        } else {
            console.warn(`✗ Elemento ${campo} não encontrado no DOM`);
        }
    });
    
    const nomeUsuario = dados.nome || 'Cliente';
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Bem-vindo(a), ${nomeUsuario}!`;
        console.log('✓ Mensagem de boas-vindas atualizada');
    } else {
        console.warn('✗ Elemento welcome-message não encontrado');
    }
    
    if (dados.foto_perfil) {
        const fotoUrl = dados.foto_perfil.startsWith('http') 
            ? dados.foto_perfil 
            : `${API_BASE_URL}${dados.foto_perfil}`;
        atualizarPreviewFoto(fotoUrl);
        console.log('✓ Foto de perfil carregada:', fotoUrl);
    } else {
        console.log('Sem foto de perfil definida');
    }
    
    console.log('=== INTERFACE PREENCHIDA COM SUCESSO ===');
}

// Atualizar preview da foto
function atualizarPreviewFoto(imagemSrc) {
    const fotoPreview = document.getElementById('foto-preview');
    const headerFoto = document.getElementById('header-foto');
    
    if (fotoPreview) {
        fotoPreview.innerHTML = `<img src="${imagemSrc}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    }
    
    if (headerFoto) {
        headerFoto.src = imagemSrc;
    }
}

// Configurar event listeners - CORRIGIDO
function configurarEventListeners() {
    console.log('Configurando event listeners...');
    
    // Botão de logout
    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // REMOVIDO: event listener duplicado para btn-editar
    // O botão já tem onclick no HTML, não precisa de addEventListener
    
    // REMOVIDO: event listener duplicado para btn-cancelar
    // O botão já tem onclick no HTML
    
    // Botão de agendar consulta
    const agendarBtn = document.getElementById('agendar');
    if (agendarBtn) {
        agendarBtn.addEventListener('click', agendarConsulta);
    }
    
    // Input de foto
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.addEventListener('change', handleFileChange);
    }
    
    // Fechar modal clicando fora
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('modal-crop');
        if (event.target === modal) {
            fecharModalCrop();
        }
    });
    
    console.log('Event listeners configurados');
}

// Função para logout
function logout() {
    console.log('Fazendo logout...');
    limparDadosAutenticacao();
    window.location.href = 'inicio.html';
}

// ================================
// FUNÇÕES DE EDIÇÃO DE PERFIL - CORRIGIDAS
// ================================

function toggleEdicao() {
    console.log('toggleEdicao chamada. Estado atual:', editandoPerfil);
    
    const campos = ['nome', 'telefone', 'endereco', 'data_nascimento'];
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    if (!editandoPerfil) {
        // MODO EDIÇÃO
        editandoPerfil = true;
        
        campos.forEach(campo => {
            const element = document.getElementById(campo);
            if (element) {
                element.readOnly = false;
                element.classList.add('editando');
            }
        });
        
        if (btnEditar) btnEditar.textContent = 'Salvar Alterações';
        if (btnCancelar) btnCancelar.style.display = 'inline-block';
        
        console.log('Modo edição ativado');
    } else {
        // SALVAR ALTERAÇÕES
        salvarAlteracoes();
    }
}

function cancelarEdicao() {
    console.log('Cancelando edição');
    editandoPerfil = false;
    
    const campos = ['nome', 'telefone', 'endereco', 'data_nascimento'];
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    campos.forEach(campo => {
        const element = document.getElementById(campo);
        if (element) {
            element.value = dadosOriginais[campo] || '';
            element.readOnly = true;
            element.classList.remove('editando');
        }
    });
    
    if (btnEditar) btnEditar.textContent = 'Editar Perfil';
    if (btnCancelar) btnCancelar.style.display = 'none';
}

async function salvarAlteracoes() {
    try {
        console.log('Salvando alterações...');
        
        if (!emailUsuario) {
            mostrarErroAutenticacao();
            return;
        }
        
        const dadosAtualizados = {
            email: emailUsuario,
            nome: document.getElementById('nome')?.value || '',
            telefone: document.getElementById('telefone')?.value || '',
            endereco: document.getElementById('endereco')?.value || '',
            data_nascimento: document.getElementById('data_nascimento')?.value || ''
        };
        
        console.log('Dados para atualizar:', dadosAtualizados);
        
        const response = await fetch(`${API_BASE_URL}/api/usuario/atualizar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosAtualizados)
        });
        
        console.log('Status da resposta:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const resultado = await response.json();
        console.log('Resultado da atualização:', resultado);
        
        if (resultado.success) {
            // Atualizar dados originais
            dadosOriginais = {
                nome: dadosAtualizados.nome,
                telefone: dadosAtualizados.telefone,
                endereco: dadosAtualizados.endereco,
                data_nascimento: dadosAtualizados.data_nascimento
            };
            
            // Salvar no localStorage
            salvarDadosAutenticacao(emailUsuario, dadosAtualizados);
            
            // Desabilitar edição
            editandoPerfil = false;
            
            const campos = ['nome', 'telefone', 'endereco', 'data_nascimento'];
            campos.forEach(campo => {
                const element = document.getElementById(campo);
                if (element) {
                    element.readOnly = true;
                    element.classList.remove('editando');
                }
            });
            
            const btnEditar = document.getElementById('btn-editar');
            const btnCancelar = document.getElementById('btn-cancelar');
            
            if (btnEditar) btnEditar.textContent = 'Editar Perfil';
            if (btnCancelar) btnCancelar.style.display = 'none';
            
            // Atualizar mensagem de boas-vindas
            const nomeUsuario = dadosAtualizados.nome || 'Cliente';
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Bem-vindo(a), ${nomeUsuario}!`;
            }
            
            alert('Perfil atualizado com sucesso!');
            console.log('Perfil atualizado com sucesso');
        } else {
            throw new Error(resultado.message || 'Erro ao atualizar perfil');
        }
        
    } catch (error) {
        console.error('Erro ao salvar alterações:', error);
        alert('Erro ao atualizar perfil: ' + error.message);
        editandoPerfil = false;
    }
}

// ================================
// FUNÇÕES DE FOTO DE PERFIL
// ================================

function alterarFoto() {
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.click();
    }
}

function handleFileChange(event) {
    const file = event.target.files[0];
    if (file) {
        const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!tiposPermitidos.includes(file.type)) {
            alert('Apenas arquivos de imagem são permitidos (JPEG, PNG, GIF)');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            alert('O arquivo deve ter no máximo 5MB');
            return;
        }
        
        mostrarPreviewImagem(file);
    }
}

function mostrarPreviewImagem(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        imagemOriginal = e.target.result;
        abrirModalCrop();
    };
    reader.readAsDataURL(file);
}

function abrirModalCrop() {
    const modal = document.getElementById('modal-crop');
    const cropImage = document.getElementById('crop-image');
    
    if (modal) {
        modal.style.display = 'block';
        
        setTimeout(() => {
            if (cropImage) {
                cropImage.src = imagemOriginal;
                cropImage.style.display = 'block';
            }
            
            if (typeof Cropper !== 'undefined' && cropImage) {
                if (cropper) {
                    cropper.destroy();
                }
                cropper = new Cropper(cropImage, {
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCropArea: 0.8
                });
            }
        }, 100);
    }
}

function fecharModalCrop() {
    const modal = document.getElementById('modal-crop');
    if (modal) {
        modal.style.display = 'none';
    }
    
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.value = '';
    }
}

async function salvarFotoCropada() {
    try {
        if (!emailUsuario) {
            mostrarErroAutenticacao();
            return;
        }
        
        let imagemFinal;
        
        if (cropper) {
            const canvas = cropper.getCroppedCanvas({
                width: 200,
                height: 200
            });
            imagemFinal = canvas.toDataURL('image/jpeg', 0.8);
        } else {
            imagemFinal = imagemOriginal;
        }
        
        await uploadFotoPerfil(imagemFinal);
        
    } catch (error) {
        console.error('Erro ao salvar foto:', error);
        alert('Erro ao salvar foto de perfil. Tente novamente.');
    }
}

async function uploadFotoPerfil(imagemDataURL) {
    try {
        const response = await fetch(imagemDataURL);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append('foto', blob, 'foto_perfil.jpg');
        formData.append('email', emailUsuario);
        
        const uploadResponse = await fetch(`${API_BASE_URL}/api/usuario/upload-foto`, {
            method: 'POST',
            body: formData
        });
        
        if (uploadResponse.ok) {
            const resultado = await uploadResponse.json();
            console.log('Upload realizado:', resultado);
            atualizarPreviewFoto(imagemDataURL);
            fecharModalCrop();
            alert('Foto de perfil atualizada com sucesso!');
        } else {
            throw new Error('Erro no upload da foto');
        }
        
    } catch (error) {
        console.error('Erro no upload da foto:', error);
        alert('Erro ao fazer upload da foto. Tente novamente.');
    }
}

// ================================
// FUNÇÃO DE AGENDAMENTO
// ================================

function agendarConsulta() {
    console.log('Abrindo widget Calendly...');
    
    if (typeof Calendly !== 'undefined') {
        Calendly.initPopupWidget({
            url: CALENDLY_URL
        });
        return false;
    } else {
        console.warn('Script do Calendly não carregado, abrindo em nova aba');
        window.open(CALENDLY_URL, '_blank');
    }
}

// ================================
// FUNÇÕES AUXILIARES
// ================================

function carregarCropperJS() {
    if (typeof Cropper === 'undefined') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
        document.head.appendChild(link);
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
        document.head.appendChild(script);
    }
}

// Debug
function debugStorage() {
    console.log('=== DEBUG STORAGE ===');
    console.log('localStorage.emailUsuario:', localStorage.getItem('emailUsuario'));
    console.log('localStorage.email:', localStorage.getItem('email'));
    console.log('localStorage.dadosUsuario:', localStorage.getItem('dadosUsuario'));
    console.log('emailUsuario (global):', emailUsuario);
    console.log('dadosUsuarioLogado (global):', dadosUsuarioLogado);
    console.log('===================');
}

// Exportar funções para uso no HTML
window.toggleEdicao = toggleEdicao;
window.cancelarEdicao = cancelarEdicao;
window.alterarFoto = alterarFoto;
window.salvarFotoCropada = salvarFotoCropada;
window.fecharModalCrop = fecharModalCrop;
window.logout = logout;
window.agendarConsulta = agendarConsulta;
window.salvarDadosAutenticacao = salvarDadosAutenticacao;
window.debugStorage = debugStorage;