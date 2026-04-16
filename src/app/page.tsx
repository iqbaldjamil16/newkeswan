'use client';

import { useState } from 'react';
import { ServiceForm } from "@/components/service-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Star, Copy, Check } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DataSummaryCard } from "@/components/data-summary-card";

export default function Home() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const linkToCopy = "https://newkeswan.vercel.app/";

  const handleCopy = () => {
    navigator.clipboard.writeText(linkToCopy).then(() => {
      setCopied(true);
      toast({
        title: "Disalin!",
        description: "Tautan berhasil disalin ke clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Gagal menyalin: ', err);
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Tidak dapat menyalin tautan.",
      });
    });
  };

  return (
    <div className="container px-3 sm:px-8 py-4 md:py-8">
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="keswan" className="w-full">
            <Card>
                <CardContent className="p-4 sm:p-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="keswan">
                            <FileText className="mr-2 h-4 w-4" />
                            Lap. Keswan
                        </TabsTrigger>
                        <TabsTrigger value="prioritas">
                            <Star className="mr-2 h-4 w-4" />
                            Lap. Prioritas
                        </TabsTrigger>
                    </TabsList>
                </CardContent>
            </Card>

            <TabsContent value="keswan" className="mt-6 md:mt-8">
                <div className="flex flex-col md:flex-row gap-4 mb-6 md:mb-8">
                    <Card className="flex-1">
                        <CardHeader>
                            <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Pelayanan Kesehatan Hewan</CardTitle>
                            <CardDescription className="text-muted-foreground pt-2 text-sm md:text-base">
                            Input detail pelayanan yang telah dilakukan
                            </CardDescription>
                            <div className="flex items-center gap-2">
                                <a href={linkToCopy} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 italic underline text-sm">
                                    {linkToCopy}
                                </a>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={handleCopy}
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    <span className="sr-only">Salin tautan</span>
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>
                    <DataSummaryCard />
                </div>
                <div className="mt-6 md:mt-8">
                    <ServiceForm formType="keswan" />
                </div>
            </TabsContent>
            <TabsContent value="prioritas" className="mt-6 md:mt-8">
                <div className="flex flex-col md:flex-row gap-4 mb-6 md:mb-8">
                    <Card className="flex-1">
                        <CardHeader>
                            <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Laporan Prioritas</CardTitle>
                            <CardDescription className="text-muted-foreground pt-2 text-sm md:text-base">
                                Input detail laporan prioritas.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <DataSummaryCard />
                </div>
                <div className="mt-6 md:mt-8">
                    <ServiceForm formType="priority" />
                </div>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
