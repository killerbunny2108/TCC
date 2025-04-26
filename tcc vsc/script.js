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

    // Submissão da ficha
    document.getElementById("fichaForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const fichaData = {};

        formData.forEach((value, key) => {
            fichaData[key] = value;
        });

        fichaData.fumante = formData.get("fumante") === "on";
        fichaData.consome_alcool = formData.get("consome_alcool") === "on";

        // Pegando o ID do administrador logado
        const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

        if (!usuarioLogado || !usuarioLogado.id_usuario) {
            alert("Você precisa estar logado para preencher a ficha.");
            return;
        }

        fichaData.id_administrador = usuarioLogado.id_usuario;

        if (!fichaData.id_paciente) {
            alert("Informe o ID do paciente.");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/ficha", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fichaData),
            });

            if (response.ok) {
                alert("Ficha salva com sucesso!");
                e.target.reset();
            } else {
                alert("Erro ao salvar ficha.");
            }
        } catch (error) {
            console.error("Erro:", error);
            alert("Erro de conexão com o servidor.");
        }
    });
    document.getElementById("criarFichaBtn")?.addEventListener("click", function () {
        const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    
        if (!usuarioLogado || usuarioLogado.email !== "nunescleusa1974@gmail.com") {
            alert("Acesso negado. Apenas o administrador pode criar fichas.");
            return;
        }
    
        window.location.href = "ficha.html";
    });
    
    document.addEventListener("DOMContentLoaded", function () {
        const API_URL = "http://localhost:3000/api/pacientes";
    
        // Função para carregar pacientes na combo box
        function carregarPacientes() {
            fetch(API_URL)
                .then(response => response.json())
                .then(pacientes => {
                    const comboBox = document.getElementById('comboPacientes');
                    // Limpa as opções existentes antes de adicionar as novas
                    comboBox.innerHTML = '<option value="">Selecione um Paciente</option>';
    
                    if (pacientes.length === 0) {
                        const option = document.createElement('option');
                        option.textContent = 'Nenhum paciente encontrado';
                        comboBox.appendChild(option);
                    } else {
                        // Preenche a combo box com os pacientes
                        pacientes.forEach(paciente => {
                            const option = document.createElement('option');
                            option.value = paciente.id_usuario;  // id do paciente
                            option.textContent = paciente.nome; // nome do paciente
                            comboBox.appendChild(option);
                        });
                    }
                })
                .catch(error => {
                    console.error('Erro ao carregar pacientes:', error);
                    alert('Erro ao carregar a lista de pacientes');
                });
        }
    
        // Chama a função para preencher a combo box quando a página carregar
        window.onload = carregarPacientes;
    });
    
});
