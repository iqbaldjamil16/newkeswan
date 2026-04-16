'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutGrid, TrendingUp, ClipboardCheck } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Komponen kartu ringkasan data yang menampilkan statistik laporan.
 * Mengambil data secara real-time dari koleksi healthcareServices.
 */
export function DataSummaryCard() {
  const { firestore } = useFirebase();
  const now = new Date();
  const currentMonthName = format(now, 'MMMM', { locale: id });

  // Membuat query yang di-memoize untuk koleksi layanan kesehatan
  const servicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'healthcareServices');
  }, [firestore]);

  // Berlangganan ke data koleksi secara real-time
  const { data: services, isLoading } = useCollection(servicesQuery);

  // Menghitung statistik berdasarkan data yang diterima
  const stats = useMemo(() => {
    if (!services) return { currentMonth: 0, total: 0 };

    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const currentMonthCount = services.filter(s => {
      let d: Date;
      if (s.date && typeof s.date.toDate === 'function') {
        d = s.date.toDate();
      } else if (s.date instanceof Date) {
        d = s.date;
      } else if (typeof s.date === 'string') {
        d = new Date(s.date);
      } else {
        return false;
      }
      return d >= start && d <= end;
    }).length;

    return {
      currentMonth: currentMonthCount,
      total: services.length
    };
  }, [services]);

  return (
    <Card className="w-full md:w-72 bg-card/50 border-primary/10 shadow-sm shrink-0">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
            <LayoutGrid className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-lg font-bold text-amber-900 dark:text-amber-200 font-headline">Ringkasan Data</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              <span>Bulan {currentMonthName}</span>
            </div>
            <span className="text-3xl font-bold text-blue-500 tabular-nums">
              {isLoading ? '...' : stats.currentMonth}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <ClipboardCheck className="h-4 w-4" />
              <span>Total Laporan</span>
            </div>
            <span className="text-3xl font-bold text-amber-900 dark:text-amber-200 tabular-nums">
              {isLoading ? '...' : stats.total}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
