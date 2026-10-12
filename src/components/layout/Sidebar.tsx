'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Code2, StickyNote, Briefcase, FileText, BarChart3, RefreshCw, AlertTriangle, LogOut, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '@/hooks/useAuth';
import { useState } from 'react';

const iconMap = { LayoutDashboard, Code2, StickyNote, Briefcase, FileText, BarChart3, RefreshCw, AlertTriangle };

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/problems', label: 'Problems', icon: 'Code2' },
  { path: '/notes', label: 'Notes', icon: 'StickyNote' },
  { path: '/interviews', label: 'Interviews', icon: 'Briefcase' },
  { path: '/resumes', label: 'Resumes', icon: 'FileText' },
  { path: '/analytics', label: 'Analytics', icon: 'BarChart3' },

  { path: '/revision', label: 'Revision', icon: 'RefreshCw' },
  { path: '/mistakes', label: 'Mistakes', icon: 'AlertTriangle' },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />
        )}
      </AnimatePresence>

      <aside className={`fixed left-0 top-0 z-50 flex h-full flex-col border-r border-[#1F2430] bg-[#12161F] transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'w-[68px]' : 'w-60'}`}>
        <div className={`flex h-14 items-center border-b border-[#1F2430] ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-white text-black font-bold text-xs flex-shrink-0">IP</div>
            {!collapsed && <span className="text-sm font-semibold text-zinc-100 tracking-tight">Interview Prep</span>}
          </div>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="hidden lg:flex h-6 w-6 items-center justify-center text-[#7A8290] hover:text-[#E6E8EB] cursor-pointer">
              <ChevronLeft size={14} />
            </button>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto py-3 ${collapsed ? 'px-2' : 'px-2.5'}`}>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap];
              const isActive = pathname === item.path;
              return (
                <Link key={item.path} href={item.path} onClick={onClose}
                  className={`relative flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors border-l-2 ${isActive ? 'text-[#E6E8EB] border-[#4FC1C9] bg-white/[0.02]' : 'text-[#7A8290] border-transparent hover:text-[#E6E8EB] hover:bg-white/[0.01]'} ${collapsed ? 'justify-center pl-1' : ''}`}>
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {collapsed && (
          <div className="px-2 pb-2">
            <button onClick={() => setCollapsed(false)} className="flex w-full items-center justify-center rounded-lg py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 transition-colors cursor-pointer">
              <ChevronLeft size={14} className="rotate-180" />
            </button>
          </div>
        )}

        <div className={`border-t border-[#1F2430] ${collapsed ? 'p-2' : 'p-3'}`}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2.5 p-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#1F2430] text-xs font-mono text-[#E6E8EB] flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-[#E6E8EB]">{user?.name || 'User'}</p>
                  <p className="truncate text-[11px] font-mono text-[#7A8290]">{user?.email}</p>
                </div>
              </div>
              <button onClick={() => logout()} className="mt-1.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer">
                <LogOut size={16} /><span>Log out</span>
              </button>
            </>
          ) : (
            <button onClick={() => logout()} title="Log out" className="flex w-full items-center justify-center rounded-lg py-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
