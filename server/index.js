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

// In-memory database para máquinas, funcionários e manutenções
let maquinas = [
  {
    id: 1,
    tag_maquina: "CNC-01",
    nome_maquina: "Torno CNC Romi",
    setor: "Usinagem",
    data_cadastro: "2026-05-15T00:40:48.887079Z"
  },
  {
    id: 4,
    tag_maquina: "EST-01",
    nome_maquina: "Esteira Transportadora Central",
    setor: "Logistica",
    data_cadastro: "2026-05-22T16:53:47.284060Z"
  }
];

let funcionarios = [
  {
    id: 1,
    nome: "Carlos Eduardo",
    cargo: "Técnico de Manutenção",
    turno_trabalho: 1,
    ativo: true,
    email: "carlos@example.com"
  },
  {
    id: 2,
    nome: "Ana Maria",
    cargo: "Engenheira de Confiabilidade",
    turno_trabalho: 2,
    ativo: true,
    email: "ana@example.com"
  }
];

let manutencoes = [
  {
    id: 1,
    maquina_id: 1,
    tag_maquina: "CNC-01",
    nome_maquina: "Torno CNC Romi",
    descricao_servico: "Troca de Óleo Lubrificante",
    data_agendada: "2026-05-28",
    concluida: false,
    data_conclusao_real: null,
    funcionario_id: null,
    nome_funcionario: null,
    tipo_manutencao: "Preventiva"
  },
  {
    id: 2,
    maquina_id: 1,
    tag_maquina: "CNC-01",
    nome_maquina: "Torno CNC Romi",
    descricao_servico: "Aperto de Base e Parafusos",
    data_agendada: "2026-05-26",
    concluida: false,
    data_conclusao_real: null,
    funcionario_id: null,
    nome_funcionario: null,
    tipo_manutencao: "Corretiva"
  }
];

// ============ ROTAS DE MÁQUINAS ============

// GET - Listar todas as máquinas
app.get('/maquinas', (req, res) => {
  res.json(maquinas);
});

// GET - Obter máquina por ID
app.get('/maquinas/:maquina_id', (req, res) => {
  const id = parseInt(req.params.maquina_id);
  const maquina = maquinas.find(m => m.id === id);
  if (!maquina) {
    return res.status(404).json({ error: 'Máquina não encontrada' });
  }
  res.json(maquina);
});

// POST - Criar nova máquina
app.post('/maquinas', (req, res) => {
  const { tag_maquina, nome_maquina, setor } = req.body;
  
  if (!tag_maquina || !nome_maquina || !setor) {
    return res.status(400).json({ error: 'Tag, nome e setor são obrigatórios' });
  }

  const newMaquina = {
    id: Math.max(0, ...maquinas.map(m => m.id)) + 1,
    tag_maquina,
    nome_maquina,
    setor,
    data_cadastro: new Date().toISOString(),
  };

  maquinas.push(newMaquina);
  io.emit('maquina_criada', newMaquina);
  res.status(201).json(newMaquina);
});

// PUT - Atualizar máquina
app.put('/maquinas/:maquina_id', (req, res) => {
  const id = parseInt(req.params.maquina_id);
  const maquinaIndex = maquinas.findIndex(m => m.id === id);
  
  if (maquinaIndex === -1) {
    return res.status(404).json({ error: 'Máquina não encontrada' });
  }

  const { tag_maquina, nome_maquina, setor } = req.body;
  
  if (!tag_maquina || !nome_maquina || !setor) {
    return res.status(400).json({ error: 'Tag, nome e setor são obrigatórios' });
  }

  maquinas[maquinaIndex] = {
    ...maquinas[maquinaIndex],
    tag_maquina,
    nome_maquina,
    setor,
  };

  io.emit('maquina_atualizada', maquinas[maquinaIndex]);
  res.json(maquinas[maquinaIndex]);
});

// DELETE - Deletar máquina
app.delete('/maquinas/:maquina_id', (req, res) => {
  const id = parseInt(req.params.maquina_id);
  const maquinaIndex = maquinas.findIndex(m => m.id === id);
  
  if (maquinaIndex === -1) {
    return res.status(404).json({ error: 'Máquina não encontrada' });
  }

  const deletedMachine = maquinas.splice(maquinaIndex, 1)[0];
  
  // Limpar manutenções associadas
  manutencoes = manutencoes.filter(t => t.maquina_id !== id);
  
  io.emit('maquina_deletada', id);
  res.json({ message: 'Máquina deletada com sucesso', maquina: deletedMachine });
});

