'use client';

import { useRef, useEffect, useState } from 'react';
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
          onClick={onFabClick}
          className="fixed z-40 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          style={{ bottom: 'calc(env(safe-area-inset-bottom,0px) + 72px)', right: '20px' }}
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
