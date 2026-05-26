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

// In-memory database para máquinas (em produção usar banco de dados real)
let machines = [
  {
    id: '1',
    name: 'Máquina de Corte 01',
    description: 'Máquina responsável pelo corte de peças',
    location: 'Galpão A, Linha 1',
    status: 'active',
    createdAt: new Date().toISOString(),
  }
];

let maintenanceTasks = [
  {
    id: '1',
    machineId: '1',
    taskName: 'Troca de Óleo Lubrificante',
    description: 'Trocar o óleo lubrificante hidráulico da base',
    scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    technician: 'Carlos Eduardo',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    machineId: '1',
    taskName: 'Aperto de Base e Parafusos',
    description: 'Revisar folga e reapertar os parafusos estruturais',
    scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'overdue',
    technician: 'Ana Maria',
    createdAt: new Date().toISOString(),
  }
];

// ============ ROTAS DE MÁQUINAS ============

// GET - Listar todas as máquinas
app.get('/api/machines', (req, res) => {
  res.json(machines);
});

// GET - Obter máquina por ID
app.get('/api/machines/:id', (req, res) => {
  const machine = machines.find(m => m.id === req.params.id);
  if (!machine) {
    return res.status(404).json({ error: 'Máquina não encontrada' });
  }
  res.json(machine);
});

// POST - Criar nova máquina
app.post('/api/machines', (req, res) => {
  const { name, description, location, status } = req.body;
  
  if (!name || !location) {
    return res.status(400).json({ error: 'Nome e localização são obrigatórios' });
  }

  const newMachine = {
    id: Date.now().toString(),
    name,
    description: description || '',
    location,
    status: status || 'active',
    createdAt: new Date().toISOString(),
  };

  machines.push(newMachine);
  
  // Notificar clientes sobre nova máquina
  io.emit('machine_created', newMachine);
  
  res.status(201).json(newMachine);
});

// PUT - Atualizar máquina
app.put('/api/machines/:id', (req, res) => {
  const machineIndex = machines.findIndex(m => m.id === req.params.id);
  
  if (machineIndex === -1) {
    return res.status(404).json({ error: 'Máquina não encontrada' });
  }

  const { name, description, location, status } = req.body;
  
  if (!name || !location) {
    return res.status(400).json({ error: 'Nome e localização são obrigatórios' });
  }

  machines[machineIndex] = {
    ...machines[machineIndex],
    name,
    description: description || '',
    location,
    status: status || machines[machineIndex].status,
  };

  // Notificar clientes sobre atualização
  io.emit('machine_updated', machines[machineIndex]);
  
  res.json(machines[machineIndex]);
});

// DELETE - Deletar máquina
app.delete('/api/machines/:id', (req, res) => {
  const machineIndex = machines.findIndex(m => m.id === req.params.id);
  
  if (machineIndex === -1) {
    return res.status(404).json({ error: 'Máquina não encontrada' });
  }

  const deletedMachine = machines.splice(machineIndex, 1)[0];
  
  // Deletar também as manutenções associadas a esta máquina
  maintenanceTasks = maintenanceTasks.filter(t => t.machineId !== req.params.id);
  
  // Notificar clientes sobre deleção
  io.emit('machine_deleted', deletedMachine.id);
  
  res.json({ message: 'Máquina deletada com sucesso', machine: deletedMachine });
});

// ============ ROTAS DE MANUTENÇÃO PREVENTIVA ============

// GET - Listar todas as tarefas de manutenção
app.get('/api/maintenance', (req, res) => {
  res.json(maintenanceTasks);
});

// POST - Criar nova tarefa de manutenção
app.post('/api/maintenance', (req, res) => {
  const { machineId, taskName, description, scheduledDate, status, technician } = req.body;
  
  if (!machineId || !taskName || !scheduledDate) {
    return res.status(400).json({ error: 'ID da máquina, nome da tarefa e data agendada são obrigatórios' });
  }

  const newTask = {
    id: Date.now().toString(),
    machineId,
    taskName,
    description: description || '',
    scheduledDate,
    status: status || 'pending',
    technician: technician || '',
    createdAt: new Date().toISOString(),
  };

  maintenanceTasks.push(newTask);
  io.emit('maintenance_created', newTask);
  res.status(201).json(newTask);
});

// PUT - Atualizar tarefa de manutenção
app.put('/api/maintenance/:id', (req, res) => {
  const taskIndex = maintenanceTasks.findIndex(t => t.id === req.params.id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Tarefa de manutenção não encontrada' });
  }

  const { machineId, taskName, description, scheduledDate, status, technician } = req.body;

  if (!machineId || !taskName || !scheduledDate) {
    return res.status(400).json({ error: 'ID da máquina, nome da tarefa e data agendada são obrigatórios' });
  }

  maintenanceTasks[taskIndex] = {
    ...maintenanceTasks[taskIndex],
    machineId,
    taskName,
    description: description || '',
    scheduledDate,
    status: status || maintenanceTasks[taskIndex].status,
    technician: technician || '',
  };

  io.emit('maintenance_updated', maintenanceTasks[taskIndex]);
  res.json(maintenanceTasks[taskIndex]);
});

// DELETE - Deletar tarefa de manutenção
app.delete('/api/maintenance/:id', (req, res) => {
  const taskIndex = maintenanceTasks.findIndex(t => t.id === req.params.id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Tarefa de manutenção não encontrada' });
  }

  const deletedTask = maintenanceTasks.splice(taskIndex, 1)[0];
  io.emit('maintenance_deleted', deletedTask.id);
  res.json({ message: 'Tarefa de manutenção deletada com sucesso', task: deletedTask });
});

// ============ ROTAS ANTIGAS ============

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
