// FUNCIONALIDADES DA PÁGINA DO USUÁRIO

// Variáveis globais
let usuarioLogado = null;
let perfilEditando = false;

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    inicializarPagina();
    configurarNavegacao();
    carregarUsuarioLogado();
    carregarHistoricoResumo();
});

// Função para inicializar a página
function inicializarPagina() {
    // Verificar se há usuário logado no localStorage
    const usuario = localStorage.getItem('usuarioLogado');
    if (usuario) {
        usuarioLogado = JSON.parse(usuario);
        atualizarBemVindo();
        atualizarHeaderUsuario();
    } else {
        // Redirecionar para login se não estiver logado
        window.location.href = 'inicio.html';
    }
}

// Atualizar mensagem de boas-vindas com nome do paciente
function atualizarBemVindo() {
    if (usuarioLogado && usuarioLogado.nome) {
        const welcomeElement = document.getElementById('welcome-message');
        if (welcomeElement) {
            welcomeElement.textContent = `Bem-vindo, ${usuarioLogado.nome}!`;
        }
    }
}

// Configurar navegação entre seções
function configurarNavegacao() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active de todos os itens
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Esconde todas as seções
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Mostra a seção correspondente
            const sectionName = this.getAttribute('data-section');
            const targetSection = document.getElementById(`${sectionName}-section`);
            
            if (targetSection) {
                targetSection.classList.add('active');
                
                // Carregar dados específicos da seção
                if (sectionName === 'perfil') {
                    carregarPerfilUsuario();
                } else if (sectionName === 'historico') {
                    carregarHistoricoCompleto();
                }
            }
        });
    });
}

// Atualizar header com dados do usuário
function atualizarHeaderUsuario() {
    if (usuarioLogado) {
        // Atualizar foto se existir
        const fotoProfile = document.getElementById('header-foto');
        if (fotoProfile && usuarioLogado.foto_perfil) {
            fotoProfile.src = usuarioLogado.foto_perfil;
        }
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
            atualizarBemVindo();
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

// Carregar histórico resumido para dashboard
async function carregarHistoricoResumo() {
    if (!usuarioLogado) return;
    
    const container = document.getElementById('historico-resumo');
    if (!container) return;
    
    try {
        const response = await fetch(`http://localhost:3000/api/usuario/fichas/${usuarioLogado.id_usuario}`);
        const historico = await response.json();

        if (response.ok && Array.isArray(historico) && historico.length > 0) {
            // Mostrar apenas as 3 últimas consultas
            const ultimasConsultas = historico.slice(0, 3);
            let html = '';
            
            ultimasConsultas.forEach(ficha => {
                const dataConsulta = new Date(ficha.data_consulta).toLocaleDateString('pt-BR');
                html += `
                    <div class="historico-item">
                        <div class="historico-data">${dataConsulta}</div>
                        <div class="historico-info">
                            <h4>Consulta Realizada</h4>
                            <p>Clique em "Histórico" para ver detalhes</p>
                        </div>
                        <div class="historico-status">Concluída</div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="historico-item">
                    <div class="historico-info">
                        <p>Nenhuma consulta anterior encontrada.</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar histórico resumido:', error);
        container.innerHTML = `
            <div class="historico-item">
                <div class="historico-info">
                    <p>Erro ao carregar histórico.</p>
                </div>
            </div>
        `;
    }
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
                const dataConsulta = new Date(ficha.data_consulta).toLocaleDateString('pt-BR');
                html += `
                    <li class="item-historico" onclick="abrirModalConsulta(${ficha.id_ficha})">
                        <div class="data-consulta">${dataConsulta}</div>
                        <div class="info-consulta">Clique para ver detalhes da consulta</div>
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
            const dataFormatada = new Date(detalhes.data_consulta).toLocaleDateString('pt-BR');
            modalBody.innerHTML = `
                <div style="line-height: 1.6;">
                    <p><strong>📅 Data da Consulta:</strong> ${dataFormatada}</p>
                    <p><strong>🩺 Queixa Principal:</strong> ${detalhes.queixa_principal || 'Não informado'}</p>
                    <p><strong>📋 Histórico Médico:</strong> ${detalhes.historico_medico || 'Não informado'}</p>
                    <p><strong>📝 Observações:</strong> ${detalhes.observacoes || 'Nenhuma observação registrada'}</p>
                </div>
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

// Função auxiliar para carregar usuário logado
function carregarUsuarioLogado() {
    console.log('Usuário carregado:', usuarioLogado);
}

// Função auxiliar para mostrar alertas
function mostrarAlerta(mensagem, tipo = 'info') {
    if (tipo === 'success') {
        alert('✅ ' + mensagem);
    } else if (tipo === 'error') {
        alert('❌ ' + mensagem);
    } else {
        alert('ℹ️ ' + mensagem);
    }
}

// Função para alterar foto
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

// Configurar upload de foto
document.addEventListener('DOMContentLoaded', function() {
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.addEventListener('change', handleFileSelect);
    }
});

// Fechar modal ao clicar fora dele
window.onclick = function(event) {
    const modal = document.getElementById('modal-consulta');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Formatação de data
function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}
async function salvarPerfil() {
    if (!usuarioLogado) return;

    const formData = new FormData();
    formData.append('nome', document.getElementById('nome').value);
    formData.append('telefone', document.getElementById('telefone').value);
    formData.append('endereco', document.getElementById('endereco').value);
    formData.append('data_nascimento', document.getElementById('data_nascimento').value);

    const file = document.getElementById('input-foto').files[0];
    if (file) {
        formData.append('foto', file);
    }

    try {
        const response = await fetch(`http://localhost:3000/api/paciente/perfil/${usuarioLogado.id_paciente}`, {
            method: 'PUT',
            body: formData
        });

        const resultado = await response.json();

        if (response.ok) {
            mostrarAlerta('Perfil atualizado com sucesso!', 'success');
            carregarPerfilUsuario(); // Atualiza visual
            cancelarEdicao();
        } else {
            mostrarAlerta(resultado.mensagem || 'Erro ao salvar perfil', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        mostrarAlerta('Erro ao salvar perfil', 'error');
    }
}