// ============ ROTAS DE FUNCIONÁRIOS ============

// GET - Listar funcionários
app.get('/funcionarios', (req, res) => {
  res.json(funcionarios);
});

// GET - Obter funcionário por ID
app.get('/funcionarios/:funcionario_id', (req, res) => {
  const id = parseInt(req.params.funcionario_id);
  const func = funcionarios.find(f => f.id === id);
  if (!func) {
    return res.status(404).json({ error: 'Funcionário não encontrado' });
  }
  res.json(func);
});

// POST - Criar funcionário
app.post('/funcionarios', (req, res) => {
  const { nome, cargo, turno_trabalho, email, senha } = req.body;
  
  if (!nome || !cargo || !email || !senha) {
    return res.status(400).json({ error: 'Nome, cargo, email e senha são obrigatórios' });
  }

  const newFunc = {
    id: Math.max(0, ...funcionarios.map(f => f.id)) + 1,
    nome,
    cargo,
    turno_trabalho: turno_trabalho !== undefined ? parseInt(turno_trabalho) : 0,
    ativo: true,
    email,
  };

  funcionarios.push(newFunc);
  io.emit('funcionario_criado', newFunc);
  res.status(201).json(newFunc);
});

// PUT - Atualizar funcionário
app.put('/funcionarios/:funcionario_id', (req, res) => {
  const id = parseInt(req.params.funcionario_id);
  const funcIndex = funcionarios.findIndex(f => f.id === id);
  
  if (funcIndex === -1) {
    return res.status(404).json({ error: 'Funcionário não encontrado' });
  }

  const { nome, cargo, turno_trabalho, email } = req.body;
  
  if (!nome || !cargo || !email) {
    return res.status(400).json({ error: 'Nome, cargo e email são obrigatórios' });
  }

  funcionarios[funcIndex] = {
    ...funcionarios[funcIndex],
    nome,
    cargo,
    turno_trabalho: turno_trabalho !== undefined ? parseInt(turno_trabalho) : funcionarios[funcIndex].turno_trabalho,
    email,
  };

  io.emit('funcionario_atualizado', funcionarios[funcIndex]);
  res.json(funcionarios[funcIndex]);
});

// DELETE - Deletar funcionário
app.delete('/funcionarios/:funcionario_id', (req, res) => {
  const id = parseInt(req.params.funcionario_id);
  const funcIndex = funcionarios.findIndex(f => f.id === id);
  
  if (funcIndex === -1) {
    return res.status(404).json({ error: 'Funcionário não encontrado' });
  }

  const deletedFunc = funcionarios.splice(funcIndex, 1)[0];
  
  // Desvincular das manutenções concluídas por ele (ou manter histórico de nome_funcionario)
  manutencoes = manutencoes.map(m => {
    if (m.funcionario_id === id) {
      return { ...m, funcionario_id: null };
    }
    return m;
  });

  io.emit('funcionario_deletado', id);
  res.json({ message: 'Funcionário deletado com sucesso', funcionario: deletedFunc });
});

// ============ ROTAS DE MANUTENÇÃO PREVENTIVA ============

// GET - Listar todas as tarefas de manutenção
app.get('/manutencoes', (req, res) => {
  // Enriquecer dados da manutenção (tag_maquina, nome_maquina, nome_funcionario) em tempo real
  const enriched = manutencoes.map(m => {
    const maquina = maquinas.find(maq => maq.id === m.maquina_id);
    const func = m.funcionario_id ? funcionarios.find(f => f.id === m.funcionario_id) : null;
    return {
      ...m,
      tag_maquina: maquina ? maquina.tag_maquina : m.tag_maquina,
      nome_maquina: maquina ? maquina.nome_maquina : m.nome_maquina,
      nome_funcionario: func ? func.nome : m.nome_funcionario,
    };
  });
  res.json(enriched);
});

