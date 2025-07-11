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
    // Removido verificarAutenticacao() conforme solicitado
    carregarDadosUsuario();
    carregarDicas();
    configurarEventListeners();
}

// Carregar dados do usuário
async function carregarDadosUsuario() {
    try {
        // Para teste, usar um email fixo se não encontrar no storage
        const emailUsuario = localStorage.getItem('emailUsuario') || 
                            localStorage.getItem('email') || 
                            sessionStorage.getItem('emailUsuario') ||
                            sessionStorage.getItem('email') ||
                            'teste@teste.com'; // Email de fallback para teste
        
        console.log('Carregando dados para:', emailUsuario);
        
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
            
            // Para teste, preencher com dados mock
            preencherDadosUsuario({
                email: emailUsuario,
                nome: 'Usuário Teste',
                telefone: '',
                endereco: '',
                data_nascimento: ''
            });
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        // Para teste, preencher com dados mock
        preencherDadosUsuario({
            email: 'teste@teste.com',
            nome: 'Usuário Teste',
            telefone: '',
            endereco: '',
            data_nascimento: ''
        });
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
                console.log('Arquivo selecionado:', file.name, file.size, file.type);
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
                            sessionStorage.getItem('email') ||
                            'teste@teste.com';
        
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
    console.log('Função alterarFoto() chamada');
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        console.log('Input file encontrado, disparando click');
        inputFoto.click();
    } else {
        console.error('Input file não encontrado');
    }
}

// Processar imagem selecionada - VERSÃO SIMPLIFICADA
function processarImagemSelecionada(file) {
    console.log('Processando imagem:', file.name, file.size, file.type);
    
    // Validar tamanho do arquivo (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB');
        return;
    }
    
    // Validar tipo do arquivo
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!tiposPermitidos.includes(file.type)) {
        alert('Por favor, selecione um arquivo de imagem válido (JPEG, PNG ou GIF)');
        return;
    }
    
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

// Salvar foto cropada - VERSÃO MELHORADA
async function salvarFotoCropada() {
    console.log('Iniciando salvamento da foto');
    
    if (!imagemSelecionada) {
        alert('Nenhuma imagem selecionada');
        return;
    }
    
    const emailUsuario = localStorage.getItem('emailUsuario') || 
                        localStorage.getItem('email') || 
                        sessionStorage.getItem('emailUsuario') ||
                        sessionStorage.getItem('email') ||
                        'teste@teste.com';
    
    try {
        console.log('Preparando FormData para envio...');
        
        // Criar FormData diretamente com o arquivo original
        const formData = new FormData();
        formData.append('foto', imagemSelecionada.file);
        formData.append('email', emailUsuario);
        
        console.log('Enviando foto para o servidor...');
        console.log('Email:', emailUsuario);
        console.log('Arquivo:', imagemSelecionada.file.name, imagemSelecionada.file.size, 'bytes');
        
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
            alert('Erro ao salvar foto: ' + errorText);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro ao salvar foto. Verifique sua conexão: ' + error.message);
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

// Função para testar upload sem modal (para debug)
function testarUploadDireto() {
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                console.log('TESTE DIRETO - Arquivo selecionado:', file.name);
                
                const emailUsuario = 'teste@teste.com';
                const formData = new FormData();
                formData.append('foto', file);
                formData.append('email', emailUsuario);
                
                try {
                    const response = await fetch('/api/usuario/foto', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (response.ok) {
                        const resultado = await response.json();
                        console.log('TESTE DIRETO - Sucesso:', resultado);
                        alert('Upload realizado com sucesso!');
                    } else {
                        const errorText = await response.text();
                        console.error('TESTE DIRETO - Erro:', errorText);
                        alert('Erro no upload: ' + errorText);
                    }
                } catch (error) {
                    console.error('TESTE DIRETO - Erro na requisição:', error);
                    alert('Erro na requisição: ' + error.message);
                }
            }
        });
    }
}