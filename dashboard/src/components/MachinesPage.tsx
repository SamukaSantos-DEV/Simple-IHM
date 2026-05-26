import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Settings } from 'lucide-react';

interface Machine {
  id?: string;
  name: string;
  description: string;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt?: string;
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Machine>({
    name: '',
    description: '',
    location: '',
    status: 'active',
  });

  // Carregar máquinas do servidor
  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/machines');
      if (response.ok) {
        const data = await response.json();
        setMachines(data);
      }
    } catch (error) {
      console.error('Erro ao carregar máquinas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (editingId) {
        // Atualizar máquina existente
        const response = await fetch(`http://localhost:3001/api/machines/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        
        if (response.ok) {
          await fetchMachines();
          resetForm();
        }
      } else {
        // Criar nova máquina
        const response = await fetch('http://localhost:3001/api/machines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        
        if (response.ok) {
          await fetchMachines();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Erro ao salvar máquina:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (machine: Machine) => {
    setFormData(machine);
    setEditingId(machine.id || null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta máquina?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/machines/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchMachines();
      }
    } catch (error) {
      console.error('Erro ao deletar máquina:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', location: '', status: 'active' });
    setEditingId(null);
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-600 border-green-400/50';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-600 border-gray-400/50';
      case 'maintenance':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-400/50';
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-400/50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'inactive':
        return 'Inativa';
      case 'maintenance':
        return 'Manutenção';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header sem Botão de Voltar */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">Gerenciar Máquinas</h1>
            <p className="text-sm opacity-60">Cadastre e gerencie as máquinas do seu sistema</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex cursor-pointer items-center gap-2 px-6 py-3 bg-ios-blue hover:bg-ios-blue/90 text-white rounded-full font-bold transition-all hover:scale-105"
          >
            <Plus size={20} />
            Nova Máquina
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="seamless-panel rounded-ios p-8 mb-12">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Settings size={24} />
              {editingId ? 'Editar Máquina' : 'Criar Nova Máquina'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 opacity-70">Nome *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 ring-ios-blue/30 transition-all"
                  placeholder="Ex: Máquina de Corte 01"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 opacity-70">Localização *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 ring-ios-blue/30 transition-all"
                  placeholder="Ex: Galpão A, Linha 1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-2 opacity-70">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 ring-ios-blue/30 transition-all resize-none"
                  placeholder="Descrição da máquina..."
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-2 opacity-70">Status</label>
                <div className="flex gap-4">
                  {['active', 'inactive', 'maintenance'].map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={formData.status === status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="rounded-full"
                      />
                      <span className="text-sm">{getStatusLabel(status)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-ios-green hover:bg-ios-green/90 text-white rounded-full font-bold transition-all disabled:opacity-50"
                >
                  <Check size={18} />
                  {editingId ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-600 rounded-full font-bold transition-all"
                >
                  <X size={18} />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Machines List */}
        <div className="seamless-panel rounded-ios p-8">
          <h2 className="text-xl font-bold mb-6">
            Máquinas Cadastradas ({machines.length})
          </h2>

          {loading && !showForm ? (
            <div className="text-center py-12 opacity-60">Carregando...</div>
          ) : machines.length === 0 ? (
            <div className="text-center py-12 opacity-60">
              <p className="mb-4">Nenhuma máquina cadastrada</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-ios-blue hover:underline font-bold"
              >
                Criar primeira máquina
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {machines.map((machine) => (
                <div
                  key={machine.id}
                  className="border border-black/10 dark:border-white/10 rounded-xl p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{machine.name}</h3>
                      <p className="text-xs opacity-60">{machine.location}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(machine.status)}`}>
                      {getStatusLabel(machine.status)}
                    </span>
                  </div>

                  {machine.description && (
                    <p className="text-sm opacity-70 mb-4">{machine.description}</p>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleEdit(machine)}
                      className="p-2 hover:bg-ios-blue/20 rounded-lg transition-all text-ios-blue"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => machine.id && handleDelete(machine.id)}
                      className="p-2 hover:bg-ios-red/20 rounded-lg transition-all text-ios-red"
                      title="Deletar"
                    >
                      <Trash2 size={16} />
                    </button>
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
