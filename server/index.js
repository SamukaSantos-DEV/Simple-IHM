const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Permite ler JSON no corpo da requisição

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Rota para o ESP32 enviar dados via HTTP POST
app.post('/update', (req, res) => {
  const data = req.body;
  console.log('Dados recebidos do ESP32 (HTTP):', data);
  
  // Transmite para o dashboard via Socket.io
  io.emit('dashboard_update', data);
  
  res.status(200).send('OK');
});

io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  // Quando o ESP32 envia dados
  socket.on('esp32_data', (data) => {
    console.log('Dados do ESP32:', data);
    // Transmite para todos os dashboards conectados
    io.emit('dashboard_update', data);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
