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

    // Carregar pacientes na combo box
    const API_PACIENTES_URL = "http://localhost:3000/api/pacientes";

    function carregarPacientes() {
        fetch(API_PACIENTES_URL)
            .then(response => response.json())
            .then(pacientes => {
                const comboBox = document.getElementById('comboPacientes');
                comboBox.innerHTML = '<option value="">Selecione um Paciente</option>';

                if (pacientes.length === 0) {
                    const option = document.createElement('option');
                    option.textContent = 'Nenhum paciente encontrado';
                    comboBox.appendChild(option);
                } else {
                    pacientes.forEach(paciente => {
                        const option = document.createElement('option');
                        option.value = paciente.id_usuario;
                        option.textContent = paciente.nome;
                        comboBox.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Erro ao carregar pacientes:', error);
                alert('Erro ao carregar a lista de pacientes');
            });
    }

    window.onload = carregarPacientes;

});

// Função para buscar as dicas da API
function buscarDicas() {
    fetch('http://localhost:3000/api/dicas')  // URL da sua API
      .then(response => response.json())
      .then(dicas => {
        const listaDicas = document.getElementById('dicas-list');
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
  
  // Chamar a função para buscar as dicas quando a página carregar
  document.addEventListener('DOMContentLoaded', buscarDicas);