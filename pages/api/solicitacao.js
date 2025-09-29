// /pages/api/solicitacao.js - CÓDIGO DE TESTE TEMPORÁRIO

export default async function handler(req, res) {
  console.log("--- LOG DE TESTE INICIADO ---");
  console.log(`A função foi chamada às ${new Date().toLocaleTimeString()}`);
  console.log("Se você está vendo esta mensagem, o sistema de logs da Vercel está funcionando.");
  console.log("--- LOG DE TESTE FINALIZADO ---");

  // Apenas responde que o teste foi recebido
  res.status(200).json({ 
    status: 'Teste de log recebido com sucesso!',
    mensagem: 'Verifique a aba Logs no painel da Vercel.'
  });
}
