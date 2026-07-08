/* ==========================================
   1. BOTÃO "SAIBA MAIS"
   ========================================== */

// essa const vai buscar o botão do cabeçalho pelo id que dei no HTML
const botaoSaibaMais = document.getElementById("btn-saiba-mais");

// Fica esperando o evento de clique nesse botão
botaoSaibaMais.addEventListener("click", function () {
    // scrollIntoView "rola" a página até o elemento escolhido aparecer na tela
    // behavior: "smooth" faz a rolagem ser suave, e não instantânea
    document.getElementById("sobre").scrollIntoView({ behavior: "smooth" });
});


/* ==========================================
   2. FORMULÁRIO DE CONTATO
   ========================================== */

// Essa const busca o formulário inteiro pelo id
const formContato = document.getElementById("form-contato");

// Essa const busca o parágrafo vazio onde vamos escrever a mensagem de agradecimento
const mensagemAgradecimento = document.getElementById("mensagem-agradecimento");

// O evento aqui é "submit" (quando o usuário aperta o botão de enviar o formulário)
formContato.addEventListener("submit", function (evento) {

    // preventDefault() impede o comportamento padrão do formulário
    // (que seria tentar enviar os dados pra um servidor e recarregar a página)
    evento.preventDefault();

    // Pega o valor que o usuário digitou no campo "nome"
    const nome = document.getElementById("nome").value;

    // Escreve a mensagem de agradecimento dentro do parágrafo,
    // usando template literal (crase + ${ }) pra inserir o nome no texto
    mensagemAgradecimento.textContent = `Obrigado, ${nome}! Sua mensagem foi enviada com sucesso.`;

    // Limpa o formulário depois de enviado, pra ficar pronto pra um novo uso
    formContato.reset();
});


/* ==========================================
   3. ACERVO DE JOGOS (API RAWG)
   ========================================== */

// CONFIG — crie uma conta gratuita em https://rawg.io/apidocs e cole sua chave aqui:
const RAWG_API_KEY = "COLE_SUA_CHAVE_AQUI";
const RAWG_BASE_URL = "https://api.rawg.io/api";

// Busca os elementos da tela que vamos usar várias vezes
const gameGrid = document.getElementById("game-grid");
const resultsInfo = document.getElementById("results-info");
const emptyState = document.getElementById("empty-state");
const errorState = document.getElementById("error-state");
const inputBusca = document.getElementById("busca-jogo");
const botaoBuscarJogo = document.getElementById("btn-buscar-jogo");
const chipsPlataforma = document.querySelectorAll(".chip");

// Referências aos botões e texto da paginação
const botaoPaginaAnterior = document.getElementById("btn-pagina-anterior");
const botaoProximaPagina = document.getElementById("btn-proxima-pagina");
const paginationInfo = document.getElementById("pagination-info");

// Guardam o estado atual da busca (o que o usuário digitou, plataforma e página)
let plataformaAtual = "";
let buscaAtual = "";
let paginaAtual = 1;
const RESULTADOS_POR_PAGINA = 16;

// Mostra "esqueletos" de carregamento enquanto a API não responde
function mostrarCarregando(quantidade = 8) {
    gameGrid.innerHTML = "";
    emptyState.classList.remove("show");
    errorState.classList.remove("show");

    for (let i = 0; i < quantidade; i++) {
        const skeleton = document.createElement("div");
        skeleton.className = "skeleton";
        gameGrid.appendChild(skeleton);
    }
}

// Monta o texto da plataforma do jogo (ex: "SNES / MEGA DRIVE")
function textoPlataforma(jogo) {
    if (!jogo.parent_platforms || jogo.parent_platforms.length === 0) {
        return "PLATAFORMA DESCONHECIDA";
    }
    return jogo.parent_platforms
        .map(function (item) { return item.platform.name; })
        .slice(0, 2)
        .join(" / ")
        .toUpperCase();
}

