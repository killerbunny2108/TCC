// Variáveis globais
let editandoPerfil = false;
let dadosOriginais = {};
let imagemSelecionada = null;
let cropper;
let imagemOriginal;


// Aguardar o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', function() {
    inicializarPagina();
});

// Inicializar a página
function inicializarPagina() {
    verificarAutenticacao();
    carregarDadosUsuario();
    carregarDicas();
    configurarEventListeners();
}


// Carregar dados do usuário
async function carregarDadosUsuario() {
    try {
        const emailUsuario = localStorage.getItem('emailUsuario') || 
                            localStorage.getItem('email') || 
                            sessionStorage.getItem('emailUsuario') ||
                            sessionStorage.getItem('email');
        
        console.log('Carregando dados para:', emailUsuario);
        
        if (!emailUsuario) {
            console.error('Email não encontrado');
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = 'inicio.html';
            return;
        }
        
        const response = await fetch('/api/usuario/perfil', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: emailUsuario })
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const dados = await response.json();
            console.log('Dados recebidos:', dados);
            
            dados.email = emailUsuario;
            preencherDadosUsuario(dados);
        } else {
            const errorText = await response.text();
            console.error('Erro ao carregar dados do usuário:', errorText);
            
            if (response.status === 404) {
                alert('Usuário não encontrado. Faça login novamente.');
                window.location.href = 'inicio.html';
            } else {
                alert('Erro ao carregar dados do usuário. Tente novamente.');
            }
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro ao carregar dados do usuário. Tente novamente.');
    }
}

// Preencher dados do usuário na interface
function preencherDadosUsuario(dados) {
    const nomeField = document.getElementById('nome');
    const telefoneField = document.getElementById('telefone');
    const enderecoField = document.getElementById('endereco');
    const dataField = document.getElementById('data_nascimento');
    const welcomeMessage = document.getElementById('welcome-message');
    
    if (nomeField) nomeField.value = dados.nome || '';
    if (telefoneField) telefoneField.value = dados.telefone || '';
    if (enderecoField) enderecoField.value = dados.endereco || '';
    if (dataField) dataField.value = dados.data_nascimento || '';
    
    const nomeUsuario = dados.nome || 'Cliente';
    if (welcomeMessage) {
        welcomeMessage.textContent = `Bem-vindo, ${nomeUsuario}!`;
    }
}

// Função para alterar foto de perfil
function alterarFoto() {
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.click();
    }
}

// Event listener para mudança de arquivo
document.getElementById('input-foto').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        // Validar tipo de arquivo
        const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!tiposPermitidos.includes(file.type)) {
            alert('Apenas arquivos de imagem são permitidos (JPEG, PNG, GIF)');
            return;
        }
        
        // Validar tamanho do arquivo (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('O arquivo deve ter no máximo 5MB');
            return;
        }
        
        // Mostrar preview da imagem
        mostrarPreviewImagem(file);
    }
});

// Mostrar preview da imagem no modal
function mostrarPreviewImagem(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        imagemOriginal = e.target.result;
        abrirModalCrop();
    };
    reader.readAsDataURL(file);
}

