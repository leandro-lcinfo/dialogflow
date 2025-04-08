const express = require('express');
const mysql = require('mysql2/promise'); // Usando a versão com Promises

const app = express();
app.use(express.json()); // Para parsear o corpo da requisição JSON do Dialogflow

// --- Configuração do Banco de Dados ---
const dbConfig = {
  host: 'lcinfo.com.br',         // Ex: localhost, IP, ou URL do serviço Cloud SQL
  user: 'lcinfoco_chamadowa',
  password: 'L1c1i1n1f1o1',
  database: 'lcinfoco_chamadosWA'
};

app.post('/webhook', async (req, res) => { 'https://www.lcinfo.com.br/api/dialogflow/index.js' // A URL que você colocará no Dialogflow
  console.log('Webhook Recebido:', JSON.stringify(req.body, null, 2));

  const intentName = req.body.queryResult.intent.displayName;
  let responseText = 'Desculpe, não entendi.'; // Resposta padrão

  if (intentName === 'RegistrarContato') { // Verifica se é o Intent correto
    const parameters = req.body.queryResult.parameters;
    const nome = parameters.nome;
    const empresa = parameters.empresa;
    const motivo = parameters.motivo;

    // Validação básica
    if (!nome || !empresa || !motivo) {
       responseText = 'Parece que faltou alguma informação. Poderia repetir, por favor?';
    } else {
       try {
         // Conecta ao banco de dados
         const connection = await mysql.createConnection(dbConfig);
         console.log('Conectado ao MySQL!');

         // Prepara e executa a query SQL para inserir os dados
         const sql = 'INSERT INTO contatos (nome, empresa, motivo) VALUES (?, ?, ?)';
         const [results] = await connection.execute(sql, [nome, empresa, motivo]);

         console.log('Dados inseridos com sucesso! ID:', results.insertId);
         await connection.end(); // Fecha a conexão

         // Monta a resposta para o Dialogflow (e para o usuário)
         responseText = `Ok! Registrei o contato de ${nome} da empresa ${empresa} pelo motivo: ${motivo}.`;

       } catch (error) {
         console.error('Erro ao conectar ou inserir no MySQL:', error);
         responseText = 'Desculpe, tive um problema ao tentar registrar as informações no banco de dados. Tente novamente mais tarde.';
         // É importante logar o erro para debug, mas não expor detalhes técnicos ao usuário.
       }
    }
  }

  // Envia a resposta de volta para o Dialogflow
  res.json({
    fulfillmentText: responseText // Texto que o Dialogflow falará/mostrará ao usuário
    // Você pode adicionar mais campos aqui se precisar (fulfillmentMessages, etc.)
  });
});

// Inicia o servidor (exemplo para rodar localmente ou em um servidor simples)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Webhook rodando na porta ${PORT}`);
});

// Se usar Cloud Functions ou Lambda, a estrutura será um pouco diferente
// (exportar a função `app` ou uma função específica).