'use client';
import { useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

export const RedactionCanvas = ({ pageNum }: { pageNum: number }) => {
  const store = useAppStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync Logic: Convert clicks to percentages so they scale with the window
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((Math.min(startPos.x, e.clientX - rect.left)) / rect.width) * 100;
    const y = ((Math.min(startPos.y, e.clientY - rect.top)) / rect.height) * 100;
    const w = (Math.abs((e.clientX - rect.left) - startPos.x) / rect.width) * 100;
    const h = (Math.abs((e.clientY - rect.top) - startPos.y) / rect.height) * 100;

    store.addBox({ x, y, w, h, page: pageNum });
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={(e) => {
        if (!store.isDrawMode) return;
        setIsDrawing(true);
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          setStartPos({ x, y });
          setCurrentPos({ x, y });
        }
      }}
      onMouseMove={(e) => {
        if (!isDrawing) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setCurrentPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          });
        }
      }}
      onMouseUp={handleMouseUp}
      className={`absolute inset-0 z-20 ${store.isDrawMode ? 'cursor-crosshair' : ''}`}
    >
      {isDrawing && containerRef.current && (
        <div 
          className="absolute border-2 border-blue-400 bg-blue-400/20 rounded-sm pointer-events-none"
          style={{
            left: `${(Math.min(startPos.x, currentPos.x) / containerRef.current.getBoundingClientRect().width) * 100}%`,
            top: `${(Math.min(startPos.y, currentPos.y) / containerRef.current.getBoundingClientRect().height) * 100}%`,
            width: `${(Math.abs(currentPos.x - startPos.x) / containerRef.current.getBoundingClientRect().width) * 100}%`,
            height: `${(Math.abs(currentPos.y - startPos.y) / containerRef.current.getBoundingClientRect().height) * 100}%`
          }}
        />
      )}
      {store.draftBoxes
        .filter(b => b.page === pageNum)
        .map(box => (
          <div 
            key={box.id}
            onClick={(e) => { e.stopPropagation(); store.toggleBox(box.id); }}
            style={{ 
              left: `${box.x}%`, 
              top: `${box.y}%`, 
              width: `${box.w}%`, 
              height: `${box.h}%`,
              opacity: box.isActive !== false ? 1 : 0.25
            }}
            className={`absolute rounded-sm shadow-sm group pointer-events-auto transition-all cursor-pointer ${
              box.isActive !== false 
                ? 'border-2 border-rose-400 bg-rose-500/20 hover:border-rose-500 hover:bg-rose-500/30' 
                : 'border-2 border-dashed border-slate-300 bg-slate-200/20'
            }`}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); store.removeBox(box.id); }}
              className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-white border border-rose-200 text-rose-500 text-[10px] rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-rose-50 flex items-center justify-center font-bold"
            >✕</button>
          </div>
        ))}
    </div>
  );
};