// Abrir modal de crop
function abrirModalCrop() {
    const modal = document.getElementById('modal-crop');
    const cropImage = document.getElementById('crop-image');
    const cropLoading = document.getElementById('crop-loading');
    
    if (modal) {
        modal.style.display = 'block';
        cropLoading.style.display = 'block';
        cropImage.style.display = 'none';
        
        // Aguardar um pouco para o modal aparecer
        setTimeout(() => {
            cropImage.src = imagemOriginal;
            cropImage.style.display = 'block';
            cropLoading.style.display = 'none';
            
            // Inicializar cropper se disponível
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

// Fechar modal de crop
function fecharModalCrop() {
    const modal = document.getElementById('modal-crop');
    if (modal) {
        modal.style.display = 'none';
    }
    
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    
    // Limpar input
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.value = '';
    }
}

// Salvar foto cropada
async function salvarFotoCropada() {
    try {
        let imagemFinal;
        
        if (cropper) {
            // Se o cropper estiver disponível, usar a imagem cropada
            const canvas = cropper.getCroppedCanvas({
                width: 200,
                height: 200,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });
            imagemFinal = canvas.toDataURL('image/jpeg', 0.8);
        } else {
            // Se não houver cropper, usar a imagem original redimensionada
            imagemFinal = await redimensionarImagem(imagemOriginal, 200, 200);
        }
        
        // Fazer upload da imagem
        await uploadFotoPerfil(imagemFinal);
        
    } catch (error) {
        console.error('Erro ao salvar foto:', error);
        alert('Erro ao salvar foto de perfil. Tente novamente.');
    }
}

// Redimensionar imagem manualmente (fallback)
function redimensionarImagem(imagemSrc, largura, altura) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = largura;
            canvas.height = altura;
            
            // Calcular proporções para crop centralizado
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

// Upload da foto de perfil
async function uploadFotoPerfil(imagemDataURL) {
    try {
        const emailUsuario = localStorage.getItem('emailUsuario') || 
                            localStorage.getItem('email') || 
                            sessionStorage.getItem('emailUsuario') ||
                            sessionStorage.getItem('email');
        
        // Converter data URL para Blob
        const response = await fetch(imagemDataURL);
        const blob = await response.blob();
        
        // Criar FormData
        const formData = new FormData();
        formData.append('foto', blob, 'foto_perfil.jpg');
        formData.append('email', emailUsuario);
        
        const uploadResponse = await fetch('/api/usuario/upload-foto', {
            method: 'POST',
            body: formData
        });
        
        if (uploadResponse.ok) {
            const resultado = await uploadResponse.json();
            
            // Atualizar preview na interface
            atualizarPreviewFoto(imagemDataURL);
            
            // Fechar modal
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

// Atualizar preview da foto na interface
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

// Verificar se é necessário carregar a biblioteca Cropper.js
function carregarCropperJS() {
    if (typeof Cropper === 'undefined') {
        // Carregar CSS do Cropper
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
        document.head.appendChild(link);
        
        // Carregar JS do Cropper
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
        document.head.appendChild(script);
    }
}

// Carregar Cropper.js quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    carregarCropperJS();
});

// Event listener para fechar modal clicando fora
document.addEventListener('click', function(event) {
    const modal = document.getElementById('modal-crop');
    if (event.target === modal) {
        fecharModalCrop();
    }
});

// Função de verificação de autenticação
function verificarAutenticacao() {
    const emailUsuario = localStorage.getItem('emailUsuario') || 
                        localStorage.getItem('email') || 
                        sessionStorage.getItem('emailUsuario') ||
                        sessionStorage.getItem('email');
    
    if (!emailUsuario) {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = 'inicio.html';
        return false;
    }
    
    return true;
}
// Carregar dicas do administrador
async function carregarDicas() {
    try {
        const response = await fetch('/api/usuario/dicas');
        
        if (response.ok) {
            const dicas = await response.json();
            exibirDicas(dicas);
        } else {
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
    // Botão de agendar consulta
    const agendarBtn = document.getElementById('agendar');
    if (agendarBtn) {
        agendarBtn.addEventListener('click', function() {
            if (typeof Calendly !== 'undefined') {
                Calendly.initPopupWidget({
                    url: 'https://calendly.com/seu-usuario/consulta'
                });
            } else {
                alert('Sistema de agendamento temporariamente indisponível');
            }
        });
    }
    
    
    // Event listeners para botões de perfil
    const btnEditar = document.getElementById('btn-editar');
    if (btnEditar) {
        btnEditar.addEventListener('click', toggleEdicao);
    }
    
    const btnCancelar = document.getElementById('btn-cancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarEdicao);
    }
    
    // Event listener para logout
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Alternar modo de edição
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

// Cancelar edição
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

// Salvar alterações do perfil
async function salvarAlteracoes() {
    try {
        const emailUsuario = localStorage.getItem('emailUsuario') || 
                            localStorage.getItem('email') || 
                            sessionStorage.getItem('emailUsuario') ||
                            sessionStorage.getItem('email');
        
        const nomeField = document.getElementById('nome');
        const telefoneField = document.getElementById('telefone');
        const enderecoField = document.getElementById('endereco');
        const dataField = document.getElementById('data_nascimento');
        
        const dadosAtualizados = {
            email: emailUsuario,
            nome: nomeField ? nomeField.value : '',
            telefone: telefoneField ? telefoneField.value : '',
            endereco: enderecoField ? enderecoField.value : '',
            data_nascimento: dataField ? dataField.value : ''
        };
        
        const response = await fetch('/api/usuario/atualizar', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosAtualizados)
        });
        
        if (response.ok) {
            dadosOriginais = { ...dadosAtualizados };
            
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


// Função para logout
function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        // Limpar todos os dados do localStorage
        localStorage.removeItem('emailUsuario');
        localStorage.removeItem('email');
        localStorage.removeItem('nomeUsuario');
        localStorage.removeItem('telefoneUsuario');
        localStorage.removeItem('enderecoUsuario');
        localStorage.removeItem('dataNascimentoUsuario');
        
        // Limpar sessionStorage
        sessionStorage.clear();
        
        // Redirecionar para página de login
        window.location.href = 'inicio.html';
    }
}

// Função para debug - verificar localStorage
function debugStorage() {
    console.log('=== DEBUG STORAGE ===');
    console.log('localStorage.emailUsuario:', localStorage.getItem('emailUsuario'));
    console.log('localStorage.email:', localStorage.getItem('email'));
    console.log('sessionStorage.emailUsuario:', sessionStorage.getItem('emailUsuario'));
    console.log('sessionStorage.email:', sessionStorage.getItem('email'));
    console.log('===================');
}

// Função para agendar consulta
function agendarConsulta() {
    // Implementar lógica de agendamento
    console.log('Agendando consulta...');
    
    // Exemplo usando modal ou redirecionamento
    if (typeof Calendly !== 'undefined') {
        Calendly.initPopupWidget({
            url: 'https://calendly.com/seu-usuario/consulta'
        });
    } else {
        // Implementar sistema próprio de agendamento
        alert('Sistema de agendamento em desenvolvimento');
    }
}

// Chamar debug no carregamento (apenas em desenvolvimento)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
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