'use client';

import { useState } from 'react';
import { LogOut, Loader2, Heart } from 'lucide-react';
import { signOut } from '@/lib/auth-actions';
import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push('/auth');
    router.refresh();
  };

  return (
    <div className="flex items-center justify-between px-6 pt-2 pb-4 bg-background safe-area-top">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Chi và Đức
        </h1>
        <Heart size={22} className="text-red-500 fill-red-500 animate-pulse" />
      </div>
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="p-2.5 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all active:scale-95 disabled:opacity-50"
        title="Đăng xuất"
      >
        {signingOut ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <LogOut size={20} />
        )}
      </button>
    </div>
  );
}
