import { Loader2 } from 'lucide-react';
export default function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-indigo-400 ${className}`} />;
}
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}
