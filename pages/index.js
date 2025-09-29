import { useState } from 'react';
import Image from 'next/image';

// --- NOVO: Estrutura de itens por categoria ---
const ITENS_CATEGORIZADOS = [
  {
    categoria: 'Etiquetas e Ribbons',
    items: ['ETIQUETA 100X150', 'ETIQUETA 100X170', 'RIBBON'],
  },
  {
    categoria: 'Fitas Adesivas',
    items: ['FITA DUREX CEX100', 'FITA FRACIONADA MAGLOG (LARANJA)', 'FITA FRÁGIL'],
  },
  {
    categoria: 'Embalagens e Proteção',
    items: ['STRETCH', 'KRAFT', 'PLÁSTICO BOLHA'],
  },
  {
    categoria: 'Escritório',
    items: ['SULFITE A4'],
  },
];

// Gera a lista completa de itens para facilitar o gerenciamento do estado
const TODOS_OS_ITENS = ITENS_CATEGORIZADOS.flatMap(cat => cat.items);

export default function RequisicaoAlmoxarifadoPage() {
  const [status, setStatus] = useState({ submitting: false, success: false, error: '' });

  const [quantidadesPadrao, setQuantidadesPadrao] = useState(
    TODOS_OS_ITENS.reduce((acc, item) => ({ ...acc, [item]: 0 }), {})
  );

  const [itensPersonalizados, setItensPersonalizados] = useState([{ nome: '', quantidade: '' }]);
  
  // --- NOVO: Estado para controlar qual categoria está aberta ---
  const [categoriaAberta, setCategoriaAberta] = useState('Etiquetas e Ribbons'); // Deixa a primeira aberta por padrão

  const handleToggleCategoria = (categoria) => {
    setCategoriaAberta(categoriaAberta === categoria ? null : categoria);
  };

  const handleQuantidadePadraoChange = (itemName, value) => {
    const intValue = parseInt(value, 10);
    setQuantidadesPadrao(prev => ({
      ...prev,
      [itemName]: isNaN(intValue) || intValue < 0 ? 0 : intValue,
    }));
  };

  // Funções para gerenciar itens personalizados (sem alteração)
  const handleItemPersonalizadoChange = (index, event) => {
    const newItems = [...itensPersonalizados];
    newItems[index][event.target.name] = event.target.value;
    setItensPersonalizados(newItems);
  };

  const handleAddItemPersonalizado = () => {
    setItensPersonalizados([...itensPersonalizados, { nome: '', quantidade: '' }]);
  };

  const handleRemoveItemPersonalizado = (index) => {
    const newItems = itensPersonalizados.filter((_, i) => i !== index);
    setItensPersonalizados(newItems);
  };

  // O handleSubmit não precisa de alteração, pois já envia apenas itens com qtde > 0
  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ submitting: true, success: false, error: '' });
    const formData = new FormData(event.target);
    for (const [item, qtde] of Object.entries(quantidadesPadrao)) {
      if (qtde > 0) {
        formData.append(`item_padrao_${item}`, qtde);
      }
    }
    itensPersonalizados.forEach((item, index) => {
      if (item.nome && item.quantidade) {
        formData.append(`item_personalizado_nome_${index}`, item.nome);
        formData.append(`item_personalizado_qtde_${index}`, item.quantidade);
      }
    });
    formData.append('item_personalizado_count', itensPersonalizados.length);
    try {
      const response = await fetch('/api/solicitacao', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Algo deu errado.');
      setStatus({ submitting: false, success: true, error: '' });
      event.target.reset();
      setQuantidadesPadrao(TODOS_OS_ITENS.reduce((acc, item) => ({ ...acc, [item]: 0 }), {}));
      setItensPersonalizados([{ nome: '', quantidade: '' }]);
    } catch (error) {
      setStatus({ submitting: false, success: false, error: error.message });
    }
  };
  
  const inputStyles = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";
  const labelStyles = "block font-medium mb-2 text-gray-700 dark:text-gray-200";

  return (
    <div className="min-h-screen bg-cyan-900 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <div className="flex justify-center mb-4"><Image src="/logo.png" alt="Logo Maglog" width={150} height={50} priority /></div>
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">Requisição Almoxarifado</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="border border-gray-300 dark:border-gray-600 p-4 rounded-md">
            <legend className="px-2 font-semibold text-gray-700 dark:text-gray-200">SEUS DADOS</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label htmlFor="nome" className={labelStyles}>Seu Nome *</label><input type="text" id="nome" name="nome" required className={inputStyles} /></div>
              <div><label htmlFor="setor" className={labelStyles}>Setor *</label><input type="text" id="setor" name="setor" required className={inputStyles} /></div>
            </div>
          </fieldset>

          {/* --- ALTERADO: Renderização dos itens em formato de Acordeão --- */}
          <div className="border border-gray-300 dark:border-gray-600 rounded-md">
            {ITENS_CATEGORIZADOS.map(({ categoria, items }) => (
              <div key={categoria} className="border-b last:border-b-0 border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => handleToggleCategoria(categoria)} className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <span>{categoria}</span>
                  <span className={`transform transition-transform duration-200 ${categoriaAberta === categoria ? 'rotate-180' : 'rotate-0'}`}>▼</span>
                </button>
                {categoriaAberta === categoria && (
                  <div className="p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                    {items.map(item => (
                      <div key={item} className="flex justify-between items-center">
                        <label htmlFor={`item_${item}`} className="text-gray-700 dark:text-gray-300">{item}</label>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => handleQuantidadePadraoChange(item, quantidadesPadrao[item] - 1)} className="px-3 py-1 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors">-</button>
                          <input type="number" id={`item_${item}`} value={quantidadesPadrao[item]} onChange={(e) => handleQuantidadePadraoChange(item, e.target.value)} className="w-16 text-center border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                          <button type="button" onClick={() => handleQuantidadePadraoChange(item, quantidadesPadrao[item] + 1)} className="px-3 py-1 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <fieldset className="border border-gray-300 dark:border-gray-600 p-4 rounded-md">
             <legend className="px-2 font-semibold text-gray-700 dark:text-gray-200">Insira outro item (fora da lista)</legend>
            {itensPersonalizados.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-end gap-2 mb-2">
                <div className="flex-grow w-full"><label className="text-sm text-gray-600 dark:text-gray-400">Item</label><input type="text" name="nome" value={item.nome} onChange={(e) => handleItemPersonalizadoChange(index, e)} className={`${inputStyles} text-sm`} /></div>
                <div className="w-full sm:w-2/5"><label className="text-sm text-gray-600 dark:text-gray-400">Unidade / Quantidade</label><input type="text" name="quantidade" value={item.quantidade} onChange={(e) => handleItemPersonalizadoChange(index, e)} className={`${inputStyles} text-sm`} /></div>
                {itensPersonalizados.length > 1 && (<button type="button" onClick={() => handleRemoveItemPersonalizado(index)} className="w-full sm:w-auto px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">-</button>)}
              </div>
            ))}
            <button type="button" onClick={handleAddItemPersonalizado} className="mt-2 px-3 py-1 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 font-bold">+</button>
          </fieldset>
          
          <div><label htmlFor="anotacao" className={labelStyles}>Anotações sobre o pedido</label><textarea id="anotacao" name="anotacao" rows="4" className={inputStyles} placeholder="Ex: Solicitação para cliente XYZ"></textarea></div>
          <div><label htmlFor="foto" className={labelStyles}>Anexar uma foto (opcional)</label><input id="foto" name="foto" type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"/></div>
          <div className="border border-gray-300 dark:border-gray-600 p-4 rounded-md">
            <div className="flex items-center"><input type="checkbox" id="enviarCopia" name="enviarCopia" className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500" /><label htmlFor="enviarCopia" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">Envie uma cópia para o seu email?</label></div>
            <input type="email" id="copiaEmail" name="copiaEmail" className={`${inputStyles} mt-2`} placeholder="exemplo@maglog.com.br"/>
          </div>
          <div className="text-center"><button type="submit" disabled={status.submitting} className="w-full sm:w-auto px-8 py-3 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-700 disabled:bg-cyan-400 transition-colors">{status.submitting ? 'Enviando...' : 'ENVIAR'}</button></div>
          {status.success && <p className="text-center text-green-600 dark:text-green-400">Requisição enviada com sucesso!</p>}
          {status.error && <p className="text-center text-red-600 dark:text-red-400">Erro: {status.error}</p>}
        </form>
      </div>
    </div>
  );
}