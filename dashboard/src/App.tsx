import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import DashboardView from './components/DashboardView';
import ConnectionStatus from './components/ConnectionStatus';
import LoginPage from './components/admin/LoginPage';
import AdminLayout from './components/admin/AdminLayout';
import MachinesPage from './components/MachinesPage';
import MaintenancePage from './components/admin/MaintenancePage';

const socket = io('http://localhost:3001');

interface MachineTelemetry {
  uptimeSeconds: number;
  downtimeSeconds: number;
  status: boolean; // true = active (ON), false = inactive (OFF)
  power: number;
  voltage: number;
  current: number;
  vibrationHz: number;
  vibrationStructural: number;
  vibrationData: number[];
  liveValueData: number[];
  historyData: { time: string, status: number }[];
  stopsCount: number;
  isNgrok?: boolean;
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  
  const [status, setStatusState] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(true);
  const [isInternetConnected, setIsInternetConnected] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isServerSignal, setIsServerSignal] = useState(true);
  const [lastDataTimestamp, setLastDataTimestamp] = useState<number>(Date.now);
  const SERVER_SIGNAL_TIMEOUT = 10000;
  
  // Telemetria detalhada por máquina
  const [telemetryMap, setTelemetryMap] = useState<Record<string | number, MachineTelemetry>>({});
  
  // Estados de exibição da máquina selecionada
  const [vibrationData, setVibrationData] = useState<number[]>(new Array(20).fill(0));
  const [liveValueData, setLiveValueData] = useState<number[]>(new Array(30).fill(0));
  const [historyData, setHistoryData] = useState<{ time: string, status: number }[]>([]);
  const [uptime, setUptime] = useState('00:00:00');
  const [downtime, setDowntime] = useState('00:00:00');
  const [power, setPower] = useState(0);
  const [voltage, setVoltage] = useState(0);
  const [current, setCurrent] = useState(0);
  const [vibrationHz, setVibrationHz] = useState(0);
  const [vibrationStructural, setVibrationStructural] = useState(0);

  const [availableMachines, setAvailableMachines] = useState<{id: number | string, name: string, tag?: string}[]>([]);
  const [selectedMachineId, setSelectedMachineIdState] = useState<number | string | null>(null);
  const selectedMachineIdRef = useRef<number | string | null>(null);

  // Manutenções preventivas
  const [maintenanceTasks, setMaintenanceTasks] = useState<any[]>([]);

  // Rankings e Turnos
  const [productiveRanking, setProductiveRanking] = useState<{ name: string; efficiency: number }[]>([]);
  const [stopsRanking, setStopsRanking] = useState<{ name: string; stops: number }[]>([]);
  const [shiftProductivity, setShiftProductivity] = useState<{ shift: string; productivity: number }[]>([]);

  const setSelectedMachineId = (id: number | string) => {
    setSelectedMachineIdState(id);
    selectedMachineIdRef.current = id;
    
    // Atualiza os estados instantaneamente com os dados da máquina no map
    if (telemetryMap[id]) {
      const tel = telemetryMap[id];
      setStatusState(tel.status);
      setUptime(formatTime(tel.uptimeSeconds));
      setDowntime(formatTime(tel.downtimeSeconds));
      setPower(tel.power);
      setVoltage(tel.voltage);
      setCurrent(tel.current);
      setVibrationHz(tel.vibrationHz);
      setVibrationStructural(tel.vibrationStructural);
      setVibrationData(tel.vibrationData);
      setLiveValueData(tel.liveValueData);
      setHistoryData(tel.historyData);
    }
  };

  const setStatus = (newStatus: boolean) => {
    setStatusState(newStatus);
    const currentId = selectedMachineIdRef.current;
    if (currentId !== null && telemetryMap[currentId]) {
      setTelemetryMap(prev => {
        const item = prev[currentId];
        const stopsDiff = (!newStatus && item.status) ? 1 : 0; // se desligou, incrementa parada
        return {
          ...prev,
          [currentId]: {
            ...item,
            status: newStatus,
            stopsCount: item.stopsCount + stopsDiff,
            current: newStatus ? (item.current > 0.5 ? item.current : 2.5) : 0.1,
            power: newStatus ? (item.power > 50 ? item.power : 550) : 22,
            vibrationHz: newStatus ? 60 : 0,
            vibrationStructural: newStatus ? 1.2 : 0.05,
          }
        };
      });
    }
  };

  const formatTime = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  const initTelemetryForMachine = (_id: number | string): MachineTelemetry => {
    const isAtiva = Math.random() > 0.2; // 80% chance de iniciar ligada
    const uptimeSecs = Math.floor(15000 + Math.random() * 30000);
    const downtimeSecs = Math.floor(2000 + Math.random() * 8000);
    const stops = Math.floor(Math.random() * 6) + 1;

    const now = Date.now();
    const hist = Array.from({ length: 20 }).map((_, idx) => {
      const timeStr = new Date(now - (20 - idx) * 30000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return {
        time: timeStr,
        status: Math.random() > 0.15 ? 1 : 0
      };
    });

    return {
      uptimeSeconds: uptimeSecs,
      downtimeSeconds: downtimeSecs,
      status: isAtiva,
      power: isAtiva ? 450 + Math.random() * 150 : 22,
      voltage: 220,
      current: isAtiva ? 2.0 + Math.random() * 1.0 : 0.1,
      vibrationHz: isAtiva ? 58 + Math.random() * 4 : 0,
      vibrationStructural: isAtiva ? 0.8 + Math.random() * 0.8 : 0.05,
      vibrationData: new Array(20).fill(0).map(() => isAtiva ? 0.8 + Math.random() * 0.8 : 0.05),
      liveValueData: new Array(30).fill(0).map(() => isAtiva ? 58 + Math.random() * 4 : 0),
      historyData: hist,
      stopsCount: stops
    };
  };

  const dailyUptimeData = [
    { day: 'Seg', onHours: 18, offHours: 6 },
    { day: 'Ter', onHours: 22, offHours: 2 },
    { day: 'Qua', onHours: 15, offHours: 9 },
    { day: 'Qui', onHours: 20, offHours: 4 },
    { day: 'Sex', onHours: 24, offHours: 0 },
    { day: 'Sab', onHours: 12, offHours: 12 },
    { day: 'Dom', onHours: 8, offHours: 16 },
  ];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Detecta queda/retorno de internet
  useEffect(() => {
    const handleOnline = () => setIsInternetConnected(true);
    const handleOffline = () => setIsInternetConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkInternet = async () => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 5000);
      try {
        await fetch('https://www.gstatic.com/generate_204', {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal,
        });
        setIsInternetConnected(true);
      } catch {
        setIsInternetConnected(false);
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    checkInternet();
    const intervalId = window.setInterval(checkInternet, 5000);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.clearInterval(intervalId);
    };
  }, []);

  // Timer para verificar se recebeu dados do servidor
  useEffect(() => {
    const checkServerSignal = setInterval(() => {
      const timeSinceLastData = Date.now() - lastDataTimestamp;
      if (timeSinceLastData > SERVER_SIGNAL_TIMEOUT && isServerSignal) {
        setIsServerSignal(false);
      } else if (timeSinceLastData <= SERVER_SIGNAL_TIMEOUT && !isServerSignal) {
        setIsServerSignal(true);
      }
    }, 1000);

    return () => clearInterval(checkServerSignal);
  }, [lastDataTimestamp, isServerSignal]);

  // Loop de Simulação de Telemetria (Move os dados a cada segundo)
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      setTelemetryMap(prevMap => {
        const nextMap = { ...prevMap };
        let mapChanged = false;

        availableMachines.forEach(machine => {
          const id = machine.id;
          if (!nextMap[id]) {
            nextMap[id] = initTelemetryForMachine(id);
            mapChanged = true;
          }

          const currentTel = nextMap[id];
          const isSelected = selectedMachineIdRef.current !== null && selectedMachineIdRef.current.toString() === id.toString();
          
          // Se for a máquina selecionada E temos sinal real de socket/ESP, deixa a lógica do socket agir
          // Caso contrário, simulamos os dados se movimentando
          let updatedTel = { ...currentTel };
          
          if (currentTel.isNgrok) {
            // Se for do ngrok, apenas incrementa tempos e mantém os dados reais do GET
            if (currentTel.status) {
              updatedTel.uptimeSeconds += 1;
            } else {
              updatedTel.downtimeSeconds += 1;
            }
          } else if (currentTel.status) {
            // Incrementa produção
            updatedTel.uptimeSeconds += 1;
            // Flutua valores
            updatedTel.voltage = 217 + Math.random() * 6; // 217 a 223 V
            updatedTel.current = Math.max(0.5, currentTel.current + (Math.random() - 0.5) * 0.2);
            updatedTel.power = updatedTel.voltage * updatedTel.current;
            updatedTel.vibrationHz = Math.max(1, 55 + Math.random() * 10);
            updatedTel.vibrationStructural = Math.max(0.1, currentTel.vibrationStructural + (Math.random() - 0.5) * 0.15);
          } else {
            // Incrementa parado
            updatedTel.downtimeSeconds += 1;
            updatedTel.voltage = Math.random() > 0.95 ? 0 : 220; // Standby
            updatedTel.current = 0.1;
            updatedTel.power = updatedTel.voltage * updatedTel.current;
            updatedTel.vibrationHz = 0;
            updatedTel.vibrationStructural = 0.05 + Math.random() * 0.02;
          }

          // Atualiza vetores de gráfico
          updatedTel.vibrationData = [...currentTel.vibrationData.slice(-19), updatedTel.vibrationStructural];
          updatedTel.liveValueData = [...currentTel.liveValueData.slice(-29), updatedTel.vibrationHz];

          // Adiciona histórico a cada 5 segundos
          if (updatedTel.uptimeSeconds % 5 === 0) {
            const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            updatedTel.historyData = [...currentTel.historyData.slice(-19), { time: timeNow, status: updatedTel.status ? 1 : 0 }];
          }

          nextMap[id] = updatedTel;
          mapChanged = true;

          // Se for a selecionada, reflete nos estados individuais imediatamente para renderizar
          if (isSelected) {
            setStatusState(updatedTel.status);
            setUptime(formatTime(updatedTel.uptimeSeconds));
            setDowntime(formatTime(updatedTel.downtimeSeconds));
            setPower(updatedTel.power);
            setVoltage(updatedTel.voltage);
            setCurrent(updatedTel.current);
            setVibrationHz(updatedTel.vibrationHz);
            setVibrationStructural(updatedTel.vibrationStructural);
            setVibrationData(updatedTel.vibrationData);
            setLiveValueData(updatedTel.liveValueData);
            setHistoryData(updatedTel.historyData);
          }
        });

        // Atualizar rankings e turnos
        if (mapChanged || Object.keys(prevMap).length === 0) {
          const list = Object.entries(nextMap).map(([idKey, tel]) => {
            const mach = availableMachines.find(m => m.id.toString() === idKey.toString());
            const name = mach ? mach.name : `Máquina ${idKey}`;
            const total = tel.uptimeSeconds + tel.downtimeSeconds || 1;
            const efficiency = (tel.uptimeSeconds / total) * 100;
            return {
              id: idKey,
              name,
              efficiency: parseFloat(efficiency.toFixed(1)),
              stops: tel.stopsCount
            };
          });

          // Ranking Mais Produtivas (maior eficiência)
          const sortedProd = [...list].sort((a, b) => b.efficiency - a.efficiency);
          setProductiveRanking(sortedProd.map(x => ({ name: x.name, efficiency: x.efficiency })));

          // Ranking Mais Paradas (mais paradas)
          const sortedStops = [...list].sort((a, b) => b.stops - a.stops);
          setStopsRanking(sortedStops.map(x => ({ name: x.name, stops: x.stops })));

          // Produtividade por Turno da máquina selecionada
          const activeId = selectedMachineIdRef.current;
          if (activeId !== null && nextMap[activeId]) {
            const activeTel = nextMap[activeId];
            // Divide o uptime em 3 turnos simulados
            const totalUp = activeTel.uptimeSeconds || 3600;
            setShiftProductivity([
              { shift: 'Turno 1 (06:00 - 14:00)', productivity: Math.round(totalUp * 0.45) },
              { shift: 'Turno 2 (14:00 - 22:00)', productivity: Math.round(totalUp * 0.35) },
              { shift: 'Turno 3 (22:00 - 06:00)', productivity: Math.round(totalUp * 0.20) }
            ]);
          }
        }

        return nextMap;
      });
    }, 1000);

    return () => clearInterval(simulationInterval);
  }, [availableMachines]);

  // Carregar máquinas e manutenções preventivas do servidor e ngrok
  useEffect(() => {
    const fetchAllData = async () => {
      // 1. Carregar máquinas
      try {
        const localResponse = await fetch('http://localhost:3001/api/machines');
        if (localResponse.ok) {
          const machinesLocal = await localResponse.json();
          if (machinesLocal && machinesLocal.length > 0) {
            setAvailableMachines(machinesLocal.map((m: any) => ({
              id: m.id,
              name: m.name,
              tag: m.tag || m.name
            })));
            
            localStorage.setItem('local_machines', JSON.stringify(machinesLocal));

            if (selectedMachineIdRef.current === null) {
              setSelectedMachineIdState(machinesLocal[0].id);
              selectedMachineIdRef.current = machinesLocal[0].id;
            }
          }
        }
      } catch (e) {
        console.warn("Backend local offline para carregar máquinas. Carregando dados locais...");
        const stored = localStorage.getItem('local_machines');
        if (stored) {
           const parsed = JSON.parse(stored);
          setAvailableMachines(parsed.map((m: any) => ({
            id: m.id,
            name: m.name,
            tag: m.tag || m.name
          })));
          if (selectedMachineIdRef.current === null && parsed.length > 0) {
            setSelectedMachineIdState(parsed[0].id);
            selectedMachineIdRef.current = parsed[0].id;
          }
        } else {
          // Mock padrão
          const defaultMachines = [{ id: '1', name: 'Máquina de Corte 01', tag: 'MC-01' }];
          setAvailableMachines(defaultMachines);
          setSelectedMachineIdState('1');
          selectedMachineIdRef.current = '1';
        }
      }

      // Tenta puxar do ngrok também se disponível e junta os dados
      try {
        const ngrokResponse = await fetch('https://caucasian-septum-syndrome.ngrok-free.dev/status-maquinas', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true' 
          }
        });
        if (ngrokResponse.ok) {
          const ngrokData = await ngrokResponse.json();
          if (ngrokData && ngrokData.length > 0) {
            setLastDataTimestamp(Date.now());
            setIsServerSignal(true);
            // 1. Atualizar a lista de máquinas com os nomes reais vindos do ngrok
            setAvailableMachines(prev => {
              const newList = [...prev];
              ngrokData.forEach((m: any) => {
                const id = m.maquina_id;
                const name = m.nome_maquina 
                  ? `${m.tag_maquina ? m.tag_maquina + ' - ' : ''}${m.nome_maquina}`
                  : (m.tag_maquina || `Máquina ${id}`);
                const tag = m.tag_maquina || `M${id}`;
                
                const existingIndex = newList.findIndex(x => x.id.toString() === id.toString());
                if (existingIndex === -1) {
                  newList.push({ id, name, tag });
                } else {
                  newList[existingIndex] = { id, name, tag };
                }
              });
              return newList;
            });

            // 2. Atualizar a telemetria com os dados do ngrok
            setTelemetryMap(prev => {
              const nextMap = { ...prev };

              ngrokData.forEach((m: any) => {
                const id = m.maquina_id;
                const isAtiva = m.status_atual?.toLowerCase() === 'ativa';

                if (!nextMap[id]) {
                  const initTelemetry = initTelemetryForMachine(id);
                  nextMap[id] = {
                    ...initTelemetry,
                    status: isAtiva,
                    power: m.potencia_watt ?? initTelemetry.power,
                    voltage: m.tensao_volt ?? initTelemetry.voltage,
                    current: m.corrente_ampere ?? initTelemetry.current,
                    vibrationHz: m.frequencia_hz ?? initTelemetry.vibrationHz,
                    vibrationStructural: m.vibracao_rms ?? initTelemetry.vibrationStructural,
                    isNgrok: true,
                  };
                } else {
                  const currentTel = nextMap[id];
                  const nextVibrationData = [...currentTel.vibrationData.slice(-19), m.vibracao_rms ?? 0];
                  const nextLiveValueData = [...currentTel.liveValueData.slice(-29), m.frequencia_hz ?? 0];
                  
                  let nextHistoryData = currentTel.historyData;
                  const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  if (currentTel.historyData.length === 0 || currentTel.status !== isAtiva) {
                    nextHistoryData = [...currentTel.historyData.slice(-19), { time: timeNow, status: isAtiva ? 1 : 0 }];
                  }

                  nextMap[id] = {
                    ...currentTel,
                    status: isAtiva,
                    power: m.potencia_watt ?? currentTel.power,
                    voltage: m.tensao_volt ?? currentTel.voltage,
                    current: m.corrente_ampere ?? currentTel.current,
                    vibrationHz: m.frequencia_hz ?? currentTel.vibrationHz,
                    vibrationStructural: m.vibracao_rms ?? currentTel.vibrationStructural,
                    vibrationData: nextVibrationData,
                    liveValueData: nextLiveValueData,
                    historyData: nextHistoryData,
                    isNgrok: true,
                  };
                }
              });

              // Sincronizar o estado ativo com a máquina selecionada atual
              const activeId = selectedMachineIdRef.current;
              if (activeId !== null && nextMap[activeId]) {
                const tel = nextMap[activeId];
                setStatusState(tel.status);
                setUptime(formatTime(tel.uptimeSeconds));
                setDowntime(formatTime(tel.downtimeSeconds));
                setPower(tel.power);
                setVoltage(tel.voltage);
                setCurrent(tel.current);
                setVibrationHz(tel.vibrationHz);
                setVibrationStructural(tel.vibrationStructural);
                setVibrationData(tel.vibrationData);
                setLiveValueData(tel.liveValueData);
                setHistoryData(tel.historyData);
              }

              return nextMap;
            });

            // Se nenhuma máquina estiver selecionada ainda, seleciona a primeira
            if (selectedMachineIdRef.current === null) {
              const firstId = ngrokData[0].maquina_id;
              setSelectedMachineIdState(firstId);
              selectedMachineIdRef.current = firstId;
            }
          }
        }
      } catch (e) {
        console.warn("ngrok offline ou indisponível.");
      }

      // 2. Carregar manutenções preventivas
      try {
        const maintenanceResponse = await fetch('http://localhost:3001/api/maintenance');
        if (maintenanceResponse.ok) {
          const maintenanceData = await maintenanceResponse.json();
          setMaintenanceTasks(maintenanceData);
          localStorage.setItem('local_maintenance', JSON.stringify(maintenanceData));
        }
      } catch (e) {
        console.warn("Backend local offline para carregar manutenções. Carregando do localStorage...");
        const storedMaint = localStorage.getItem('local_maintenance');
        if (storedMaint) {
          setMaintenanceTasks(JSON.parse(storedMaint));
        } else {
          // Mock inicial de manutenções
          const defaultMaint = [
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
          setMaintenanceTasks(defaultMaint);
          localStorage.setItem('local_maintenance', JSON.stringify(defaultMaint));
        }
      }
    };

    fetchAllData();
    const syncInterval = setInterval(fetchAllData, 8000); // Sincroniza a cada 8 segundos

    socket.on('connect', () => {
      setIsSocketConnected(true);
      setIsServerSignal(true);
      setLastDataTimestamp(Date.now());
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    socket.on('dashboard_update', (data) => {
      // Evento do socket para dados reais do ESP32
      setLastDataTimestamp(Date.now());
      setIsServerSignal(true);
      
      const currentId = selectedMachineIdRef.current;
      if (currentId !== null) {
        setTelemetryMap(prev => {
          if (!prev[currentId]) return prev;
          const currentTel = prev[currentId];
          const isAtiva = data.status !== undefined ? data.status : currentTel.status;
          
          return {
            ...prev,
            [currentId]: {
              ...currentTel,
              status: isAtiva,
              vibrationStructural: data.vibration !== undefined ? data.vibration : currentTel.vibrationStructural,
              vibrationHz: isAtiva ? (data.frequency !== undefined ? data.frequency : 60) : 0,
              voltage: data.voltage !== undefined ? data.voltage : currentTel.voltage,
              current: data.current !== undefined ? data.current : currentTel.current,
              power: data.power !== undefined ? data.power : currentTel.power,
            }
          };
        });
      }
    });

    return () => {
      clearInterval(syncInterval);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('dashboard_update');
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans transition-colors duration-700">
        {/* Notificações globais de conexão */}
        <ConnectionStatus 
          isConnected={isInternetConnected} 
          isServerSignal={isServerSignal}
        />

        <Routes>
          {/* Rota Raiz: Dashboard Pública */}
          <Route 
            path="/" 
            element={
              <DashboardView 
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                status={status}
                setStatus={setStatus}
                isSocketConnected={isSocketConnected}
                isServerSignal={isServerSignal}
                uptime={uptime}
                downtime={downtime}
                power={power}
                voltage={voltage}
                current={current}
                vibrationHz={vibrationHz}
                vibrationStructural={vibrationStructural}
                vibrationData={vibrationData}
                liveValueData={liveValueData}
                historyData={historyData}
                dailyUptimeData={dailyUptimeData}
                availableMachines={availableMachines}
                selectedMachineId={selectedMachineId}
                setSelectedMachineId={setSelectedMachineId}
                productiveRanking={productiveRanking}
                stopsRanking={stopsRanking}
                shiftProductivity={shiftProductivity}
                maintenanceTasks={maintenanceTasks}
              />
            } 
          />

          {/* Rota de Login do Admin */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Área Protegida do Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/machines" replace />} />
            <Route path="machines" element={<MachinesPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
          </Route>
          
          {/* Rota Curinga */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
