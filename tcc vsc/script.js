document.addEventListener("DOMContentLoaded", function () {
    const API_URL = "http://localhost:3000/api/usuario";

    // Botão de login
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
        .then(res => res.json())
        .then(data => {
            if (data.usuario) {
                alert("Login bem-sucedido!");
                localStorage.setItem("usuarioLogado", JSON.stringify(data.usuario));

                if (email === "nunescleusa1974@gmail.com") {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "usuario.html";
                }
            } else {
                alert(data.mensagem || "Falha no login");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Erro ao conectar com o servidor");
        });
    });

    // Botão de cadastro
    document.getElementById("cadastroBtn")?.addEventListener("click", function (event) {
        event.preventDefault();

        const nome = document.getElementById("nome")?.value || "Usuário";
        const email = document.getElementById("email").value.trim().toLowerCase();
        const senha = document.getElementById("senha").value;

        if (!email || !senha) {
            alert("Preencha todos os campos.");
            return;
        }

        fetch(`${API_URL}/cadastro`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email, senha })
        })
        .then(res => res.json())
        .then(data => {
            if (data.mensagem?.includes("sucesso")) {
                alert("Cadastro realizado com sucesso!");
                window.location.href = "login.html";
            } else {
                alert(data.mensagem || "Erro ao cadastrar");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Erro ao conectar com o servidor");
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

    // Submissão da ficha (sem verificação de usuário logado)
    document.getElementById("fichaForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();

        console.log("Formulário enviado");

        const formData = new FormData(e.target);
        const fichaData = {};

        formData.forEach((value, key) => {
            fichaData[key] = value;
        });

        fichaData.fumante = formData.get("fumante") === "on";
        fichaData.consome_alcool = formData.get("consome_alcool") === "on";

        // A partir daqui, removi qualquer uso do "usuarioLogado"

        if (!fichaData.id_paciente) {
            alert("Informe o ID do paciente.");
            return;
        }

        try {
            console.log("Dados da ficha:", fichaData);

            const response = await fetch("http://localhost:3000/api/ficha", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fichaData),
            });

            if (response.ok) {
                alert("Ficha salva com sucesso!");
                e.target.reset();
            } else {
                console.error("Erro ao salvar a ficha:", response);
                alert("Erro ao salvar ficha.");
            }
        } catch (error) {
            console.error("Erro:", error);
            alert("Erro de conexão com o servidor.");
        }
    });

    // Carregar pacientes na combo box - MODIFICADO PARA VERIFICAR SE O ELEMENTO EXISTE
    function carregarPacientes() {
        // Verificar para ambos os IDs possíveis - 'comboPacientes' e 'id_paciente'
        const comboBox = document.getElementById('comboPacientes') || document.getElementById('id_paciente');
        // Só executar se o elemento existir na página atual
        if (comboBox) {
            fetch("http://localhost:3000/api/pacientes")
                .then(response => response.json())
                .then(pacientes => {
                    comboBox.innerHTML = '<option value="">Selecione um Paciente</option>';

                    if (pacientes.length === 0) {
                        const option = document.createElement('option');
                        option.textContent = 'Nenhum paciente encontrado';
                        comboBox.appendChild(option);
                    } else {
                        pacientes.forEach(paciente => {
                            const option = document.createElement('option');
                            // Usar o id_paciente que foi retornado da API
                            option.value = paciente.id_paciente;
                            option.textContent = paciente.nome;
                            comboBox.appendChild(option);
                        });
                    }
                })
                .catch(error => {
                    console.error('Erro ao carregar pacientes:', error);
                    // Remover o alert para evitar mensagens desnecessárias
                    // alert('Erro ao carregar a lista de pacientes');
                });
        }
    }

    // Chamar a função apenas se estivermos em uma página que precisa dela
    if (window.location.pathname.includes('admin.html') || 
        document.getElementById('comboPacientes') || 
        document.getElementById('id_paciente')) {
        carregarPacientes();
    }

    // Prevenir rolagem da página quando a tecla espaço é pressionada
    document.addEventListener('keydown', function(e) {
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
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('dicas-list')) {
        buscarDicas();
    }
});

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