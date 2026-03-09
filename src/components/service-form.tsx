
"use client";

import { useTransition, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PlusCircle, Trash2, Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from 'date-fns/locale';
import { doc, addDoc, collection, Timestamp } from 'firebase/firestore';
import Image from "next/image";

import { cn } from "@/lib/utils";
import { serviceSchema, type HealthcareService } from "@/lib/types";
import { medicineData, medicineTypes, type MedicineType, livestockTypes, puskeswanList, treatmentTypes, dosageUnits, karossaDesaList, budongBudongDesaList, pangaleDesaList, tobadakDesaList, topoyoDesaList, budongBudongOfficerList, karossaOfficerList, pangaleOfficerList, tobadakOfficerList, topoyoOfficerList, caseStatusOptions, priorityOfficerList, prioritySyndromeOptions, priorityDiagnosisOptions } from "@/lib/definitions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { useFirebase, updateDocumentNonBlocking, errorEmitter, FirestorePermissionError } from "@/firebase";


export function ServiceForm({ initialData, formType = 'keswan' }: { initialData?: HealthcareService, formType?: 'keswan' | 'priority' }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!initialData;

  const [showManualTreatmentType, setShowManualTreatmentType] = useState(
    initialData ? !treatmentTypes.includes(initialData.treatmentType) : false
  );
  const [showManualLivestockType, setShowManualLivestockType] = useState(
    initialData ? !livestockTypes.includes(initialData.livestockType) : false
  );

  const form = useForm<HealthcareService>({
    resolver: zodResolver(serviceSchema),
    defaultValues: initialData ? {
      ...initialData,
      date: initialData.date ? new Date(initialData.date) : new Date(),
      caseDevelopments: (initialData.caseDevelopments && initialData.caseDevelopments.length > 0)
        ? initialData.caseDevelopments
        : [{ status: "", count: initialData.livestockCount || 1 }],
    } : {
      date: new Date(),
      puskeswan: "",
      officerName: "",
      ownerName: "",
      ownerAddress: "",
      caseId: "",
      livestockType: "",
      livestockCount: 1,
      clinicalSymptoms: "",
      diagnosis: "",
      treatmentType: "",
      photoUrl: "",
      treatments: [{ medicineType: "", medicineName: "", dosageValue: 0, dosageUnit: "ml" }],
      caseDevelopments: [{ status: "", count: 1 }],
    },
  });
  
  const { fields: treatmentFields, append: appendTreatment, remove: removeTreatment } = useFieldArray({
    control: form.control,
    name: "treatments",
  });

  const { fields: caseDevelopmentFields, append: appendCaseDevelopment, remove: removeCaseDevelopment } = useFieldArray({
    control: form.control,
    name: "caseDevelopments",
  });

  const watchedPuskeswan = form.watch("puskeswan");
  const watchedTreatments = form.watch("treatments");
  const watchedPhotoUrl = form.watch("photoUrl");

  const officerListMap: Record<string, string[]> = {
    'Puskeswan Budong-Budong': budongBudongOfficerList,
    'Puskeswan Karossa': karossaOfficerList,
    'Puskeswan Pangale': pangaleOfficerList,
    'Puskeswan Tobadak': tobadakOfficerList,
    'Puskeswan Topoyo': topoyoOfficerList,
  };
  const officerList = officerListMap[watchedPuskeswan] || [];
  const isOfficerSelection = officerList.length > 0;

  const [showManualOfficerName, setShowManualOfficerName] = useState(
    initialData ? isOfficerSelection && !officerList.includes(initialData.officerName) : false
  );

  const desaListMap: Record<string, string[]> = {
    'Puskeswan Karossa': karossaDesaList,
    'Puskeswan Budong-Budong': budongBudongDesaList,
    'Puskeswan Pangale': pangaleDesaList,
    'Puskeswan Tobadak': tobadakDesaList,
    'Puskeswan Topoyo': topoyoDesaList,
  };
  const desaList = desaListMap[watchedPuskeswan] || [];
  const isDesaSelection = desaList.length > 0;
  
  const [showManualOwnerAddress, setShowManualOwnerAddress] = useState(
    initialData ? isDesaSelection && !desaList.includes(initialData.ownerAddress) : false
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File terlalu besar",
          description: "Maksimal ukuran foto adalah 2MB.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("photoUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    form.setValue("photoUrl", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  function onSubmit(values: HealthcareService) {
    if (!firestore) {
        toast({
          variant: "destructive",
          title: "Gagal Menyimpan",
          description: "Koneksi database tidak tersedia.",
        });
        return;
    }

    startTransition(() => {
      try {
        const { id, caseDevelopment, ...dataToSave } = values;
        
        const serviceData = {
          ...dataToSave,
          date: Timestamp.fromDate(values.date),
        };

        if (isEditMode && initialData?.id) {
            const serviceDocRef = doc(firestore, 'healthcareServices', initialData.id);
            // Non-blocking update
            updateDocumentNonBlocking(serviceDocRef, serviceData);
            
            toast({
              title: "Sukses",
              description: "Data pelayanan berhasil diperbarui!",
            });
            router.push('/laporan');
        } else {
            const servicesCollection = collection(firestore, 'healthcareServices');
            
            // Initiate the write and handle redirection immediately for smooth UI
            // We use addDoc directly to get the ID for localStorage, but we don't 'await' it.
            addDoc(servicesCollection, serviceData)
              .then((newDocRef) => {
                const newEntries = JSON.parse(localStorage.getItem('newEntries') || '[]');
                newEntries.push({ id: newDocRef.id, timestamp: Date.now() });
                localStorage.setItem('newEntries', JSON.stringify(newEntries));
              })
              .catch((error) => {
                const permissionError = new FirestorePermissionError({
                  path: servicesCollection.path,
                  operation: 'create',
                  requestResourceData: serviceData,
                });
                errorEmitter.emit('permission-error', permissionError);
              });

            toast({
                title: "Sukses",
                description: "Data pelayanan berhasil disimpan!",
            });
            router.push('/laporan');
        }
      } catch (error: any) {
        console.error("Submit error:", error);
        toast({
          variant: "destructive",
          title: "Gagal Menyimpan",
          description: error.message || "Terjadi kesalahan saat menyimpan data.",
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-4 md:space-y-6">
            <Card>
              <CardContent className="p-4">
              <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Pelayanan</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="w-full"
                          value={field.value instanceof Date ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            const dateValue = e.target.value;
                            if (dateValue) {
                              field.onChange(parseISO(dateValue));
                            } else {
                              field.onChange(null);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <FormField
                  control={form.control}
                  name="puskeswan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puskeswan</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('ownerAddress', ''); 
                          setShowManualOwnerAddress(false);
                          form.setValue('officerName', '');
                          setShowManualOfficerName(false);
                        }}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Puskeswan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {puskeswanList.map((puskeswan) => (
                            <SelectItem key={puskeswan} value={puskeswan}>{puskeswan}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <FormField
                  control={form.control}
                  name="officerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Petugas</FormLabel>
                      {formType === 'priority' ? (
                        <Select
                            onValueChange={field.onChange}
                            value={field.value}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Nama Petugas" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {priorityOfficerList.map((officer) => (
                                    <SelectItem key={officer} value={officer}>{officer}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                      ) : (
                        <>
                          {isOfficerSelection && !showManualOfficerName ? (
                            <Select
                              onValueChange={(value) => {
                                if (value === 'Lainnya') {
                                  setShowManualOfficerName(true);
                                  field.onChange('');
                                } else {
                                  field.onChange(value);
                                }
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih Nama Petugas" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {officerList.map((officer) => (
                                  <SelectItem key={officer} value={officer}>{officer}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <FormControl>
                              <Input 
                                placeholder="Nama Petugas" 
                                {...field} 
                                value={(showManualOfficerName && field.value === 'Lainnya') ? '' : field.value}
                              />
                            </FormControl>
                          )}
                        </>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Pemilik</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Budi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                 <FormField
                  control={form.control}
                  name="ownerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Pemilik</FormLabel>
                      {(isDesaSelection && !showManualOwnerAddress) ? (
                        <Select 
                            onValueChange={(value) => {
                                if (value === 'Lainnya') {
                                    setShowManualOwnerAddress(true);
                                    field.onChange('');
                                } else {
                                    field.onChange(value);
                                }
                            }}
                            value={field.value}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Desa" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {desaList.map((desa) => (
                                    <SelectItem key={desa} value={desa}>{desa}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                            <Input 
                                placeholder="Alamat Desa, Contoh : Salopangkang" 
                                {...field}
                                value={(showManualOwnerAddress && field.value === 'Lainnya') ? '' : field.value}
                             />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <FormField
                  control={form.control}
                  name="caseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        ID Kasus iSIKHNAS
                        <span className="ml-2 text-xs italic font-normal text-muted-foreground">
                          (Opsional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="contoh : 53144622" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="livestockType"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                              Jenis Ternak
                            </FormLabel>
                            {showManualLivestockType ? (
                              <FormControl>
                                <Input 
                                  placeholder="Masukkan jenis ternak"
                                  {...field}
                                />
                              </FormControl>
                            ) : (
                              <Select 
                                onValueChange={(value) => {
                                  if (value === 'Lainnya') {
                                    setShowManualLivestockType(true);
                                    field.onChange('');
                                  } else {
                                    field.onChange(value);
                                  }
                                }} 
                                value={field.value}
                              >
                                <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih Jenis Ternak" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {livestockTypes.map((type) => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            )}
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="livestockCount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Jumlah</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                </CardContent>
            </Card>
          </div>

          <div className="space-y-4 md:space-y-6">
            <Card>
              <CardContent className="p-4">
                <FormField
                  control={form.control}
                  name="clinicalSymptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{formType === 'keswan' ? 'Gejala Klinis' : 'Sindrom'}</FormLabel>
                      {formType === 'priority' ? (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Sindrom Prioritas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {prioritySyndromeOptions.map((option) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Textarea placeholder="Deskripsi gejala klinis" {...field} />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                 <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnosa</FormLabel>
                      {formType === 'priority' ? (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Diagnosa Prioritas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {priorityDiagnosisOptions.map((option) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                            <Textarea placeholder="Diagnosa penyakit" {...field} className="min-h-[60px]" />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-2">
                <FormField
                  control={form.control}
                  name="treatmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Jenis Penanganan
                      </FormLabel>
                      {showManualTreatmentType ? (
                        <FormControl>
                          <Input
                            placeholder="Masukkan jenis penanganan"
                            {...field}
                          />
                        </FormControl>
                      ) : (
                        <Select
                          onValueChange={(value) => {
                            if (value === 'Lainnya') {
                              setShowManualTreatmentType(true);
                              field.onChange('');
                            } else {
                              field.onChange(value);
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Jenis Penanganan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {treatmentTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>
                      Pengobatan
                    </Label>
                  </div>

                  {treatmentFields.map((item, index) => {
                    const selectedMedicineType = watchedTreatments?.[index]?.medicineType as MedicineType;
                    const medicineNameValue = form.watch(`treatments.${index}.medicineName`);
                    const isManualMedicineName = medicineNameValue === 'Lainnya';
                    const dosageUnitValue = form.watch(`treatments.${index}.dosageUnit`);
                    const isManualDosageUnit = dosageUnitValue === 'Lainnya';
                    const isMedicineTypeLainnya = selectedMedicineType === 'Lainnya';

                    return (
                      <Card key={item.id} className="relative p-4 bg-card">
                         {treatmentFields.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute -top-1 -right-1 h-6 w-6"
                                onClick={() => removeTreatment(index)}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`treatments.${index}.medicineType`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Jenis Obat</FormLabel>
                                <Select
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    form.setValue(`treatments.${index}.medicineName`, '');
                                }}
                                defaultValue={field.value}
                                >
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Pilih Jenis" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {medicineTypes.map((type) => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                          />
                           <FormField
                            control={form.control}
                            name={`treatments.${index}.medicineName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nama Obat</FormLabel>
                                {isMedicineTypeLainnya || isManualMedicineName ? (
                                   <FormControl>
                                      <Input
                                        placeholder="Masukkan nama obat"
                                        {...field}
                                        value={field.value === 'Lainnya' ? '' : field.value}
                                        onChange={(e) => field.onChange(e.target.value)}
                                      />
                                    </FormControl>
                                ) : (
                                  <Select
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                    }}
                                    value={field.value}
                                    disabled={!selectedMedicineType}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Pilih Obat" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {selectedMedicineType && medicineData[selectedMedicineType] ? (
                                        medicineData[selectedMedicineType].map((drug) => (
                                          <SelectItem key={drug} value={drug}>
                                            {drug}
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <SelectItem value="-" disabled>
                                          Pilih jenis dahulu
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="space-y-2">
                            <FormLabel>Dosis</FormLabel>
                            <div className="grid grid-cols-2 gap-2">
                              <FormField
                                  control={form.control}
                                  name={`treatments.${index}.dosageValue`}
                                  render={({ field }) => (
                                  <FormItem>
                                      <FormControl>
                                        <Input type="number" step="0.001" placeholder="Jumlah" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                                  )}
                              />
                               <FormField
                                control={form.control}
                                name={`treatments.${index}.dosageUnit`}
                                render={({ field }) => (
                                  <FormItem>
                                    {isManualDosageUnit ? (
                                       <FormControl>
                                          <Input
                                            placeholder="Satuan"
                                            {...field}
                                            value={field.value === 'Lainnya' ? '' : field.value}
                                            onChange={(e) => field.onChange(e.target.value)}
                                          />
                                        </FormControl>
                                    ) : (
                                      <Select
                                        onValueChange={(value) => {
                                          if (value === 'Lainnya') {
                                            field.onChange('Lainnya');
                                          } else {
                                            field.onChange(value);
                                          }
                                        }}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Satuan" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {dosageUnits.map((unit) => (
                                            <SelectItem key={unit} value={unit}>
                                              {unit}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                  <div className="flex justify-start">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={() => appendTreatment({ medicineType: "", medicineName: "", dosageValue: 0, dosageUnit: "ml" }, { shouldFocus: false })}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Tambah
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="space-y-4">
                    <div>
                        <Label>
                          Perkembangan Kasus
                        </Label>
                    </div>

                    {caseDevelopmentFields.map((item, index) => (
                        <Card key={item.id} className="relative p-4 bg-card">
                        {caseDevelopmentFields.length > 1 && (
                            <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute -top-1 -right-1 h-6 w-6"
                            onClick={() => removeCaseDevelopment(index)}
                            >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <FormField
                            control={form.control}
                            name={`caseDevelopments.${index}.count`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Jumlah</FormLabel>
                                <FormControl>
                                    <Input
                                    type="number"
                                    placeholder="Jumlah"
                                    {...field}
                                    onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name={`caseDevelopments.${index}.status`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Keterangan</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Status" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {caseStatusOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                        {option}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                        </Card>
                    ))}
                    <div className="flex justify-start">
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="bg-accent text-accent-foreground hover:bg-accent/90"
                            onClick={() => appendCaseDevelopment({ status: "", count: 1 }, { shouldFocus: false })}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah
                        </Button>
                    </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="font-normal text-sm">
                    Upload Foto Pelayanan
                    <span className="ml-2 text-xs italic font-normal text-muted-foreground">
                      (Opsional, Maks 2MB)
                    </span>
                  </Label>
                </div>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg p-6 hover:bg-muted/50 transition-colors">
                  {watchedPhotoUrl ? (
                    <div className="relative w-full aspect-video">
                      <Image 
                        src={watchedPhotoUrl} 
                        alt="Service documentation preview" 
                        fill 
                        className="object-contain rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-lg"
                        onClick={removePhoto}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Belum ada foto yang diunggah</p>
                    </div>
                  )}
                  <div className="mt-4">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      {watchedPhotoUrl ? (
                        <><ImageIcon className="h-4 w-4" /> Ganti Foto</>
                      ) : (
                        <><Upload className="h-4 w-4" /> Pilih Foto</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex justify-start md:justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Simpan Perubahan' : 'Simpan Data'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
