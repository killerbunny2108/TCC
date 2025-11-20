document.addEventListener("DOMContentLoaded", function () {
    const API_URL = "http://localhost:3000/api/usuario";

    document.getElementById("loginBtn")?.addEventListener("click", function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim().toLowerCase();
        const senha = document.getElementById("senha").value;

        if (!email || !senha) {
            alert("Preencha todos os campos.");
            return;
        }

        fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                if (data.user || data.success) {
                    localStorage.setItem("usuarioLogado", JSON.stringify(data.user));

                    if (data.user.email === "nunescleusa1974@gmail.com") {
                        window.location.href = "admin.html";
                    } else {
                        window.location.href = "usuario.html";
                    }
                } else {
                    alert(data.message || "Falha no login");
                }
            })
            .catch(err => {
                console.error("Erro completo:", err);
                alert("Erro ao conectar com o servidor");
            });
    });

  // Botão de cadastro - CORRIGIDO
    document.getElementById("cadastroBtn")?.addEventListener("click", function (event) {
    event.preventDefault();

    const nome = document.getElementById("nome")?.value?.trim() || "";
    const email = document.getElementById("email")?.value?.trim().toLowerCase() || "";
    const senha = document.getElementById("senha")?.value || "";
    const dataNascimento = document.getElementById("dataNascimento")?.value || "";

    // Validação dos campos obrigatórios
    if (!nome || !email || !senha) {
        alert("Por favor, preencha todos os campos obrigatórios (Nome, Email e Senha).");
        return;
    }

    // Validação do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.log("Por favor, insira um email válido.");
        return;
    }

    // Validação da senha
    if (senha.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    // Preparar dados para envio
    const dadosCadastro = {
        nome: nome,
        email: email,
        senha: senha,
        telefone: "", // Opcional - pode ser preenchido depois no perfil
        endereco: "", // Opcional - pode ser preenchido depois no perfil
        data_nascimento: dataNascimento || null
    };

    console.log("Enviando dados de cadastro:", dadosCadastro);

    // Enviar requisição
    fetch(`${API_URL}/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosCadastro)
    })
        .then(res => {
            console.log("Status da resposta:", res.status);
            if (!res.ok) {
                // Tentar ler a mensagem de erro
                return res.json().then(data => {
                    throw new Error(data.message || `Erro HTTP: ${res.status}`);
                });
            }
            return res.json();
        })
        .then(data => {
            console.log("Resposta do servidor:", data);
            
            // Verificar sucesso - CORRIGIDO para usar 'message' e 'success'
            if (data.success || data.message?.toLowerCase().includes("sucesso")) {
                alert("Cadastro realizado com sucesso! Você será redirecionado para o login.");
                window.location.href = "login.html";
            } else {
                alert(data.message || "Erro ao cadastrar. Tente novamente.");
            }
        })
        .catch(err => {
            console.error("Erro completo:", err);
            alert(err.message || "Erro ao conectar com o servidor. Verifique se o backend está rodando.");
        });
});
    // Botão voltar
    document.getElementById("voltarBtn")?.addEventListener("click", function () {
        window.history.back();
    });

    // Botão criar ficha (SEM VERIFICAÇÃO)
    document.getElementById("criarFichaBtn")?.addEventListener("click", function () {
        window.location.href = "ficha.html";
    });

    // Submissão da ficha de anamnese - Corrigido para redirecionar para admin.html após salvar
    document.getElementById("formFicha")?.addEventListener("submit", async (e) => {
        e.preventDefault();

        console.log("Formulário enviado");

        const formData = new FormData(e.target);
        const fichaData = {};

        formData.forEach((value, key) => {
            fichaData[key] = value;
        });

        fichaData.fumante = document.getElementById("fumante").checked;
        fichaData.consome_alcool = document.getElementById("consome_alcool").checked;

        // Obter o ID do administrador do localStorage (assumindo que está logado)
        const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
        fichaData.id_administrador = usuarioLogado.id_usuario;

        if (!fichaData.id_paciente) {
            alert("Selecione um paciente.");
            return;
        }

        try {
            console.log("Dados da ficha:", fichaData);

            const response = await fetch("http://localhost:3000/api/ficha", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fichaData),
            });

            const result = await response.json();

            if (response.ok) {
                alert("Ficha salva com sucesso!");
                // Redirecionar para a página do administrador após salvar com sucesso
                window.location.href = "admin.html";
            } else {
                console.error("Erro ao salvar a ficha:", result);
                alert(result.mensagem || "Erro ao salvar ficha.");
            }
        } catch (error) {
            console.error("Erro:", error);
            alert("Erro de conexão com o servidor.");
        }
    });

    // Carregar pacientes na combo box - MODIFICADO PARA USAR O ID CORRETO
    function carregarPacientes() {
        const comboBox = document.getElementById('id_paciente');

        if (comboBox) {
            console.log("Carregando pacientes...");
            fetch("http://localhost:3000/api/pacientes")
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Falha ao obter dados dos pacientes: ' + response.status);
                    }
                    return response.json();
                })
                .then(pacientes => {
                    console.log("Pacientes recebidos:", pacientes);
                    comboBox.innerHTML = '<option value="">Selecione um Paciente</option>';

                    if (pacientes.length === 0) {
                        const option = document.createElement('option');
                        option.textContent = 'Nenhum paciente encontrado';
                        option.disabled = true;
                        comboBox.appendChild(option);
                    } else {
                        pacientes.forEach(paciente => {
                            const option = document.createElement('option');
                            option.value = paciente.id_paciente;
                            option.textContent = paciente.nome;
                            comboBox.appendChild(option);
                        });
                    }
                })
                .catch(error => {
                    console.error('Erro ao carregar pacientes:', error);
                    alert('Erro ao carregar a lista de pacientes. Verifique o console para mais detalhes.');
                });
        }
    }

    // Chamar a função apenas se estivermos na página de ficha
    if (window.location.pathname.includes('ficha.html')) {
        carregarPacientes();
    }

    // Prevenir rolagem da página quando a tecla espaço é pressionada
    document.addEventListener('keydown', function (e) {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
        }
    });
});

// Função para buscar as dicas da API
function buscarDicas() {
    const listaDicas = document.getElementById('dicas-list');
    // Só executar se o elemento existir na página atual
    if (listaDicas) {
        fetch('http://localhost:3000/api/dicas')
            .then(response => response.json())
            .then(dicas => {
                listaDicas.innerHTML = ''; // Limpar qualquer conteúdo anterior

                // Adicionar cada dica na lista
                dicas.forEach(dica => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <h3>${dica.titulo}</h3>
                        <p>${dica.descricao}</p>
                    `;
                    listaDicas.appendChild(li);
                });
            })
            .catch(error => {
                console.error('Erro ao carregar as dicas:', error);
            });
    }
}

