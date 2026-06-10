'use client';

import { useMemo } from 'react';
import { format } from "date-fns";
import { id } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell, PieChart, Pie, Legend } from 'recharts';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { type HealthcareService } from "@/lib/types";
import { priorityDiagnosisOptions } from "@/lib/definitions";
import { useIsMobile } from "@/hooks/use-mobile";

interface StatItem {
  name: string;
  count: number;
}

function calculateStats(services: HealthcareService[], groupBy: 'month' | 'officerName' | 'puskeswan' | 'diagnosis'): StatItem[] {
  if (services.length === 0) return [];

  const counts: { [key: string]: number } = {};

  services.forEach(service => {
      let key: string;
      if (groupBy === 'month') {
          key = format(new Date(service.date), 'MMMM yyyy', { locale: id });
      } else {
          key = service[groupBy as keyof Omit<HealthcareService, 'date'>] as string;
      }
      counts[key] = (counts[key] || 0) + service.livestockCount;
  });

  return Object.entries(counts)
      .map(([name, count]) => ({
          name,
          count,
      }))
      .sort((a, b) => b.count - a.count);
}

const StatChart = ({
  title,
  data,
  officerToPuskeswanMap,
  puskeswanColors,
  defaultColor,
  showAll = false,
}: {
  title: string;
  data: StatItem[];
  officerToPuskeswanMap?: { [key: string]: string };
  puskeswanColors?: { [key: string]: string };
  defaultColor?: string;
  showAll?: boolean;
}) => {
  const isMobile = useIsMobile();
  
  const chartData = useMemo(() => {
    if (!data) return [];
    return showAll ? data : data.slice(0, 10);
  }, [data, showAll]);

  const yAxisWidth = isMobile ? 120 : 180;
  const rightMargin = isMobile ? 50 : 80;

  const barHeight = (title.includes("Kerbau") || title.includes("Statistik per Bulan")) ? 16 : 28;
  const minChartHeight = (title.includes("Kerbau") || title.includes("Statistik per Bulan")) ? 80 : 150;
  const chartHeight = Math.max(minChartHeight, chartData.length * barHeight);


  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0">
        <CardTitle className="text-base font-semibold text-left">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: rightMargin, left: 0, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                stroke="hsl(var(--muted-foreground))"
                fontSize={isMobile ? 10 : 11}
                interval={0}
                width={yAxisWidth}
                tickFormatter={(value) => value}
                tick={{ fontWeight: 'normal' }}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div
                        className="rounded-lg border bg-background p-2 shadow-sm text-sm"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <span className="font-bold">{label}</span>
                        <span className="text-muted-foreground ml-2">
                          {`Jumlah: ${payload[0].value} Ekor`}
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
                <Bar
                  dataKey="count"
                  name="Jumlah Ternak"
                  animationDuration={2000}
                  radius={[0, 4, 4, 0]}
                >
                  <LabelList
                      dataKey="count"
                      position="right"
                      offset={8}
                      className="font-semibold"
                      fill="hsl(var(--foreground))"
                      fontSize={isMobile ? 10 : 11}
                  />
                  {(chartData as StatItem[]).map((entry, index) => {
                      let color = defaultColor || '#26592b';
                      if (title.startsWith('Kasus')) {
                        color = '#26592b';
                      } else if (title === 'Statistik per Bulan') {
                          color = '#FA8072';
                      } else if (title === 'Statistik per Petugas') {
                        const puskeswan = officerToPuskeswanMap?.[entry.name];
                        if (puskeswan) {
                          color = puskeswanColors?.[puskeswan] || color;
                        }
                      } else if (title === 'Statistik per Puskeswan') {
                        color = puskeswanColors?.[entry.name] || color;
                      }
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                </Bar>
            </BarChart>
          </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const StatPieChart = ({ title, data, colors, defaultColor }: {
  title: string;
  data: StatItem[];
  colors: { [key: string]: string };
  defaultColor: string;
}) => {
  const isMobile = useIsMobile();
  const total = useMemo(() => data.reduce((sum, item) => sum + item.count, 0), [data]);
  const isPuskeswanChart = title === 'Statistik per Puskeswan';


  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-bold"
        style={{ textShadow: '0px 1px 2px rgba(0, 0, 0, 0.8)' }}
      >
        {value}
      </text>
    );
  };

  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-left">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                  <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={isMobile ? 80 : 100}
                      innerRadius={isMobile ? 30 : 40}
                      dataKey="count"
                      nameKey="name"
                      animationDuration={1500}
                  >
                      {data.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={colors[entry.name] || defaultColor} stroke={'hsl(var(--card))'} strokeWidth={2}/>
                      ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0];
                        const percentage = total > 0 ? (((item.value as number) / total) * 100).toFixed(1) : 0;
                        const name = item.name as string;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
                            <span className="font-bold">{name}: </span>
                            <span className="text-muted-foreground">
                              {`${item.value} ternak (${percentage}%)`}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign={"bottom"}
                    align={"center"}
                    layout={'vertical'}
                    wrapperStyle={{
                      fontSize: '12px',
                      paddingLeft: '0px',
                      color: 'hsl(var(--foreground))'
                    }}
                    iconSize={12}
                    iconType="circle"
                    formatter={(value) => <span style={{color: 'hsl(var(--foreground))'}}>{value}</span>}
                  />
              </PieChart>
          </ResponsiveContainer>
          {total > 0 && (
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={isPuskeswanChart ? { transform: 'translateY(-38px)' } : {}}
            >
              <span className="text-xl font-bold text-foreground">
                {total}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

function getGenericLivestockType(type: string): string {
    const trimmedType = type.trim();
    const lowerType = trimmedType.toLowerCase();
    if (lowerType.startsWith('sapi')) return 'Sapi';
    if (lowerType.startsWith('kambing')) return 'Kambing';
    if (lowerType.startsWith('ayam')) return 'Ayam';
    if (lowerType.startsWith('kucing')) return 'Kucing';
    if (lowerType.startsWith('anjing')) return 'Anjing';
    return trimmedType; 
}

export default function StatisticsDisplay({ services }: { services: HealthcareService[] }) {
  if (services.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-left">Statistik Belum Tersedia</CardTitle>
          <CardDescription>
            Tidak ada data untuk ditampilkan statistiknya pada periode yang
            dipilih.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const priorityServices = services.filter((service) =>
    priorityDiagnosisOptions.includes(service.diagnosis)
  );
  const keswanServices = services.filter(
    (service) => !priorityDiagnosisOptions.includes(service.diagnosis)
  );

  const statsByMonth = calculateStats(services, 'month');
  const statsByOfficer = calculateStats(services, 'officerName');
  const statsByPuskeswan = calculateStats(services, 'puskeswan');

  const statsByDiagnosisAndAnimal: {
    [animalType: string]: { [diagnosis: string]: number };
  } = {};
  keswanServices.forEach((service) => {
    const genericType = getGenericLivestockType(service.livestockType.trim());
    if (!statsByDiagnosisAndAnimal[genericType]) {
      statsByDiagnosisAndAnimal[genericType] = {};
    }
    const diagnosis = service.diagnosis.trim();
    statsByDiagnosisAndAnimal[genericType][diagnosis] = (statsByDiagnosisAndAnimal[genericType][diagnosis] || 0) + service.livestockCount;
  });

  const diagnosisCharts = Object.entries(statsByDiagnosisAndAnimal)
    .sort(([animalA], [animalB]) => animalA.localeCompare(animalB))
    .map(([animalType, diagnoses]) => {
      const chartData: StatItem[] = Object.entries(diagnoses)
        .map(([name, count]) => ({ name, count }))
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count);

      if (chartData.length === 0) return null;

      return (
        <Card key={animalType}>
            <CardContent className="pt-6">
                <StatChart
                    title={`Statistik Kasus/Penyakit - ${animalType}`}
                    data={chartData}
                    showAll={true}
                />
            </CardContent>
        </Card>
      );
    })
    .filter(Boolean);

  const officerToPuskeswanMap: { [key: string]: string } = {};
  services.forEach((service) => {
    if (
      service.officerName &&
      service.puskeswan &&
      !officerToPuskeswanMap[service.officerName]
    ) {
      officerToPuskeswanMap[service.officerName] = service.puskeswan;
    }
  });

  const priorityDiagnosisStats = calculateStats(priorityServices, 'diagnosis');

  const puskeswanColors: { [key: string]: string } = {
    'Puskeswan Topoyo': '#00008B',
    'Puskeswan Tobadak': '#006400',
    'Puskeswan Karossa': '#800080',
    'Puskeswan Budong-Budong': '#f0c419',
    'Puskeswan Pangale': '#FF0000',
  };
  const defaultColor = '#808080';

  const caseStatusColors = {
    Sembuh: '#006400',
    'Tidak Sembuh': '#f0c419',
    Mati: '#FF0000',
  };
  const defaultCaseStatusColor = '#808080';

  function calculateCaseDevelopmentStats(
    services: HealthcareService[]
  ): StatItem[] {
    const stats: { [key: string]: number } = {};
    services.forEach((service) => {
      if (service.caseDevelopments) {
        service.caseDevelopments.forEach((dev) => {
          if (dev.status) {
            stats[dev.status] = (stats[dev.status] || 0) + dev.count;
          }
        });
      }
    });
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  const keswanCaseDevelopmentStats = calculateCaseDevelopmentStats(keswanServices);
  const priorityCaseDevelopmentStats =
    calculateCaseDevelopmentStats(priorityServices);

  // --- Logic for Detailed Stats per Puskeswan ---
  const detailedPuskeswanStats = useMemo(() => {
    const map: Record<string, Record<string, Record<string, number>>> = {};
    
    services.forEach(service => {
      const pw = service.puskeswan;
      const animal = getGenericLivestockType(service.livestockType);
      const diagnosis = service.diagnosis.trim();
      
      if (!map[pw]) map[pw] = {};
      if (!map[pw][animal]) map[pw][animal] = {};
      map[pw][animal][diagnosis] = (map[pw][animal][diagnosis] || 0) + service.livestockCount;
    });

    return map;
  }, [services]);

  const sortedPuskeswans = Object.keys(detailedPuskeswanStats).sort();

  return (
    <div className="space-y-6">
      <StatChart
        title="Statistik per Bulan"
        data={statsByMonth}
        officerToPuskeswanMap={officerToPuskeswanMap}
        puskeswanColors={puskeswanColors}
        defaultColor={defaultColor}
      />
      <StatChart
        title="Statistik per Petugas"
        data={statsByOfficer}
        officerToPuskeswanMap={officerToPuskeswanMap}
        puskeswanColors={puskeswanColors}
        defaultColor={defaultColor}
        showAll={true}
      />
      <PieChartContainer /> {/* Placeholder for consistency if needed, but the original has PieChart below global stats */}
      <StatPieChart
        title="Statistik per Puskeswan"
        data={statsByPuskeswan}
        colors={puskeswanColors}
        defaultColor={defaultColor}
      />

      {/* --- Detailed Breakdown Section per Puskeswan --- */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold px-1">Statistik Kasus per Puskeswan</h2>
        {sortedPuskeswans.map(pwName => (
          <Card key={pwName} className="border rounded-lg shadow-sm">
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle className="text-lg font-bold">{pwName}</CardTitle>
              <CardDescription>Rincian kasus dan diagnosa penyakit di wilayah {pwName}.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              {Object.entries(detailedPuskeswanStats[pwName])
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([animalType, diagnoses]) => {
                  const chartData = Object.entries(diagnoses)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count);
                        
                  return (
                    <StatChart
                      key={`${pwName}-${animalType}`}
                      title={`Kasus ${animalType} di ${pwName}`}
                      data={chartData}
                      showAll={true}
                      defaultColor={puskeswanColors[pwName]}
                    />
                  );
                })}
            </CardContent>
            <CardFooter className="flex justify-end border-t bg-muted/5 py-3">
               <span className="text-sm font-bold text-primary">
                  Total: {Object.values(detailedPuskeswanStats[pwName]).reduce((acc, animalMap) => 
                    acc + Object.values(animalMap).reduce((sum, count) => sum + count, 0), 0
                  )} Ekor
               </span>
            </CardFooter>
          </Card>
        ))}
      </div>

      {priorityDiagnosisStats.length > 0 && (
        <Card>
            <CardContent className="pt-6">
                <StatChart
                title="Statistik Kasus/Penyakit Prioritas"
                data={priorityDiagnosisStats}
                showAll={true}
                />
            </CardContent>
        </Card>
      )}
      {keswanCaseDevelopmentStats.length > 0 && (
        <StatPieChart
          title="Statistik Perkembangan Kasus"
          data={keswanCaseDevelopmentStats}
          colors={caseStatusColors}
          defaultColor={defaultCaseStatusColor}
        />
      )}
      {priorityCaseDevelopmentStats.length > 0 && (
        <StatPieChart
          title="Statistik Perkembangan Kasus Prioritas"
          data={priorityCaseDevelopmentStats}
          colors={caseStatusColors}
          defaultColor={defaultCaseStatusColor}
        />
      )}
      {diagnosisCharts}
    </div>
  );
}

// Dummy for layout consistency if needed by the component's internal logic
function PieChartContainer() { return null; }
