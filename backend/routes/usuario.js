// Importar o Express e a conexão com banco de dados
const express = require('express');
const router = express.Router();
const connection = require('../db');

// Rota de login
router.post('/login', (req, res) => {
    const { email, senha } = req.body;

    // Validação básica
    if (!email || !senha) {
        return res.status(400).json({ mensagem: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário pelo email
    connection.query(
        'SELECT * FROM Usuario WHERE email = ?',
        [email],
        (err, results) => {
            if (err) {
                console.error('Erro ao buscar usuário:', err);
                return res.status(500).json({ mensagem: 'Erro ao buscar usuário' });
            }

            if (results.length === 0) {
                return res.status(401).json({ mensagem: 'Email ou senha incorretos' });
            }

            const usuario = results[0];

           
            if (senha !== usuario.senha) { 
                return res.status(401).json({ mensagem: 'Email ou senha incorretos' });
            }

            // Remover a senha antes de enviar o usuário
            delete usuario.senha;

            res.json({ mensagem: 'Login bem-sucedido', usuario });
        }
    );
});

// Rota de cadastro - CORRIGIDA
router.post('/cadastro', (req, res) => {
    const { nome, email, senha } = req.body;

    // Validação básica
    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: 'Nome, email e senha são obrigatórios' });
    }

    // Verificar se o email já existe
    connection.query(
        'SELECT * FROM Usuario WHERE email = ?',
        [email],
        (err, results) => {
            if (err) {
                console.error('Erro ao verificar email:', err);
                return res.status(500).json({ mensagem: 'Erro ao verificar email' });
            }

            if (results.length > 0) {
                return res.status(400).json({ mensagem: 'Este email já está em uso' });
            }

            // Na prática, você deveria usar bcrypt.hash aqui
            // const senhaHash = await bcrypt.hash(senha, 10);

            // Inserir na tabela Usuario
            connection.query(
                'INSERT INTO Usuario (nome, email, senha) VALUES (?, ?, ?)',
                [nome, email, senha], // Use senhaHash no lugar de senha quando implementar bcrypt
                (err, result) => {
                    if (err) {
                        console.error('Erro ao cadastrar usuário:', err);
                        return res.status(500).json({ mensagem: 'Erro ao cadastrar usuário' });
                    }

                    const id_usuario = result.insertId;

                    // CORREÇÃO: Inserir também na tabela Paciente
                    // Somente se não for o email do admin
                    if (email !== 'nunescleusa1974@gmail.com') {
                        connection.query(
                            'INSERT INTO Paciente (id_paciente, id_usuario) VALUES (?, ?)',
                            [id_usuario, id_usuario],
                            (err, result) => {
                                if (err) {
                                    console.error('Erro ao cadastrar paciente:', err);
                                    // Se falhar, ainda mantemos o usuário criado
                                    return res.status(500).json({ mensagem: 'Usuário criado mas erro ao registrar como paciente' });
                                }

                                res.status(201).json({ mensagem: 'Cadastro realizado com sucesso!' });
                            }
                        );
                    } else {
                        // Se for o email do admin, inserir na tabela Administrador
                        connection.query(
                            'INSERT INTO Administrador (id_administrador, is_usuario) VALUES (?, ?)',
                            [id_usuario, id_usuario],
                            (err, result) => {
                                if (err) {
                                    console.error('Erro ao cadastrar administrador:', err);
                                    return res.status(500).json({ mensagem: 'Usuário criado mas erro ao registrar como administrador' });
                                }

                                res.status(201).json({ mensagem: 'Administrador cadastrado com sucesso!' });
                            }
                        );
                    }
                }
            );
        }
    );
});

module.exports = router;

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
        document.querySelector('.usuario-header h1').textContent = `Bem-vindo, ${usuarioLogado.nome}!`;
        
        // Atualizar foto se existir
        const fotoProfile = document.querySelector('.usuario-profile img');
        if (usuarioLogado.foto_perfil) {
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
    document.getElementById('input-foto').addEventListener('change', handleFileSelect);
}