// Chamar a função para buscar as dicas apenas se estiver em uma página que usa dicas
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('dicas-list')) {
        buscarDicas();
    }
});

// Código do carrossel
let slideIndex = 0;
const slides = document.querySelectorAll('.carousel-slide');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');

// Só executar o código do carrossel se os elementos existirem
if (slides.length > 0 && prevBtn && nextBtn) {
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.display = (i === index) ? 'block' : 'none';
        });
    }

    prevBtn.addEventListener('click', () => {
        slideIndex = (slideIndex - 1 + slides.length) % slides.length;
        showSlide(slideIndex);
    });

    nextBtn.addEventListener('click', () => {
        slideIndex = (slideIndex + 1) % slides.length;
        showSlide(slideIndex);
    });

    // Mostrar o primeiro slide ao carregar
    showSlide(slideIndex);
}

// Animações ao scroll
function animateOnScroll() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(element => {
        observer.observe(element);
    });
}

// Animar cards de depoimentos ao scroll
function animateDepoimentos() {
    const cards = document.querySelectorAll('.depoimento-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('animated');
                }, index * 150); // Delay escalonado
            }
        });
    }, {
        threshold: 0.2
    });

    cards.forEach(card => {
        observer.observe(card);
    });
}

// Smooth scroll para links de navegação
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Inicializar animações quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    animateOnScroll();
    animateDepoimentos();
    
    // Adicionar classe aos elementos que devem animar
    const elementsToAnimate = [
        
        '.texto',
        '.terapias-main'
    ];
    
    elementsToAnimate.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.classList.add('animate-on-scroll'));
    });
});
