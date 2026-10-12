export default function EmptyState({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start justify-center p-8 border border-[#1F2430] bg-[#12161F]">
      <div className="font-mono text-sm text-[#7A8290] mb-2">{'//'} {title.toLowerCase()}</div>
      <p className="text-sm text-[#E6E8EB] max-w-md mb-6">{description}</p>
      {children}
    </div>
  );
}