// GET - Obter manutenção específica por ID
app.get('/manutencoes/:manutencao_id', (req, res) => {
  const id = parseInt(req.params.manutencao_id);
  const m = manutencoes.find(item => item.id === id);
  
  if (!m) {
    return res.status(404).json({ error: 'Manutenção não encontrada' });
  }

  const maquina = maquinas.find(maq => maq.id === m.maquina_id);
  const func = m.funcionario_id ? funcionarios.find(f => f.id === m.funcionario_id) : null;
  res.json({
    ...m,
    tag_maquina: maquina ? maquina.tag_maquina : m.tag_maquina,
    nome_maquina: maquina ? maquina.nome_maquina : m.nome_maquina,
    nome_funcionario: func ? func.nome : m.nome_funcionario,
  });
});

// POST - Criar nova tarefa de manutenção
app.post('/manutencoes', (req, res) => {
  const { maquina_id, descricao_servico, data_agendada, tipo_manutencao } = req.body;
  
  if (maquina_id === undefined || !descricao_servico || !data_agendada || !tipo_manutencao) {
    return res.status(400).json({ error: 'maquina_id, descricao_servico, data_agendada e tipo_manutencao são obrigatórios' });
  }

  const mid = parseInt(maquina_id);
  const maquina = maquinas.find(maq => maq.id === mid);
  
  const newTask = {
    id: Math.max(0, ...manutencoes.map(m => m.id)) + 1,
    maquina_id: mid,
    tag_maquina: maquina ? maquina.tag_maquina : '',
    nome_maquina: maquina ? maquina.nome_maquina : '',
    descricao_servico,
    data_agendada,
    concluida: false,
    data_conclusao_real: null,
    funcionario_id: null,
    nome_funcionario: null,
    tipo_manutencao: tipo_manutencao || 'Preventiva',
  };

  manutencoes.push(newTask);
  io.emit('manutencao_criada', newTask);
  res.status(201).json(newTask);
});

// PUT - Atualizar tarefa de manutenção
app.put('/manutencoes/:manutencao_id', (req, res) => {
  const id = parseInt(req.params.manutencao_id);
  const taskIndex = manutencoes.findIndex(t => t.id === id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Manutenção não encontrada' });
  }

  const { descricao_servico, data_agendada, tipo_manutencao } = req.body;

  if (!descricao_servico || !data_agendada || !tipo_manutencao) {
    return res.status(400).json({ error: 'descricao_servico, data_agendada e tipo_manutencao são obrigatórios' });
  }

  manutencoes[taskIndex] = {
    ...manutencoes[taskIndex],
    descricao_servico,
    data_agendada,
    tipo_manutencao,
  };

  io.emit('manutencao_atualizada', manutencoes[taskIndex]);
  res.json(manutencoes[taskIndex]);
});

// DELETE - Deletar tarefa de manutenção
app.delete('/manutencoes/:manutencao_id', (req, res) => {
  const id = parseInt(req.params.manutencao_id);
  const taskIndex = manutencoes.findIndex(t => t.id === id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Manutenção não encontrada' });
  }

  const deletedTask = manutencoes.splice(taskIndex, 1)[0];
  io.emit('manutencao_deletada', id);
  res.json({ message: 'Manutenção deletada com sucesso', task: deletedTask });
});

// PATCH - Concluir tarefa de manutenção
app.patch('/manutencoes/:manutencao_id/concluir', (req, res) => {
  const id = parseInt(req.params.manutencao_id);
  const taskIndex = manutencoes.findIndex(t => t.id === id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Manutenção não encontrada' });
  }

  const { funcionario_id } = req.body;
  if (funcionario_id === undefined || funcionario_id === null) {
    return res.status(400).json({ error: 'funcionario_id é obrigatório' });
  }

  const fid = parseInt(funcionario_id);
  const func = funcionarios.find(f => f.id === fid);
  if (!func) {
    return res.status(404).json({ error: 'Funcionário não encontrado' });
  }

  manutencoes[taskIndex] = {
    ...manutencoes[taskIndex],
    concluida: true,
    data_conclusao_real: new Date().toISOString(),
    funcionario_id: fid,
    nome_funcionario: func.nome,
  };

  io.emit('manutencao_atualizada', manutencoes[taskIndex]);
  res.json(manutencoes[taskIndex]);
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
