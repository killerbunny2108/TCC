// Variáveis globais
let editandoPerfil = false;
let dadosOriginais = {};
let cropper = null;
let imagemSelecionada = null;

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
    
    // Fechar modal ao clicar fora
    const modalCrop = document.getElementById('modal-crop');
    if (modalCrop) {
        modalCrop.addEventListener('click', function(e) {
            if (e.target === modalCrop) {
                fecharModalCrop();
            }
        });
    }
    
    // Event listener para tecla ESC fechar modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fecharModalCrop();
        }
    });
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

// Alterar foto de perfil
function alterarFoto() {
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.click();
    }
}

// Processar imagem selecionada - VERSÃO CORRIGIDA
function processarImagemSelecionada(file) {
    console.log('Processando imagem:', file.name, file.size, file.type);
    
    // Validar tamanho do arquivo (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB');
        return;
    }
    
    // Validar tipo do arquivo
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido');
        return;
    }
    
    // Limpar estado anterior
    imagemSelecionada = null;
    
    // Criar FileReader
    const reader = new FileReader();
    
    reader.onload = function(e) {
        console.log('Imagem carregada pelo FileReader');
        
        const imageDataUrl = e.target.result;
        const cropImage = document.getElementById('crop-image');
        const modalCrop = document.getElementById('modal-crop');
        
        if (!cropImage || !modalCrop) {
            console.error('Elementos do modal não encontrados');
            alert('Erro: elementos do modal não encontrados');
            return;
        }
        
        // Limpar imagem anterior
        cropImage.src = '';
        cropImage.style.display = 'none';
        
        // Configurar nova imagem
        cropImage.onload = function() {
            console.log('Imagem carregada no elemento img');
            
            // Mostrar a imagem
            cropImage.style.display = 'block';
            cropImage.style.maxWidth = '100%';
            cropImage.style.maxHeight = '400px';
            cropImage.style.objectFit = 'contain';
            
            // Armazenar dados da imagem
            imagemSelecionada = {
                dataUrl: imageDataUrl,
                file: file
            };
            
            // Mostrar modal
            modalCrop.style.display = 'block';
            
            console.log('Modal exibido com sucesso');
        };
        
        cropImage.onerror = function() {
            console.error('Erro ao carregar imagem no elemento img');
            alert('Erro ao carregar a imagem. Tente novamente.');
        };
        
        // Definir src da imagem
        cropImage.src = imageDataUrl;
    };
    
    reader.onerror = function() {
        console.error('Erro ao ler arquivo');
        alert('Erro ao ler o arquivo. Tente novamente.');
    };
    
    // Iniciar leitura
    reader.readAsDataURL(file);
}

// Salvar foto cropada - VERSÃO CORRIGIDA
async function salvarFotoCropada() {
    console.log('Iniciando salvamento da foto');
    
    if (!imagemSelecionada) {
        alert('Nenhuma imagem selecionada');
        return;
    }
    
    const emailUsuario = localStorage.getItem('emailUsuario') || 
                        localStorage.getItem('email') || 
                        sessionStorage.getItem('emailUsuario') ||
                        sessionStorage.getItem('email');
    
    if (!emailUsuario) {
        alert('Erro: usuário não identificado');
        return;
    }
    
    try {
        // Criar canvas para processar a imagem
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Definir tamanho do canvas (imagem quadrada)
        const tamanho = 300;
        canvas.width = tamanho;
        canvas.height = tamanho;
        
        // Criar nova imagem
        const img = new Image();
        
        img.onload = function() {
            console.log('Imagem carregada para processamento:', img.width, 'x', img.height);
            
            // Calcular crop quadrado centralizado
            const minDimension = Math.min(img.width, img.height);
            const sx = (img.width - minDimension) / 2;
            const sy = (img.height - minDimension) / 2;
            
            // Desenhar imagem no canvas
            ctx.drawImage(img, sx, sy, minDimension, minDimension, 0, 0, tamanho, tamanho);
            
            // Converter para blob
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    alert('Erro ao processar a imagem');
                    return;
                }
                
                console.log('Blob criado:', blob.size, 'bytes');
                
                // Criar FormData
                const formData = new FormData();
                formData.append('foto', blob, 'foto-perfil.jpg');
                formData.append('email', emailUsuario);
                
                try {
                    console.log('Enviando foto para o servidor...');
                    
                    const response = await fetch('/api/usuario/foto', {
                        method: 'POST',
                        body: formData
                    });
                    
                    console.log('Resposta do servidor:', response.status);
                    
                    if (response.ok) {
                        const resultado = await response.json();
                        console.log('Foto salva com sucesso:', resultado);
                        
                        // Atualizar preview da foto
                        const fotoPreview = document.getElementById('foto-preview');
                        const headerFoto = document.getElementById('header-foto');
                        
                        const novaImagemUrl = resultado.url + '?t=' + Date.now();
                        
                        if (fotoPreview) {
                            fotoPreview.innerHTML = `<img src="${novaImagemUrl}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                        }
                        if (headerFoto) {
                            headerFoto.src = novaImagemUrl;
                        }
                        
                        fecharModalCrop();
                        alert('Foto atualizada com sucesso!');
                    } else {
                        const errorText = await response.text();
                        console.error('Erro do servidor:', errorText);
                        alert('Erro ao salvar foto. Tente novamente.');
                    }
                } catch (error) {
                    console.error('Erro na requisição:', error);
                    alert('Erro ao salvar foto. Verifique sua conexão.');
                }
            }, 'image/jpeg', 0.8);
        };
        
        img.onerror = function() {
            console.error('Erro ao carregar imagem para processamento');
            alert('Erro ao processar a imagem. Tente novamente.');
        };
        
        // Carregar imagem
        img.src = imagemSelecionada.dataUrl;
        
    } catch (error) {
        console.error('Erro ao processar foto:', error);
        alert('Erro ao processar a imagem. Tente novamente.');
    }
}

// Fechar modal de crop
function fecharModalCrop() {
    console.log('Fechando modal de crop');
    
    const modalCrop = document.getElementById('modal-crop');
    const inputFoto = document.getElementById('input-foto');
    const cropImage = document.getElementById('crop-image');
    
    if (modalCrop) {
        modalCrop.style.display = 'none';
    }
    
    if (inputFoto) {
        inputFoto.value = '';
    }
    
    if (cropImage) {
        cropImage.src = '';
        cropImage.style.display = 'none';
    }
    
    // Limpar dados da imagem
    imagemSelecionada = null;
    
    // Limpar cropper se existir
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
    localStorage.removeItem('telefoneUsuario');
    localStorage.removeItem('enderecoUsuario');
    localStorage.removeItem('dataNascimentoUsuario');
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

// Chamar debug no carregamento
debugStorage();