// Variáveis globais
let editandoPerfil = false;
let dadosOriginais = {};
let cropper = null;

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
        
        console.log('Carregando dados para:', emailUsuario); // Debug
        
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

        console.log('Response status:', response.status); // Debug

        if (response.ok) {
            const dados = await response.json();
            console.log('Dados recebidos:', dados); // Debug
            
            // Garantir que o email seja sempre o do login
            dados.email = emailUsuario;
            
            preencherDadosUsuario(dados);
        } else {
            const errorText = await response.text();
            console.error('Erro ao carregar dados do usuário:', errorText);
            
            if (response.status === 404) {
                alert('Usuário não encontrado. Faça login novamente.');
                window.location.href = 'inicio.html';
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
    const emailField = document.getElementById('email');
    const telefoneField = document.getElementById('telefone');
    const enderecoField = document.getElementById('endereco');
    const dataField = document.getElementById('data_nascimento');
    const welcomeMessage = document.getElementById('welcome-message');
    
    if (nomeField) nomeField.value = dados.nome || '';
    if (emailField) {
        emailField.value = dados.email || '';
        // Tornar o campo email sempre não editável
        emailField.readOnly = true;
        emailField.classList.add('campo-fixo'); // Adicionar classe para estilo diferenciado
    }
    if (telefoneField) telefoneField.value = dados.telefone || '';
    if (enderecoField) enderecoField.value = dados.endereco || '';
    if (dataField) dataField.value = dados.data_nascimento || '';
    
    // Atualizar mensagem de boas-vindas
    const nomeUsuario = dados.nome || 'Cliente';
    if (welcomeMessage) {
        welcomeMessage.textContent = `Bem-vindo, ${nomeUsuario}!`;
    }
    
    // Carregar foto de perfil se existir
    if (dados.foto_perfil) {
        const fotoPreview = document.getElementById('foto-preview');
        const headerFoto = document.getElementById('header-foto');
        
        if (fotoPreview) {
            fotoPreview.innerHTML = `<img src="${dados.foto_perfil}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        }
        if (headerFoto) {
            headerFoto.src = dados.foto_perfil;
        }
    }
    
    // Armazenar dados originais
    dadosOriginais = { ...dados };
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
            // Integração com Calendly
            if (typeof Calendly !== 'undefined') {
                Calendly.initPopupWidget({
                    url: 'https://calendly.com/seu-usuario/consulta'
                });
            } else {
                alert('Sistema de agendamento temporariamente indisponível');
            }
        });
    }
    
    // Input de foto
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                processarImagemSelecionada(file);
            }
        });
    }
}

// Alternar modo de edição
function toggleEdicao() {
    editandoPerfil = !editandoPerfil;
    
    // Remover 'email' da lista de campos editáveis
    const campos = ['nome', 'telefone', 'endereco', 'data_nascimento'];
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    if (editandoPerfil) {
        // Ativar edição apenas nos campos permitidos
        campos.forEach(campo => {
            const element = document.getElementById(campo);
            if (element) {
                element.readOnly = false;
                element.classList.add('editando');
            }
        });
        
        // Garantir que o email permaneça não editável
        const emailField = document.getElementById('email');
        if (emailField) {
            emailField.readOnly = true;
            emailField.classList.remove('editando');
        }
        
        if (btnEditar) btnEditar.textContent = 'Salvar Alterações';
        if (btnCancelar) btnCancelar.style.display = 'inline-block';
    } else {
        // Salvar alterações
        salvarAlteracoes();
    }
}

// Cancelar edição
function cancelarEdicao() {
    editandoPerfil = false;
    
    // Remover 'email' da lista de campos editáveis
    const campos = ['nome', 'telefone', 'endereco', 'data_nascimento'];
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    // Restaurar dados originais apenas nos campos editáveis
    campos.forEach(campo => {
        const element = document.getElementById(campo);
        if (element) {
            element.value = dadosOriginais[campo] || '';
            element.readOnly = true;
            element.classList.remove('editando');
        }
    });
    
    // Garantir que o email permaneça não editável e com o valor correto
    const emailField = document.getElementById('email');
    if (emailField) {
        emailField.value = dadosOriginais.email || '';
        emailField.readOnly = true;
        emailField.classList.remove('editando');
    }
    
    if (btnEditar) btnEditar.textContent = 'Editar Perfil';
    if (btnCancelar) btnCancelar.style.display = 'none';
}

// Salvar alterações do perfil
async function salvarAlteracoes() {
    try {
        const emailField = document.getElementById('email');
        const nomeField = document.getElementById('nome');
        const telefoneField = document.getElementById('telefone');
        const enderecoField = document.getElementById('endereco');
        const dataField = document.getElementById('data_nascimento');
        
        const dadosAtualizados = {
            email: emailField ? emailField.value : '',
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
            // Atualizar dados originais
            dadosOriginais = { ...dadosAtualizados };
            
            // Desativar edição
            const campos = ['nome', 'telefone', 'endereco', 'data_nascimento'];
            campos.forEach(campo => {
                const element = document.getElementById(campo);
                if (element) {
                    element.readOnly = true;
                    element.classList.remove('editando');
                }
            });
            
            // Garantir que o email permaneça não editável
            const emailField = document.getElementById('email');
            if (emailField) {
                emailField.readOnly = true;
                emailField.classList.remove('editando');
            }
            
            const btnEditar = document.getElementById('btn-editar');
            const btnCancelar = document.getElementById('btn-cancelar');
            
            if (btnEditar) btnEditar.textContent = 'Editar Perfil';
            if (btnCancelar) btnCancelar.style.display = 'none';
            
            // Atualizar nome na mensagem de boas-vindas
            const nomeUsuario = dadosAtualizados.nome || 'Cliente';
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Bem-vindo, ${nomeUsuario}!`;
            }
            
            alert('Perfil atualizado com sucesso!');
        } else {
            alert('Erro ao atualizar perfil. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro ao salvar alterações:', error);
        alert('Erro ao atualizar perfil. Tente novamente.');
    }
    
    editandoPerfil = false;
}

// Alterar foto de perfil
function alterarFoto() {
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.click();
    }
}

