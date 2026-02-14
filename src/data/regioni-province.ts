export interface Provincia {
  nome: string;
  sigla: string;
}

export interface Regione {
  nome: string;
  province: Provincia[];
}

export const REGIONI_E_PROVINCE: Regione[] = [
  {
    nome: "Abruzzo",
    province: [
      { nome: "L'Aquila", sigla: "AQ" },
      { nome: "Chieti", sigla: "CH" },
      { nome: "Pescara", sigla: "PE" },
      { nome: "Teramo", sigla: "TE" }
    ]
  },
  {
    nome: "Basilicata",
    province: [
      { nome: "Matera", sigla: "MT" },
      { nome: "Potenza", sigla: "PZ" }
    ]
  },
  {
    nome: "Calabria",
    province: [
      { nome: "Catanzaro", sigla: "CZ" },
      { nome: "Cosenza", sigla: "CS" },
      { nome: "Crotone", sigla: "KR" },
      { nome: "Reggio Calabria", sigla: "RC" },
      { nome: "Vibo Valentia", sigla: "VV" }
    ]
  },
  {
    nome: "Campania",
    province: [
      { nome: "Avellino", sigla: "AV" },
      { nome: "Benevento", sigla: "BN" },
      { nome: "Caserta", sigla: "CE" },
      { nome: "Napoli", sigla: "NA" },
      { nome: "Salerno", sigla: "SA" }
    ]
  },
  {
    nome: "Emilia-Romagna",
    province: [
      { nome: "Bologna", sigla: "BO" },
      { nome: "Ferrara", sigla: "FE" },
      { nome: "Forlì-Cesena", sigla: "FC" },
      { nome: "Modena", sigla: "MO" },
      { nome: "Parma", sigla: "PR" },
      { nome: "Piacenza", sigla: "PC" },
      { nome: "Ravenna", sigla: "RA" },
      { nome: "Reggio Emilia", sigla: "RE" },
      { nome: "Rimini", sigla: "RN" }
    ]
  },
  {
    nome: "Friuli-Venezia Giulia",
    province: [
      { nome: "Gorizia", sigla: "GO" },
      { nome: "Pordenone", sigla: "PN" },
      { nome: "Trieste", sigla: "TS" },
      { nome: "Udine", sigla: "UD" }
    ]
  },
  {
    nome: "Lazio",
    province: [
      { nome: "Frosinone", sigla: "FR" },
      { nome: "Latina", sigla: "LT" },
      { nome: "Rieti", sigla: "RI" },
      { nome: "Roma", sigla: "RM" },
      { nome: "Viterbo", sigla: "VT" }
    ]
  },
  {
    nome: "Liguria",
    province: [
      { nome: "Genova", sigla: "GE" },
      { nome: "Imperia", sigla: "IM" },
      { nome: "La Spezia", sigla: "SP" },
      { nome: "Savona", sigla: "SV" }
    ]
  },
  {
    nome: "Lombardia",
    province: [
      { nome: "Bergamo", sigla: "BG" },
      { nome: "Brescia", sigla: "BS" },
      { nome: "Como", sigla: "CO" },
      { nome: "Cremona", sigla: "CR" },
      { nome: "Lecco", sigla: "LC" },
      { nome: "Lodi", sigla: "LO" },
      { nome: "Mantova", sigla: "MN" },
      { nome: "Milano", sigla: "MI" },
      { nome: "Monza e Brianza", sigla: "MB" },
      { nome: "Pavia", sigla: "PV" },
      { nome: "Sondrio", sigla: "SO" },
      { nome: "Varese", sigla: "VA" }
    ]
  },
  {
    nome: "Marche",
    province: [
      { nome: "Ancona", sigla: "AN" },
      { nome: "Ascoli Piceno", sigla: "AP" },
      { nome: "Fermo", sigla: "FM" },
      { nome: "Macerata", sigla: "MC" },
      { nome: "Pesaro e Urbino", sigla: "PU" }
    ]
  },
  {
    nome: "Molise",
    province: [
      { nome: "Campobasso", sigla: "CB" },
      { nome: "Isernia", sigla: "IS" }
    ]
  },
  {
    nome: "Piemonte",
    province: [
      { nome: "Alessandria", sigla: "AL" },
      { nome: "Asti", sigla: "AT" },
      { nome: "Biella", sigla: "BI" },
      { nome: "Cuneo", sigla: "CN" },
      { nome: "Novara", sigla: "NO" },
      { nome: "Torino", sigla: "TO" },
      { nome: "Verbano-Cusio-Ossola", sigla: "VB" },
      { nome: "Vercelli", sigla: "VC" }
    ]
  },
  {
    nome: "Puglia",
    province: [
      { nome: "Bari", sigla: "BA" },
      { nome: "Barletta-Andria-Trani", sigla: "BT" },
      { nome: "Brindisi", sigla: "BR" },
      { nome: "Foggia", sigla: "FG" },
      { nome: "Lecce", sigla: "LE" },
      { nome: "Taranto", sigla: "TA" }
    ]
  },
  {
    nome: "Sardegna",
    province: [
      { nome: "Cagliari", sigla: "CA" },
      { nome: "Nuoro", sigla: "NU" },
      { nome: "Oristano", sigla: "OR" },
      { nome: "Sassari", sigla: "SS" },
      { nome: "Sud Sardegna", sigla: "SU" }
    ]
  },
  {
    nome: "Sicilia",
    province: [
      { nome: "Agrigento", sigla: "AG" },
      { nome: "Caltanissetta", sigla: "CL" },
      { nome: "Catania", sigla: "CT" },
      { nome: "Enna", sigla: "EN" },
      { nome: "Messina", sigla: "ME" },
      { nome: "Palermo", sigla: "PA" },
      { nome: "Ragusa", sigla: "RG" },
      { nome: "Siracusa", sigla: "SR" },
      { nome: "Trapani", sigla: "TP" }
    ]
  },
  {
    nome: "Toscana",
    province: [
      { nome: "Arezzo", sigla: "AR" },
      { nome: "Firenze", sigla: "FI" },
      { nome: "Grosseto", sigla: "GR" },
      { nome: "Livorno", sigla: "LI" },
      { nome: "Lucca", sigla: "LU" },
      { nome: "Massa-Carrara", sigla: "MS" },
      { nome: "Pisa", sigla: "PI" },
      { nome: "Pistoia", sigla: "PT" },
      { nome: "Prato", sigla: "PO" },
      { nome: "Siena", sigla: "SI" }
    ]
  },
  {
    nome: "Trentino-Alto Adige",
    province: [
      { nome: "Bolzano", sigla: "BZ" },
      { nome: "Trento", sigla: "TN" }
    ]
  },
  {
    nome: "Umbria",
    province: [
      { nome: "Perugia", sigla: "PG" },
      { nome: "Terni", sigla: "TR" }
    ]
  },
  {
    nome: "Valle d'Aosta",
    province: [
      { nome: "Aosta", sigla: "AO" }
    ]
  },
  {
    nome: "Veneto",
    province: [
      { nome: "Belluno", sigla: "BL" },
      { nome: "Padova", sigla: "PD" },
      { nome: "Rovigo", sigla: "RO" },
      { nome: "Treviso", sigla: "TV" },
      { nome: "Venezia", sigla: "VE" },
      { nome: "Verona", sigla: "VR" },
      { nome: "Vicenza", sigla: "VI" }
    ]
  }
];
