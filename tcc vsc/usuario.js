// Variáveis globais
let editandoPerfil = false;
let dadosOriginais = {};
let imagemSelecionada = null;
let cropper;
let imagemOriginal;
let emailUsuario = null;
let dadosUsuarioLogado = null;

// Aguardar o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', function() {
    inicializarPagina();
});

// Inicializar a página
function inicializarPagina() {
    console.log('Inicializando página...');
    
    // Primeiro verificar se o usuário está logado
    if (!verificarAutenticacao()) {
        return;
    }
    
    carregarDadosUsuario();
    carregarDicas();
    configurarEventListeners();
}

// Verificar se o usuário está autenticado - VERSÃO CORRIGIDA
function verificarAutenticacao() {
    console.log('=== VERIFICAÇÃO DE AUTENTICAÇÃO ===');
    
    // Tentar recuperar email de várias fontes
    const possiveisEmails = [
        localStorage.getItem('emailUsuario'),
        localStorage.getItem('email'),
        sessionStorage.getItem('emailUsuario'),
        sessionStorage.getItem('email'),
        localStorage.getItem('usuarioLogado'), // Caso esteja como JSON
        sessionStorage.getItem('usuarioLogado')
    ];
    
    console.log('Possíveis emails encontrados:', possiveisEmails);
    
    // Procurar primeiro email válido
    for (let email of possiveisEmails) {
        if (email && email.trim() !== '' && email !== 'null' && email !== 'undefined') {
            // Se for um objeto JSON, tentar extrair o email
            if (email.startsWith('{')) {
                try {
                    const dadosJson = JSON.parse(email);
                    if (dadosJson.email) {
                        emailUsuario = dadosJson.email;
                        dadosUsuarioLogado = dadosJson;
                        console.log('Email encontrado no JSON:', emailUsuario);
                        break;
                    }
                } catch (e) {
                    console.log('Erro ao parse JSON:', e);
                }
            } else {
                emailUsuario = email;
                console.log('Email encontrado diretamente:', emailUsuario);
                break;
            }
        }
    }
    
    // Se ainda não encontrou, tentar recuperar dados do usuário completos
    if (!emailUsuario) {
        const dadosCompletos = localStorage.getItem('dadosUsuario') || sessionStorage.getItem('dadosUsuario');
        if (dadosCompletos) {
            try {
                const dados = JSON.parse(dadosCompletos);
                if (dados.email) {
                    emailUsuario = dados.email;
                    dadosUsuarioLogado = dados;
                    console.log('Email recuperado dos dados completos:', emailUsuario);
                }
            } catch (e) {
                console.log('Erro ao recuperar dados completos:', e);
            }
        }
    }
    
    console.log('Email final encontrado:', emailUsuario);
    console.log('Dados do usuário:', dadosUsuarioLogado);
    
    // Verificar se é um email válido
    if (!emailUsuario || !isValidEmail(emailUsuario)) {
        console.error('Email inválido ou não encontrado');
        mostrarErroAutenticacao();
        return false;
    }
    
    // Garantir que o email está salvo corretamente
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
    
    // Limpar dados inválidos
    limparDadosAutenticacao();
    
    // Mostrar mensagem e redirecionar
    alert('Sessão expirada ou inválida. Faça login novamente.');
    
    // Aguardar um pouco antes de redirecionar
    setTimeout(() => {
        window.location.href = 'inicio.html';
    }, 1000);
}

// Salvar dados de autenticação de forma mais robusta
function salvarDadosAutenticacao(email, dadosUsuario = {}) {
    try {
        console.log('Salvando dados de autenticação:', email, dadosUsuario);
        
        // Validar email antes de salvar
        if (!email || !isValidEmail(email)) {
            console.error('Tentativa de salvar email inválido:', email);
            return false;
        }
        
        // Salvar email em múltiplos formatos para compatibilidade
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
        
        // Salvar em localStorage
        localStorage.setItem('emailUsuario', email);
        localStorage.setItem('email', email);
        localStorage.setItem('dadosUsuario', JSON.stringify(dadosParaSalvar));
        localStorage.setItem('usuarioLogado', JSON.stringify(dadosParaSalvar));
        
        // Salvar em sessionStorage como backup
        sessionStorage.setItem('emailUsuario', email);
        sessionStorage.setItem('email', email);
        sessionStorage.setItem('dadosUsuario', JSON.stringify(dadosParaSalvar));
        
        // Salvar dados individuais para compatibilidade
        if (dadosUsuario.nome) localStorage.setItem('nomeUsuario', dadosUsuario.nome);
        if (dadosUsuario.telefone) localStorage.setItem('telefoneUsuario', dadosUsuario.telefone);
        if (dadosUsuario.endereco) localStorage.setItem('enderecoUsuario', dadosUsuario.endereco);
        if (dadosUsuario.data_nascimento) localStorage.setItem('dataNascimentoUsuario', dadosUsuario.data_nascimento);
        
        // Atualizar variáveis globais
        emailUsuario = email;
        dadosUsuarioLogado = dadosParaSalvar;
        
        console.log('Dados salvos com sucesso');
        return true;
        
    } catch (error) {
        console.error('Erro ao salvar dados de autenticação:', error);
        return false;
    }
}

