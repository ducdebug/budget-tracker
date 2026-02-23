'use client';

import { Home, BarChart3, FolderOpen, Book, Settings, Plus } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onFabClick: () => void;
}

export function BottomNav({ activeTab, onTabChange, onFabClick }: BottomNavProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Trang chủ' },
    { id: 'stats', icon: BarChart3, label: 'Thống kê' },
    { id: 'categories', icon: FolderOpen, label: 'Danh mục' },
    { id: 'debt', icon: Book, label: 'Sổ Nợ' },
    { id: 'settings', icon: Settings, label: 'Cài đặt' },
  ];

  return (
    <>
      <button
        onClick={onFabClick}
        className="fixed z-40 w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 70px)',
          right: '20px',
        }}
        aria-label="Thêm giao dịch"
      >
        <Plus size={28} className="text-accent-foreground" />
      </button>

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-30">
        <div className="flex items-center justify-around px-2 py-1.5 max-w-md mx-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all min-w-[52px] ${activeTab === item.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-card active:bg-card'
                }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="safe-area-bottom" />
      </div>
    </>
  );
}
