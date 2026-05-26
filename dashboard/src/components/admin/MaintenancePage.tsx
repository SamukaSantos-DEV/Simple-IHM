import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Calendar, Wrench, User, FileText } from 'lucide-react';

interface MaintenanceTask {
  id?: string;
  machineId: string;
  taskName: string;
  description: string;
  scheduledDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  technician: string;
  createdAt?: string;
}

interface Machine {
  id: string;
  name: string;
  location: string;
}

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MaintenanceTask>({
    machineId: '',
    taskName: '',
    description: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    technician: '',
  });

  useEffect(() => {
    fetchMachines();
    fetchTasks();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/machines');
      if (response.ok) {
        const data = await response.json();
        setMachines(data);
        if (data.length > 0 && !formData.machineId) {
          setFormData(prev => ({ ...prev, machineId: data[0].id }));
        }
      } else {
        loadFallbackMachines();
      }
    } catch (error) {
      console.error('Erro ao carregar máquinas no admin de manutenção:', error);
      loadFallbackMachines();
    }
  };

  const loadFallbackMachines = () => {
    const local = localStorage.getItem('local_machines');
    if (local) {
      const parsed = JSON.parse(local);
      setMachines(parsed);
      if (parsed.length > 0) {
        setFormData(prev => ({ ...prev, machineId: parsed[0].id }));
      }
    } else {
      // Mock inicial caso não tenha nada
      const mock = [{ id: '1', name: 'Máquina de Corte 01', location: 'Galpão A' }];
      setMachines(mock);
      setFormData(prev => ({ ...prev, machineId: '1' }));
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/maintenance');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
        localStorage.setItem('local_maintenance', JSON.stringify(data));
      } else {
        loadFallbackTasks();
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas de manutenção:', error);
      loadFallbackTasks();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackTasks = () => {
    const local = localStorage.getItem('local_maintenance');
    if (local) {
      setTasks(JSON.parse(local));
    } else {
      const mockTasks: MaintenanceTask[] = [
        {
          id: '1',
          machineId: '1',
          taskName: 'Troca de Óleo Lubrificante',
          description: 'Trocar o óleo lubrificante hidráulico da base',
          scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending',
          technician: 'Carlos Eduardo',
        },
        {
          id: '2',
          machineId: '1',
          taskName: 'Aperto de Base e Parafusos',
          description: 'Revisar folga e reapertar os parafusos estruturais',
          scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'overdue',
          technician: 'Ana Maria',
        }
      ];
      setTasks(mockTasks);
      localStorage.setItem('local_maintenance', JSON.stringify(mockTasks));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        // Se a data agendada já passou e o status é pending, marca como atrasado (overdue)
        status: formData.status === 'pending' && new Date(formData.scheduledDate) < new Date(new Date().setHours(0,0,0,0))
          ? 'overdue' 
          : formData.status
      };

      const isLocalOnly = !window.navigator.onLine; // Ou se falhar

      let success = false;
      let newOrUpdatedTask: MaintenanceTask | null = null;

      if (!isLocalOnly) {
        try {
          if (editingId) {
            const response = await fetch(`http://localhost:3001/api/maintenance/${editingId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (response.ok) {
              newOrUpdatedTask = await response.json();
              success = true;
            }
          } else {
            const response = await fetch('http://localhost:3001/api/maintenance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (response.ok) {
              newOrUpdatedTask = await response.json();
              success = true;
            }
          }
        } catch {
          success = false;
        }
      }

      if (!success) {
        // Fallback local
        let updatedTasksList = [...tasks];
        if (editingId) {
          updatedTasksList = tasks.map(t => t.id === editingId ? { ...payload, id: editingId } : t);
        } else {
          const newTask = { ...payload, id: Date.now().toString() };
          updatedTasksList.push(newTask);
        }
        setTasks(updatedTasksList);
        localStorage.setItem('local_maintenance', JSON.stringify(updatedTasksList));
        resetForm();
      } else {
        await fetchTasks();
        resetForm();
      }
    } catch (error) {
      console.error('Erro ao salvar manutenção:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task: MaintenanceTask) => {
    setFormData(task);
    setEditingId(task.id || null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta manutenção?')) return;

    try {
      let success = false;
      try {
        const response = await fetch(`http://localhost:3001/api/maintenance/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          success = true;
        }
      } catch {
        success = false;
      }

      if (!success) {
        const updated = tasks.filter(t => t.id !== id);
        setTasks(updated);
        localStorage.setItem('local_maintenance', JSON.stringify(updated));
      } else {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Erro ao deletar manutenção:', error);
    }
  };

  const handleToggleComplete = async (task: MaintenanceTask) => {
    const updatedStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updatedTask = { ...task, status: updatedStatus as any };

    try {
      let success = false;
      try {
        const response = await fetch(`http://localhost:3001/api/maintenance/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTask),
        });
        if (response.ok) {
          success = true;
        }
      } catch {
        success = false;
      }

      if (!success) {
        const updated = tasks.map(t => t.id === task.id ? updatedTask : t);
        setTasks(updated);
        localStorage.setItem('local_maintenance', JSON.stringify(updated));
      } else {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Erro ao alterar status da tarefa:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      machineId: machines[0]?.id || '',
      taskName: '',
      description: '',
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      technician: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-600 border-green-400/50';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-600 border-blue-400/50';
      case 'overdue':
        return 'bg-red-500/20 text-red-600 border-red-400/50';
      case 'pending':
      default:
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-400/50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'in_progress':
        return 'Em Andamento';
      case 'overdue':
        return 'Atrasada';
      case 'pending':
      default:
        return 'Agendada';
    }
  };

  const getMachineName = (machineId: string) => {
    return machines.find(m => m.id.toString() === machineId.toString())?.name || `Máquina ${machineId}`;
  };

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">Manutenção Preventiva</h1>
            <p className="text-sm opacity-60">Agende e monitore as intervenções preventivas dos equipamentos</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex cursor-pointer items-center gap-2 px-6 py-3 bg-ios-blue hover:bg-ios-blue/90 text-white rounded-full font-bold transition-all hover:scale-105"
          >
            <Plus size={20} />
            Agendar Manutenção
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="seamless-panel rounded-ios p-8 mb-12">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Wrench size={24} />
              {editingId ? 'Editar Manutenção' : 'Agendar Nova Manutenção'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 opacity-70">Máquina *</label>
                <select
                  required
                  value={formData.machineId}
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                  className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-ios-blue/30 transition-all cursor-pointer text-slate-800 dark:text-slate-100"
                >
                  {machines.map(m => (
                    <option key={m.id} value={m.id} className="text-black dark:text-white bg-slate-100 dark:bg-slate-900">
                      {m.name} ({m.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 opacity-70">Nome da Tarefa *</label>
                <input
                  type="text"
                  required
                  value={formData.taskName}
                  onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                  className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 ring-ios-blue/30 transition-all text-slate-800 dark:text-slate-100"
                  placeholder="Ex: Troca de Filtros, Calibração de Eixo"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 opacity-70">Data Programada *</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 ring-ios-blue/30 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 opacity-70">Técnico Responsável</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.technician}
                    onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                    className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 ring-ios-blue/30 transition-all text-slate-800 dark:text-slate-100"
                    placeholder="Nome do técnico"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-2 opacity-70">Descrição da Intervenção</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 ring-ios-blue/30 transition-all resize-none text-slate-800 dark:text-slate-100"
                  placeholder="Instruções e especificações técnicas da preventiva..."
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-2 opacity-70">Status</label>
                <div className="flex gap-4 flex-wrap">
                  {['pending', 'in_progress', 'completed', 'overdue'].map((st) => (
                    <label key={st} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value={st}
                        checked={formData.status === st}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="rounded-full"
                      />
                      <span className="text-sm font-medium">{getStatusLabel(st)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-ios-green hover:bg-ios-green/90 text-white rounded-full font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Check size={18} />
                  {editingId ? 'Atualizar' : 'Agendar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-600 rounded-full font-bold transition-all cursor-pointer"
                >
                  <X size={18} />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tasks List */}
        <div className="seamless-panel rounded-ios p-8">
          <h2 className="text-xl font-bold mb-6">
            Cronograma de Manutenções ({tasks.length})
          </h2>

          {loading && !showForm ? (
            <div className="text-center py-12 opacity-60">Carregando...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 opacity-60">
              <p className="mb-4">Nenhuma manutenção agendada</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-ios-blue hover:underline font-bold cursor-pointer"
              >
                Agendar primeira preventiva
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`border border-black/10 dark:border-white/10 rounded-2xl p-6 transition-all flex flex-col justify-between hover:bg-black/5 dark:hover:bg-white/5
                    ${task.status === 'completed' ? 'opacity-70' : ''}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div className="flex-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded-md text-ios-blue">
                          {getMachineName(task.machineId)}
                        </span>
                        <h3 className="font-bold text-lg mt-1.5">{task.taskName}</h3>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusBadge(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-sm opacity-70 mb-4 flex items-start gap-2">
                        <FileText size={16} className="shrink-0 mt-0.5 opacity-60" />
                        <span>{task.description}</span>
                      </p>
                    )}

                    <div className="flex flex-col gap-1.5 text-xs opacity-65 mb-4 border-t border-black/5 dark:border-white/5 pt-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>Agendado para: <strong>{new Date(task.scheduledDate).toLocaleDateString('pt-BR')}</strong></span>
                      </div>
                      {task.technician && (
                        <div className="flex items-center gap-2">
                          <User size={14} />
                          <span>Técnico: <strong>{task.technician}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-between items-center mt-2 border-t border-black/5 dark:border-white/5 pt-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => handleToggleComplete(task)}
                        className="w-4 h-4 rounded text-ios-green focus:ring-0 border-black/20 dark:border-white/20"
                      />
                      <span className="text-xs font-bold opacity-80">Marcar Concluída</span>
                    </label>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(task)}
                        className="p-2 hover:bg-ios-blue/20 rounded-lg transition-all text-ios-blue cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => task.id && handleDelete(task.id)}
                        className="p-2 hover:bg-ios-red/20 rounded-lg transition-all text-ios-red cursor-pointer"
                        title="Deletar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
