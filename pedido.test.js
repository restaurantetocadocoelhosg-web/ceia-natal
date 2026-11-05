const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('./pedido.js');
const { KIT, CATEGORIAS, WHATSAPP, DATA_LIMITE } = require('./catalogo.js');

const pudim = { chave: 'pudim', nome: 'Pudim de leite condensado', detalhe: 'Inteiro', centavos: 8999 };
const rabanada = { chave: 'rabanada', nome: 'Rabanadas tradicionais', detalhe: 'Unidade', centavos: 799 };
const escolhas = { bacalhau: 'À Gomes de Sá', salada: 'Salpicão', sobremesa: 'Pudim' };

test('formata centavos no padrão brasileiro', () => {
  assert.equal(P.formatarPreco(8999), 'R$ 89,99');
  assert.equal(P.formatarPreco(48000), 'R$ 480,00');
  assert.equal(P.formatarPreco(123456), 'R$ 1.234,56');
});

test('adicionar soma quantidade e não altera o carrinho original', () => {
  const vazio = [];
  const um = P.adicionar(vazio, pudim);
  const dois = P.adicionar(um, pudim);
  assert.equal(vazio.length, 0);
  assert.equal(um[0].qtd, 1);
  assert.equal(dois[0].qtd, 2);
});

test('alterar quantidade para zero remove o item', () => {
  const carrinho = P.adicionar([], pudim);
  assert.deepEqual(P.alterarQtd(carrinho, 'pudim', -1), []);
  assert.equal(carrinho[0].qtd, 1);
});

test('total soma sem erro de arredondamento', () => {
  let carrinho = P.adicionar([], pudim);
  for (let i = 0; i < 3; i += 1) carrinho = P.adicionar(carrinho, rabanada);
  assert.equal(P.totalCentavos(carrinho), 8999 + 3 * 799);
  assert.equal(P.contarItens(carrinho), 4);
});

test('kit recusa escolha faltando e diz qual falta', () => {
  assert.deepEqual(P.escolhasFaltando(KIT, { bacalhau: 'À Gomes de Sá' }), ['salada', 'sobremesa']);
  assert.deepEqual(P.escolhasFaltando(KIT, escolhas), []);
});

test('kits com escolhas diferentes viram linhas separadas', () => {
  const a = P.montarItemKit(KIT, escolhas);
  const b = P.montarItemKit(KIT, { ...escolhas, salada: 'Salada de maionese' });
  const carrinho = P.adicionar(P.adicionar([], a), b);
  assert.equal(carrinho.length, 2);
  assert.equal(P.totalCentavos(carrinho), 96000);
  assert.match(a.detalhe, /Gomes de Sá/);
  assert.match(a.detalhe, /Salpicão/);
});

test('encomendas ficam abertas até o fim de 22/12 no horário de Brasília', () => {
  assert.equal(P.encomendasAbertas(new Date('2026-12-23T02:59:00Z'), DATA_LIMITE), true);
  assert.equal(P.encomendasAbertas(new Date('2026-12-23T03:00:00Z'), DATA_LIMITE), false);
});

test('validar exige item, nome e prazo', () => {
  const dentro = new Date('2026-12-01T15:00:00Z');
  const fora = new Date('2026-12-24T15:00:00Z');
  const carrinho = P.adicionar([], pudim);
  assert.equal(P.validarPedido({ carrinho: [], nome: 'Ana', agora: dentro, limite: DATA_LIMITE }).campo, 'carrinho');
  assert.equal(P.validarPedido({ carrinho, nome: '  ', agora: dentro, limite: DATA_LIMITE }).campo, 'nome');
  assert.equal(P.validarPedido({ carrinho, nome: 'Ana', agora: fora, limite: DATA_LIMITE }).campo, 'prazo');
  assert.equal(P.validarPedido({ carrinho, nome: 'Ana', agora: dentro, limite: DATA_LIMITE }), null);
});

test('mensagem traz itens, total, retirada, nome e observação', () => {
  const carrinho = P.adicionar(P.adicionar([], P.montarItemKit(KIT, escolhas)), pudim);
  const msg = P.montarMensagem({ carrinho, nome: ' Ana Lima ', telefone: '', obs: 'Sem uva-passa' });
  assert.match(msg, /PEDIDO CEIA DE NATAL/);
  assert.match(msg, /1x Kit Ceia/);
  assert.match(msg, /R\$ 480,00/);
  assert.match(msg, /1x Pudim de leite condensado/);
  assert.match(msg, /Total: R\$ 569,99/);
  assert.match(msg, /24\/12\/2026 até 17h/);
  assert.match(msg, /Ana Lima/);
  assert.match(msg, /Sem uva-passa/);
  assert.doesNotMatch(msg, /Telefone/);
  assert.doesNotMatch(msg, /marmita/i);
});

