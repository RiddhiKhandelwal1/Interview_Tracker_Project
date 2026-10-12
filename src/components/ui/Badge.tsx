interface BadgeProps { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'; className?: string; }
const variants = {
  default: 'text-[#7A8290]',
  success: 'text-[#4FAE7E]',
  warning: 'text-[#D9A253]',
  danger: 'text-[#C7595A]',
  info: 'text-[#4FC1C9]',
};
export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return <span className={`font-mono text-[11px] ${variants[variant]} ${className}`}>[{children}]</span>;
}