// Carregar dados do usuário com melhor tratamento de erro
async function carregarDadosUsuario() {
    try {
        console.log('Carregando dados do usuário para:', emailUsuario);
        
        if (!emailUsuario) {
            console.error('Email não disponível para carregar dados');
            mostrarErroAutenticacao();
            return;
        }
        
        // Mostrar loading
        mostrarLoading(true);
        
        const response = await fetch('/api/usuario/perfil', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: emailUsuario })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (response.ok) {
            const dados = await response.json();
            console.log('Dados recebidos do servidor:', dados);
            
            // Garantir que o email está nos dados
            dados.email = emailUsuario;
            
            // Salvar dados atualizados
            salvarDadosAutenticacao(emailUsuario, dados);
            
            // Preencher interface
            preencherDadosUsuario(dados);
            
            // Salvar dados originais para cancelamento de edição
            dadosOriginais = {
                nome: dados.nome || '',
                telefone: dados.telefone || '',
                endereco: dados.endereco || '',
                data_nascimento: dados.data_nascimento || ''
            };
            
            console.log('Dados carregados com sucesso');
            
        } else {
            // Tentar ler resposta de erro
            let errorMessage = 'Erro desconhecido';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.mensagem || errorMessage;
            } catch (e) {
                errorMessage = await response.text();
            }
            
            console.error('Erro ao carregar dados:', response.status, errorMessage);
            
            // Tratar diferentes tipos de erro
            if (response.status === 404) {
                alert('Usuário não encontrado. Verifique suas credenciais.');
                mostrarErroAutenticacao();
            } else if (response.status === 401) {
                alert('Sessão expirada. Faça login novamente.');
                mostrarErroAutenticacao();
            } else if (response.status === 400) {
                alert('Dados inválidos. Tente fazer login novamente.');
                mostrarErroAutenticacao();
            } else {
                alert('Erro ao carregar dados do usuário. Tente novamente.');
                // Não redirecionar para permitir retry
            }
        }
    } catch (error) {
        console.error('Erro na requisição de dados do usuário:', error);
        
        // Verificar se é erro de rede
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            alert('Erro de conexão. Verifique sua internet e tente novamente.');
        } else {
            alert('Erro inesperado ao carregar dados. Tente novamente.');
        }
    } finally {
        mostrarLoading(false);
    }
}

// Mostrar/esconder loading
function mostrarLoading(mostrar) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = mostrar ? 'block' : 'none';
    }
}

// Limpar dados de autenticação de forma mais completa
function limparDadosAutenticacao() {
    console.log('Limpando dados de autenticação...');
    
    // Lista de todas as possíveis chaves de dados
    const chaves = [
        'emailUsuario', 'email', 'dadosUsuario', 'usuarioLogado',
        'nomeUsuario', 'telefoneUsuario', 'enderecoUsuario', 'dataNascimentoUsuario'
    ];
    
    // Limpar localStorage
    chaves.forEach(chave => {
        localStorage.removeItem(chave);
    });
    
    // Limpar sessionStorage
    sessionStorage.clear();
    
    // Limpar variáveis globais
    emailUsuario = null;
    dadosUsuarioLogado = null;
    dadosOriginais = {};
    
    console.log('Dados de autenticação limpos');
}

