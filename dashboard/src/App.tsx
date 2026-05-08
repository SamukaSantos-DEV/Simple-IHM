import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import VibrationChart from './components/VibrationChart';
import HistoryChart from './components/HistoryChart';
import UptimeDailyChart from './components/UptimeDailyChart';
import LiveMetricChart from './components/LiveMetricChart';
import logo from './assets/hero.png';
import { Power, Clock, Zap, Sun, Moon, Settings, Calendar, Filter, ArrowUpRight, ArrowDownRight, Activity as ActivityIcon } from 'lucide-react';
import Grainient from './components/Grainient';

const socket = io('http://localhost:3001');
const BRAND_GRADIENT = 'linear-gradient(135deg, #812FFF 0%, #5CE1E6 100%)';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  const [status, setStatus] = useState(true);
  const [vibrationData, setVibrationData] = useState<number[]>(new Array(20).fill(0));
  const [liveValueData, setLiveValueData] = useState<number[]>(new Array(30).fill(40));
  const [historyData, setHistoryData] = useState<{ time: string, status: number }[]>([]);
  const [uptime, setUptime] = useState('00:42:15');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  // Mock data for daily comparison
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

  useEffect(() => {

    // Update favicon/tab icon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = '/favicon.png';
    }

    const mockInterval = setInterval(() => {
      const mockVib = 0.4 + (Math.random() * 0.3);
      const mockLive = 40 + (Math.sin(Date.now() / 2000) * 10) + (Math.random() * 5);
      setVibrationData(prev => [...prev.slice(-19), mockVib]);
      setLiveValueData(prev => [...prev.slice(-29), mockLive]);
      const now = new Date().toLocaleTimeString();
      setHistoryData(prev => {
        if (prev.length === 0) return [{ time: now, status: 1 }];
        return prev;
      });
    }, 1000);

    socket.on('dashboard_update', (data) => {
      if (data.status !== undefined) setStatus(data.status);
      if (data.vibration !== undefined) setVibrationData(prev => [...prev.slice(-20), data.vibration]);
      if (data.uptime !== undefined) setUptime(data.uptime);
    });

    return () => {
      clearInterval(mockInterval);
      socket.off('dashboard_update');
    };
  }, [darkMode]);

  
  return (
    <div className="min-h-screen p-6 md:p-12 font-sans transition-colors duration-700">


      <div className="fixed inset-0 -z-10 overflow-hidden">
        <Grainient
          color1={darkMode ? "#350046" : "#dbc8ff"}
          color2={darkMode ? "#00222d" : "#cbfcff"}
          color3={darkMode ? "#000000" : "#ffffff"}
          timeSpeed={0.15}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={4}
          warpSpeed={4}
          warpAmplitude={40}
          blendAngle={0}
          blendSoftness={0.1}
          rotationAmount={300}
          noiseScale={1.5}
          grainAmount={0.05}
          grainScale={1.5}
          grainAnimated={true}
          contrast={darkMode ? 1.3 : 1.05}
          gamma={1}
          saturation={darkMode ? 1.1 : 0.7}
          centerX={0}
          centerY={0}
          zoom={1}
        />
      </div>
      <div className="scroll-reveal-mask" />
      <header className="flex justify-between items-center mb-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <img
              src={logo}
              alt="Logo"
              className={`w-14 h-14 object-contain transition-all duration-700 ${darkMode ? 'brightness-125 contrast-125 drop-shadow-[0_0_15px_rgba(129,47,255,0.6)]' : 'brightness-100'}`}
            />
            <div className="absolute inset-0 bg-ios-blue/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tighter leading-none ">
              Simple <span className="bg-clip-text text-transparent italic pr-1" style={{ backgroundImage: BRAND_GRADIENT }}>IHM</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 mt-1 font-bold">Industrial Control System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="theme-btn"
          >
            {darkMode ? <Sun size={24} className="text-yellow-400" /> : <Moon size={24} className="text-slate-600" />}
            <span className="theme-btn-text">{darkMode ? 'Dark' : 'Light'}</span>
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-12 gap-10 max-w-7xl mx-auto">
        {/* Left Column: Big Toggle & Core Status */}
        <div className="md:col-span-3 flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs font-black uppercase tracking-widest opacity-30">Power Control</p>
            <div
              onClick={() => setStatus(!status)}
              className={`power-toggle ${status ? 'active' : 'inactive'}`}
            >
              <span className="toggle-label label-off">OFF</span>
              <div className="power-switch">
                <Power size={24} className="text-white" />
              </div>
              <span className="toggle-label label-on">ON</span>
            </div>
            <div className="text-center mt-2">
              <p className={`text-sm font-black tracking-widest transition-colors ${status ? 'text-ios-green' : 'text-ios-red'}`}>
                SYSTEM {status ? 'ON' : 'OFF'}
              </p>
            </div>
          </div>

          <div className="w-full flex flex-col gap-4 mt-8">
            <div className="seamless-panel rounded-ios p-6">
              <div className="flex items-center gap-3 opacity-60 mb-2">
                <Clock size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Session Time</span>
              </div>
              <h2 className="text-4xl font-mono font-bold tracking-tighter">{uptime}</h2>
            </div>

            <div className="seamless-panel rounded-ios p-6">
              <div className="flex items-center gap-3 opacity-60 mb-2">
                <Filter size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Date Filter</span>
              </div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 ring-ios-blue/30 transition-all"
              />
            </div>

            <div className="seamless-panel rounded-ios p-6 w-full overflow-hidden">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-40 mb-4">Efficiency Log</h3>
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="opacity-30 border-b border-black/5 dark:border-white/5">
                    <th className="pb-2 font-bold">Day</th>
                    <th className="pb-2 font-bold text-right">ON/OFF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {dailyUptimeData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="group hover:bg-black/5 transition-colors">
                      <td className="py-2 font-bold">{row.day}</td>
                      <td className="py-2 font-mono text-right">
                        <span className="text-ios-green">{row.onHours}h</span>
                        <span className="mx-1 opacity-10">|</span>
                        <span className="text-ios-red">{row.offHours}h</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Live Chart */}
          <div className="md:col-span-2 seamless-panel rounded-ios p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold flex items-center gap-3">
                Live Process Frequency
              </h3>
            </div>
            <LiveMetricChart data={liveValueData} title="Output Hz" darkMode={darkMode} />
          </div>

          <div className="seamless-panel rounded-ios p-8">
            <h3 className="text-lg font-bold mb-6">Uptime Distribution</h3>
            <UptimeDailyChart data={dailyUptimeData} darkMode={darkMode} />
          </div>

          {/* Secondary Charts moved here to replace table */}
          <div className="seamless-panel rounded-ios p-8">
            <h3 className="text-lg font-bold mb-6">Structural Vibration</h3>
            <VibrationChart data={vibrationData} darkMode={darkMode} />
          </div>

          <div className="md:col-span-2 seamless-panel rounded-ios p-8 mb-12">
            <h3 className="text-lg font-bold mb-6">Device Status History</h3>
            <HistoryChart data={historyData} darkMode={darkMode} />
          </div>
        </div>
      </main>
      <footer className="mt-12 text-center text-xs opacity-30">Connected via Bridge 2026</footer>
    </div>
  );
}
