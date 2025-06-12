// FUNCIONALIDADES DA PÁGINA DO USUÁRIO

// Variáveis globais
let usuarioLogado = null;
let perfilEditando = false;

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    inicializarPagina();
    configurarNavegacao();
    carregarUsuarioLogado();
});

// Função para inicializar a página
function inicializarPagina() {
    // Verificar se há usuário logado no localStorage
    const usuario = localStorage.getItem('usuarioLogado');
    if (usuario) {
        usuarioLogado = JSON.parse(usuario);
        atualizarHeaderUsuario();
    } else {
        // Redirecionar para login se não estiver logado
        window.location.href = 'inicio.html';
    }
}

// Configurar navegação entre seções
function configurarNavegacao() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('main > section');
    
    navItems.forEach((item, index) => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active de todos os itens
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Adiciona active no item clicado
            this.classList.add('active');
            
            // Mostra a seção correspondente
            switch(index) {
                case 0: // Dashboard
                    mostrarDashboard();
                    break;
                case 1: // Perfil
                    mostrarPerfil();
                    break;
                case 2: // Histórico
                    mostrarHistorico();
                    break;
                case 3: // Ajuda
                    mostrarAjuda();
                    break;
            }
        });
    });
}

// Atualizar header com dados do usuário
function atualizarHeaderUsuario() {
    if (usuarioLogado) {
        const headerElement = document.querySelector('.usuario-header h1');
        if (headerElement) {
            headerElement.textContent = `Bem-vindo, ${usuarioLogado.nome}!`;
        }
        
        // Atualizar foto se existir
        const fotoProfile = document.querySelector('.usuario-profile img');
        if (fotoProfile && usuarioLogado.foto_perfil) {
            fotoProfile.src = usuarioLogado.foto_perfil;
        }
    }
}

// Mostrar Dashboard (padrão)
function mostrarDashboard() {
    document.querySelectorAll('main > section').forEach(section => {
        section.style.display = 'block';
    });
    
    // Esconder seções específicas
    const perfilSection = document.querySelector('.perfil');
    const historicoSection = document.querySelector('.historico-detalhado');
    
    if (perfilSection) perfilSection.style.display = 'none';
    if (historicoSection) historicoSection.style.display = 'none';
}