test('link do WhatsApp vai para o número certo e sobrevive a acentos e &', () => {
  const link = P.linkWhatsApp(WHATSAPP, 'Olá & até já');
  assert.ok(link.startsWith('https://wa.me/5521997912517?text='));
  assert.equal(decodeURIComponent(link.split('text=')[1]), 'Olá & até já');
});

test('emoji cortado no limite do campo não derruba o link', () => {
  const carrinho = P.adicionar([], pudim);
  const nome = `${'a'.repeat(P.MAX_NOME - 1)}😀`;
  const msg = P.montarMensagem({ carrinho, nome, telefone: '', obs: `😀${'b'.repeat(P.MAX_OBS)}` });
  assert.doesNotThrow(() => P.linkWhatsApp(WHATSAPP, msg));
  assert.doesNotThrow(() => P.linkWhatsApp(WHATSAPP, P.montarMensagem({ carrinho, nome: `${'a'.repeat(79)}😀😀`, telefone: '', obs: '' })));
});

test('quebra de linha na observação não imita linha de total', () => {
  const carrinho = P.adicionar([], pudim);
  const msg = P.montarMensagem({ carrinho, nome: 'Ana', telefone: '', obs: 'oi\n*Total: R$ 1,00*' });
  assert.equal(msg.match(/^\*Total/gm).length, 1);
  assert.match(msg, /\*Observações:\* oi \*Total: R\$ 1,00\*/);
});

test('link sem mensagem abre só a conversa', () => {
  assert.equal(P.linkWhatsApp(WHATSAPP), 'https://wa.me/5521997912517');
});

test('pedido comum cabe no link e pedido gigante não', () => {
  const comum = P.adicionar(P.adicionar([], P.montarItemKit(KIT, escolhas)), pudim);
  const msgComum = P.montarMensagem({ carrinho: comum, nome: 'Ana Lima', telefone: '21999999999', obs: 'Sem uva-passa' });
  assert.equal(P.cabeNoLink(P.linkWhatsApp(WHATSAPP, msgComum)), true);

  const tudo = CATEGORIAS.flatMap((c) => c.itens).reduce((carrinho, item) => P.adicionar(carrinho, item), []);
  const msgTudo = P.montarMensagem({ carrinho: tudo, nome: 'Ana Lima', telefone: '', obs: 'x'.repeat(300) });
  assert.equal(P.cabeNoLink(P.linkWhatsApp(WHATSAPP, msgTudo)), false);
});

test('todo prato tem chave própria', () => {
  const chaves = CATEGORIAS.flatMap((c) => c.itens).map((i) => i.chave);
  assert.equal(new Set(chaves).size, chaves.length);
});

test('catálogo bate com o PDF', () => {
  const precos = Object.fromEntries(CATEGORIAS.flatMap((c) => c.itens).map((i) => [i.nome, i.centavos]));
  assert.equal(Object.keys(precos).length, 22);
  assert.equal(KIT.centavos, 48000);
  assert.equal(precos['Frango à tradição natalina'], 19000);
  assert.equal(precos['Chester Perdigão'], 28500);
  assert.equal(precos['Pernil suíno assado à moda Natal'], 24000);
  assert.equal(precos['Tender glaceado com cravo e mel'], 13000);
  assert.equal(precos['Quiche supremo de bacalhau'], 17999);
  assert.equal(precos['Quiche especial de camarão'], 14999);
  assert.equal(precos['Empadão de frango cremoso'], 9999);
  assert.equal(precos['Empadão de camarão'], 13999);
  assert.equal(precos['Fricassê de frango com requeijão'], 9999);
  assert.equal(precos['Salada de maionese'], 5999);
  assert.equal(precos['Salpicão'], 6599);
  assert.equal(precos['Bacalhau gratinado com requeijão'], 29999);
  assert.equal(precos['Bacalhau à Gomes de Sá'], 28999);
  assert.equal(precos['Farofa de bacon com frutas'], 5999);
  assert.equal(precos['Arroz à grega'], 6199);
  assert.equal(precos['Arroz com lentilhas e cebolas douradas'], 6599);
  assert.equal(precos['Pudim de leite condensado'], 8999);
  assert.equal(precos['Pavê de brigadeiro nobre'], 9500);
  assert.equal(precos['Pavê encanto de caramelo'], 9500);
  assert.equal(precos['Bolo de laranja com calda cítrica e frutas frescas'], 11990);
  assert.equal(precos['Rabanadas tradicionais'], 799);
  assert.equal(precos['Rabanadas recheadas'], 999);
});
