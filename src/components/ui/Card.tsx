export default function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 ${className}`}>{children}</div>;
}
