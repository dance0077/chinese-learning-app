import React, { useState, useEffect } from 'react';
import { X, Terminal, AlertCircle } from 'lucide-react';

interface LogItem {
  type: 'log' | 'error' | 'warn';
  message: string;
  timestamp: string;
}

const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type: 'log' | 'error' | 'warn', args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      const newLog = {
        type,
        message,
        timestamp: new Date().toLocaleTimeString()
      };

      setLogs(prev => [...prev.slice(-49), newLog]);
      if (type === 'error') {
        // Use setTimeout to avoid setState during render
        setTimeout(() => setHasError(true), 0);
      }
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args);
    };

    // Capture unhandled errors
    window.onerror = (message, source, lineno, colno, error) => {
       addLog('error', [`Global Error: ${message} at ${source}:${lineno}`]);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  if (!isOpen && !hasError) return null;

  return (
    <>
      {!isOpen && hasError && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 left-4 z-[100] bg-red-500 text-white p-2 rounded-full shadow-lg animate-pulse"
        >
          <AlertCircle className="w-6 h-6" />
        </button>
      )}
      
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 h-1/2 bg-black/90 text-green-400 font-mono text-xs z-[100] flex flex-col border-t-2 border-green-500 shadow-2xl">
          <div className="flex justify-between items-center p-2 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              <span className="font-bold">Debug Console</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setLogs([])} className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700">Clear</button>
              <button onClick={() => setIsOpen(false)} className="px-2 py-1 hover:bg-gray-700 rounded"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {logs.map((log, i) => (
              <div key={i} className={`break-words ${log.type === 'error' ? 'text-red-400 bg-red-900/20' : log.type === 'warn' ? 'text-yellow-400' : ''}`}>
                <span className="opacity-50">[{log.timestamp}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default DebugConsole;