// Desenha os cards de jogo na tela a partir da lista que veio da API
function renderizarJogos(jogos) {
    gameGrid.innerHTML = "";

    if (!jogos || jogos.length === 0) {
        emptyState.classList.add("show");
        return;
    }
    emptyState.classList.remove("show");

    jogos.forEach(function (jogo) {
        const capa = jogo.background_image || "";
        const nota = jogo.rating ? jogo.rating.toFixed(1) : "—";
        const ano = jogo.released ? jogo.released.slice(0, 4) : "?";

        // Cria o card na "mão" (sem template literal gigante) pra ficar mais fácil de ler
        const card = document.createElement("div");
        card.className = "game-card";

        card.innerHTML = `
            <div class="game-card-cover">
                <span class="price-tag">★ ${nota}</span>
                ${capa ? `<img src="${capa}" alt="Capa de ${jogo.name}" loading="lazy">` : ""}
            </div>
            <div class="game-card-body">
                <div class="game-card-title">${jogo.name}</div>
                <div class="label-strip">${ano} · ${textoPlataforma(jogo)}</div>
            </div>
        `;

        // Ao clicar no card, abre o modal com os detalhes desse jogo
        card.addEventListener("click", function () {
            abrirDetalhesJogo(jogo.id);
        });

        gameGrid.appendChild(card);
    });
}

// Busca a lista de jogos na API, considerando o texto digitado e a plataforma escolhida
function buscarJogos() {
    // Se ainda não colocou a chave da API, avisa e para por aqui
    if (!RAWG_API_KEY || RAWG_API_KEY === "COLE_SUA_CHAVE_AQUI") {
        errorState.textContent = "Adicione sua chave da RAWG API no script.js (variável RAWG_API_KEY) para carregar os jogos.";
        errorState.classList.add("show");
        gameGrid.innerHTML = "";
        resultsInfo.textContent = "";
        return;
    }

    mostrarCarregando();

    // URLSearchParams monta a "query string" (?key=...&search=...) de forma organizada
    const parametros = new URLSearchParams({
        key: RAWG_API_KEY,
        page_size: String(RESULTADOS_POR_PAGINA),
        page: String(paginaAtual)
    });

    if (buscaAtual) parametros.set("search", buscaAtual);
    if (plataformaAtual) parametros.set("platforms", plataformaAtual);
    if (!buscaAtual) parametros.set("ordering", "-rating"); // sem busca, mostra os mais bem avaliados

    fetch(`${RAWG_BASE_URL}/games?${parametros.toString()}`)
        .then(function (resposta) {
            if (!resposta.ok) throw new Error("Falha na requisição");
            return resposta.json();
        })
        .then(function (dados) {
            resultsInfo.textContent = dados.count
                ? `${dados.count.toLocaleString("pt-BR")} ITENS NO CATÁLOGO`
                : "";
            renderizarJogos(dados.results);
            atualizarPaginacao(dados);
        })
        .catch(function (erro) {
            console.error(erro);
            errorState.classList.add("show");
            gameGrid.innerHTML = "";
        });
}

// Atualiza os botões e o texto "Página X" com base no que a API retornou
function atualizarPaginacao(dados) {
    // a RAWG manda "next" e "previous" como URL (ou null quando não existe)
    botaoPaginaAnterior.disabled = !dados.previous;
    botaoProximaPagina.disabled = !dados.next;

    const totalPaginas = Math.ceil(dados.count / RESULTADOS_POR_PAGINA);
    paginationInfo.textContent = totalPaginas
        ? `Página ${paginaAtual} de ${totalPaginas.toLocaleString("pt-BR")}`
        : "";
}

