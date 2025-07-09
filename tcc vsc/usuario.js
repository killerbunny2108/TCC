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

// Verificar se o usuário está autenticado
function verificarAutenticacao() {
    const emailUsuario = localStorage.getItem('emailUsuario') || 
                        localStorage.getItem('email') || 
                        sessionStorage.getItem('emailUsuario');
    
    if (!emailUsuario) {
        window.location.href = 'login.html';
        return;
    }
}

// Carregar dados do usuário
async function carregarDadosUsuario() {
    try {
        const emailUsuario = localStorage.getItem('emailUsuario') || 
                            localStorage.getItem('email') || 
                            sessionStorage.getItem('emailUsuario');
        
        const response = await fetch('/api/usuario/perfil', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: emailUsuario })
        });

        if (response.ok) {
            const dados = await response.json();
            preencherDadosUsuario(dados);
        } else {
            console.error('Erro ao carregar dados do usuário');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
    }
}

// Preencher dados do usuário na interface
function preencherDadosUsuario(dados) {
    document.getElementById('nome').value = dados.nome || '';
    document.getElementById('email').value = dados.email || '';
    document.getElementById('telefone').value = dados.telefone || '';
    document.getElementById('endereco').value = dados.endereco || '';
    document.getElementById('data_nascimento').value = dados.data_nascimento || '';
    
    // Atualizar mensagem de boas-vindas
    const nomeUsuario = dados.nome || 'Cliente';
    document.getElementById('welcome-message').textContent = `Bem-vindo, ${nomeUsuario}!`;
    
    // Carregar foto de perfil se existir
    if (dados.foto_perfil) {
        const fotoPreview = document.getElementById('foto-preview');
        const headerFoto = document.getElementById('header-foto');
        
        fotoPreview.innerHTML = `<img src="${dados.foto_perfil}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        headerFoto.src = dados.foto_perfil;
    }
    
    // Armazenar dados originais
    dadosOriginais = { ...dados };
}

// Carregar dicas do administrador
async function carregarDicas() {
    try {
        const response = await fetch('/api/dicas');
        
        if (response.ok) {
            const dicas = await response.json();
            exibirDicas(dicas);
        } else {
            document.getElementById('loading-dicas').textContent = 'Erro ao carregar dicas';
        }
    } catch (error) {
        console.error('Erro ao carregar dicas:', error);
        document.getElementById('loading-dicas').textContent = 'Erro ao carregar dicas';
    }
}

// Exibir dicas na interface
function exibirDicas(dicas) {
    const container = document.getElementById('dicas-container');
    
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
    document.getElementById('agendar').addEventListener('click', function() {
        // Integração com Calendly
        Calendly.initPopupWidget({
            url: 'https://calendly.com/seu-usuario/consulta'
        });
    });
    
    // Input de foto
    document.getElementById('input-foto').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            processarImagemSelecionada(file);
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
        // Ativar edição
        campos.forEach(campo => {
            document.getElementById(campo).readOnly = false;
            document.getElementById(campo).classList.add('editando');
        });
        
        btnEditar.textContent = 'Salvar Alterações';
        btnCancelar.style.display = 'inline-block';
    } else {
        // Salvar alterações
        salvarAlteracoes();
    }
}

// Cancelar edição
function cancelarEdicao() {
    editandoPerfil = false;
    
    const campos = ['nome', 'telefone', 'endereco', 'data_nascimento'];
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    // Restaurar dados originais
    campos.forEach(campo => {
        document.getElementById(campo).value = dadosOriginais[campo] || '';
        document.getElementById(campo).readOnly = true;
        document.getElementById(campo).classList.remove('editando');
    });
    
    btnEditar.textContent = 'Editar Perfil';
    btnCancelar.style.display = 'none';
}

// Salvar alterações do perfil
async function salvarAlteracoes() {
    try {
        const dadosAtualizados = {
            email: document.getElementById('email').value,
            nome: document.getElementById('nome').value,
            telefone: document.getElementById('telefone').value,
            endereco: document.getElementById('endereco').value,
            data_nascimento: document.getElementById('data_nascimento').value
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
                document.getElementById(campo).readOnly = true;
                document.getElementById(campo).classList.remove('editando');
            });
            
            document.getElementById('btn-editar').textContent = 'Editar Perfil';
            document.getElementById('btn-cancelar').style.display = 'none';
            
            // Atualizar nome na mensagem de boas-vindas
            const nomeUsuario = dadosAtualizados.nome || 'Cliente';
            document.getElementById('welcome-message').textContent = `Bem-vindo, ${nomeUsuario}!`;
            
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
    document.getElementById('input-foto').click();
}

// Processar imagem selecionada
function processarImagemSelecionada(file) {
    if (file.size > 5 * 1024 * 1024) { // 5MB
        alert('A imagem deve ter no máximo 5MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('crop-image').src = e.target.result;
        document.getElementById('modal-crop').style.display = 'block';
        
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
            formData.append('email', document.getElementById('email').value);
            
            const response = await fetch('/api/usuario/foto', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const resultado = await response.json();
                
                // Atualizar preview da foto
                const fotoPreview = document.getElementById('foto-preview');
                const headerFoto = document.getElementById('header-foto');
                
                fotoPreview.innerHTML = `<img src="${resultado.url}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                headerFoto.src = resultado.url;
                
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
    document.getElementById('modal-crop').style.display = 'none';
    document.getElementById('input-foto').value = '';
    
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
    sessionStorage.clear();
    window.location.href = 'inicio.html';
}