// Carregar dados do perfil
async function carregarPerfilUsuario() {
    if (!usuarioLogado) return;
    
    try {
        const response = await fetch(`http://localhost:3000/api/perfil/${usuarioLogado.id_usuario}`);
        const perfil = await response.json();
        
        if (response.ok) {
            // Preencher campos
            document.getElementById('nome').value = perfil.nome || '';
            document.getElementById('email').value = perfil.email || '';
            document.getElementById('telefone').value = perfil.telefone || '';
            document.getElementById('endereco').value = perfil.endereco || '';
            document.getElementById('data_nascimento').value = perfil.data_nascimento ? perfil.data_nascimento.split('T')[0] : '';
            
            // Atualizar foto
            if (perfil.foto_perfil) {
                const fotoPreview = document.getElementById('foto-preview');
                fotoPreview.innerHTML = `<img src="${perfil.foto_perfil}" alt="Foto de perfil">`;
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
        
        btnEditar.textContent = 'Salvar Alterações';
        btnEditar.onclick = salvarPerfil;
        btnCancelar.style.display = 'inline-block';
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
    
    document.getElementById('btn-editar').textContent = 'Editar Perfil';
    document.getElementById('btn-editar').onclick = toggleEdicao;
    document.getElementById('btn-cancelar').style.display = 'none';
    perfilEditando = false;
}

// Salvar perfil
async function salvarPerfil() {
    if (!usuarioLogado) return;
    
    const dadosPerfil = {
        nome: document.getElementById('nome').value,
        telefone: document.getElementById('telefone').value,
        endereco: document.getElementById('endereco').value,
        data_nascimento: document.getElementById('data_nascimento').value
    };
    
    try {
        const response = await fetch(`http://localhost:3000/api/perfil/${usuarioLogado.id_usuario}`, {
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

// Carregar histórico completo
async function carregarHistoricoCompleto() {
    if (!usuarioLogado) return;
    
    const container = document.getElementById('historico-completo');
    
    try {
        const response = await fetch(`http://localhost:3000/api/historico/${usuarioLogado.id_usuario}`);
        const historico = await response.json();
        
        if (response.ok) {
            if (historico.length === 0) {
                container.innerHTML = '<div class="historico-vazio">Nenhuma consulta encontrada.</div>';
                return;
            }
            
            // Limpar container
            container.innerHTML = '';
            
            // Adicionar cada consulta
            historico.forEach(consulta => {
                const item = document.createElement('div');
                item.className = 'historico-item';
                item.innerHTML = `
                    <div class="historico-data">${formatarData(consulta.data_atendimento)}</div>
                    <div class="historico-info">
                        <h4>${consulta.tipo_atendimento}</h4>
                        <p><strong>Terapeuta:</strong> ${consulta.terapeuta_nome}</p>
                        <p><strong>Motivo:</strong> ${consulta.motivo_consulta}</p>
                    </div>
                    <div class="historico-status">Concluída</div>
                `;
                
                // Adicionar evento para mostrar detalhes
                item.addEventListener('click', () => mostrarDetalhesConsulta(consulta.id));
                container.appendChild(item);
            });
            
        } else {
            container.innerHTML = '<div class="erro">Erro ao carregar histórico.</div>';
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        container.innerHTML = '<div class="erro">Erro ao carregar histórico.</div>';
    }
}

// Mostrar detalhes da consulta
async function mostrarDetalhesConsulta(idConsulta) {
    try {
        const response = await fetch(`http://localhost:3000/api/consulta/${idConsulta}`);
        const consulta = await response.json();
        
        if (response.ok) {
            const modalBody = document.getElementById('modal-body-consulta');
            modalBody.innerHTML = `
                <div class="modal-field">
                    <label>Data da Consulta:</label>
                    <p>${formatarData(consulta.data_atendimento)}</p>
                </div>
                <div class="modal-field">
                    <label>Tipo de Atendimento:</label>
                    <p>${consulta.tipo_atendimento}</p>
                </div>
                <div class="modal-field">
                    <label>Terapeuta:</label>
                    <p>${consulta.terapeuta_nome}</p>
                </div>
                <div class="modal-field">
                    <label>Motivo da Consulta:</label>
                    <p>${consulta.motivo_consulta}</p>
                </div>
                <div class="modal-field">
                    <label>Observações:</label>
                    <p>${consulta.observacoes || 'Nenhuma observação registrada.'}</p>
                </div>
            `;
            
            document.getElementById('modal-consulta').classList.add('show');
        }
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        mostrarAlerta('Erro ao carregar detalhes da consulta', 'error');
    }
}

// Fechar modal
function fecharModal() {
    document.getElementById('modal-consulta').classList.remove('show');
}

// Mostrar ajuda
function mostrarAjuda() {
    // Esconder outras seções
    document.querySelectorAll('main > section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Criar seção de ajuda se não existir
    let ajudaSection = document.querySelector('.ajuda');
    if (!ajudaSection) {
        const main = document.querySelector('main');
        const ajudaHTML = `
            <section class="ajuda">
                <h2>Central de Ajuda</h2>
                <div class="ajuda-container">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Como agendar uma consulta?</h3>
                        </div>
                        <div class="card-content">
                            <p>Clique no botão "Agendar Consulta" no dashboard e escolha o melhor horário disponível no calendário.</p>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Como editar meu perfil?</h3>
                        </div>
                        <div class="card-content">
                            <p>Acesse a seção "Perfil" e clique em "Editar Perfil" para at