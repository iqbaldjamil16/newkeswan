'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

import { ServiceForm } from '@/components/service-form';
import { type HealthcareService, serviceSchema } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { FloatingBackButton } from '@/components/floating-back-button';

function EditSkeleton() {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { firestore } = useFirebase();
  const [service, setService] = useState<HealthcareService | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchService() {
      if (!id || !firestore) {
        setLoading(false);
        if (!id) notFound();
        return;
      };
      try {
        setLoading(true);
        const docRef = doc(firestore, 'healthcareServices', id);
        const docSnap = await getDoc(docRef);
      
        if (docSnap.exists()) {
          const data = docSnap.data();

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

          const serviceData = serviceSchema.parse({
            ...data,
            id: docSnap.id,
            date: (data.date as Timestamp).toDate(),
          });
          setService(serviceData);
        } else {
          notFound();
        }
      } catch (error) {
        console.error('Failed to fetch service:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    }
    fetchService();
  }, [id, firestore]);

  return (
    <div className="container px-4 sm:px-8 py-4 md:py-8">
      <div className="max-w-4xl mx-auto">
        {loading ? (
            <EditSkeleton />
        ) : service ? (
          <>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Edit Pelayanan Kesehatan Hewan</h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              Perbarui detail pelayanan yang telah diberikan.
            </p>
            <div className="mt-6 md:mt-8">
              <ServiceForm initialData={service} />
            </div>
          </>
        ) : null}
      </div>
      <FloatingBackButton href="back" label="Kembali ke halaman laporan" />
    </div>
  );
}