// Preencher dados do usuário na interface
function preencherDadosUsuario(dados) {
    console.log('Preenchendo dados na interface:', dados);
    
    // Preencher campos do formulário
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
        }
    });
    
    // Atualizar mensagem de boas-vindas
    const nomeUsuario = dados.nome || 'Cliente';
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Bem-vindo, ${nomeUsuario}!`;
    }
    
    // Atualizar email na interface (se houver campo)
    const emailField = document.getElementById('email-display');
    if (emailField) {
        emailField.textContent = emailUsuario;
    }
    
    // Carregar foto de perfil se existir
    if (dados.foto_perfil) {
        atualizarPreviewFoto(dados.foto_perfil);
    }
}

// Verificar autenticação periodicamente
function iniciarVerificacaoPeriodicaAutenticacao() {
    setInterval(function() {
        // Só verificar se a página está visível
        if (document.visibilityState === 'visible' && emailUsuario) {
            const emailStorage = localStorage.getItem('emailUsuario') || 
                               localStorage.getItem('email');
            
            if (!emailStorage || !isValidEmail(emailStorage)) {
                console.log('Sessão perdida - redirecionando para login');
                mostrarErroAutenticacao();
            }
        }
    }, 30000); // Verificar a cada 30 segundos
}

// Função para ser chamada após login bem-sucedido
function iniciarSessao(email, dadosUsuario = {}) {
    console.log('Iniciando sessão para:', email);
    
    if (!email || !isValidEmail(email)) {
        console.error('Email inválido para iniciar sessão:', email);
        return false;
    }
    
    const sucesso = salvarDadosAutenticacao(email, dadosUsuario);
    
    if (sucesso) {
        console.log('Sessão iniciada com sucesso para:', email);
        
        // Iniciar verificação periódica
        iniciarVerificacaoPeriodicaAutenticacao();
        
        return true;
    } else {
        console.error('Falha ao iniciar sessão');
        return false;
    }
}

// Função para logout
function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        console.log('Fazendo logout...');
        limparDadosAutenticacao();
        window.location.href = 'inicio.html';
    }
}

// Função para debug - verificar localStorage
function debugStorage() {
    console.log('=== DEBUG STORAGE ===');
    console.log('localStorage.emailUsuario:', localStorage.getItem('emailUsuario'));
    console.log('localStorage.email:', localStorage.getItem('email'));
    console.log('localStorage.dadosUsuario:', localStorage.getItem('dadosUsuario'));
    console.log('localStorage.usuarioLogado:', localStorage.getItem('usuarioLogado'));
    console.log('sessionStorage.emailUsuario:', sessionStorage.getItem('emailUsuario'));
    console.log('sessionStorage.email:', sessionStorage.getItem('email'));
    console.log('emailUsuario (global):', emailUsuario);
    console.log('dadosUsuarioLogado (global):', dadosUsuarioLogado);
    console.log('===================');
}

// Carregar dicas do administrador
async function carregarDicas() {
    try {
        const response = await fetch('/api/usuario/dicas');
        
        if (response.ok) {
            const dicas = await response.json();
            exibirDicas(dicas);
        } else {
            console.error('Erro ao carregar dicas:', response.status);
            const loadingElement = document.getElementById('loading-dicas');
            if (loadingElement) {
                loadingElement.textContent = 'Erro ao carregar dicas';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dicas:', error);
        const loadingElement = document.getElementById('loading-dicas');
        if (loadingElement) {
            loadingElement.textContent = 'Erro ao carregar dicas';
        }
    }
}

// Exibir dicas na interface
function exibirDicas(dicas) {
    const container = document.getElementById('dicas-container');
    
    if (!container) return;
    
    if (dicas.length === 0) {
        container.innerHTML = '<p>Nenhuma dica disponível no momento.</p>';
        return;
    }
    
    let html = '';
    dicas.forEach(dica => {
        const dataPublicacao = new Date(dica.data_publicacao).toLocaleDateString('pt-BR');
        html += `
            <div class="dica-card">
                <h3>${dica.titulo}</h3>
                <p>${dica.descricao}</p>
                <span class="data-publicacao">Publicado em: ${dataPublicacao}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Configurar event listeners
function configurarEventListeners() {
    // Botão de logout
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Botão de editar perfil
    const btnEditar = document.getElementById('btn-editar');
    if (btnEditar) {
        btnEditar.addEventListener('click', toggleEdicao);
    }
    
    // Botão de cancelar edição
    const btnCancelar = document.getElementById('btn-cancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarEdicao);
    }
    
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
    
    // Event listener para fechar modal clicando fora
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('modal-crop');
        if (event.target === modal) {
            fecharModalCrop();
        }
    });
}

