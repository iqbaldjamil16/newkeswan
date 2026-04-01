'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CornerUpLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingBackButtonProps {
  /** 
   * Tujuan navigasi. 
   * Gunakan '/' untuk Home, path spesifik seperti '/laporan', 
   * atau 'back' untuk kembali ke halaman sebelumnya (browser back).
   * Default: '/'
   */
  href?: string | 'back';
  /** Class tambahan untuk styling Tailwind */
  className?: string;
  /** Label untuk aksesibilitas (aria-label) */
  label?: string;
}

/**
 * Komponen Tombol Kembali Melayang (Floating Back Button)
 * Menggunakan ShadCN Button dan Lucide Icon.
 */
export function FloatingBackButton({ 
  href = '/', 
  className,
  label = "Kembali" 
}: FloatingBackButtonProps) {
  const router = useRouter();
  
  const handleClick = () => {
    if (href === 'back') {
      router.back();
    } else {
      router.push(href);
    }
  };

  return (
    <Button
      variant="default"
      className={cn(
        "fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg z-50 transition-all hover:scale-110 active:scale-95",
        className
      )}
      aria-label={label}
      onClick={handleClick}
    >
      <CornerUpLeft className="h-7 w-7" />
    </Button>
  );
}
