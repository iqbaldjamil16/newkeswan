
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { doc, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';

import { HealthcareService } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from './ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from './ui/card';
import {
  PawPrint,
  PlusCircle,
  ChevronDown,
  Pencil,
  Trash2,
  Loader2,
  ImageIcon,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from './ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { useFirebase } from '@/firebase';
import { PasswordDialog } from './password-dialog';

function ReportSkeleton() {
  return (
    <>
      <div className="md:hidden space-y-4 p-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">
                <Skeleton className="h-5 w-full" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-full" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-full" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-full" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-full" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-full" />
              </TableHead>
              <TableHead className="w-[100px]">
                <Skeleton className="h-5 w-full" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7}>
                <Skeleton className="h-10 w-full" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={7}>
                <Skeleton className="h-10 w-full" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={7}>
                <Skeleton className="h-10 w-full" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function ServiceCard({
  service,
  onDelete,
  isHighlighted,
}: {
  service: HealthcareService;
  onDelete: (id: string) => void;
  isHighlighted: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const router = useRouter();

  const handleDelete = () => {
    if (!firestore || !service.id) return;
    startDeleteTransition(async () => {
      try {
        const serviceDoc = doc(firestore, 'healthcareServices', service.id!);
        await deleteDoc(serviceDoc);
        toast({
          title: 'Sukses',
          description: 'Data pelayanan berhasil dihapus.',
        });
        onDelete(service.id!);
        router.refresh();
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: 'Gagal menghapus data.',
        });
      }
    });
  };

  const hasDevelopments = (service.caseDevelopments && service.caseDevelopments.length > 0 && service.caseDevelopments.some(d => d.status && d.count > 0)) || service.caseDevelopment;

  return (
    <Collapsible
      asChild
      key={service.id}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <Card className={cn(isHighlighted && "highlight-new")}>
        <CardHeader className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold">{service.officerName}</div>
              <div className="text-sm text-muted-foreground">
                {service.puskeswan}
              </div>
              <div className="text-sm text-muted-foreground pt-1">
                {format(new Date(service.date), 'dd MMM yyyy', { locale: id })}
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-4 pt-0 space-y-3">
            {service.photoUrl && (
              <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted mb-4">
                 <Image 
                    src={service.photoUrl} 
                    alt="Service documentation" 
                    fill 
                    className="object-cover"
                  />
              </div>
            )}
            <div>
              <div className="text-xs font-semibold text-muted-foreground">
                Pemilik
              </div>
              <p className="text-sm">{service.ownerName}</p>
              <p className="text-xs text-muted-foreground">
                {service.ownerAddress}
              </p>
            </div>
            {service.caseId && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground">
                  ID iSIKHNAS
                </div>
                <p className="text-sm">{service.caseId}</p>
              </div>
            )}
            <div>
              <div className="text-xs font-semibold text-muted-foreground">
                Ternak
              </div>
              <Badge variant="secondary">
                {service.livestockType} ({service.livestockCount})
              </Badge>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground">
                Diagnosa
              </div>
              <p className="text-sm">{service.diagnosis}</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground">
                Pengobatan
              </div>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                {service.treatments.map((treatment, index) => (
                  <li key={index}>
                    <span className="font-semibold">{treatment.medicineName}</span>{' '}
                    ({treatment.dosageValue} {treatment.dosageUnit})
                    <br />
                    <span className="text-muted-foreground text-xs">
                      {treatment.medicineType}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {hasDevelopments && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground">
                  Perkembangan Kasus
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {service.caseDevelopments && service.caseDevelopments.length > 0 && service.caseDevelopments.some(d => d.status && d.count > 0) ? (
                    service.caseDevelopments.filter(d => d.status && d.count > 0).map((dev, index) => (
                      <Badge
                        key={index}
                        variant={
                          dev.status === 'Sembuh'
                            ? 'default'
                            : dev.status === 'Mati'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {dev.status} ({dev.count})
                      </Badge>
                    ))
                  ) : service.caseDevelopment ? (
                    <Badge
                      variant={
                        service.caseDevelopment === 'Sembuh'
                          ? 'default'
                          : service.caseDevelopment === 'Mati'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {service.caseDevelopment}
                    </Badge>
                  ) : null}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-4 pt-0 justify-end gap-2">
            <PasswordDialog
              title="Akses Terbatas"
              description="Silakan masukkan kata sandi untuk mengedit data."
              onSuccess={() => router.push(`/laporan/${service.id}/edit`)}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
            <PasswordDialog
              title="Konfirmasi Hapus"
              description="Tindakan ini memerlukan verifikasi. Masukkan kata sandi untuk melanjutkan."
              onSuccess={handleDelete}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive h-8 w-8"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              }
            />
          </CardFooter>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function ActionsCell({
  service,
  onDelete,
}: {
  service: HealthcareService;
  onDelete: (id: string) => void;
}) {
  const [isDeleting, startDeleteTransition] = useTransition();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const router = useRouter();

  const handleDelete = () => {
    if (!firestore || !service.id) return;
    startDeleteTransition(async () => {
      try {
        const serviceDoc = doc(firestore, 'healthcareServices', service.id!);
        await deleteDoc(serviceDoc);
        toast({
          title: 'Sukses',
          description: 'Data pelayanan berhasil dihapus.',
        });
        onDelete(service.id!);
        router.refresh();
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: 'Gagal menghapus data.',
        });
      }
    });
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <PasswordDialog
        title="Akses Terbatas"
        description="Silakan masukkan kata sandi untuk mengedit data."
        onSuccess={() => router.push(`/laporan/${service.id}/edit`)}
        trigger={
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
      <PasswordDialog
        title="Konfirmasi Hapus"
        description="Tindakan ini memerlukan verifikasi. Masukkan kata sandi untuk melanjutkan."
        onSuccess={handleDelete}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        }
      />
    </div>
  );
}

interface ServiceTableProps {
  services: HealthcareService[];
  loading: boolean;
  highlightedIds: string[];
  searchTerm: string;
  onDelete: (id: string) => void;
  isPending: boolean;
}

export function ServiceTable({ services, loading, highlightedIds, searchTerm, onDelete, isPending }: ServiceTableProps) {
  
  if (loading) {
    return <ReportSkeleton />;
  }

  return (
    <div
      className={cn('h-full', isPending && 'opacity-50 transition-opacity duration-300')}
    >
      <div className="md:hidden h-full overflow-y-auto">
        {services.length > 0 ? (
          <div className="space-y-4 p-4">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onDelete={onDelete}
                isHighlighted={service.id ? highlightedIds.includes(service.id) : false}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <PawPrint className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              {searchTerm
                ? 'Tidak ada hasil ditemukan.'
                : 'Belum ada data untuk periode ini.'}
            </p>
          </div>
        )}
      </div>

      <div className="hidden md:block relative w-full overflow-auto rounded-md border h-[520px]">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <TableHead className="w-[120px]">Tanggal</TableHead>
              <TableHead>Pemilik</TableHead>
              <TableHead>Jenis Hewan</TableHead>
              <TableHead>Diagnosa</TableHead>
              <TableHead>Pengobatan</TableHead>
              <TableHead>Petugas</TableHead>
              <TableHead className="w-[100px] text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length > 0 ? (
              services.map((service) => (
                <TableRow key={service.id} className={cn(service.id && highlightedIds.includes(service.id) && "highlight-new")}>
                  <TableCell className="font-medium align-top">
                    {format(new Date(service.date), 'dd MMM yyyy', {
                      locale: id,
                    })}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="font-medium">{service.ownerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {service.ownerAddress}
                    </div>
                    {service.caseId && (
                        <div className="text-xs text-muted-foreground pt-1">
                          ID: {service.caseId}
                        </div>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant="secondary">
                      {service.livestockType} ({service.livestockCount})
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span>{service.diagnosis}</span>
                        {service.photoUrl && (
                          <ImageIcon className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      {((service.caseDevelopments && service.caseDevelopments.length > 0 && service.caseDevelopments.some(d => d.status && d.count > 0)) || service.caseDevelopment) && (
                        <div className="flex flex-wrap gap-1">
                            {service.caseDevelopments && service.caseDevelopments.length > 0 && service.caseDevelopments.some(d => d.status && d.count > 0) ? (
                                service.caseDevelopments.filter(d => d.status && d.count > 0).map((dev, index) => (
                                <Badge
                                    key={index}
                                    variant={
                                    dev.status === 'Sembuh' ? 'default' :
                                    dev.status === 'Mati' ? 'destructive' :
                                    'secondary'
                                    }
                                    className="w-fit"
                                >
                                    {dev.status} ({dev.count})
                                </Badge>
                                ))
                            ) : service.caseDevelopment ? (
                                <Badge
                                variant={
                                    service.caseDevelopment === 'Sembuh' ? 'default' :
                                    service.caseDevelopment === 'Mati' ? 'destructive' :
                                    'secondary'
                                }
                                className="w-fit"
                                >
                                {service.caseDevelopment}
                                </Badge>
                            ) : null}
                        </div>
                      )}
                      {service.photoUrl && (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="photo" className="border-none">
                            <AccordionTrigger className="py-1 text-xs text-primary hover:no-underline">
                              Lihat Foto Pelayanan
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted mt-2 border">
                                <Image 
                                  src={service.photoUrl} 
                                  alt="Service documentation" 
                                  fill 
                                  className="object-contain"
                                />
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <Accordion
                      type="single"
                      collapsible
                      className="w-full max-w-xs"
                    >
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="py-1 text-primary hover:no-underline">
                          <PlusCircle className="mr-2 h-4 w-4" /> Lihat{' '}
                          {service.treatments.length} pengobatan
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="list-disc pl-5 space-y-1 text-xs">
                            {service.treatments.map((treatment, index) => (
                              <li key={index}>
                                <span className="font-semibold">
                                  {treatment.medicineName}
                                </span>{' '}
                                ({treatment.dosageValue}{' '}
                                {treatment.dosageUnit})
                                <br />
                                <span className="text-muted-foreground">
                                  {treatment.medicineType}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="font-medium">{service.officerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {service.puskeswan}
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-center">
                    <ActionsCell
                      service={service}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <PawPrint className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? 'Tidak ada hasil ditemukan.'
                        : 'Pilih bulan dan tahun untuk menampilkan data.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
