import { Loader2 } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-primary-600/30" />
          <div className="absolute inset-0 w-14 h-14 rounded-full border-t-2 border-primary-500 animate-spin" />
        </div>
        <p className="text-content-muted text-sm font-sans">Loading…</p>
      </div>
    </div>
  );
}

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return <Loader2 className={`${sizeMap[size]} animate-spin text-primary-500`} />;
}
