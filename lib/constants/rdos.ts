export interface BIRRDO {
  code: string;
  name: string;
  region: string;
}

export const BIR_RDOS: BIRRDO[] = [
  // NCR
  { code: "024", name: "024 - Valenzuela City", region: "NCR" },
  { code: "025A", name: "025A - West Bulacan", region: "Region 3" },
  { code: "025B", name: "025B - East Bulacan", region: "Region 3" },
  { code: "026", name: "026 - Malabon / Navotas", region: "NCR" },
  { code: "027", name: "027 - Caloocan City", region: "NCR" },
  { code: "028", name: "028 - Novaliches", region: "NCR" },
  { code: "029", name: "029 - Tondo / San Nicolas", region: "NCR" },
  { code: "030", name: "030 - Binondo", region: "NCR" },
  { code: "031", name: "031 - Sta. Cruz", region: "NCR" },
  { code: "032", name: "032 - Quiapo / San Miguel", region: "NCR" },
  { code: "033", name: "033 - Intramuros / Ermita / Malate", region: "NCR" },
  { code: "034", name: "034 - Paco / Pandacan / Sta. Ana", region: "NCR" },
  { code: "038", name: "038 - North Quezon City", region: "NCR" },
  { code: "039", name: "039 - South Quezon City", region: "NCR" },
  { code: "040", name: "040 - Cubao, Quezon City", region: "NCR" },
  { code: "041", name: "041 - Mandaluyong City", region: "NCR" },
  { code: "042", name: "042 - San Juan City", region: "NCR" },
  { code: "043", name: "043 - Pasig City", region: "NCR" },
  { code: "044", name: "044 - Taguig / Pateros", region: "NCR" },
  { code: "045", name: "045 - Marikina City", region: "NCR" },
  { code: "046", name: "046 - Cainta / Taytay / Angono (Rizal)", region: "Region 4A" },
  { code: "047", name: "047 - East Makati", region: "NCR" },
  { code: "048", name: "048 - West Makati", region: "NCR" },
  { code: "049", name: "049 - North Makati", region: "NCR" },
  { code: "050", name: "050 - South Makati", region: "NCR" },
  { code: "051", name: "051 - Pasay City", region: "NCR" },
  { code: "052", name: "052 - Parañaque City", region: "NCR" },
  { code: "053A", name: "053A - Las Piñas City", region: "NCR" },
  { code: "053B", name: "053B - Muntinlupa City", region: "NCR" },

  // CALABARZON (Region 4A)
  { code: "054A", name: "054A - Trece Martires, Cavite", region: "Region 4A" },
  { code: "054B", name: "054B - Bacoor, Cavite", region: "Region 4A" },
  { code: "055", name: "055 - East Laguna / San Pablo City", region: "Region 4A" },
  { code: "056", name: "056 - Central Laguna / Calamba", region: "Region 4A" },
  { code: "057", name: "057 - West Laguna / Biñan", region: "Region 4A" },
  { code: "058", name: "058 - Batangas City", region: "Region 4A" },
  { code: "059", name: "059 - Lipa City", region: "Region 4A" },
  { code: "060", name: "060 - Lucena City, Quezon", region: "Region 4A" },

  // Central Luzon (Region 3)
  { code: "017A", name: "017A - Tarlac City", region: "Region 3" },
  { code: "020", name: "020 - Balanga, Bataan", region: "Region 3" },
  { code: "021A", name: "021A - North Pampanga (Angeles)", region: "Region 3" },
  { code: "021B", name: "021B - South Pampanga (San Fernando)", region: "Region 3" },
  { code: "022", name: "022 - Olongapo City / Zambales", region: "Region 3" },

  // North / South Luzon
  { code: "008", name: "008 - Baguio City", region: "CAR" },
  { code: "009", name: "009 - La Trinidad, Benguet", region: "CAR" },
  { code: "003", name: "003 - San Fernando, La Union", region: "Region 1" },
  { code: "004", name: "004 - Calasiao, Central Pangasinan", region: "Region 1" },
  { code: "065", name: "065 - Naga City, Camarines Sur", region: "Region 5" },
  { code: "067", name: "067 - Legazpi City, Albay", region: "Region 5" },

  // Visayas
  { code: "071", name: "071 - Kalibo, Aklan", region: "Region 6" },
  { code: "072", name: "072 - Roxas City, Capiz", region: "Region 6" },
  { code: "074", name: "074 - Iloilo City", region: "Region 6" },
  { code: "077", name: "077 - Bacolod City", region: "Region 6" },
  { code: "080", name: "080 - Mandaue City, Cebu", region: "Region 7" },
  { code: "081", name: "081 - Cebu City North", region: "Region 7" },
  { code: "082", name: "082 - Cebu City South", region: "Region 7" },
  { code: "083", name: "083 - Talisay, Cebu", region: "Region 7" },
  { code: "084", name: "084 - Tagbilaran, Bohol", region: "Region 7" },
  { code: "088", name: "088 - Tacloban City, Leyte", region: "Region 8" },

  // Mindanao
  { code: "093A", name: "093A - Zamboanga City", region: "Region 9" },
  { code: "098", name: "098 - Cagayan de Oro City", region: "Region 10" },
  { code: "107", name: "107 - Cotabato City", region: "Region 12" },
  { code: "110", name: "110 - General Santos City", region: "Region 12" },
  { code: "112", name: "112 - Tagum, Davao del Norte", region: "Region 11" },
  { code: "113A", name: "113A - West Davao City", region: "Region 11" },
  { code: "113B", name: "113B - East Davao City", region: "Region 11" },
];