// Resto das funções (foto, edição, etc.) mantidas igual...
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
    const cropLoading = document.getElementById('crop-loading');
    
    if (modal) {
        modal.style.display = 'block';
        cropLoading.style.display = 'block';
        cropImage.style.display = 'none';
        
        setTimeout(() => {
            cropImage.src = imagemOriginal;
            cropImage.style.display = 'block';
            cropLoading.style.display = 'none';
            
            if (typeof Cropper !== 'undefined') {
                if (cropper) {
                    cropper.destroy();
                }
                cropper = new Cropper(cropImage, {
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCropArea: 0.8,
                    responsive: true,
                    modal: true,
                    guides: true,
                    highlight: true,
                    cropBoxMovable: true,
                    cropBoxResizable: true,
                    toggleDragModeOnDblclick: false
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
                height: 200,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });
            imagemFinal = canvas.toDataURL('image/jpeg', 0.8);
        } else {
            imagemFinal = await redimensionarImagem(imagemOriginal, 200, 200);
        }
        
        await uploadFotoPerfil(imagemFinal);
        
    } catch (error) {
        console.error('Erro ao salvar foto:', error);
        alert('Erro ao salvar foto de perfil. Tente novamente.');
    }
}

function redimensionarImagem(imagemSrc, largura, altura) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = largura;
            canvas.height = altura;
            
            const scale = Math.max(largura / img.width, altura / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const offsetX = (largura - scaledWidth) / 2;
            const offsetY = (altura - scaledHeight) / 2;
            
            ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        
        img.src = imagemSrc;
    });
}

async function uploadFotoPerfil(imagemDataURL) {
    try {
        const response = await fetch(imagemDataURL);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append('foto', blob, 'foto_perfil.jpg');
        formData.append('email', emailUsuario);
        
        const uploadResponse = await fetch('/api/usuario/upload-foto', {
            method: 'POST',
            body: formData
        });
        
        if (uploadResponse.ok) {
            const resultado = await uploadResponse.json();
            atualizarPreviewFoto(imagemDataURL);
            fecharModalCrop();
            alert('Foto de perfil atualizada com sucesso!');
        } else {
            const errorText = await uploadResponse.text();
            console.error('Erro no upload:', errorText);
            alert('Erro ao fazer upload da foto. Tente novamente.');
        }
        
    } catch (error) {
        console.error('Erro no upload da foto:', error);
        alert('Erro ao fazer upload da foto. Tente novamente.');
    }
}

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

function toggleEdicao() {
    editandoPerfil = !editandoPerfil;
    
    const campos = ['nome', 'telefone', 'endereco', 'data_nascimento'];
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    if (editandoPerfil) {
        campos.forEach(campo => {
            const element = document.getElementById(campo);
            if (element) {
                element.readOnly = false;
                element.classList.add('editando');
            }
        });
        
        if (btnEditar) btnEditar.textContent = 'Salvar Alterações';
        if (btnCancelar) btnCancelar.style.display = 'inline-block';
    } else {
        salvarAlteracoes();
    }
}

function cancelarEdicao() {
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
        
        const response = await fetch('/api/usuario/atualizar', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosAtualizados)
        });
        
        if (response.ok) {
            dadosOriginais = {
                nome: dadosAtualizados.nome,
                telefone: dadosAtualizados.telefone,
                endereco: dadosAtualizados.endereco,
                data_nascimento: dadosAtualizados.data_nascimento
            };
            
            salvarDadosAutenticacao(emailUsuario, dadosAtualizados);
            
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
            
            const nomeUsuario = dadosAtualizados.nome || 'Cliente';
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Bem-vindo, ${nomeUsuario}!`;
            }
            
            alert('Perfil atualizado com sucesso!');
        } else {
            const errorText = await response.text();
            console.error('Erro ao atualizar perfil:', errorText);
            alert('Erro ao atualizar perfil. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro ao salvar alterações:', error);
        alert('Erro ao atualizar perfil. Tente novamente.');
    }
    
    editandoPerfil = false;
}

function agendarConsulta() {
    if (!emailUsuario) {
        mostrarErroAutenticacao();
        return;
    }
    
    console.log('Agendando consulta...');
    
    if (typeof Calendly !== 'undefined') {
        Calendly.initPopupWidget({
            url: 'https://calendly.com/seu-usuario/consulta'
        });
    } else {
        alert('Sistema de agendamento em desenvolvimento');
    }
}

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

// Inicializar quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    carregarCropperJS();
    iniciarVerificacaoPeriodicaAutenticacao();
});

// Debug em desenvolvimento
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugStorage = debugStorage;
    debugStorage();
}


// Exportar funções para uso global
window.toggleEdicao = toggleEdicao;
window.cancelarEdicao = cancelarEdicao;
window.alterarFoto = alterarFoto;
window.salvarFotoCropada = salvarFotoCropada;
window.fecharModalCrop = fecharModalCrop;
window.logout = logout;
window.agendarConsulta = agendarConsulta;
window.iniciarSessao = iniciarSessao;
window.salvarDadosAutenticacao = salvarDadosAutenticacao;
window.verificarSessaoValida = verificarSessaoValida;
window.debugStorage = debugStorage;