import { useState } from 'react';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import Head from 'next/head';

const ITENS_CATEGORIZADOS = [
  { categoria: 'Etiquetas e Ribbons', items: ['ETIQUETA 100X150', 'ETIQUETA 100X170', 'RIBBON'] },
  { categoria: 'Fitas Adesivas', items: ['FITA DUREX CEX100', 'FITA FRACIONADA MAGLOG', 'FITA FRÁGIL'] },
  { categoria: 'Embalagens e Proteção', items: ['STRETCH', 'KRAFT', 'PLÁSTICO BOLHA'] },
  { categoria: 'Escritório', items: ['SULFITE A4'] },
];

const TODOS_OS_ITENS = ITENS_CATEGORIZADOS.flatMap(cat => cat.items);

export default function RequisicaoAlmoxarifadoPage() {
  const [status, setStatus] = useState({ submitting: false, success: false, error: '' });
  const [quantidadesPadrao, setQuantidadesPadrao] = useState(
    TODOS_OS_ITENS.reduce((acc, item) => ({ ...acc, [item]: 0 }), {})
  );
  const [itensPersonalizados, setItensPersonalizados] = useState([{ nome: '', quantidade: '' }]);
  
  // Estado para controlar qual categoria está aberta (funciona em Mobile e Desktop agora)
  const [categoriaAberta, setCategoriaAberta] = useState('Etiquetas e Ribbons');

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ submitting: true, success: false, error: '' });

    const formData = new FormData(event.target);
    const imageFile = formData.get('foto');
    if (imageFile && imageFile.size > 0) {
      try {
        const compressedFile = await imageCompression(imageFile, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
        formData.set('foto', compressedFile, compressedFile.name);
      } catch (error) {
        setStatus({ submitting: false, success: false, error: 'Erro ao processar imagem.' });
        return;
      }
    }

    for (const [item, qtde] of Object.entries(quantidadesPadrao)) {
      if (qtde > 0) formData.append(`item_padrao_${item}`, qtde);
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
      if (!response.ok) throw new Error('Erro ao enviar.');
      setStatus({ submitting: false, success: true, error: '' });
      event.target.reset();
      setQuantidadesPadrao(TODOS_OS_ITENS.reduce((acc, item) => ({ ...acc, [item]: 0 }), {}));
      setItensPersonalizados([{ nome: '', quantidade: '' }]);
    } catch (error) {
      setStatus({ submitting: false, success: false, error: error.message });
    }
  };
  
  // ESTILOS PADRONIZADOS
  const inputStyles = "w-full px-3 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-50 dark:bg-gray-900 dark:border-gray-600 dark:text-white text-sm border-gray-300 placeholder-gray-400 dark:placeholder-gray-500";
  const labelStyles = "block font-bold text-gray-700 dark:text-gray-300 text-xs uppercase mb-1";

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900 p-2 md:p-4 font-sans transition-colors duration-200">
      <Head><title>Requisição Almoxarifado - Maglog</title></Head>
      
      <div className="w-full max-w-[95%] mx-auto bg-white dark:bg-gray-800 p-4 md:p-8 rounded-lg shadow-xl border-t-8 border-cyan-900 dark:border-cyan-600">
        
        {/* LOGO */}
        <div className="flex justify-center mb-4 md:mb-6">
            <Image src="/logo.png" alt="Logo Maglog" width={180} height={60} priority className="w-32 md:w-48 h-auto" />
        </div>

        <h1 className="text-xl md:text-2xl font-bold text-center text-cyan-900 dark:text-cyan-400 mb-6 border-b-2 border-gray-200 dark:border-gray-700 pb-2 uppercase">
            Requisição Almoxarifado
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-300 dark:border-gray-600 p-4 rounded bg-gray-50 dark:bg-gray-700/30">
             <div><label className={labelStyles}>Seu Nome *</label><input type="text" name="nome" required className={inputStyles} /></div>
             <div><label className={labelStyles}>Setor *</label><input type="text" name="setor" required className={inputStyles} /></div>
          </div>

          {/* LISTA DE ITENS (LAYOUT UNIFICADO - EXPANSÍVEL EM TODAS AS TELAS) */}
          <div className="space-y-4"> 
            {ITENS_CATEGORIZADOS.map(({ categoria, items }) => (
              <div key={categoria} className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-750 overflow-hidden">
                
                {/* Título da Categoria (Clicável em PC e Mobile) */}
                <button type="button" onClick={() => handleToggleCategoria(categoria)} className="w-full flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-700 text-left font-bold text-cyan-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <span className="text-lg">{categoria}</span>
                  {/* Seta gira quando aberto */}
                  <span className={`transform transition-transform duration-200 ${categoriaAberta === categoria ? 'rotate-180' : 'rotate-0'}`}>▼</span>
                </button>
                
                {/* Itens (Abre e fecha baseado no estado) */}
                <div className={`${categoriaAberta === categoria ? 'block' : 'hidden'} p-4 space-y-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600`}>
                  {items.map(item => (
                    <div key={item} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <label htmlFor={`item_${item}`} className="text-sm font-bold text-gray-700 dark:text-gray-300 flex-grow pr-4">{item}</label>
                      <div className="flex items-center gap-2">
                        {/* BOTÃO MENOS CORRIGIDO AQUI (quantidadesPadrao) */}
                        <button type="button" onClick={() => handleQuantidadePadraoChange(item, quantidadesPadrao[item] - 1)} className="w-10 h-10 flex items-center justify-center bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 rounded hover:bg-cyan-200 dark:hover:bg-cyan-800 font-bold text-lg">-</button>
                        
                        <input type="number" id={`item_${item}`} value={quantidadesPadrao[item]} onChange={(e) => handleQuantidadePadraoChange(item, e.target.value)} className="w-16 h-10 text-center border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white rounded focus:ring-cyan-500 font-bold" />
                        
                        <button type="button" onClick={() => handleQuantidadePadraoChange(item, quantidadesPadrao[item] + 1)} className="w-10 h-10 flex items-center justify-center bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 rounded hover:bg-cyan-200 dark:hover:bg-cyan-800 font-bold text-lg">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* ITENS PERSONALIZADOS */}
          <fieldset className="border border-gray-300 dark:border-gray-600 p-4 rounded bg-gray-50 dark:bg-gray-700/30">
             <legend className="px-2 font-bold text-gray-700 dark:text-gray-300 text-sm uppercase">Outros Itens (Fora da Lista)</legend>
            {itensPersonalizados.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row items-end gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-gray-600 last:border-0 last:pb-0">
                <div className="w-full md:w-3/4"><label className={labelStyles}>Item</label><input type="text" name="nome" value={item.nome} onChange={(e) => handleItemPersonalizadoChange(index, e)} className={inputStyles} placeholder="Nome do produto" /></div>
                <div className="w-full md:w-1/4"><label className={labelStyles}>Qtde/Unid</label><input type="text" name="quantidade" value={item.quantidade} onChange={(e) => handleItemPersonalizadoChange(index, e)} className={inputStyles} placeholder="Ex: 2 caixas" /></div>
                {itensPersonalizados.length > 1 && (<button type="button" onClick={() => handleRemoveItemPersonalizado(index)} className="w-full md:w-auto h-[46px] px-4 bg-red-500 text-white rounded font-bold hover:bg-red-600">X</button>)}
              </div>
            ))}
            <button type="button" onClick={handleAddItemPersonalizado} className="mt-2 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 font-bold text-sm">+ Adicionar Item Extra</button>
          </fieldset>
          
          {/* FOTO E OBS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className={labelStyles}>Anotações</label><textarea name="anotacao" rows="4" className={inputStyles} placeholder="Detalhes..."></textarea></div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 border border-yellow-200 dark:border-yellow-700 rounded h-fit">
                  <label className={labelStyles}>Foto do Pedido (Opcional)</label>
                  <input name="foto" type="file" accept="image/*" className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-cyan-100 dark:file:bg-cyan-900 file:text-cyan-700 dark:file:text-cyan-300 hover:file:bg-cyan-200" />
              </div>
          </div>

          <div className="border border-gray-300 dark:border-gray-600 p-4 rounded bg-white dark:bg-gray-800">
            <div className="flex items-center"><input type="checkbox" id="enviarCopia" name="enviarCopia" className="h-5 w-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500" /><label htmlFor="enviarCopia" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">Enviar cópia para meu e-mail</label></div>
            <input type="email" name="copiaEmail" className={`${inputStyles} mt-3`} placeholder="seu@email.com" />
          </div>

          <div className="text-center pt-4 pb-8">
             <button type="submit" disabled={status.submitting} className="w-full md:w-1/2 px-8 py-4 bg-cyan-900 dark:bg-cyan-700 text-white font-bold rounded shadow hover:bg-cyan-800 dark:hover:bg-cyan-600 disabled:bg-gray-400 transition-colors text-lg">
                {status.submitting ? 'ENVIANDO...' : 'ENVIAR PEDIDO'}
             </button>
          </div>

          {status.success && <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded text-center font-bold mb-8">Sucesso!</div>}
          {status.error && <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded text-center font-bold mb-8">Erro: {status.error}</div>}
        </form>
      </div>
    </div>
  );
}