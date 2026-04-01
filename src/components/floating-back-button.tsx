'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CornerUpLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingBackButtonProps {
  href?: string | 'back';
  className?: string;
  label?: string;
}

/**
 * Komponen Tombol Kembali Melayang (Floating Back Button)
 * 
 * Cara Penggunaan:
 * <FloatingBackButton /> // Kembali ke '/' (Home)
 * <FloatingBackButton href="/laporan" /> // Kembali ke halaman tertentu
 * <FloatingBackButton href="back" /> // Kembali ke halaman sebelumnya (browser back)
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
        "fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg z-50",
        className
      )}
      aria-label={label}
      onClick={handleClick}
    >
      <CornerUpLeft className="h-7 w-7" />
    </Button>
  );
}
