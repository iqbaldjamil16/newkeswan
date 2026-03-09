'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CornerUpLeft, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useFirebase } from '@/firebase';
import { collection, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { type HealthcareService, serviceSchema } from '@/lib/types';
import { format, getMonth, getYear, subYears, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const years = Array.from({ length: 5 }, (_, i) => getYear(subYears(new Date(), i)).toString());
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i.toString(),
  label: new Date(0, i).toLocaleString('id-ID', { month: 'long' })
}));

export default function DocsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonth(new Date()).toString());
  const [selectedYear, setSelectedYear] = useState<string>(getYear(new Date()).toString());

  const handleGeneratePdf = async () => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Koneksi Firestore tidak tersedia.' });
        return;
    }
    setIsGenerating(true);

    try {
        const servicesCollection = collection(firestore, 'healthcareServices');
        
        const year = selectedYear === 'all-years' ? null : parseInt(selectedYear, 10);
        const month = selectedMonth === 'all-months' ? null : parseInt(selectedMonth, 10);

        const queryConstraints: any[] = [orderBy('date', 'asc')];

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
        const querySnapshot = await getDocs(q);

        let allServices: HealthcareService[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
             try {
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
                allServices.push(service);
            } catch (e) {
                console.error("Validation error parsing service data for PDF:", e, data);
            }
        });
        
        const services = allServices.filter(s => s.officerName === 'drh. Iqbal Djamil');

        if (services.length === 0) {
            toast({ title: 'Info', description: 'Tidak ada data pelayanan untuk drh. Muhammad Iqbal Djamil pada periode yang dipilih.' });
            setIsGenerating(false);
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Laporan Pelayanan Kesehatan Hewan', pageWidth / 2, 22, { align: 'center' });
        
        doc.setFontSize(11);
        
        const labelX = 14;
        const colonX = 45;
        const valueX = 47;
        let currentY = 30;
        const lineHeight = 6;
        
        // Petugas
        doc.setFont(undefined, 'normal');
        doc.text('Petugas', labelX, currentY);
        doc.text(':', colonX, currentY);
        doc.setFont(undefined, 'bold');
        doc.text('drh. Muhammad Iqbal Djamil', valueX, currentY);
        doc.setFont(undefined, 'normal');
        currentY += lineHeight;
        
        // Kecamatan
        doc.text('Kecamatan', labelX, currentY);
        doc.text(':', colonX, currentY);
        doc.text('Topoyo', valueX, currentY);
        currentY += lineHeight;

        // Bulan
        const monthLabelText = months.find(m => m.value === selectedMonth)?.label || 'Semua Bulan';
        const yearLabelText = selectedYear === 'all-years' ? 'Semua Tahun' : selectedYear;
        let periodLabel;
        if (selectedYear === 'all-years') {
            periodLabel = 'Semua Periode';
        } else if (selectedMonth === 'all-months') {
            periodLabel = yearLabelText;
        } else {
            periodLabel = `${monthLabelText} ${yearLabelText}`;
        }
        doc.text('Bulan', labelX, currentY);
        doc.text(':', colonX, currentY);
        doc.text(periodLabel, valueX, currentY);

        if (services.length > 0) {
          const tableColumn = ["No.", "Tanggal", "Puskeswan", "Pemilik", "Alamat", "ID Kasus", "Jenis Hewan", "Gejala Klinis", "Diagnosa", "Penanganan", "Pengobatan", "Perkembangan Kasus"];
          const tableRows: any[][] = [];

          services.forEach((service, index) => {
              const treatments = service.treatments.map(t => `${t.medicineName} (${t.dosageValue} ${t.dosageUnit})`).join('\n');
              const caseDevelopmentText = (service.caseDevelopments || [])
                .filter(dev => dev.status && dev.count > 0)
                .map(dev => `${dev.status} (${dev.count})`)
                .join(', ');

              const serviceData = [
                  index + 1,
                  format(new Date(service.date), 'dd-MM-yyyy', { locale: id }),
                  service.puskeswan,
                  service.ownerName,
                  service.ownerAddress,
                  service.caseId || '-',
                  `${service.livestockType} (${service.livestockCount})`,
                  service.clinicalSymptoms,
                  service.diagnosis,
                  service.treatmentType,
                  treatments,
                  caseDevelopmentText || (service.caseDevelopment || '-'),
              ];
              tableRows.push(serviceData);
          });
          
          const totalLivestock = services.reduce((sum, service) => sum + service.livestockCount, 0);

          autoTable(doc, {
              head: [tableColumn],
              body: tableRows,
              startY: currentY + 5,
              styles: { fontSize: 8, cellPadding: 2, textColor: [0, 0, 0], valign: 'middle' },
              headStyles: { fillColor: [38, 89, 43], textColor: [255, 255, 255], fontSize: 9, halign: 'center', valign: 'middle' },
              columnStyles: {
                0: { halign: 'center' },
                5: { halign: 'left' },
                11: { halign: 'left' },
              }
          });
          
          const finalTableY = (doc as any).lastAutoTable.finalY;
          const totalText = `Total Data: ${services.length} - Total Pelayanan Keswan: ${totalLivestock} Ekor`;
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text(totalText, 14, finalTableY + 10);
          doc.setFont(undefined, 'normal');

          // LAMPIRAN FOTO
          const servicesWithPhotos = services.filter(s => s.photoUrl);
          if (servicesWithPhotos.length > 0) {
            doc.addPage();
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Lampiran Foto Pelayanan', pageWidth / 2, 20, { align: 'center' });
            
            let imgY = 30;
            const imgWidth = 120;
            const imgHeight = 90;
            const horizontalGap = 10;
            const verticalGap = 20;

            // Simple layout: 1 or 2 images per page
            servicesWithPhotos.forEach((service, i) => {
              const caption = `${i + 1}. Pemilik: ${service.ownerName} - ${format(new Date(service.date), 'dd/MM/yyyy')}`;
              
              // Check for page break
              if (imgY + imgHeight + 15 > pageHeight) {
                doc.addPage();
                imgY = 20;
              }

              doc.setFontSize(10);
              doc.setFont(undefined, 'bold');
              doc.text(caption, 14, imgY);
              
              try {
                // Determine format
                const formatStr = service.photoUrl?.includes('png') ? 'PNG' : 'JPEG';
                doc.addImage(service.photoUrl!, formatStr, 14, imgY + 5, imgWidth, imgHeight);
                imgY += imgHeight + verticalGap;
              } catch (err) {
                console.error("Gagal menambahkan gambar ke PDF", err);
                doc.setFont(undefined, 'italic');
                doc.text('[Gagal memuat gambar]', 14, imgY + 10);
                imgY += 20;
              }
            });
          }

        } else {
          doc.setFontSize(11);
          doc.text('Tidak ada data pelayanan tabel untuk periode ini.', 14, 50);
        }

        doc.save(`laporan-drh-muhammad-iqbal-djamil-${periodLabel.replace(/\s/g, '_')}.pdf`);

    } catch (error) {
        console.error("Gagal membuat PDF: ", error);
        toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan saat membuat PDF.' });
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="container px-4 sm:px-8 py-4 md:py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
              Unduh PDF Khusus
            </CardTitle>
            <CardDescription className="text-muted-foreground pt-2 text-sm md:text-base">
              Halaman ini menyediakan fitur untuk mengunduh laporan PDF khusus untuk drh. Muhammad Iqbal Djamil.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Filter Laporan</CardTitle>
                <CardDescription>Pilih bulan dan tahun untuk laporan yang akan diunduh.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
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
                    <SelectTrigger>
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
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Unduh Laporan PDF</CardTitle>
                <CardDescription>Hanya memuat data pelayanan khusus untuk drh. Muhammad Iqbal Djamil berdasarkan filter yang dipilih.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleGeneratePdf} disabled={isGenerating}>
                    {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Membuat PDF...</> : <><Download className="mr-2 h-4 w-4" /> Unduh Laporan PDF</>}
                </Button>
            </CardContent>
        </Card>
      </div>
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
