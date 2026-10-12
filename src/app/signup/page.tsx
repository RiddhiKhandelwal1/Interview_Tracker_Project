'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuth from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup, isLoading, error, isAuthenticated, clearError } = useAuth();
  const router = useRouter();

  useEffect(() => { if (isAuthenticated) router.replace('/'); }, [isAuthenticated, router]);
  useEffect(() => { return () => { clearError(); }; }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signup({ name, email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] bg-violet-600/5 rounded-sm blur-[120px]" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-indigo-600 text-[#E6E8EB] font-bold text-lg">IP</div>
          <h1 className="text-xl font-semibold text-[#E6E8EB]">Create an account</h1>
          <p className="mt-1 text-sm text-[#7A8290]">Start tracking your interview prep</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-sm border border-red-500/20 bg-red-500/5 p-3 text-xs text-[#E6E8EB]">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-[#7A8290] mb-1.5">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#7A8290] mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#7A8290] mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
              className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={isLoading}
            className="w-full rounded-sm bg-indigo-600 py-2.5 text-sm font-medium text-[#E6E8EB] hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-[#7A8290]">
          Already have an account? <Link href="/login" className="text-[#E6E8EB] hover:text-indigo-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
