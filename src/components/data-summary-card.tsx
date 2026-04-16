'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutGrid, Users, ClipboardCheck } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Komponen kartu ringkasan data yang menampilkan statistik petugas aktif dan total laporan per bulan.
 * 
 * OPTIMASI:
 * Query difilter langsung di sisi Firestore untuk mempercepat pengambilan data
 * dan mengurangi beban pemrosesan di sisi client.
 */
export function DataSummaryCard() {
  const { firestore } = useFirebase();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Mengatur tanggal sekarang setelah komponen dipasang untuk menghindari hydration mismatch
    setNow(new Date());
  }, []);

  const currentMonthName = useMemo(() => {
    if (!now) return '...';
    return format(now, 'MMMM', { locale: id });
  }, [now]);

  // Query yang dioptimalkan: hanya mengambil data bulan berjalan dari server
  const servicesQuery = useMemoFirebase(() => {
    if (!firestore || !now) return null;
    
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    return query(
      collection(firestore, 'healthcareServices'),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end))
    );
  }, [firestore, now]);

  const { data: services, isLoading } = useCollection(servicesQuery);

  const stats = useMemo(() => {
    // Jika data belum ada atau sedang loading, kembalikan nilai default
    if (!services) return { activeOfficers: 0, currentMonthReports: 0 };

    // Menghitung jumlah petugas unik yang menginput di bulan ini
    const activeOfficersSet = new Set(services.map(s => s.officerName));
    
    // Menghitung total jumlah ternak (kasus) agar sinkron dengan statistik
    const totalCasesCount = services.reduce((sum, s) => sum + (s.livestockCount || 0), 0);

    return {
      activeOfficers: activeOfficersSet.size,
      currentMonthReports: totalCasesCount
    };
  }, [services]);

  return (
    <Card className="w-full md:w-72 bg-card/50 border-primary/10 shadow-sm shrink-0">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30">
            <LayoutGrid className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <span className="text-lg font-bold text-black dark:text-white font-headline">Ringkasan Data</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <Users className="h-4 w-4" />
              <span>Bulan {currentMonthName}</span>
            </div>
            <span className="text-xl font-bold text-primary tabular-nums">
              {isLoading || !now ? '...' : stats.activeOfficers}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <ClipboardCheck className="h-4 w-4" />
              <span>Total Kasus (Ekor)</span>
            </div>
            <span className="text-xl font-bold text-primary tabular-nums">
              {isLoading || !now ? '...' : stats.currentMonthReports}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
