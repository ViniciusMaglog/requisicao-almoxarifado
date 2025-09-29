import nodemailer from 'nodemailer';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

const createHtmlTable = (title, headers, rows) => {
  if (rows.length === 0) return '';
  return `<h3>${title}</h3><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><thead><tr>${headers.map(header => `<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">${header}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td style="border: 1px solid #ddd; padding: 8px;">${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
};

// --- NOVO: Função para enviar notificação para o Discord ---
async function enviarNotificacaoDiscord(dados) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('Webhook do Discord não configurado. Pulando notificação.');
    return;
  }

  // Formata a lista de itens para uma string legível
  let itensDescricao = '';
  if (dados.itensPadrao.length > 0) {
    itensDescricao += '**Itens Padrão:**\n' + dados.itensPadrao.map(item => `- ${item[0]}: ${item[1]}`).join('\n');
  }
  if (dados.itensPersonalizados.length > 0) {
    itensDescricao += '\n\n**Itens Adicionais:**\n' + dados.itensPersonalizados.map(item => `- ${item[0]}: ${item[1]}`).join('\n');
  }
  if (!itensDescricao) {
    itensDescricao = 'Nenhum item solicitado.';
  }

  // Monta a mensagem usando o formato "Embed" do Discord
  const payload = {
    content: `🔔 **Nova Requisição de Almoxarifado Recebida!**`, // Mensagem de ping/notificação
    embeds: [
      {
        title: 'Detalhes da Requisição',
        color: 0x0099ff, // Cor da barra lateral (azul)
        fields: [
          { name: 'Solicitante', value: dados.nome, inline: true },
          { name: 'Setor', value: dados.setor, inline: true },
          { name: 'Itens Solicitados', value: itensDescricao },
          { name: 'Anotações', value: dados.anotacao || 'Nenhuma' },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Sistema de Requisições Maglog' },
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('Notificação enviada para o Discord com sucesso.');
    } else {
      console.error(`Erro ao enviar notificação para o Discord: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Falha ao enviar requisição para o Discord:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const form = formidable({ multiples: true, allowEmptyFiles: true, minFileSize: 0 });

  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const getFieldValue = (value) => (Array.isArray(value) ? value[0] : value);
    const nome = getFieldValue(fields.nome);
    const setor = getFieldValue(fields.setor);
    const anotacao = getFieldValue(fields.anotacao);
    const enviarCopia = getFieldValue(fields.enviarCopia) === 'on';
    const copiaEmail = getFieldValue(fields.copiaEmail);
    const itensPadrao = [];
    const itensPersonalizados = [];

    for (const key in fields) {
      if (key.startsWith('item_padrao_')) {
        const itemName = key.replace('item_padrao_', '');
        const quantidade = getFieldValue(fields[key]);
        if (parseInt(quantidade, 10) > 0) {
          itensPadrao.push([itemName, quantidade]);
        }
      }
    }
    const itemCount = parseInt(getFieldValue(fields.item_personalizado_count) || '0', 10);
    if (!isNaN(itemCount)) {
      for (let i = 0; i < itemCount; i++) {
        const itemName = getFieldValue(fields[`item_personalizado_nome_${i}`]);
        const quantidade = getFieldValue(fields[`item_personalizado_qtde_${i}`]);
        if (itemName) {
          itensPersonalizados.push([itemName, quantidade]);
        }
      }
    }

    const transporter = nodemailer.createTransport({ /* ... suas configs de email ... */ });
    const mailOptions = { /* ... suas configs de email ... */ };
    await transporter.sendMail(mailOptions);

    // --- NOVO: Chama a função para notificar o Discord após enviar o e-mail ---
    await enviarNotificacaoDiscord({
      nome,
      setor,
      anotacao,
      itensPadrao,
      itensPersonalizados,
    });

    return res.status(200).json({ message: 'Requisição enviada com sucesso!' });
  } catch (error) {
    console.error('Erro no servidor:', error);
    return res.status(500).json({ message: error.message || 'Erro interno no servidor.' });
  }
}