// Processar imagem selecionada
function processarImagemSelecionada(file) {
    if (file.size > 5 * 1024 * 1024) { // 5MB
        alert('A imagem deve ter no máximo 5MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const cropImage = document.getElementById('crop-image');
        const modalCrop = document.getElementById('modal-crop');
        
        if (cropImage) cropImage.src = e.target.result;
        if (modalCrop) modalCrop.style.display = 'block';
        
        // Inicializar cropper (assumindo que você tem uma biblioteca de crop)
        // Se não tiver, pode usar uma biblioteca como Cropper.js
        inicializarCropper();
    };
    reader.readAsDataURL(file);
}

// Inicializar cropper (placeholder - você pode usar Cropper.js)
function inicializarCropper() {
    // Implementar lógica do cropper aqui
    // Por enquanto, vamos apenas mostrar a imagem
    console.log('Cropper inicializado');
}

// Salvar foto cropada
async function salvarFotoCropada() {
    try {
        const cropImage = document.getElementById('crop-image');
        const emailField = document.getElementById('email');
        
        if (!cropImage || !emailField) {
            alert('Erro: elementos não encontrados');
            return;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Definir tamanho do canvas (imagem quadrada)
        canvas.width = 300;
        canvas.height = 300;
        
        // Desenhar imagem no canvas
        ctx.drawImage(cropImage, 0, 0, 300, 300);
        
        // Converter para blob
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('foto', blob, 'foto-perfil.jpg');
            formData.append('email', emailField.value);
            
            const response = await fetch('/api/usuario/foto', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const resultado = await response.json();
                
                // Atualizar preview da foto
                const fotoPreview = document.getElementById('foto-preview');
                const headerFoto = document.getElementById('header-foto');
                
                if (fotoPreview) {
                    fotoPreview.innerHTML = `<img src="${resultado.url}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                }
                if (headerFoto) {
                    headerFoto.src = resultado.url;
                }
                
                fecharModalCrop();
                alert('Foto atualizada com sucesso!');
            } else {
                alert('Erro ao salvar foto. Tente novamente.');
            }
        }, 'image/jpeg', 0.8);
        
    } catch (error) {
        console.error('Erro ao salvar foto:', error);
        alert('Erro ao salvar foto. Tente novamente.');
    }
}

// Fechar modal de crop
function fecharModalCrop() {
    const modalCrop = document.getElementById('modal-crop');
    const inputFoto = document.getElementById('input-foto');
    
    if (modalCrop) modalCrop.style.display = 'none';
    if (inputFoto) inputFoto.value = '';
    
    // Destruir cropper se existir
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

// Função para logout
function logout() {
    localStorage.removeItem('emailUsuario');
    localStorage.removeItem('email');
    localStorage.removeItem('nomeUsuario');
    sessionStorage.removeItem('emailUsuario');
    sessionStorage.removeItem('email');
    sessionStorage.clear();
    window.location.href = 'inicio.html';
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

// Chamar debug no carregamento (remover após teste)
debugStorage();