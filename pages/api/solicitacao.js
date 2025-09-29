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

async function enviarNotificacaoDiscord(dados) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('Webhook do Discord não configurado. Pulando notificação.');
    return;
  }
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
  const payload = {
    content: `🔔 **Nova Requisição de Almoxarifado Recebida!**`,
    embeds: [
      {
        title: 'Detalhes da Requisição de Almoxarifado',
        color: 0x0099ff,
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
    
    // --- CÓDIGO DE DEBUG DAS VARIÁVEIS DE AMBIENTE ---
    console.log("--- DEBUGANDO VARIÁVEIS DE AMBIENTE DE E-MAIL ---");
    console.log(`EMAIL_SERVER_HOST: [${process.env.EMAIL_SERVER_HOST}]`);
    console.log(`EMAIL_SERVER_PORT: [${process.env.EMAIL_SERVER_PORT}]`);
    console.log(`EMAIL_SERVER_USER: [${process.env.EMAIL_SERVER_USER}]`);
    console.log("-------------------------------------------------");

    // --- CÓDIGO DO NODEMAILER RESTAURADO E COMPLETO ---
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      secure: false, // true para porta 465, false para outras
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const attachments = [];
    const fotoFile = getFieldValue(files.foto);
    if (fotoFile && fotoFile.size > 0) {
      attachments.push({
        filename: fotoFile.originalFilename,
        path: fotoFile.filepath,
      });
    }

    const mailOptions = {
      from: `"${nome || 'Sistema Almoxarifado'}" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_TO,
      cc: enviarCopia && copiaEmail ? copiaEmail : '',
      subject: `Nova Requisição de Almoxarifado - Setor: ${setor}`,
      html: `
        <h1>Nova Requisição de Almoxarifado</h1>
        <p><strong>Data da Requisição:</strong> ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
        <p><strong>Solicitante:</strong> ${nome}</p>
        <p><strong>Setor:</strong> ${setor}</p>
        <hr>
        ${createHtmlTable('Itens Padrão Solicitados', ['Item', 'Quantidade'], itensPadrao)}
        ${createHtmlTable('Itens Fora da Lista Solicitados', ['Item', 'Unidade / Quantidade'], itensPersonalizados)}
        <hr>
        <h3>Anotações:</h3>
        <p>${(anotacao || 'Nenhuma').replace(/\n/g, '<br>')}</p>
        <br>
        ${enviarCopia ? `<p><em>Cópia enviada para: ${copiaEmail}</em></p>` : ''}
      `,
      attachments: attachments,
    };
    
    await transporter.sendMail(mailOptions);

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
