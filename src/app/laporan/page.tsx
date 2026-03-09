
'use client';

import { useState, useTransition, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';
import { getYear, getMonth, format, subYears, startOfMonth, endOfMonth } from "date-fns";
import { id } from 'date-fns/locale';
import { collection, query, orderBy, getDocs, Timestamp, where } from 'firebase/firestore';

import { ServiceTable } from "@/components/service-table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CornerUpLeft, Download, LayoutGrid, BarChart2 } from "lucide-react";
import { type HealthcareService, serviceSchema } from "@/lib/types";
import { PasswordDialog } from "@/components/password-dialog";
import { puskeswanList, priorityDiagnosisOptions } from "@/lib/definitions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebase } from "@/firebase";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const StatisticsDisplay = lazy(() => import('@/components/statistics-display'));

function StatisticsPlaceholder() {
    return (
        <div className="space-y-6 p-4 sm:p-0">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent className="pt-6">
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent className="pt-6">
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent className="pt-6">
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

const years = Array.from({ length: 5 }, (_, i) => getYear(subYears(new Date(), i)).toString());
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i.toString(),
  label: new Date(0, i).toLocaleString('id-ID', { month: 'long' })
}));

export default function ReportPage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const [services, setServices] = useState<HealthcareService[]>([]);
  const [filteredServices, setFilteredServices] = useState<HealthcareService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonth(new Date()).toString());
  const [selectedYear, setSelectedYear] = useState<string>(getYear(new Date()).toString());
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);

  useEffect(() => {
    const updateHighlighted = () => {
      const storedEntries = JSON.parse(localStorage.getItem('newEntries') || '[]');
      const now = Date.now();
      const oneHour = 3600 * 1000;
      
      const validEntries = storedEntries.filter(
        (entry: { id: string, timestamp: number }) => (now - entry.timestamp) < oneHour
      );

      if (validEntries.length !== storedEntries.length) {
        localStorage.setItem('newEntries', JSON.stringify(validEntries));
      }
      
      setHighlightedIds(validEntries.map((entry: { id: string }) => entry.id));
    };

    updateHighlighted();
    const interval = setInterval(updateHighlighted, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadServices = useCallback(async (yearStr: string, monthStr: string) => {
    if (!firestore) return;
    setLoading(true);

    const year = yearStr === 'all-years' || yearStr === '' ? null : parseInt(yearStr, 10);
    const month = monthStr === 'all-months' || monthStr === '' ? null : parseInt(monthStr, 10);

    const servicesCollection = collection(firestore, 'healthcareServices');
    const queryConstraints = [orderBy('date', 'desc')];

    if (year !== null && month !== null) {
        const startDate = startOfMonth(new Date(year, month));
        const endDate = endOfMonth(new Date(year, month));
        queryConstraints.push(where('date', '>=', startDate));
        queryConstraints.push(where('date', '<=', endDate));
    } else if (year !== null) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        queryConstraints.push(where('date', '>=', startDate));
        queryConstraints.push(where('date', '<=', endDate));
    }

    const q = query(servicesCollection, ...queryConstraints);

    try {
      const querySnapshot = await getDocs(q);
      const fetchedServices: HealthcareService[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        try {
          if (data.officerName && data.officerName.toLowerCase().includes('basuki')) {
            data.officerName = 'Basuki Budianto';
          }
          
          if (!data.caseDevelopments || data.caseDevelopments.length === 0) {
            let status = 'Sembuh';
            if (data.caseDevelopment && typeof data.caseDevelopment === 'string' && data.caseDevelopment.length > 0) {
              status = data.caseDevelopment;
            }
            data.caseDevelopments = [{
              status: status,
              count: data.livestockCount || 1,
            }];
          }
          
          const service = serviceSchema.parse({
            ...data,
            id: doc.id,
            date: (data.date as Timestamp).toDate(),
          });
          fetchedServices.push(service);
        } catch (e) {
          console.error('Validation error parsing service data:', e);
        }
      });
      setServices(fetchedServices);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [firestore]);

  useEffect(() => {
    startTransition(() => {
        loadServices(selectedYear, selectedMonth);
    });
  }, [loadServices, selectedYear, selectedMonth]);

  useEffect(() => {
    startTransition(() => {
      let servicesToFilter = services;

      const lowercasedFilter = searchTerm.toLowerCase();
      if (lowercasedFilter) {
        servicesToFilter = servicesToFilter.filter((service) => {
          const ownerName = service.ownerName.toLowerCase();
          const officerName = service.officerName.toLowerCase();
          const puskeswan = service.puskeswan.toLowerCase();
          const diagnosis = service.diagnosis.toLowerCase();
          const livestockType = service.livestockType.toLowerCase();
          const formattedDate = format(new Date(service.date), 'dd MMM yyyy', {
            locale: id,
          }).toLowerCase();

          return (
            ownerName.includes(lowercasedFilter) ||
            officerName.includes(lowercasedFilter) ||
            puskeswan.includes(lowercasedFilter) ||
            diagnosis.includes(lowercasedFilter) ||
            livestockType.includes(lowercasedFilter) ||
            formattedDate.includes(lowercasedFilter)
          );
        });
      }
      
      if (highlightedIds.length > 0) {
        const highlightedItems = servicesToFilter.filter(s => s.id! && highlightedIds.includes(s.id));
        const restItems = servicesToFilter.filter(s => !s.id || !highlightedIds.includes(s.id));
        servicesToFilter = [...highlightedItems, ...restItems];
      }

      setFilteredServices(servicesToFilter);
    });
  }, [searchTerm, services, highlightedIds]);

  const handleLocalDelete = (serviceId: string) => {
    setServices((currentServices) =>
      currentServices.filter((s) => s.id !== serviceId)
    );
     const newEntries = JSON.parse(localStorage.getItem('newEntries') || '[]');
     const updatedEntries = newEntries.filter((entry: {id: string}) => entry.id !== serviceId);
     if(newEntries.length !== updatedEntries.length) {
       localStorage.setItem('newEntries', JSON.stringify(updatedEntries));
       setHighlightedIds(updatedEntries.map((entry: {id: string}) => entry.id));
     }
  };

  const handleDownload = () => {
    const wb = XLSX.utils.book_new();

    puskeswanList.forEach((puskeswan) => {
      const servicesByPuskeswan = filteredServices.filter(
        (s) => s.puskeswan === puskeswan && !priorityDiagnosisOptions.includes(s.diagnosis)
      );

      if (servicesByPuskeswan.length === 0) return;

      const sortedServices = servicesByPuskeswan.sort((a, b) => {
        const officerComparison = a.officerName.localeCompare(b.officerName);
        if (officerComparison !== 0) return officerComparison;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      const servicesByOfficer: { [key: string]: HealthcareService[] } = {};
      sortedServices.forEach(service => {
        if (!servicesByOfficer[service.officerName]) {
          servicesByOfficer[service.officerName] = [];
        }
        servicesByOfficer[service.officerName].push(service);
      });

      const allDataForSheet: any[] = [];
      const headers = ['Tanggal', 'Nama Pemilik', 'Alamat Pemilik', 'Jenis Ternak', 'Sindrom', 'Diagnosa', 'Jenis Penanganan', 'Obat yang Digunakan', 'Dosis', 'Jumlah Ternak', 'ID Isikhnas', 'Perkembangan Kasus', 'Lampiran Foto'];
      const officerNames = Object.keys(servicesByOfficer).sort();

      officerNames.forEach(officerName => {
        allDataForSheet.push({});
        allDataForSheet.push({});
        allDataForSheet.push({ 'Nama Petugas': officerName });
        allDataForSheet.push(Object.fromEntries(headers.map(h => [h, h])));
        const data = servicesByOfficer[officerName].map((service) => {
          const caseDevelopmentText = (service.caseDevelopments || [])
              .filter(dev => dev.status && dev.count > 0)
              .map(dev => `${dev.status} (${dev.count})`)
              .join(', ');

          return {
            'Tanggal': format(new Date(service.date), 'dd-MM-yyyy'),
            'Nama Pemilik': service.ownerName,
            'Alamat Pemilik': service.ownerAddress,
            'Jenis Ternak': service.livestockType,
            'Sindrom': service.clinicalSymptoms,
            'Diagnosa': service.diagnosis,
            'Jenis Penanganan': service.treatmentType,
            'Obat yang Digunakan': service.treatments.map((t) => t.medicineName).join(', '),
            'Dosis': service.treatments.map((t) => `${t.dosageValue} ${t.dosageUnit}`).join(', '),
            'Jumlah Ternak': service.livestockCount,
            'ID Isikhnas': service.caseId,
            'Perkembangan Kasus': caseDevelopmentText,
            'Lampiran Foto': service.photoUrl || '-',
          };
        });
        allDataForSheet.push(...data);
      });

      const sheetName = puskeswan.replace('Puskeswan ', '').replace(/[/\\?*:[\]]/g, '');
      const ws = XLSX.utils.json_to_sheet(allDataForSheet, { skipHeader: true });

      const columnWidths = headers.map((header) => {
        const allValues = allDataForSheet.map(row => row[header]).filter(Boolean);
        const maxLength = allValues.reduce((max, cellValue) => {
          const cellLength = cellValue ? String(cellValue).length : 0;
          return Math.max(max, cellLength);
        }, header.length);
        return { wch: header === 'Lampiran Foto' ? 30 : Math.min(maxLength + 2, 50) };
      });
      ws['!cols'] = columnWidths;
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
    });

    const priorityServices = filteredServices.filter(s => priorityDiagnosisOptions.includes(s.diagnosis));
    if (priorityServices.length > 0) {
      const sortedServices = priorityServices.sort((a, b) => {
        const officerComparison = a.officerName.localeCompare(b.officerName);
        if (officerComparison !== 0) return officerComparison;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      const servicesByOfficer: { [key: string]: HealthcareService[] } = {};
      sortedServices.forEach(service => {
        if (!servicesByOfficer[service.officerName]) {
          servicesByOfficer[service.officerName] = [];
        }
        servicesByOfficer[service.officerName].push(service);
      });

      const allDataForSheet: any[] = [];
      const headers = ['Tanggal', 'Nama Pemilik', 'Alamat Pemilik', 'Jenis Ternak', 'Sindrom', 'Diagnosa', 'Jenis Penanganan', 'Obat yang Digunakan', 'Dosis', 'Jumlah Ternak', 'ID Isikhnas', 'Perkembangan Kasus', 'Lampiran Foto'];
      const officerNames = Object.keys(servicesByOfficer).sort();

      officerNames.forEach(officerName => {
        allDataForSheet.push({});
        allDataForSheet.push({});
        allDataForSheet.push({ 'Nama Petugas': officerName });
        allDataForSheet.push(Object.fromEntries(headers.map(h => [h, h])));
        const data = priorityServices.filter(s => s.officerName === officerName).map((service) => {
          const caseDevelopmentText = (service.caseDevelopments || [])
            .filter(dev => dev.status && dev.count > 0)
            .map(dev => `${dev.status} (${dev.count})`)
            .join(', ');

          return {
            'Tanggal': format(new Date(service.date), 'dd-MM-yyyy'),
            'Nama Pemilik': service.ownerName,
            'Alamat Pemilik': service.ownerAddress,
            'Jenis Ternak': service.livestockType,
            'Sindrom': service.clinicalSymptoms,
            'Diagnosa': service.diagnosis,
            'Jenis Penanganan': service.treatmentType,
            'Obat yang Digunakan': service.treatments.map((t) => t.medicineName).join(', '),
            'Dosis': service.treatments.map((t) => `${t.dosageValue} ${t.dosageUnit}`).join(', '),
            'Jumlah Ternak': service.livestockCount,
            'ID Isikhnas': service.caseId,
            'Perkembangan Kasus': caseDevelopmentText,
            'Lampiran Foto': service.photoUrl || '-',
          };
        });
        allDataForSheet.push(...data);
      });

      const sheetName = 'Laporan Prioritas';
      const ws = XLSX.utils.json_to_sheet(allDataForSheet, { skipHeader: true });

      const columnWidths = headers.map((header) => {
        const allValues = allDataForSheet.map(row => row[header]).filter(Boolean);
        const maxLength = allValues.reduce((max, cellValue) => {
          const cellLength = cellValue ? String(cellValue).length : 0;
          return Math.max(max, cellLength);
        }, header.length);
        return { wch: header === 'Lampiran Foto' ? 30 : Math.min(maxLength + 2, 50) };
      });
      ws['!cols'] = columnWidths;
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
  
    const monthLabel =
      selectedMonth === 'all-months' || selectedMonth === ''
        ? 'SemuaBulan'
        : months.find((m) => m.value === selectedMonth)?.label || 'SemuaBulan';
    const yearLabel =
      selectedYear === 'all-years' || selectedYear === ''
        ? getYear(new Date()).toString()
        : selectedYear;
  
    XLSX.writeFile(wb, `laporan_pelayanan_${monthLabel}_${yearLabel}.xlsx`);
  };

  return (
    <div className="container px-4 sm:px-8 py-4 md:py-8 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
                Laporan Pelayanan
              </CardTitle>
              <CardDescription className="mt-1 text-sm md:text-base">
                Cari, lihat, dan unduh semua data pelayanan yang telah
                diinput.
              </CardDescription>
            </div>
            <div className="w-full flex justify-end sm:w-auto">
              <PasswordDialog
                title="Akses Terbatas"
                description="Silakan masukkan kata sandi untuk mengunduh laporan."
                onSuccess={handleDownload}
                trigger={
                  <Button disabled={loading || filteredServices.length === 0 || isPending}>
                    <Download className="mr-2 h-5 w-5" />
                    Unduh Laporan
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="tabel" className="w-full">
        <Card className="p-4 sm:p-6 pb-0">
          <CardContent className="p-0">
              <div className="grid grid-cols-2 md:flex md:justify-end gap-2">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all-months">Semua Bulan</SelectItem>
                      {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                          {month.label}
                      </SelectItem>
                      ))}
                  </SelectContent>
                  </Select>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all-years">Semua Tahun</SelectItem>
                      {years.map((year) => (
                      <SelectItem key={year} value={year}>
                          {year}
                      </SelectItem>
                      ))}
                  </SelectContent>
                  </Select>
                  <Input
                  placeholder="Cari data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full col-span-2 md:w-64"
                  />
              </div>
              <div className="pt-4">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="tabel">
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      Tabel
                      </TabsTrigger>
                      <TabsTrigger value="statistik">
                      <BarChart2 className="mr-2 h-4 w-4" />
                      Statistik
                      </TabsTrigger>
                  </TabsList>
              </div>
          </CardContent>

          <TabsContent value="tabel" className="md:pt-4">
            <ServiceTable
              services={filteredServices}
              loading={loading && services.length === 0}
              highlightedIds={highlightedIds}
              searchTerm={searchTerm}
              onDelete={handleLocalDelete}
              isPending={isPending}
            />
          </TabsContent>
          <TabsContent value="statistik" className="md:pt-4">
            <Suspense fallback={<StatisticsPlaceholder />}>
              <StatisticsDisplay services={filteredServices} />
            </Suspense>
          </TabsContent>
        </Card>
      </Tabs>
      
      <Button
          variant="default"
          className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg"
          aria-label="Kembali ke halaman utama"
          onClick={() => router.push('/')}
        >
          <CornerUpLeft className="h-7 w-7" />
        </Button>
    </div>
  );
}