// Mostrar seção de perfil
function mostrarPerfil() {
    // Esconder outras seções
    document.querySelectorAll('main > section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Criar ou mostrar seção de perfil
    let perfilSection = document.querySelector('.perfil');
    if (!perfilSection) {
        criarSecaoPerfil();
    } else {
        perfilSection.style.display = 'block';
    }
    
    carregarPerfilUsuario();
}

// Criar seção de perfil
function criarSecaoPerfil() {
    const main = document.querySelector('main');
    const perfilHTML = `
        <section class="perfil">
            <h2>Meu Perfil</h2>
            <div class="perfil-container">
                <div class="perfil-foto">
                    <div class="foto-preview" id="foto-preview">
                        <span class="foto-placeholder">👤</span>
                    </div>
                    <button class="btn-foto" onclick="alterarFoto()">Alterar Foto</button>
                    <input type="file" id="input-foto" accept="image/*" style="display: none;">
                </div>
                <div class="perfil-form">
                    <div class="form-group">
                        <label for="nome">Nome Completo</label>
                        <input type="text" id="nome" name="nome" readonly>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" readonly>
                    </div>
                    <div class="form-group">
                        <label for="telefone">Telefone</label>
                        <input type="tel" id="telefone" name="telefone" readonly>
                    </div>
                    <div class="form-group">
                        <label for="endereco">Endereço</label>
                        <input type="text" id="endereco" name="endereco" readonly>
                    </div>
                    <div class="form-group">
                        <label for="data_nascimento">Data de Nascimento</label>
                        <input type="date" id="data_nascimento" name="data_nascimento" readonly>
                    </div>
                    <div class="form-actions">
                        <button class="btn-primary" id="btn-editar" onclick="toggleEdicao()">Editar Perfil</button>
                        <button class="btn-secondary" id="btn-cancelar" onclick="cancelarEdicao()" style="display: none;">Cancelar</button>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    main.insertAdjacentHTML('beforeend', perfilHTML);
    
    // Configurar upload de foto
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.addEventListener('change', handleFileSelect);
    }
}

// Carregar dados do perfil
async function carregarPerfilUsuario() {
    if (!usuarioLogado) return;
    
    try {
        const response = await fetch(`http://localhost:3000/api/usuario/perfil/${usuarioLogado.id_usuario}`);
        const perfil = await response.json();
        
        if (response.ok) {
            // Preencher campos
            const nomeField = document.getElementById('nome');
            const emailField = document.getElementById('email');
            const telefoneField = document.getElementById('telefone');
            const enderecoField = document.getElementById('endereco');
            const dataNascimentoField = document.getElementById('data_nascimento');
            
            if (nomeField) nomeField.value = perfil.nome || '';
            if (emailField) emailField.value = perfil.email || '';
            if (telefoneField) telefoneField.value = perfil.telefone || '';
            if (enderecoField) enderecoField.value = perfil.endereco || '';
            if (dataNascimentoField) {
                dataNascimentoField.value = perfil.data_nascimento ? perfil.data_nascimento.split('T')[0] : '';
            }
            
            // Atualizar foto
            if (perfil.foto_perfil) {
                const fotoPreview = document.getElementById('foto-preview');
                if (fotoPreview) {
                    fotoPreview.innerHTML = `<img src="${perfil.foto_perfil}" alt="Foto de perfil">`;
                }
            }
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        mostrarAlerta('Erro ao carregar dados do perfil', 'error');
    }
}

// Toggle edição do perfil
function toggleEdicao() {
    const inputs = document.querySelectorAll('.perfil-form input:not([type="email"])');
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    if (!perfilEditando) {
        // Entrar em modo de edição
        inputs.forEach(input => {
            if (input.id !== 'email') { // Email não pode ser editado
                input.removeAttribute('readonly');
                input.style.backgroundColor = 'white';
            }
        });
        
        if (btnEditar) {
            btnEditar.textContent = 'Salvar Alterações';
            btnEditar.onclick = salvarPerfil;
        }
        if (btnCancelar) {
            btnCancelar.style.display = 'inline-block';
        }
        perfilEditando = true;
        
    } else {
        // Sair do modo de edição
        salvarPerfil();
    }
}

// Cancelar edição
function cancelarEdicao() {
    carregarPerfilUsuario(); // Recarregar dados originais
    
    const inputs = document.querySelectorAll('.perfil-form input');
    inputs.forEach(input => {
        input.setAttribute('readonly', true);
        input.style.backgroundColor = '#f5f5f5';
    });
    
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    if (btnEditar) {
        btnEditar.textContent = 'Editar Perfil';
        btnEditar.onclick = toggleEdicao;
    }
    if (btnCancelar) {
        btnCancelar.style.display = 'none';
    }
    perfilEditando = false;
}

// Salvar perfil
async function salvarPerfil() {
    if (!usuarioLogado) return;
    
    const nomeField = document.getElementById('nome');
    const telefoneField = document.getElementById('telefone');
    const enderecoField = document.getElementById('endereco');
    const dataNascimentoField = document.getElementById('data_nascimento');
    
    const dadosPerfil = {
        nome: nomeField ? nomeField.value : '',
        telefone: telefoneField ? telefoneField.value : '',
        endereco: enderecoField ? enderecoField.value : '',
        data_nascimento: dataNascimentoField ? dataNascimentoField.value : ''
    };
    
    try {
        const response = await fetch(`http://localhost:3000/api/usuario/perfil/${usuarioLogado.id_usuario}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosPerfil)
        });
        
        const resultado = await response.json();
        
        if (response.ok) {
            mostrarAlerta('Perfil atualizado com sucesso!', 'success');
            
            // Atualizar dados locais
            usuarioLogado.nome = dadosPerfil.nome;
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            atualizarHeaderUsuario();
            
            // Sair do modo de edição
            cancelarEdicao();
        } else {
            mostrarAlerta(resultado.mensagem || 'Erro ao salvar perfil', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        mostrarAlerta('Erro ao salvar perfil', 'error');
    }
}

// Mostrar histórico
function mostrarHistorico() {
    // Esconder outras seções
    document.querySelectorAll('main > section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Criar ou mostrar seção de histórico detalhado
    let historicoSection = document.querySelector('.historico-detalhado');
    if (!historicoSection) {
        criarSecaoHistorico();
    } else {
        historicoSection.style.display = 'block';
    }
    
    carregarHistoricoCompleto();
}

// Criar seção de histórico detalhado
function criarSecaoHistorico() {
    const main = document.querySelector('main');
    const historicoHTML = `
        <section class="historico-detalhado">
            <h2>Histórico Completo de Consultas</h2>
            <div class="historico-container" id="historico-completo">
                <div class="loading">Carregando histórico...</div>
            </div>
        </section>
        
        <!-- Modal para detalhes da consulta -->
        <div id="modal-consulta" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Detalhes da Consulta</h3>
                    <span class="close" onclick="fecharModal()">&times;</span>
                </div>
                <div class="modal-body" id="modal-body-consulta">
                    <!-- Conteúdo será preenchido dinamicamente -->
                </div>
            </div>
        </div>
    `;
    
    main.insertAdjacentHTML('beforeend', historicoHTML);
}

// Carregar histórico completo de consultas
async function carregarHistoricoCompleto() {
    if (!usuarioLogado) return;
    
    const container = document.getElementById('historico-completo');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Carregando histórico...</div>';

    try {
        const response = await fetch(`http://localhost:3000/api/usuario/fichas/${usuarioLogado.id_usuario}`);
        const historico = await response.json();

        if (response.ok && Array.isArray(historico) && historico.length > 0) {
            let html = '<ul class="lista-historico">';
            historico.forEach(ficha => {
                const dataConsulta = new Date(ficha.data_consulta).toLocaleDateString();
                html += `
                    <li class="item-historico" onclick="abrirModalConsulta(${ficha.id_ficha})">
                        <span>Consulta em: ${dataConsulta}</span>
                    </li>
                `;
            });
            html += '</ul>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p>Não há consultas anteriores registradas.</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        container.innerHTML = '<p>Erro ao carregar histórico de consultas.</p>';
    }
}

// Abrir modal com detalhes da consulta
async function abrirModalConsulta(idFicha) {
    const modal = document.getElementById('modal-consulta');
    const modalBody = document.getElementById('modal-body-consulta');
    
    if (!modal || !modalBody) return;
    
    modalBody.innerHTML = '<p>Carregando detalhes da consulta...</p>';
    modal.style.display = 'block';

    try {
        const response = await fetch(`http://localhost:3000/api/usuario/ficha/${idFicha}`);
        const detalhes = await response.json();

        if (response.ok) {
            modalBody.innerHTML = `
                <p><strong>Data:</strong> ${new Date(detalhes.data_consulta).toLocaleDateString()}</p>
                <p><strong>Queixa principal:</strong> ${detalhes.queixa_principal || '—'}</p>
                <p><strong>Histórico médico:</strong> ${detalhes.historico_medico || '—'}</p>
                <p><strong>Observações:</strong> ${detalhes.observacoes || '—'}</p>
            `;
        } else {
            modalBody.innerHTML = '<p>Erro ao carregar detalhes da consulta.</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        modalBody.innerHTML = '<p>Erro ao carregar detalhes da consulta.</p>';
    }
}

// Fechar modal de consulta
function fecharModal() {
    const modal = document.getElementById('modal-consulta');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Mostrar seção de ajuda
function mostrarAjuda() {
    // Esconder outras seções
    document.querySelectorAll('main > section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Criar ou mostrar seção de ajuda
    let ajudaSection = document.querySelector('.ajuda');
    if (!ajudaSection) {
        criarSecaoAjuda();
    } else {
        ajudaSection.style.display = 'block';
    }
}

// Criar seção de ajuda
function criarSecaoAjuda() {
    const main = document.querySelector('main');
    const ajudaHTML = `
        <section class="ajuda">
            <h2>Central de Ajuda</h2>
            <div class="ajuda-container">
                <div class="ajuda-item">
                    <h3>Como agendar uma consulta?</h3>
                    <p>Para agendar uma consulta, entre em contato através dos nossos canais de atendimento.</p>
                </div>
                <div class="ajuda-item">
                    <h3>Como alterar meus dados?</h3>
                    <p>Vá até a seção "Perfil" e clique em "Editar Perfil" para alterar suas informações.</p>
                </div>
                <div class="ajuda-item">
                    <h3>Como visualizar meu histórico?</h3>
                    <p>Na seção "Histórico" você pode ver todas as suas consultas anteriores.</p>
                </div>
            </div>
        </section>
    `;
    
    main.insertAdjacentHTML('beforeend', ajudaHTML);
}

// Função auxiliar para carregar usuário logado
function carregarUsuarioLogado() {
    // Esta função pode ser expandida conforme necessário
    console.log('Usuário carregado:', usuarioLogado);
}

// Função auxiliar para mostrar alertas
function mostrarAlerta(mensagem, tipo = 'info') {
    // Implementar sistema de alertas aqui
    if (tipo === 'success') {
        alert('✅ ' + mensagem);
    } else if (tipo === 'error') {
        alert('❌ ' + mensagem);
    } else {
        alert('ℹ️ ' + mensagem);
    }
}

// Função para alterar foto (placeholder)
function alterarFoto() {
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.click();
    }
}

// Handler para seleção de arquivo
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const fotoPreview = document.getElementById('foto-preview');
            if (fotoPreview) {
                fotoPreview.innerHTML = `<img src="${e.target.result}" alt="Foto de perfil">`;
            }
        };
        reader.readAsDataURL(file);
    }
}

// Formatação de data
function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}