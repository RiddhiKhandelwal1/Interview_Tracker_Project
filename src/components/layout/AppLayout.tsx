'use client';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0E14] text-[#E6E8EB]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#1F2430] bg-[#0B0E14] px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 text-[#7A8290] hover:text-[#E6E8EB] cursor-pointer">
            <Menu size={18} />
          </button>
          {title && <h1 className="text-sm font-mono text-[#7A8290]">{'// '}{title.toLowerCase()}</h1>}
        </header>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
