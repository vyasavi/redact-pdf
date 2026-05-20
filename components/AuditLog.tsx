import { useAppStore } from '@/store/useAppStore';
import { useEffect, useRef } from 'react';

export const AuditLog = () => {
  const { logs } = useAppStore(); // Fixed: Destructure 'logs' not 'auditLog'
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden h-[400px] flex flex-col shadow-sm">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
        <span className="text-slate-800 font-semibold text-sm">Activity Log</span>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Status</span>
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
        </div>
      </div>
      <div ref={scrollRef} className="p-5 space-y-3 overflow-y-auto custom-scrollbar flex-1">
        {logs.length === 0 && <p className="text-slate-400 text-sm italic text-center mt-10">Waiting for activity...</p>}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="text-slate-300 font-mono text-xs mt-0.5">{i.toString().padStart(2, '0')}</span>
            <div className="text-slate-600 leading-relaxed">{log}</div>
          </div>
        ))}
      </div>
    </div>
  );
};