'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Home, Clock, BookOpen, Settings, Plus } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onFabClick: () => void;
}

const navItems = [
  { id: 'home', icon: Home, label: 'Trang chủ' },
  { id: 'history', icon: Clock, label: 'Lịch sử' },
  { id: 'debt', icon: BookOpen, label: 'Sổ Nợ' },
  { id: 'settings', icon: Settings, label: 'Cài đặt' },
];

export function BottomNav({ activeTab, onTabChange, onFabClick }: BottomNavProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState({ left: 0, width: 0 });

  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const translateRef = useRef(translate);
  
  useEffect(() => {
    translateRef.current = translate;
  }, [translate]);

  const dragRef = useRef({
    isDragging: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    startTransX: 0,
    startTransY: 0
  });

  useEffect(() => {
    const val = localStorage.getItem('fabOffset');
    if (val) {
      try { setTranslate(JSON.parse(val)); } catch(e) {}
    }
  }, []);

  const onTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const y = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    dragRef.current.hasMoved = false;
    dragRef.current.startX = x;
    dragRef.current.startY = y;
    dragRef.current.startTransX = translateRef.current.x;
    dragRef.current.startTransY = translateRef.current.y;
    dragRef.current.isDragging = false;
    
    setIsDragging(true);
  };

  const onTouchMove = useCallback((e: TouchEvent | MouseEvent) => {
    const x = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const y = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

    if (!dragRef.current.isDragging) {
      if (Math.abs(x - dragRef.current.startX) > 5 || Math.abs(y - dragRef.current.startY) > 5) {
        dragRef.current.isDragging = true;
      } else {
        return;
      }
    }
    
    e.preventDefault();

    let newX = dragRef.current.startTransX + (x - dragRef.current.startX);
    let newY = dragRef.current.startTransY + (y - dragRef.current.startY);

    const maxX = 10;
    const minX = - (typeof window !== 'undefined' ? window.innerWidth : 400) + 70;
    const maxY = 40; 
    const minY = - (typeof window !== 'undefined' ? window.innerHeight : 800) + 120;

    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));

    setTranslate({ x: newX, y: newY });
    dragRef.current.hasMoved = true;
  }, []);

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);

    if (dragRef.current.isDragging || dragRef.current.hasMoved) {
      dragRef.current.isDragging = false;
      localStorage.setItem('fabOffset', JSON.stringify(translateRef.current));
      
      setTimeout(() => {
        dragRef.current.hasMoved = false;
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('mousemove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('mouseup', onTouchEnd);
      return () => {
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('mousemove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        window.removeEventListener('mouseup', onTouchEnd);
      };
    }
  }, [isDragging, onTouchMove, onTouchEnd]);

  const onFabClickHandler = (e: React.MouseEvent) => {
    if (dragRef.current.hasMoved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onFabClick();
  };

  useEffect(() => {
    if (!navRef.current) return;
    const idx = navItems.findIndex(i => i.id === activeTab);
    const btns = navRef.current.querySelectorAll<HTMLButtonElement>('[data-nav]');
    if (btns[idx]) {
      const b = btns[idx].getBoundingClientRect();
      const c = navRef.current.getBoundingClientRect();
      setInd({ left: b.left - c.left, width: b.width });
    }
  }, [activeTab]);

  return (
    <>
      {(activeTab === 'home' || activeTab === 'debt') && (
        <button
          onClick={onFabClickHandler}
          onTouchStart={onTouchStart}
          onMouseDown={onTouchStart}
          className={`fixed z-40 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg ${isDragging ? 'scale-110 opacity-95 cursor-grabbing' : 'active:scale-90 cursor-pointer transition-transform duration-200'}`}
          style={{ 
            bottom: 'calc(env(safe-area-inset-bottom,0px) + 72px)', 
            right: '20px',
            transform: `translate(${translate.x}px, ${translate.y}px)`,
            touchAction: 'none'
          }}
        >
          <Plus size={26} className="text-white" strokeWidth={2.5} />
        </button>
      )}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-30">
        <div ref={navRef} className="flex items-center justify-around px-2 py-1 max-w-md mx-auto relative">
          <div
            className="absolute top-1 h-[calc(100%-8px)] rounded-xl bg-primary/10 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ left: `${ind.left}px`, width: `${ind.width}px` }}
          />
          {navItems.map(item => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                data-nav
                onClick={() => onTabChange(item.id)}
                className={`relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <item.icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] leading-tight ${active ? 'font-semibold' : 'font-normal'}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="safe-area-bottom" />
      </div>
    </>
  );
}
