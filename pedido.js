// Regras do pedido: conta, validação e mensagem do WhatsApp. Sem acesso à tela.
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./catalogo.js'));
  else raiz.PedidoCeia = fabrica(raiz.CatalogoCeia);
})(typeof self !== 'undefined' ? self : this, function (catalogo) {
  'use strict';

  const FUSO = 'America/Sao_Paulo';
  const MAX_NOME = 80;
  const MAX_TELEFONE = 30;
  const MAX_OBS = 300;
  // Acima disso o WhatsApp pode cortar o texto; o limite exato não é publicado, então o valor é conservador.
  const MAX_LINK = 2000;

  function formatarPreco(centavos) {
    const reais = Math.floor(centavos / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const resto = String(centavos % 100).padStart(2, '0');
    return `R$ ${reais},${resto}`;
  }

  function adicionar(carrinho, item) {
    const existe = carrinho.some((linha) => linha.chave === item.chave);
    if (existe) {
      return carrinho.map((linha) => (linha.chave === item.chave ? { ...linha, qtd: linha.qtd + 1 } : linha));
    }
    return [...carrinho, { ...item, qtd: 1 }];
  }

  function alterarQtd(carrinho, chave, variacao) {
    return carrinho
      .map((linha) => (linha.chave === chave ? { ...linha, qtd: linha.qtd + variacao } : linha))
      .filter((linha) => linha.qtd > 0);
  }

  function qtdDe(carrinho, chave) {
    const linha = carrinho.find((item) => item.chave === chave);
    return linha ? linha.qtd : 0;
  }

  function totalCentavos(carrinho) {
    return carrinho.reduce((soma, linha) => soma + linha.centavos * linha.qtd, 0);
  }

  function contarItens(carrinho) {
    return carrinho.reduce((soma, linha) => soma + linha.qtd, 0);
  }

  function escolhasFaltando(kit, escolhas) {
    return kit.escolhas.filter((grupo) => !escolhas[grupo.id]).map((grupo) => grupo.id);
  }

  function montarItemKit(kit, escolhas) {
    const detalhe = kit.escolhas.map((grupo) => `${grupo.rotulo}: ${escolhas[grupo.id]}`).join('; ');
    const chave = `${kit.chave}|${kit.escolhas.map((grupo) => escolhas[grupo.id]).join('|')}`;
    return { chave, nome: kit.nome, detalhe, centavos: kit.centavos };
  }

  function dataEmBrasilia(agora) {
    const partes = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(agora);
    const valor = (tipo) => partes.find((parte) => parte.type === tipo).value;
    return `${valor('year')}-${valor('month')}-${valor('day')}`;
  }

  function encomendasAbertas(agora, limite) {
    return dataEmBrasilia(agora) <= limite;
  }

  function validarPedido({ carrinho, nome, agora, limite }) {
    if (!encomendasAbertas(agora, limite)) {
      return { campo: 'prazo', mensagem: 'As encomendas da ceia foram encerradas em 22/12.' };
    }
    if (carrinho.length === 0) {
      return { campo: 'carrinho', mensagem: 'Adicione pelo menos um item para fazer o pedido.' };
    }
    if (!String(nome || '').trim()) {
      return { campo: 'nome', mensagem: 'Informe o nome de quem vai retirar a encomenda.' };
    }
    return null;
  }

  function limpar(texto, maximo) {
    // Junta as linhas para o cliente não imitar um campo da mensagem, e tira o emoji que o corte partiu ao meio.
    return String(texto || '').replace(/\s+/g, ' ').trim().slice(0, maximo).replace(/\p{Cs}/gu, '');
  }

  function montarMensagem({ carrinho, nome, telefone, obs }) {
    const linhas = carrinho.map((linha) => {
      const detalhe = linha.detalhe ? ` (${linha.detalhe})` : '';
      return `• ${linha.qtd}x ${linha.nome}${detalhe}: ${formatarPreco(linha.centavos * linha.qtd)}`;
    });
    const fone = limpar(telefone, MAX_TELEFONE);
    const observacao = limpar(obs, MAX_OBS);
    return [
      '🎄 *PEDIDO CEIA DE NATAL - TOCA DO COELHO*',
      '',
      '*Itens:*',
      ...linhas,
      '',
      `*Total: ${formatarPreco(totalCentavos(carrinho))}*`,
      `*Retirada:* ${catalogo.RETIRADA}`,
      `*Nome:* ${limpar(nome, MAX_NOME)}`,
      ...(fone ? [`*Telefone:* ${fone}`] : []),
      ...(observacao ? [`*Observações:* ${observacao}`] : []),
    ].join('\n');
  }

  function linkWhatsApp(numero, mensagem) {
    const conversa = `https://wa.me/${numero}`;
    return mensagem ? `${conversa}?text=${encodeURIComponent(mensagem)}` : conversa;
  }

  function cabeNoLink(link) {
    return link.length <= MAX_LINK;
  }

  return {
    formatarPreco, adicionar, alterarQtd, qtdDe, totalCentavos, contarItens,
    escolhasFaltando, montarItemKit, dataEmBrasilia, encomendasAbertas,
    validarPedido, montarMensagem, linkWhatsApp, cabeNoLink, MAX_NOME, MAX_TELEFONE, MAX_OBS,
  };
});
