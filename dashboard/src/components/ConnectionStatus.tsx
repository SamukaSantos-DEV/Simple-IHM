import { WifiOff, AlertCircle, Wifi } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isServerSignal: boolean;
}

export default function ConnectionStatus({ isConnected, isServerSignal }: ConnectionStatusProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const prevIsConnected = useRef(isConnected);

  const hasServerSignalAlert = !isServerSignal && isConnected && !showSuccess;

  useEffect(() => {
    if (!prevIsConnected.current && isConnected) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    prevIsConnected.current = isConnected;
  }, [isConnected]);

  return (
    <>
      {/* TARJA VERDE */}
      <div
        className={`fixed top-6 left-1/2 z-50 flex w-max max-w-[90vw] justify-center items-center rounded-2xl bg-linear-to-r from-green-600 to-green-700 text-white shadow-2xl transition-all duration-500 ease-out
          ${showSuccess ? 'opacity-100 translate-y-0 -translate-x-1/2' : 'opacity-0 -translate-y-8 -translate-x-1/2 pointer-events-none'}`}
      >
        <div className="flex items-center justify-center gap-4 px-6 py-3">
          <Wifi size={24} />
          <h2 className="text-lg font-bold tracking-tight">Conexão restabelecida</h2>
        </div>
      </div>

      {/* TARJA VERMELHA */}
      <div
        className={`fixed top-6 left-1/2 z-50 flex w-[90%] max-w-2xl justify-center items-center rounded-2xl bg-linear-to-r from-red-800 to-red-900 text-white shadow-2xl transition-all duration-500 ease-out
          ${!isConnected && !showSuccess ? 'opacity-100 translate-y-0 -translate-x-1/2' : 'opacity-0 -translate-y-8 -translate-x-1/2 pointer-events-none'}`}
      >
        <div className="flex items-center justify-center gap-4 px-6 py-4">
          <WifiOff size={32} className="animate-pulse shrink-0" />
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">PERDA DE CONEXÃO COM A INTERNET</h2>
            <p className="text-sm opacity-90 mt-1">Sua máquina perdeu a conexão. Por favor, verifique sua conexão WiFi.</p>
          </div>
        </div>
      </div>

      {/* ESPAÇO ANIMADO DA TARJA CINZA */}
      <div
        className={`transition-all duration-500 ease-out overflow-hidden ${
          hasServerSignalAlert ? 'h-28 mt-6' : 'h-0 mt-0'
        }`}
      >
        <div
          className={`mx-auto flex w-[90%] max-w-2xl justify-center items-center rounded-2xl bg-linear-to-r from-gray-800 to-gray-950 text-white shadow-2xl transition-all duration-500 ease-out ${
            hasServerSignalAlert ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-4 px-6 py-4">
            <AlertCircle size={32} className="shrink-0 text-yellow-500" />
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                PERDA DE SINAL DO SERVIDOR
              </h2>
              <p className="text-sm opacity-90 mt-1">
                Não foi possível alcançar o servidor. Tentando reconectar...
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}