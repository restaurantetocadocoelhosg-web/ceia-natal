// Liga o cardápio e o pedido à tela. As regras ficam em pedido.js.
(function () {
  'use strict';

  const { KIT, CATEGORIAS, WHATSAPP, DATA_LIMITE } = window.CatalogoCeia;
  const P = window.PedidoCeia;
  const porId = (id) => document.getElementById(id);

  let carrinho = [];
  const linhasDoCardapio = new Map();
  const abertas = P.encomendasAbertas(new Date(), DATA_LIMITE);

  function criar(tag, props = {}, filhos = []) {
    const elemento = document.createElement(tag);
    Object.entries(props).forEach(([nome, valor]) => {
      if (nome === 'texto') elemento.textContent = valor;
      else if (nome === 'aoClicar') elemento.addEventListener('click', valor);
      else elemento.setAttribute(nome, valor);
    });
    filhos.forEach((filho) => elemento.append(filho));
    return elemento;
  }

  function criarContador(item, classeExtra = '') {
    const menos = criar('button', { type: 'button', class: 'contador-botao', 'aria-label': `Tirar 1 de ${item.nome}`, 'data-acao': 'menos', texto: '−' });
    const numero = criar('span', { class: 'contador-numero', 'aria-live': 'polite' });
    const mais = criar('button', { type: 'button', class: 'contador-botao', 'aria-label': `Colocar mais 1 de ${item.nome}`, 'data-acao': 'mais', texto: '+' });
    const grupo = criar('div', { class: `contador ${classeExtra}`.trim(), role: 'group', 'aria-label': `Quantidade de ${item.nome}` }, [menos, numero, mais]);
    return { grupo, menos, numero, mais };
  }

  function criarLinhaCardapio(item) {
    const adicionar = criar('button', { type: 'button', class: 'botao-adicionar', 'aria-label': `Adicionar ${item.nome}`, texto: 'Adicionar' });
    const contador = criarContador(item);
    adicionar.addEventListener('click', () => {
      atualizar(P.adicionar(carrinho, item));
      contador.mais.focus();
    });
    contador.mais.addEventListener('click', () => atualizar(P.adicionar(carrinho, item)));
    contador.menos.addEventListener('click', () => {
      const novo = P.alterarQtd(carrinho, item.chave, -1);
      atualizar(novo);
      if (P.qtdDe(novo, item.chave) === 0) adicionar.focus();
    });
    linhasDoCardapio.set(item.chave, { adicionar, contador });

    const nome = criar('span', { class: 'prato-nome', texto: item.nome });
    const pontos = criar('span', { class: 'prato-pontos', 'aria-hidden': 'true' });
    const preco = criar('span', { class: 'prato-preco', texto: P.formatarPreco(item.centavos) });
    const titulo = criar('div', { class: 'prato-titulo' }, [nome, pontos, preco]);
    const detalhe = criar('p', { class: 'prato-detalhe', texto: item.detalhe });
    const texto = criar('div', { class: 'prato-texto' }, [titulo, detalhe]);
    const acoes = criar('div', { class: 'prato-acoes' }, abertas ? [adicionar, contador.grupo] : []);
    return criar('li', { class: 'prato' }, [texto, acoes]);
  }

  function montarCardapio() {
    CATEGORIAS.forEach((categoria) => {
      porId('atalhos').append(criar('a', { href: `#${categoria.id}`, texto: categoria.nome }));
      const lista = criar('ul', { class: 'pratos' }, categoria.itens.map(criarLinhaCardapio));
      const titulo = criar('h3', { texto: categoria.nome });
      porId('categorias').append(criar('section', { id: categoria.id, class: 'categoria' }, [titulo, lista]));
    });
  }

  function montarEscolhasDoKit() {
    KIT.escolhas.forEach((grupo, indice) => {
      const opcoes = grupo.opcoes.map((opcao) => {
        const entrada = criar('input', { type: 'radio', name: grupo.id, value: opcao });
        return criar('label', { class: 'opcao' }, [entrada, criar('span', { texto: opcao })]);
      });
      const legenda = criar('legend', {}, [
        criar('span', { class: 'passo', 'aria-hidden': 'true', texto: String(indice + 1) }),
        criar('span', { texto: `${grupo.titulo} ` }),
        criar('small', { texto: `(${grupo.porcao})` }),
      ]);
      porId('kit-escolhas').append(criar('fieldset', { id: `grupo-${grupo.id}` }, [legenda, criar('div', { class: 'opcoes' }, opcoes)]));
    });
  }

  function mostrarErro(id, mensagem) {
    const erro = porId(id);
    erro.textContent = mensagem || '';
    erro.hidden = !mensagem;
  }

  function adicionarKit(evento) {
    evento.preventDefault();
    const dados = new FormData(evento.target);
    const escolhas = Object.fromEntries(KIT.escolhas.map((grupo) => [grupo.id, dados.get(grupo.id)]));
    const faltando = P.escolhasFaltando(KIT, escolhas);
    KIT.escolhas.forEach((grupo) => porId(`grupo-${grupo.id}`).classList.toggle('faltando', faltando.includes(grupo.id)));
    if (faltando.length > 0) {
      const nomes = KIT.escolhas.filter((g) => faltando.includes(g.id)).map((g) => g.rotulo.toLowerCase()).join(', ');
      mostrarErro('kit-erro', `Falta escolher: ${nomes}.`);
      porId(`grupo-${faltando[0]}`).querySelector('input').focus();
      return;
    }
    mostrarErro('kit-erro', '');
    atualizar(P.adicionar(carrinho, P.montarItemKit(KIT, escolhas)));
    evento.target.reset();
    abrirPedido();
  }

  function criarLinhaPedido(linha) {
    const contador = criarContador(linha, 'contador-pequeno');
    contador.numero.textContent = String(linha.qtd);
    contador.mais.addEventListener('click', () => atualizar(P.alterarQtd(carrinho, linha.chave, 1), linha.chave, 'mais'));
    contador.menos.addEventListener('click', () => atualizar(P.alterarQtd(carrinho, linha.chave, -1), linha.chave, 'menos'));
    const texto = criar('div', { class: 'linha-texto' }, [
      criar('p', { class: 'linha-nome', texto: linha.nome }),
      ...(linha.detalhe ? [criar('p', { class: 'linha-detalhe', texto: linha.detalhe })] : []),
    ]);
    const preco = criar('p', { class: 'linha-preco', texto: P.formatarPreco(linha.centavos * linha.qtd) });
    return criar('div', { class: 'linha', 'data-chave': linha.chave }, [texto, contador.grupo, preco]);
  }

  function restaurarFoco(chave, acao) {
    if (!chave) return;
    const linha = [...porId('pedido-itens').children].find((filho) => filho.dataset.chave === chave);
    const alvo = linha ? linha.querySelector(`[data-acao="${acao}"]`) : porId('fechar-pedido');
    if (alvo) alvo.focus();
  }

  function atualizar(novoCarrinho, chaveFoco, acaoFoco) {
    carrinho = novoCarrinho;
    linhasDoCardapio.forEach(({ adicionar, contador }, chave) => {
      const qtd = P.qtdDe(carrinho, chave);
      adicionar.hidden = qtd > 0;
      contador.grupo.hidden = qtd === 0;
      contador.numero.textContent = String(qtd);
    });

    const itens = P.contarItens(carrinho);
    const total = P.formatarPreco(P.totalCentavos(carrinho));
    porId('barra').hidden = itens === 0;
    porId('barra-resumo').textContent = `${itens} ${itens === 1 ? 'item' : 'itens'}, ${total}`;
    porId('pedido-itens').replaceChildren(...carrinho.map(criarLinhaPedido));
    if (carrinho.length === 0) {
      porId('pedido-itens').append(criar('p', { class: 'pedido-vazio', texto: 'Seu pedido está vazio. Escolha um prato no cardápio para começar.' }));
    }
    porId('pedido-total').textContent = total;
    porId('form-pedido').hidden = carrinho.length === 0;
    esconderAviso();
    restaurarFoco(chaveFoco, acaoFoco);
  }

  function esconderAviso() {
    porId('pedido-aviso').hidden = true;
    mostrarErro('pedido-erro', '');
  }

  function abrirPedido() {
    const janela = porId('pedido');
    if (janela.hasAttribute('open')) return;
    if (typeof janela.showModal === 'function') {
      janela.showModal();
    } else {
      janela.classList.add('pedido-sem-suporte');
      janela.setAttribute('open', '');
    }
  }

  function fecharPedido() {
    const janela = porId('pedido');
    if (typeof janela.close === 'function') janela.close();
    else janela.removeAttribute('open');
  }

  function abrirLink(endereco) {
    const link = criar('a', { href: endereco, target: '_blank', rel: 'noopener' });
    document.body.append(link);
    link.click();
    link.remove();
  }

  function mostrarAviso({ mensagem, link, cabe }) {
    porId('pedido-aviso-texto').textContent = cabe
      ? 'Abrimos o WhatsApp com seu pedido. Ele só chega à equipe depois que você tocar em enviar por lá. Se o WhatsApp não abriu, use as opções abaixo.'
      : 'Seu pedido ficou grande demais para abrir pronto. Copie o texto abaixo, abra o WhatsApp e cole na conversa.';
    porId('pedido-link').href = link;
    porId('pedido-texto').value = mensagem;
    porId('pedido-texto').hidden = cabe;
    porId('copiar-status').hidden = true;
    porId('pedido-aviso').hidden = false;
  }

  async function copiarPedido() {
    const status = porId('copiar-status');
    const texto = porId('pedido-texto');
    try {
      await navigator.clipboard.writeText(texto.value);
      status.textContent = 'Pedido copiado. Agora abra o WhatsApp e cole na conversa.';
    } catch {
      // Alguns navegadores embutidos bloqueiam a cópia: mostra o texto para copiar à mão.
      texto.hidden = false;
      texto.focus();
      texto.select();
      status.textContent = 'Não foi possível copiar sozinho. Selecione o texto abaixo e copie.';
    }
    status.hidden = false;
  }

  function enviarPedido(evento) {
    evento.preventDefault();
    const dados = new FormData(evento.target);
    const nome = dados.get('nome');
    const erro = P.validarPedido({ carrinho, nome, agora: new Date(), limite: DATA_LIMITE });
    mostrarErro('pedido-erro', erro ? erro.mensagem : '');
    if (erro) {
      if (erro.campo === 'nome') porId('nome').focus();
      return;
    }
    const mensagem = P.montarMensagem({ carrinho, nome, telefone: dados.get('telefone'), obs: dados.get('obs') });
    const linkCompleto = P.linkWhatsApp(WHATSAPP, mensagem);
    const cabe = P.cabeNoLink(linkCompleto);
    const link = cabe ? linkCompleto : P.linkWhatsApp(WHATSAPP);
    if (cabe) abrirLink(link);
    mostrarAviso({ mensagem, link, cabe });
  }

  function limparAvisoDoKit(evento) {
    const grupo = evento.target.closest('fieldset');
    if (grupo) grupo.classList.remove('faltando');
    const dados = new FormData(porId('form-kit'));
    const escolhas = Object.fromEntries(KIT.escolhas.map((g) => [g.id, dados.get(g.id)]));
    const faltando = KIT.escolhas.filter((g) => P.escolhasFaltando(KIT, escolhas).includes(g.id));
    const avisoVisivel = !porId('kit-erro').hidden;
    if (avisoVisivel) {
      const nomes = faltando.map((g) => g.rotulo.toLowerCase()).join(', ');
      mostrarErro('kit-erro', nomes ? `Falta escolher: ${nomes}.` : '');
    }
  }

  function iniciar() {
    montarCardapio();
    if (abertas) {
      montarEscolhasDoKit();
      porId('form-kit').addEventListener('change', limparAvisoDoKit);
      porId('form-pedido').addEventListener('input', esconderAviso);
      porId('form-kit').addEventListener('submit', adicionarKit);
      porId('form-pedido').addEventListener('submit', enviarPedido);
      porId('abrir-pedido').addEventListener('click', abrirPedido);
      porId('fechar-pedido').addEventListener('click', fecharPedido);
      porId('copiar').addEventListener('click', copiarPedido);
      porId('limpar').addEventListener('click', () => {
        porId('form-pedido').reset();
        atualizar([]);
        porId('fechar-pedido').focus();
      });
      atualizar([]);
    } else {
      porId('encerrado').hidden = false;
      porId('form-kit').hidden = true;
    }
  }

  iniciar();
})();
