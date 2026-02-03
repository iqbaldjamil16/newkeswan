
export const puskeswanList = [
  'Puskeswan Budong-Budong',
  'Puskeswan Karossa',
  'Puskeswan Pangale',
  'Puskeswan Tobadak',
  'Puskeswan Topoyo',
];

export const karossaDesaList = [
    "Benggaulu",
    "Kadaila",
    "Karossa",
    "Kayucalla",
    "Kambunong",
    "Lara",
    "Lembah Hopo",
    "Salubiro",
    "Sanjango",
    "Sukamaju",
    "Tasoskko",
    "Mora IV",
    "UPT Lara III",
    "Lainnya",
].sort((a, b) => {
    if (a === "Lainnya") return 1;
    if (b === "Lainnya") return -1;
    return a.localeCompare(b);
});

export const budongBudongDesaList = [
    "Babana",
    "Barakkang",
    "Kire",
    "Lumu",
    "Pasapa",
    "Salumanurung",
    "Tinali",
    "Bojo",
    "Lembah Hada",
    "Salogatta",
    "Potantanakayyang",
    "Lainnya",
].sort((a, b) => {
    if (a === "Lainnya") return 1;
    if (b === "Lainnya") return -1;
    return a.localeCompare(b);
});

export const pangaleDesaList = [
    "Kombiling",
    "Kuo",
    "Lamba-lamba",
    "Lemo-Lemo",
    "Pangale",
    "Polo Camba",
    "Polo Lereng",
    "Polo Pangale",
    "Sartanamaju",
    "Lainnya",
].sort((a, b) => {
    if (a === "Lainnya") return 1;
    if (b === "Lainnya") return -1;
    return a.localeCompare(b);
});

export const tobadakDesaList = [
    "Bambadaru",
    "Batu Parigi",
    "Mahahe",
    "Polongaan",
    "Saluadak",
    "Sejati",
    "Sulobaja",
    "Tobadak",
    "Lainnya",
].sort((a, b) => {
    if (a === "Lainnya") return 1;
    if (b === "Lainnya") return -1;
    return a.localeCompare(b);
});

export const topoyoDesaList = [
    "Bambamanurug",
    "Budong-Budong",
    "Kabubu",
    "Pangalloang",
    "Paraili",
    "Salule'bo",
    "Salupangkang",
    "Salupangkang IV",
    "Sinabatta",
    "Tabolang",
    "Tangkau",
    "Tappilina",
    "Topoyo",
    "Tumbu",
    "Waeputeh",
    "Lainnya",
].sort((a, b) => {
    if (a === "Lainnya") return 1;
    if (b === "Lainnya") return -1;
    return a.localeCompare(b);
});

export const budongBudongOfficerList = [
    "Anshari Saleh",
    "Suprapto",
    "Nur Fauzi",
    "Hadi",
    "Rahman",
    "Tadi Sole",
    "Lainnya",
].sort((a, b) => {
    if (a === "Lainnya") return 1;
    if (b === "Lainnya") return -1;
    return a.localeCompare(b);
});

export const karossaOfficerList = [
    "Asari Rasyid",
    "drh. Stephani",
    "Basuki Budianto",
    "Hasaruddin",
    "Nasaruddin",
    "Lainnya",
].sort((a, b) => {
    if (a === "Lainnya") return 1;
    if (b === "Lainnya") return -1;
    return a.localeCompare(b);
});

export const pangaleOfficerList = [
    "Kamarudin",
    "Kamaruddin",
    "drh. Ketut Elok",
    "Mansyur",
    "Jawaril",
    "Sugeng",
    "Lainnya",
].sort((a, b) => {
    if (a === "Lainnya") return 1;
    if (b === "Lainnya") return -1;
    return a.localeCompare(b);
});

export const tobadakOfficerList = [
    "Endang",
    "Jupry",
    "drh. M Ishak",
    "Aser M",
    "Lainnya",
].sort((a, b) => {
    if (a === "Lainnya") return 1;
    if (b === "Lainnya") return -1;
    return a.localeCompare(b);
});

export const topoyoOfficerList = [
    "drh. Iqbal Djamil",
    "Alfons B",
    "Haslim",
    "Lainnya",
].sort((a, b) => {
    if (a === "Lainnya") return 1;
    if (b === "Lainnya") return -1;
    return a.localeCompare(b);
});


