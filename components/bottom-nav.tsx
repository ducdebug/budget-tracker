'use client';

import { useRef, useEffect, useState } from 'react';
import { Home, BarChart3, FolderOpen, Book, Settings, Plus } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onFabClick: () => void;
}

const navItems = [
  { id: 'home', icon: Home, label: 'Trang chủ' },
  { id: 'stats', icon: BarChart3, label: 'Thống kê' },
  { id: 'categories', icon: FolderOpen, label: 'Danh mục' },
  { id: 'debt', icon: Book, label: 'Sổ Nợ' },
  { id: 'settings', icon: Settings, label: 'Cài đặt' },
];

export function BottomNav({ activeTab, onTabChange, onFabClick }: BottomNavProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!navRef.current) return;
    const activeIndex = navItems.findIndex(item => item.id === activeTab);
    const buttons = navRef.current.querySelectorAll<HTMLButtonElement>('[data-nav-item]');
    if (buttons[activeIndex]) {
      const btn = buttons[activeIndex];
      const container = navRef.current;
      const btnRect = btn.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [activeTab]);

  return (
    <>
      <button
        onClick={onFabClick}
        className="fixed z-40 w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-xl transition-all hover:shadow-2xl hover:scale-110 active:scale-90"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 70px)',
          right: '20px',
        }}
        aria-label="Thêm giao dịch"
      >
        <Plus size={28} className="text-accent-foreground" />
      </button>

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-30">
        <div
          ref={navRef}
          className="flex items-center justify-around px-2 py-1.5 max-w-md mx-auto relative"
        >
          <div
            className="absolute top-1.5 h-[calc(100%-12px)] rounded-2xl bg-primary/10 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
            }}
          />

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                data-nav-item
                onClick={() => onTabChange(item.id)}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 min-w-[52px] ${isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:bg-card active:bg-card'
                  }`}
              >
                <item.icon
                  size={20}
                  className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'
                    }`}
                />
                <span
                  className={`text-[10px] font-medium leading-tight transition-all duration-200 ${isActive ? 'font-semibold' : ''
                    }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="safe-area-bottom" />
      </div>
    </>
  );
}
