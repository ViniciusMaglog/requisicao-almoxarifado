import { useState } from 'react';
import Image from 'next/image';

// --- NOVO: Lista de itens padrão do almoxarifado ---
const ITENS_PADRAO = [
  'ETIQUETA 100X150',
  'ETIQUETA 100X170',
  'FITA DUREX CEX100',
  'SULFITE A4',
  'STRETCH',
  'FITA FRACIONADA MAGLOG (LARANJA)',
  'KRAFT',
  'FITA FRÁGIL',
  'PLÁSTICO BOLHA',
  'RIBBON',
];

export default function RequisicaoAlmoxarifadoPage() {
  const [status, setStatus] = useState({ submitting: false, success: false, error: '' });

  // --- ALTERADO: Estado para quantidades dos itens padrão ---
  const [quantidadesPadrao, setQuantidadesPadrao] = useState(
    ITENS_PADRAO.reduce((acc, item) => ({ ...acc, [item]: 0 }), {})
  );

  // --- ALTERADO: Estado para itens personalizados (fora da lista) ---
  const [itensPersonalizados, setItensPersonalizados] = useState([{ nome: '', quantidade: '' }]);

  // Função para alterar a quantidade de itens padrão
  const handleQuantidadePadraoChange = (itemName, value) => {
    const intValue = parseInt(value, 10);
    setQuantidadesPadrao(prev => ({
      ...prev,
      [itemName]: isNaN(intValue) || intValue < 0 ? 0 : intValue,
    }));
  };

  // Funções para gerenciar itens personalizados
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

    // Adiciona itens padrão com quantidade > 0 ao formData
    for (const [item, qtde] of Object.entries(quantidadesPadrao)) {
      if (qtde > 0) {
        formData.append(`item_padrao_${item}`, qtde);
      }
    }
    
    // Adiciona itens personalizados ao formData
    itensPersonalizados.forEach((item, index) => {
      if (item.nome && item.quantidade) {
        formData.append(`item_personalizado_nome_${index}`, item.nome);
        formData.append(`item_personalizado_qtde_${index}`, item.quantidade);
      }
    });
    formData.append('item_personalizado_count', itensPersonalizados.length);

    try {
      const response = await fetch('/api/solicitacao', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Algo deu errado.');

      setStatus({ submitting: false, success: true, error: '' });
      event.target.reset();
      setQuantidadesPadrao(ITENS_PADRAO.reduce((acc, item) => ({ ...acc, [item]: 0 }), {}));
      setItensPersonalizados([{ nome: '', quantidade: '' }]);
    } catch (error) {
      setStatus({ submitting: false, success: false, error: error.message });
    }
  };
  
  // Estilos baseados no seu design (tema Teal/Ciano)
  const inputStyles = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";
  const labelStyles = "block font-medium mb-2 text-gray-700 dark:text-gray-200";

  return (
    <div className="min-h-screen bg-cyan-900 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="Logo Maglog" width={150} height={50} priority />
        </div>
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">Requisição de Almoxarifado</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seus Dados */}
          <fieldset className="border border-gray-300 dark:border-gray-600 p-4 rounded-md">
            <legend className="px-2 font-semibold text-gray-700 dark:text-gray-200">INSIRA SEUS DADOS</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nome" className={labelStyles}>Seu Nome *</label>
                <input type="text" id="nome" name="nome" required className={inputStyles} />
              </div>
              <div>
                <label htmlFor="setor" className={labelStyles}>Setor *</label>
                <input type="text" id="setor" name="setor" required className={inputStyles} />
              </div>
            </div>
          </fieldset>

          {/* Itens Padrão */}
          <div className="space-y-4">
            {ITENS_PADRAO.map(item => (
              <div key={item} className="flex justify-between items-center">
                <label htmlFor={`item_${item}`} className="text-gray-700 dark:text-gray-300">{item}</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleQuantidadePadraoChange(item, quantidadesPadrao[item] - 1)} className="cursor-pointer px-3 py-1 bg-cyan-600 text-white hover:bg-cyan-700 rounded-md">-</button>
                  <input
                    type="number"
                    id={`item_${item}`}
                    name={`item_padrao_${item}`}
                    value={quantidadesPadrao[item]}
                    onChange={(e) => handleQuantidadePadraoChange(item, e.target.value)}
                    className="w-16 text-center border-gray-300 rounded-md"
                  />
                  <button type="button" onClick={() => handleQuantidadePadraoChange(item, quantidadesPadrao[item] + 1)} className="cursor-pointer px-3 py-1 bg-cyan-600 text-white hover:bg-cyan-700 rounded-md">+</button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Itens Personalizados */}
          <fieldset className="border border-gray-300 dark:border-gray-600 p-4 rounded-md">
             <legend className="px-2 font-semibold text-gray-700 dark:text-gray-200">Insira outro item que está fora da lista</legend>
            {itensPersonalizados.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-end gap-2 mb-2">
                <div className="flex-grow w-full">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Item</label>
                  <input type="text" name="nome" value={item.nome} onChange={(e) => handleItemPersonalizadoChange(index, e)} className={`${inputStyles} text-sm`} />
                </div>
                <div className="w-full sm:w-2/5">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Unidade / Quantidade</label>
                  <input type="text" name="quantidade" value={item.quantidade} onChange={(e) => handleItemPersonalizadoChange(index, e)} className={`${inputStyles} text-sm`} />
                </div>
                {itensPersonalizados.length > 1 && (
                  <button type="button" onClick={() => handleRemoveItemPersonalizado(index)} className="cursor-pointer w-full sm:w-auto px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">-</button>
                )}
              </div>
            ))}
            <button type="button" onClick={handleAddItemPersonalizado} className="cursor-pointer mt-2 px-3 py-1 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 font-bold">+</button>
          </fieldset>

          {/* Anotação */}
          <div>
            <label htmlFor="anotacao" className={labelStyles}>Deixar anotação referente ao pedido</label>
            <textarea id="anotacao" name="anotacao" rows="4" className={inputStyles} placeholder="Ex: fui reabastecer, era modelo..."></textarea>
          </div>

          {/* Upload de Foto */}
          <div>
            <label htmlFor="foto" className={labelStyles}>Caso seja possível e necessário anexe uma foto</label>
            <input id="foto" name="foto" type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"/>
          </div>

          {/* Cópia por E-mail */}
          <div className="border border-gray-300 dark:border-gray-600 p-4 rounded-md">
            <div className="flex items-center">
              <input type="checkbox" id="enviarCopia" name="enviarCopia" className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500" />
              <label htmlFor="enviarCopia" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
                Envie uma cópia deste pedido para o seu email?
              </label>
            </div>
            <input type="email" id="copiaEmail" name="copiaEmail" className={`${inputStyles} mt-2`} placeholder="exemplo@maglog.com.br"/>
          </div>

          {/* Botão Enviar */}
          <div className="text-center">
            <button type="submit" disabled={status.submitting} className="cursor-pointer w-full sm:w-auto px-8 py-3 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-700 disabled:bg-cyan-400 transition-colors">
              {status.submitting ? 'Enviando...' : 'ENVIAR'}
            </button>
          </div>

          {/* Mensagens de Status */}
          {status.success && <p className="text-center text-green-600 dark:text-green-400">Requisição enviada com sucesso!</p>}
          {status.error && <p className="text-center text-red-600 dark:text-red-400">Erro: {status.error}</p>}
        </form>
      </div>
    </div>
  );
}