export const livestockTypes = [
  'Anjing',
  'Anjing Ras',
  'Ayam Buras',
  'Ayam Domestik',
  'Ayam Petelur',
  'Babi',
  'Burung',
  'Itik',
  'Kambing Jawa Randu',
  'Kambing Kacang',
  'Kambing PE',
  'Kerbau',
  'Kucing Bengal',
  'Kucing British',
  'Kucing Domestik',
  'Kucing Himalaya',
  'Kucing MixDom',
  'Kucing Persia',
  'Kuda',
  'Manila',
  'Sapi Angus',
  'Sapi Bali',
  'Sapi Limosin',
  'Sapi Simental',
  'Lainnya',
];

export const treatmentTypes = [
  'Injeksi',
  'Per Oral',
  'Kutaneus/Topikal',
  'Subkutaneus',
  'Intravena',
  'Intrauteri',
  'Intraanal',
  'Intramamae',
  'Lainnya',
];

export const dosageUnits = [
  'ml',
  'mg',
  'g',
  'Bolus',
  'Kaplet',
  'Lainnya',
];

export const medicineData = {
  Antibiotik: [
    'Colibact Bolus',
    'Duodin',
    'Gusanex',
    'Interflox',
    'Intramox La',
    'Kaloxy La',
    'Limoxin La',
    'Limoxin Spray',
    'Medoxy La',
    'Penstrep',
    'Proxy Vet La',
    'Sulfastrong',
    'Vet Oxy La',
    'Vet oxy sb',
    'Lainnya',
  ],
  'Anti Radang Analgesia & Piretik': [
    'Dexapros',
    'Glucortin-20',
    'Sulpidon',
    'Sulprodon',
    'Lainnya',
  ],
  Vitamin: [
    'B12',
    'B Kompleks',
    'B komp bolus',
    'Biodin',
    'Biopros',
    'Calcidex',
    'Fertilife',
    'Hematodin',
    'Injectamin',
    'Pro B Plek',
    'Vitol',
    'Lainnya',
  ],
  'Anti Helminthiasis & Ektoparasit': [
    'Fluconix',
    'Flukicide',
    'Intermectin',
    'Ivomec',
    'Verm O Bolus',
    'Verm O Kaplet',
    'Verm O Pros Bolus',
    'Wormectin',
    'Wormzole Bolus',
    'Lainnya',
  ],
  Hormon: ['Capriglandin', 'Intracin', 'Juramate', 'Ovalumon', 'Pgf2@', 'Lainnya'],
  Anastesia: ['Ketamine', 'Lidocain', 'Lainnya'],
  Sedasi: ['Xylazine', 'Lainnya'],
  Antialergi: ['Vetadryl', 'Prodryl', 'Lainnya'],
  Antibloat: ['Antibloat', 'Tympanol', 'Lainnya'],
  'Susu Mineral & As. Amino': [
    'Lactomax',
    'Lactova',
    'Langantor',
    'Maxinos',
    'Mineral Permix',
    'Mineral-10',
    'Pigmix',
    'ProLac',
    'Susu Nutrinos',
    'Ultra Mineral',
    'Lainnya',
  ],
  Lainnya: [],
};

export type MedicineType = keyof typeof medicineData;

export const medicineTypes = Object.keys(medicineData) as MedicineType[];

export const caseStatusOptions = [
  'Sembuh',
  'Tidak Sembuh',
  'Mati',
];

export const priorityOfficerList = [
    'drh. M Ishak',
    'drh. Iqbal Djamil',
    'drh. Stephani',
    'drh. Ketut Elok',
].sort();

export const prioritySyndromeOptions = [
  'Mati Meningkat Pada Unggas',
  'Mati Mendadak',
  'Gila Galak',
  'Demam Pada Babi',
  'Keguguran atau Sendi Bengkak',
  'Pincang AirLiur dan Lepuh',
  'Penyakit Luar Biasa',
  'Keringat Berdarah',
];

export const priorityDiagnosisOptions = [
  'Flu Burung',
  'Rabies',
  'Brucellosis',
  'Penyakit Mulut dan Kuku (PMK)',
  'Jembrana',
  'Lumpy Skin Disease (LSD)',
  'African Swine Fever (ASF)',
  'Anthrax',
].sort();
