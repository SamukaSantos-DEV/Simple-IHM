import { WifiOff, AlertCircle } from 'lucide-react';

interface StatusIndicatorProps {
  isConnected: boolean;
  isServerSignal: boolean;
}

export default function StatusIndicator({ isConnected, isServerSignal }: StatusIndicatorProps) {
  if (isConnected && isServerSignal) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20">
      {!isConnected ? (
        <>
          <WifiOff size={14} className="text-red-500 animate-pulse" />
          <span className="text-xs font-bold text-red-600 dark:text-red-400">SEM INTERNET</span>
        </>
      ) : !isServerSignal ? (
        <>
          <AlertCircle size={14} className="text-gray-600 animate-pulse" />
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">DESATUALIZADO</span>
        </>
      ) : null}
    </div>
  );
}