// Busca os detalhes de UM jogo específico e mostra no modal
function abrirDetalhesJogo(id) {
    const modalOverlay = document.getElementById("modal-overlay");
    const modalTitulo = document.getElementById("modal-title");
    const modalCorpo = document.getElementById("modal-body");

    modalTitulo.textContent = "Carregando...";
    modalCorpo.innerHTML = "";
    modalOverlay.classList.add("show");

    fetch(`${RAWG_BASE_URL}/games/${id}?key=${RAWG_API_KEY}`)
        .then(function (resposta) {
            return resposta.json();
        })
        .then(function (jogo) {
            modalTitulo.textContent = jogo.name;

            const plataformas = (jogo.platforms || [])
                .map(function (p) { return p.platform.name; })
                .join(", ");
            const generos = (jogo.genres || [])
                .map(function (g) { return g.name; })
                .join(", ");

            let descricao = jogo.description_raw || "Sem descrição disponível.";
            if (descricao.length > 500) {
                descricao = descricao.slice(0, 500) + "...";
            }

            // Primeiro mostra tudo, com a descrição ainda em inglês e um aviso de "traduzindo"
            modalCorpo.innerHTML = `
                ${jogo.background_image ? `<img src="${jogo.background_image}" alt="Capa de ${jogo.name}">` : ""}
                <p><strong>Plataformas:</strong> ${plataformas || "—"}</p>
                <p><strong>Gêneros:</strong> ${generos || "—"}</p>
                <p><strong>Lançamento:</strong> ${jogo.released || "—"} &nbsp;|&nbsp; ★ ${jogo.rating ? jogo.rating.toFixed(1) : "—"}</p>
                <p class="modal-description" id="modal-description">Traduzindo descrição...</p>
            `;

            // Depois, busca a tradução e troca o texto assim que ela chegar
            traduzirTexto(descricao).then(function (textoTraduzido) {
                document.getElementById("modal-description").textContent = textoTraduzido;
            });
        })
        .catch(function (erro) {
            modalTitulo.textContent = "Erro";
            modalCorpo.innerHTML = "<p>Não foi possível carregar os detalhes deste jogo.</p>";
            console.error(erro);
        });
}

// Traduz um texto do inglês pro português usando a API gratuita MyMemory.
// Se der qualquer problema (limite de uso, sem internet, etc.), devolve o texto original.
function traduzirTexto(texto) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=en|pt-br`;

    return fetch(url)
        .then(function (resposta) {
            return resposta.json();
        })
        .then(function (dados) {
            if (dados && dados.responseData && dados.responseData.translatedText) {
                return dados.responseData.translatedText;
            }
            return texto;
        })
        .catch(function () {
            return texto;
        });
}

// Fecha o modal ao clicar no X ou fora da caixinha
document.getElementById("modal-close").addEventListener("click", function () {
    document.getElementById("modal-overlay").classList.remove("show");
});
document.getElementById("modal-overlay").addEventListener("click", function (evento) {
    if (evento.target.id === "modal-overlay") {
        document.getElementById("modal-overlay").classList.remove("show");
    }
});

// Evento de clique no botão de buscar
botaoBuscarJogo.addEventListener("click", function () {
    buscaAtual = inputBusca.value.trim();
    paginaAtual = 1; // toda busca nova começa da página 1
    buscarJogos();
});

// Também permite buscar apertando Enter no campo de texto
inputBusca.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
        buscaAtual = inputBusca.value.trim();
        paginaAtual = 1;
        buscarJogos();
    }
});

// Evento de clique nos chips de plataforma (SNES, Mega Drive, etc.)
chipsPlataforma.forEach(function (chip) {
    chip.addEventListener("click", function () {
        // remove o "active" de todos os chips, e coloca só no que foi clicado
        chipsPlataforma.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");

        plataformaAtual = chip.dataset.platform;
        paginaAtual = 1; // trocar de plataforma também reinicia a paginação
        buscarJogos();
    });
});

// Botões de "Anterior" e "Próxima"
botaoPaginaAnterior.addEventListener("click", function () {
    if (paginaAtual > 1) {
        paginaAtual--;
        buscarJogos();
        // rola de volta pro topo do catálogo, senão o usuário fica "perdido" lá embaixo
        document.getElementById("acervo").scrollIntoView({ behavior: "smooth" });
    }
});

botaoProximaPagina.addEventListener("click", function () {
    paginaAtual++;
    buscarJogos();
    document.getElementById("acervo").scrollIntoView({ behavior: "smooth" });
});

// Carrega o acervo assim que a página abre
buscarJogos();