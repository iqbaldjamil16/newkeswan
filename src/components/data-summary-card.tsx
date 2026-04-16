'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutGrid, Users, ClipboardCheck } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Komponen kartu ringkasan data yang menampilkan statistik petugas aktif dan total laporan per bulan.
 * 
 * SUMBER DATA:
 * Data diambil dari koleksi 'healthcareServices' di Firestore.
 */
export function DataSummaryCard() {
  const { firestore } = useFirebase();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const currentMonthName = useMemo(() => {
    if (!now) return '...';
    return format(now, 'MMMM', { locale: id });
  }, [now]);

  const servicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'healthcareServices');
  }, [firestore]);

  const { data: services, isLoading } = useCollection(servicesQuery);

  const stats = useMemo(() => {
    if (!services || !now) return { activeOfficers: 0, currentMonthReports: 0 };

    const start = startOfMonth(now);
    const end = endOfMonth(now);

    // Filter data untuk bulan berjalan
    const currentMonthServices = services.filter(s => {
      let d: Date;
      if (s.date && typeof (s.date as any).toDate === 'function') {
        d = (s.date as any).toDate();
      } else if (s.date instanceof Timestamp) {
        d = s.date.toDate();
      } else if (s.date instanceof Date) {
        d = s.date;
      } else if (typeof s.date === 'string') {
        d = new Date(s.date);
      } else if (s.date && typeof s.date === 'object' && 'seconds' in (s.date as any)) {
        d = new Date((s.date as any).seconds * 1000);
      } else {
        return false;
      }
      
      return isWithinInterval(d, { start, end });
    });

    // Menghitung jumlah petugas unik yang menginput di bulan ini
    const activeOfficersSet = new Set(currentMonthServices.map(s => s.officerName));
    
    // Menghitung total jumlah ternak (kasus) agar sinkron dengan statistik
    const totalCasesCount = currentMonthServices.reduce((sum, s) => sum + (s.livestockCount || 0), 0);

    return {
      activeOfficers: activeOfficersSet.size,
      currentMonthReports: totalCasesCount
    };
  }, [services, now]);

  return (
    <Card className="w-full md:w-72 bg-card/50 border-primary/10 shadow-sm shrink-0">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900/30">
            <LayoutGrid className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <span className="text-lg font-bold text-black dark:text-white font-headline">Ringkasan Data</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <Users className="h-4 w-4" />
              <span>Bulan {currentMonthName}</span>
            </div>
            <span className="text-3xl font-bold text-blue-500 tabular-nums">
              {isLoading || !now ? '...' : stats.activeOfficers}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <ClipboardCheck className="h-4 w-4" />
              <span>Total Kasus (Ekor)</span>
            </div>
            <span className="text-3xl font-bold text-amber-900 dark:text-amber-200 tabular-nums">
              {isLoading || !now ? '...' : stats.currentMonthReports}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
