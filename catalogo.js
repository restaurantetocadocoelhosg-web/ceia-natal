// Cardápio da Ceia de Natal 2026. Fonte: Cardapio-Ceia-de-Natal-Toca-do-Coelho.pdf.
// Preços em centavos, para a conta nunca sofrer arredondamento.
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.CatalogoCeia = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const WHATSAPP = '5521997912517';
  const DATA_LIMITE = '2026-12-22';
  const RETIRADA = '24/12/2026 até 17h';

  const KIT = {
    chave: 'kit-ceia',
    nome: 'Kit Ceia',
    resumo: 'Para até 4 pessoas',
    centavos: 48000,
    centavosPorPessoa: 12000,
    incluso: 'Farofa de bacon com frutas (500 g) e arroz à grega (1 kg)',
    escolhas: [
      {
        id: 'bacalhau',
        titulo: 'Escolha o bacalhau',
        rotulo: 'Bacalhau',
        porcao: '1,5 kg',
        opcoes: ['Gratinado com requeijão', 'À Gomes de Sá'],
      },
      {
        id: 'salada',
        titulo: 'Escolha a salada',
        rotulo: 'Salada',
        porcao: '1 kg',
        opcoes: ['Salada de maionese', 'Salpicão'],
      },
      {
        id: 'sobremesa',
        titulo: 'Escolha a sobremesa',
        rotulo: 'Sobremesa',
        porcao: '1 unidade inteira',
        opcoes: ['Pudim', 'Pavê de brigadeiro', 'Pavê de doce de leite'],
      },
    ],
  };

  const CATEGORIAS = [
    {
      id: 'carnes',
      nome: 'Carnes natalinas',
      itens: [
        { chave: 'frango', nome: 'Frango à tradição natalina', detalhe: 'Inteiro, cerca de 3 kg. Serve 10 a 12', centavos: 19000 },
        { chave: 'chester', nome: 'Chester Perdigão', detalhe: 'Inteiro, cerca de 3,5 kg. Serve 10 a 12', centavos: 28500 },
        { chave: 'pernil', nome: 'Pernil suíno assado à moda Natal', detalhe: 'Peça de cerca de 3 kg. Serve 10 a 12', centavos: 24000 },
        { chave: 'tender', nome: 'Tender glaceado com cravo e mel', detalhe: 'Inteiro, cerca de 1,5 kg. Serve 6 a 8', centavos: 13000 },
      ],
    },
    {
      id: 'bacalhaus',
      nome: 'Bacalhaus',
      itens: [
        { chave: 'bacalhau-gratinado', nome: 'Bacalhau gratinado com requeijão', detalhe: 'Travessa de 1,5 kg. Serve 6', centavos: 29999 },
        { chave: 'bacalhau-gomes', nome: 'Bacalhau à Gomes de Sá', detalhe: 'Travessa de 1,5 kg. Serve 6', centavos: 28999 },
      ],
    },
    {
      id: 'tortas',
      nome: 'Tortas',
      itens: [
        { chave: 'quiche-bacalhau', nome: 'Quiche supremo de bacalhau', detalhe: 'Forma de 26 cm, 10 a 12 fatias', centavos: 17999 },
        { chave: 'quiche-camarao', nome: 'Quiche especial de camarão', detalhe: 'Forma de 26 cm, 10 a 12 fatias', centavos: 14999 },
        { chave: 'empadao-frango', nome: 'Empadão de frango cremoso', detalhe: 'Travessa de 1,5 kg. Serve 8 a 10', centavos: 9999 },
        { chave: 'empadao-camarao', nome: 'Empadão de camarão', detalhe: 'Travessa de 1,5 kg. Serve 8 a 10', centavos: 13999 },
        { chave: 'fricasse', nome: 'Fricassê de frango com requeijão', detalhe: 'Travessa de 1,5 kg. Serve 6 a 8', centavos: 9999 },
      ],
    },
    {
      id: 'acompanhamentos',
      nome: 'Acompanhamentos',
      itens: [
        { chave: 'farofa', nome: 'Farofa de bacon com frutas', detalhe: '1 kg. Serve 10 a 12', centavos: 5999 },
        { chave: 'arroz-grega', nome: 'Arroz à grega', detalhe: '1 kg. Serve 8 a 10', centavos: 6199 },
        { chave: 'arroz-lentilhas', nome: 'Arroz com lentilhas e cebolas douradas', detalhe: '1 kg. Serve 8 a 10', centavos: 6599 },
      ],
    },
    {
      id: 'saladas',
      nome: 'Saladas',
      itens: [
        { chave: 'maionese', nome: 'Salada de maionese', detalhe: '1 kg. Serve 6 a 8', centavos: 5999 },
        { chave: 'salpicao', nome: 'Salpicão', detalhe: '1 kg. Serve 6 a 8', centavos: 6599 },
      ],
    },
    {
      id: 'sobremesas',
      nome: 'Sobremesas',
      itens: [
        { chave: 'pudim', nome: 'Pudim de leite condensado', detalhe: 'Inteiro, cerca de 1,2 kg. 12 fatias', centavos: 8999 },
        { chave: 'pave-brigadeiro', nome: 'Pavê de brigadeiro nobre', detalhe: 'Travessa de 1,5 kg. Serve 10 a 12', centavos: 9500 },
        { chave: 'pave-caramelo', nome: 'Pavê encanto de caramelo', detalhe: 'Travessa de 1,5 kg. Serve 10 a 12', centavos: 9500 },
        { chave: 'bolo-laranja', nome: 'Bolo de laranja com calda cítrica e frutas frescas', detalhe: 'Inteiro, cerca de 1,5 kg. 14 a 16 fatias', centavos: 11990 },
        { chave: 'rabanada', nome: 'Rabanadas tradicionais', detalhe: 'Unidade, cerca de 80 g', centavos: 799 },
        { chave: 'rabanada-recheada', nome: 'Rabanadas recheadas', detalhe: 'Unidade, cerca de 100 g', centavos: 999 },
      ],
    },
  ];

  return { WHATSAPP, DATA_LIMITE, RETIRADA, KIT, CATEGORIAS };
});
