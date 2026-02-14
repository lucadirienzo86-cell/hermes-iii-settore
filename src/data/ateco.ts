export interface AtecoGruppo {
  codice: string;
  descrizione: string;
}

export interface AtecoDivisione {
  codice: string;
  descrizione: string;
  gruppi: AtecoGruppo[];
}

export interface AtecoSezione {
  codice: string;
  titolo: string;
  divisioni: AtecoDivisione[];
}

export const CODICI_ATECO: AtecoSezione[] = [
  {
    codice: "A",
    titolo: "AGRICOLTURA, SILVICOLTURA E PESCA",
    divisioni: [
      {
        codice: "01",
        descrizione: "Coltivazioni agricole e produzione di prodotti animali, caccia e servizi connessi",
        gruppi: [
          { codice: "01.1", descrizione: "Coltivazione di colture agricole non permanenti" },
          { codice: "01.2", descrizione: "Coltivazione di colture permanenti" },
          { codice: "01.3", descrizione: "Riproduzione delle piante" },
          { codice: "01.4", descrizione: "Allevamento di animali" },
          { codice: "01.5", descrizione: "Coltivazioni agricole associate all'allevamento di animali: attività mista" },
          { codice: "01.6", descrizione: "Attività di supporto all'agricoltura e attività successive alla raccolta" },
          { codice: "01.7", descrizione: "Caccia, cattura di animali e servizi connessi" }
        ]
      },
      {
        codice: "02",
        descrizione: "Silvicoltura ed utilizzo di aree forestali",
        gruppi: [
          { codice: "02.1", descrizione: "Silvicoltura e altre attività forestali" },
          { codice: "02.2", descrizione: "Utilizzo di aree forestali" },
          { codice: "02.3", descrizione: "Raccolta di prodotti selvatici non legnosi" },
          { codice: "02.4", descrizione: "Servizi di supporto per la silvicoltura" }
        ]
      },
      {
        codice: "03",
        descrizione: "Pesca e acquacoltura",
        gruppi: [
          { codice: "03.1", descrizione: "Pesca" },
          { codice: "03.2", descrizione: "Acquacoltura" }
        ]
      }
    ]
  },
  {
    codice: "B",
    titolo: "ESTRAZIONE DI MINERALI DA CAVE E MINIERE",
    divisioni: [
      {
        codice: "05",
        descrizione: "Estrazione di carbone",
        gruppi: [
          { codice: "05.1", descrizione: "Estrazione di antracite e carbone bituminoso" },
          { codice: "05.2", descrizione: "Estrazione di lignite" }
        ]
      },
      {
        codice: "06",
        descrizione: "Estrazione di petrolio greggio e di gas naturale",
        gruppi: [
          { codice: "06.1", descrizione: "Estrazione di petrolio greggio" },
          { codice: "06.2", descrizione: "Estrazione di gas naturale" }
        ]
      },
      {
        codice: "07",
        descrizione: "Estrazione di minerali metalliferi",
        gruppi: [
          { codice: "07.1", descrizione: "Estrazione di minerali metalliferi ferrosi" },
          { codice: "07.2", descrizione: "Estrazione di minerali metalliferi non ferrosi" }
        ]
      },
      {
        codice: "08",
        descrizione: "Attività di estrazione di minerali da cave e miniere n.c.a.",
        gruppi: [
          { codice: "08.1", descrizione: "Estrazione di pietre ornamentali e da costruzione, calcare, gesso, creta e ardesia" },
          { codice: "08.9", descrizione: "Estrazione di minerali da cave e miniere n.c.a." }
        ]
      },
      {
        codice: "09",
        descrizione: "Attività dei servizi di supporto all'estrazione",
        gruppi: [
          { codice: "09.1", descrizione: "Attività di supporto all'estrazione di petrolio e di gas naturale" },
          { codice: "09.9", descrizione: "Attività di supporto per altre attività estrattive" }
        ]
      }
    ]
  },
  {
    codice: "C",
    titolo: "ATTIVITÀ MANIFATTURIERE",
    divisioni: [
      {
        codice: "10",
        descrizione: "Industrie alimentari",
        gruppi: [
          { codice: "10.1", descrizione: "Lavorazione e conservazione di carne e produzione di prodotti a base di carne" },
          { codice: "10.2", descrizione: "Lavorazione e conservazione di pesce, crostacei e molluschi" },
          { codice: "10.3", descrizione: "Lavorazione e conservazione di frutta e ortaggi" },
          { codice: "10.4", descrizione: "Produzione di oli e grassi vegetali e animali" },
          { codice: "10.5", descrizione: "Industria lattiero-casearia" },
          { codice: "10.6", descrizione: "Lavorazione delle granaglie, produzione di amidi e di prodotti amidacei" },
          { codice: "10.7", descrizione: "Produzione di prodotti da forno e farinacei" },
          { codice: "10.8", descrizione: "Produzione di altri prodotti alimentari" },
          { codice: "10.9", descrizione: "Produzione di prodotti per l'alimentazione degli animali" }
        ]
      },
      {
        codice: "11",
        descrizione: "Industria delle bevande",
        gruppi: [
          { codice: "11.0", descrizione: "Industria delle bevande" }
        ]
      },
      {
        codice: "12",
        descrizione: "Industria del tabacco",
        gruppi: [
          { codice: "12.0", descrizione: "Industria del tabacco" }
        ]
      },
      {
        codice: "13",
        descrizione: "Industrie tessili",
        gruppi: [
          { codice: "13.1", descrizione: "Preparazione e filatura di fibre tessili" },
          { codice: "13.2", descrizione: "Tessitura" },
          { codice: "13.3", descrizione: "Finissaggio dei tessili" },
          { codice: "13.9", descrizione: "Altre industrie tessili" }
        ]
      },
      {
        codice: "14",
        descrizione: "Confezione di articoli di abbigliamento; confezione di articoli in pelle e pelliccia",
        gruppi: [
          { codice: "14.1", descrizione: "Confezione di articoli di abbigliamento (escluso abbigliamento in pelliccia)" },
          { codice: "14.2", descrizione: "Confezione di articoli in pelliccia" },
          { codice: "14.3", descrizione: "Fabbricazione di articoli di maglieria" }
        ]
      },
      {
        codice: "15",
        descrizione: "Fabbricazione di articoli in pelle e simili",
        gruppi: [
          { codice: "15.1", descrizione: "Preparazione e concia del cuoio; fabbricazione di articoli da viaggio, borse, pelletteria e selleria" },
          { codice: "15.2", descrizione: "Fabbricazione di calzature" }
        ]
      },
      {
        codice: "16",
        descrizione: "Industria del legno e dei prodotti in legno e sughero (esclusi i mobili); fabbricazione di articoli in paglia e materiali da intreccio",
        gruppi: [
          { codice: "16.1", descrizione: "Taglio e piallatura del legno" },
          { codice: "16.2", descrizione: "Fabbricazione di prodotti in legno, sughero, paglia e materiali da intreccio" }
        ]
      },
      {
        codice: "17",
        descrizione: "Fabbricazione di carta e di prodotti di carta",
        gruppi: [
          { codice: "17.1", descrizione: "Fabbricazione di pasta-carta, carta e cartone" },
          { codice: "17.2", descrizione: "Fabbricazione di articoli di carta e cartone" }
        ]
      },
      {
        codice: "18",
        descrizione: "Stampa e riproduzione di supporti registrati",
        gruppi: [
          { codice: "18.1", descrizione: "Stampa e servizi connessi alla stampa" },
          { codice: "18.2", descrizione: "Riproduzione di supporti registrati" }
        ]
      },
      {
        codice: "19",
        descrizione: "Fabbricazione di coke e prodotti derivanti dalla raffinazione del petrolio",
        gruppi: [
          { codice: "19.1", descrizione: "Fabbricazione di prodotti di cokeria" },
          { codice: "19.2", descrizione: "Fabbricazione di prodotti derivanti dalla raffinazione del petrolio" }
        ]
      },
      {
        codice: "20",
        descrizione: "Fabbricazione di prodotti chimici",
        gruppi: [
          { codice: "20.1", descrizione: "Fabbricazione di prodotti chimici di base, di fertilizzanti e composti azotati, di materie plastiche e gomma sintetica in forme primarie" },
          { codice: "20.2", descrizione: "Fabbricazione di agrofarmaci e di altri prodotti chimici per l'agricoltura" },
          { codice: "20.3", descrizione: "Fabbricazione di pitture, vernici e smalti, inchiostri da stampa e adesivi sintetici" },
          { codice: "20.4", descrizione: "Fabbricazione di saponi e detergenti, di prodotti per la pulizia e la lucidatura, di profumi e cosmetici" },
          { codice: "20.5", descrizione: "Fabbricazione di altri prodotti chimici" },
          { codice: "20.6", descrizione: "Fabbricazione di fibre sintetiche e artificiali" }
        ]
      },
      {
        codice: "21",
        descrizione: "Fabbricazione di prodotti farmaceutici di base e di preparati farmaceutici",
        gruppi: [
          { codice: "21.1", descrizione: "Fabbricazione di prodotti farmaceutici di base" },
          { codice: "21.2", descrizione: "Fabbricazione di medicinali e preparati farmaceutici" }
        ]
      },
      {
        codice: "22",
        descrizione: "Fabbricazione di articoli in gomma e materie plastiche",
        gruppi: [
          { codice: "22.1", descrizione: "Fabbricazione di articoli in gomma" },
          { codice: "22.2", descrizione: "Fabbricazione di articoli in materie plastiche" }
        ]
      },
      {
        codice: "23",
        descrizione: "Fabbricazione di altri prodotti della lavorazione di minerali non metalliferi",
        gruppi: [
          { codice: "23.1", descrizione: "Fabbricazione di vetro e di prodotti in vetro" },
          { codice: "23.2", descrizione: "Fabbricazione di prodotti refrattari" },
          { codice: "23.3", descrizione: "Fabbricazione di materiali da costruzione in terracotta" },
          { codice: "23.4", descrizione: "Fabbricazione di altri prodotti in porcellana e in ceramica" },
          { codice: "23.5", descrizione: "Produzione di cemento, calce e gesso" },
          { codice: "23.6", descrizione: "Fabbricazione di prodotti in calcestruzzo, cemento e gesso" },
          { codice: "23.7", descrizione: "Taglio, modellatura e finitura di pietre" },
          { codice: "23.9", descrizione: "Produzione di prodotti abrasivi e di prodotti in minerali non metalliferi n.c.a." }
        ]
      },
      {
        codice: "24",
        descrizione: "Metallurgia",
        gruppi: [
          { codice: "24.1", descrizione: "Siderurgia" },
          { codice: "24.2", descrizione: "Fabbricazione di tubi, condotti, profilati cavi e relativi accessori in acciaio (esclusi quelli in acciaio colato)" },
          { codice: "24.3", descrizione: "Fabbricazione di altri prodotti della prima trasformazione dell'acciaio" },
          { codice: "24.4", descrizione: "Produzione di metalli di base preziosi e altri metalli non ferrosi" },
          { codice: "24.5", descrizione: "Fonderie" }
        ]
      },
      {
        codice: "25",
        descrizione: "Fabbricazione di prodotti in metallo (esclusi macchinari e attrezzature)",
        gruppi: [
          { codice: "25.1", descrizione: "Fabbricazione di elementi da costruzione in metallo" },
          { codice: "25.2", descrizione: "Fabbricazione di cisterne, serbatoi, radiatori e contenitori in metallo" },
          { codice: "25.3", descrizione: "Fabbricazione di generatori di vapore (esclusi i contenitori in metallo per caldaie per il riscaldamento centrale ad acqua calda)" },
          { codice: "25.4", descrizione: "Fabbricazione di armi e munizioni" },
          { codice: "25.5", descrizione: "Fucinatura, imbutitura, stampaggio e profilatura dei metalli; metallurgia delle polveri" },
          { codice: "25.6", descrizione: "Trattamento e rivestimento dei metalli; lavori di meccanica generale" },
          { codice: "25.7", descrizione: "Fabbricazione di articoli di coltelleria, utensili e oggetti di ferramenta" },
          { codice: "25.9", descrizione: "Fabbricazione di altri prodotti in metallo" }
        ]
      },
      {
        codice: "26",
        descrizione: "Fabbricazione di computer e prodotti di elettronica e ottica; apparecchi elettromedicali, apparecchi di misurazione e di orologi",
        gruppi: [
          { codice: "26.1", descrizione: "Fabbricazione di componenti elettronici e schede elettroniche" },
          { codice: "26.2", descrizione: "Fabbricazione di computer e unità periferiche" },
          { codice: "26.3", descrizione: "Fabbricazione di apparecchiature per le telecomunicazioni" },
          { codice: "26.4", descrizione: "Fabbricazione di prodotti di elettronica di consumo audio e video" },
          { codice: "26.5", descrizione: "Fabbricazione di strumenti e apparecchi di misurazione, prova e navigazione; orologi" },
          { codice: "26.6", descrizione: "Fabbricazione di strumenti per irradiazione, apparecchiature elettromedicali ed elettroterapeutiche" },
          { codice: "26.7", descrizione: "Fabbricazione di strumenti ottici e attrezzature fotografiche" },
          { codice: "26.8", descrizione: "Fabbricazione di supporti magnetici ed ottici" }
        ]
      },
      {
        codice: "27",
        descrizione: "Fabbricazione di apparecchiature elettriche",
        gruppi: [
          { codice: "27.1", descrizione: "Fabbricazione di motori, generatori e trasformatori elettrici e di apparecchiature per la distribuzione e il controllo dell'elettricità" },
          { codice: "27.2", descrizione: "Fabbricazione di batterie di pile ed accumulatori elettrici" },
          { codice: "27.3", descrizione: "Fabbricazione di cablaggi e accessori per apparecchiature elettriche ed elettroniche" },
          { codice: "27.4", descrizione: "Fabbricazione di apparecchiature per illuminazione" },
          { codice: "27.5", descrizione: "Fabbricazione di apparecchi per uso domestico" },
          { codice: "27.9", descrizione: "Fabbricazione di altre apparecchiature elettriche" }
        ]
      },
      {
        codice: "28",
        descrizione: "Fabbricazione di macchinari e apparecchiature n.c.a.",
        gruppi: [
          { codice: "28.1", descrizione: "Fabbricazione di macchine di impiego generale" },
          { codice: "28.2", descrizione: "Fabbricazione di altre macchine di impiego generale" },
          { codice: "28.3", descrizione: "Fabbricazione di macchine per l'agricoltura e la silvicoltura" },
          { codice: "28.4", descrizione: "Fabbricazione di macchine per la formatura dei metalli e di altre macchine utensili" },
          { codice: "28.9", descrizione: "Fabbricazione di altre macchine per impieghi speciali" }
        ]
      },
      {
        codice: "29",
        descrizione: "Fabbricazione di autoveicoli, rimorchi e semirimorchi",
        gruppi: [
          { codice: "29.1", descrizione: "Fabbricazione di autoveicoli" },
          { codice: "29.2", descrizione: "Fabbricazione di carrozzerie per autoveicoli, rimorchi e semirimorchi" },
          { codice: "29.3", descrizione: "Fabbricazione di parti ed accessori per autoveicoli e loro motori" }
        ]
      },
      {
        codice: "30",
        descrizione: "Fabbricazione di altri mezzi di trasporto",
        gruppi: [
          { codice: "30.1", descrizione: "Costruzione di navi e imbarcazioni" },
          { codice: "30.2", descrizione: "Costruzione di locomotive e di materiale rotabile ferro-tranviario" },
          { codice: "30.3", descrizione: "Fabbricazione di aeromobili, di veicoli spaziali e dei relativi dispositivi" },
          { codice: "30.4", descrizione: "Fabbricazione di veicoli militari da combattimento" },
          { codice: "30.9", descrizione: "Fabbricazione di mezzi di trasporto n.c.a." }
        ]
      },
      {
        codice: "31",
        descrizione: "Fabbricazione di mobili",
        gruppi: [
          { codice: "31.0", descrizione: "Fabbricazione di mobili" }
        ]
      },
      {
        codice: "32",
        descrizione: "Altre industrie manifatturiere",
        gruppi: [
          { codice: "32.1", descrizione: "Fabbricazione di gioielleria, bigiotteria e articoli connessi; lavorazione delle pietre preziose" },
          { codice: "32.2", descrizione: "Fabbricazione di strumenti musicali" },
          { codice: "32.3", descrizione: "Fabbricazione di articoli sportivi" },
          { codice: "32.4", descrizione: "Fabbricazione di giochi e giocattoli" },
          { codice: "32.5", descrizione: "Fabbricazione di strumenti e forniture mediche e dentistiche" },
          { codice: "32.9", descrizione: "Industrie manifatturiere n.c.a." }
        ]
      },
      {
        codice: "33",
        descrizione: "Riparazione, manutenzione ed installazione di macchine ed apparecchiature",
        gruppi: [
          { codice: "33.1", descrizione: "Riparazione e manutenzione di prodotti in metallo, macchine ed apparecchiature" },
          { codice: "33.2", descrizione: "Installazione di macchine ed apparecchiature industriali" }
        ]
      }
    ]
  },
  {
    codice: "D",
    titolo: "FORNITURA DI ENERGIA ELETTRICA, GAS, VAPORE E ARIA CONDIZIONATA",
    divisioni: [
      {
        codice: "35",
        descrizione: "Fornitura di energia elettrica, gas, vapore e aria condizionata",
        gruppi: [
          { codice: "35.1", descrizione: "Produzione, trasmissione e distribuzione di energia elettrica" },
          { codice: "35.2", descrizione: "Produzione di gas; distribuzione di combustibili gassosi mediante condotte" },
          { codice: "35.3", descrizione: "Fornitura di vapore e aria condizionata" }
        ]
      }
    ]
  },
  {
    codice: "E",
    titolo: "FORNITURA DI ACQUA; RETI FOGNARIE, ATTIVITÀ DI GESTIONE DEI RIFIUTI E RISANAMENTO",
    divisioni: [
      {
        codice: "36",
        descrizione: "Raccolta, trattamento e fornitura di acqua",
        gruppi: [
          { codice: "36.0", descrizione: "Raccolta, trattamento e fornitura di acqua" }
        ]
      },
      {
        codice: "37",
        descrizione: "Gestione delle reti fognarie",
        gruppi: [
          { codice: "37.0", descrizione: "Gestione delle reti fognarie" }
        ]
      },
      {
        codice: "38",
        descrizione: "Attività di raccolta, trattamento e smaltimento dei rifiuti; recupero dei materiali",
        gruppi: [
          { codice: "38.1", descrizione: "Raccolta dei rifiuti" },
          { codice: "38.2", descrizione: "Trattamento e smaltimento dei rifiuti" },
          { codice: "38.3", descrizione: "Recupero dei materiali" }
        ]
      },
      {
        codice: "39",
        descrizione: "Attività di risanamento e altri servizi di gestione dei rifiuti",
        gruppi: [
          { codice: "39.0", descrizione: "Attività di risanamento e altri servizi di gestione dei rifiuti" }
        ]
      }
    ]
  },
  {
    codice: "F",
    titolo: "COSTRUZIONI",
    divisioni: [
      {
        codice: "41",
        descrizione: "Costruzione di edifici",
        gruppi: [
          { codice: "41.1", descrizione: "Sviluppo di progetti immobiliari" },
          { codice: "41.2", descrizione: "Costruzione di edifici residenziali e non residenziali" }
        ]
      },
      {
        codice: "42",
        descrizione: "Ingegneria civile",
        gruppi: [
          { codice: "42.1", descrizione: "Costruzione di strade e ferrovie" },
          { codice: "42.2", descrizione: "Costruzione di opere di pubblica utilità" },
          { codice: "42.9", descrizione: "Costruzione di altre opere di ingegneria civile" }
        ]
      },
      {
        codice: "43",
        descrizione: "Lavori di costruzione specializzati",
        gruppi: [
          { codice: "43.1", descrizione: "Demolizione e preparazione del cantiere edile" },
          { codice: "43.2", descrizione: "Installazione di impianti elettrici, idraulici ed altri lavori di costruzione e installazione" },
          { codice: "43.3", descrizione: "Completamento e finitura di edifici" },
          { codice: "43.9", descrizione: "Altri lavori specializzati di costruzione" }
        ]
      }
    ]
  },
  {
    codice: "G",
    titolo: "COMMERCIO ALL'INGROSSO E AL DETTAGLIO; RIPARAZIONE DI AUTOVEICOLI E MOTOCICLI",
    divisioni: [
      {
        codice: "45",
        descrizione: "Commercio all'ingrosso e al dettaglio e riparazione di autoveicoli e motocicli",
        gruppi: [
          { codice: "45.1", descrizione: "Commercio di autoveicoli" },
          { codice: "45.2", descrizione: "Manutenzione e riparazione di autoveicoli" },
          { codice: "45.3", descrizione: "Commercio di parti e accessori di autoveicoli" },
          { codice: "45.4", descrizione: "Commercio, manutenzione e riparazione di motocicli e relative parti ed accessori" }
        ]
      },
      {
        codice: "46",
        descrizione: "Commercio all'ingrosso (escluso quello di autoveicoli e di motocicli)",
        gruppi: [
          { codice: "46.1", descrizione: "Intermediari del commercio" },
          { codice: "46.2", descrizione: "Commercio all'ingrosso di materie prime agricole e di animali vivi" },
          { codice: "46.3", descrizione: "Commercio all'ingrosso di prodotti alimentari, bevande e prodotti del tabacco" },
          { codice: "46.4", descrizione: "Commercio all'ingrosso di beni di consumo finale" },
          { codice: "46.5", descrizione: "Commercio all'ingrosso di apparecchiature ICT" },
          { codice: "46.6", descrizione: "Commercio all'ingrosso di altri macchinari, attrezzature e forniture" },
          { codice: "46.7", descrizione: "Commercio all'ingrosso specializzato di altri prodotti" },
          { codice: "46.9", descrizione: "Commercio all'ingrosso non specializzato" }
        ]
      },
      {
        codice: "47",
        descrizione: "Commercio al dettaglio (escluso quello di autoveicoli e di motocicli)",
        gruppi: [
          { codice: "47.1", descrizione: "Commercio al dettaglio in esercizi non specializzati" },
          { codice: "47.2", descrizione: "Commercio al dettaglio di prodotti alimentari, bevande e tabacco in esercizi specializzati" },
          { codice: "47.3", descrizione: "Commercio al dettaglio di carburante per autotrazione in esercizi specializzati" },
          { codice: "47.4", descrizione: "Commercio al dettaglio di apparecchiature informatiche e per le telecomunicazioni (ICT) in esercizi specializzati" },
          { codice: "47.5", descrizione: "Commercio al dettaglio di altri prodotti per uso domestico in esercizi specializzati" },
          { codice: "47.6", descrizione: "Commercio al dettaglio di articoli culturali e ricreativi in esercizi specializzati" },
          { codice: "47.7", descrizione: "Commercio al dettaglio di altri prodotti in esercizi specializzati" },
          { codice: "47.8", descrizione: "Commercio al dettaglio ambulante" },
          { codice: "47.9", descrizione: "Commercio al dettaglio al di fuori di negozi, banchi e mercati" }
        ]
      }
    ]
  },
  {
    codice: "H",
    titolo: "TRASPORTO E MAGAZZINAGGIO",
    divisioni: [
      {
        codice: "49",
        descrizione: "Trasporto terrestre e trasporto mediante condotte",
        gruppi: [
          { codice: "49.1", descrizione: "Trasporto ferroviario di passeggeri (interurbano)" },
          { codice: "49.2", descrizione: "Trasporto ferroviario di merci" },
          { codice: "49.3", descrizione: "Altri trasporti terrestri di passeggeri" },
          { codice: "49.4", descrizione: "Trasporto di merci su strada e servizi di trasloco" },
          { codice: "49.5", descrizione: "Trasporto mediante condotte" }
        ]
      },
      {
        codice: "50",
        descrizione: "Trasporto marittimo e per vie d'acqua",
        gruppi: [
          { codice: "50.1", descrizione: "Trasporto marittimo e costiero di passeggeri" },
          { codice: "50.2", descrizione: "Trasporto marittimo e costiero di merci" },
          { codice: "50.3", descrizione: "Trasporto di passeggeri per vie d'acqua interne" },
          { codice: "50.4", descrizione: "Trasporto di merci per vie d'acqua interne" }
        ]
      },
      {
        codice: "51",
        descrizione: "Trasporto aereo",
        gruppi: [
          { codice: "51.1", descrizione: "Trasporto aereo di passeggeri" },
          { codice: "51.2", descrizione: "Trasporto aereo di merci e trasporto spaziale" }
        ]
      },
      {
        codice: "52",
        descrizione: "Magazzinaggio e attività di supporto ai trasporti",
        gruppi: [
          { codice: "52.1", descrizione: "Magazzinaggio e custodia" },
          { codice: "52.2", descrizione: "Attività di supporto ai trasporti" }
        ]
      },
      {
        codice: "53",
        descrizione: "Servizi postali e attività di corriere",
        gruppi: [
          { codice: "53.1", descrizione: "Attività postali con obbligo di servizio universale" },
          { codice: "53.2", descrizione: "Altre attività postali e di corriere senza obbligo di servizio universale" }
        ]
      }
    ]
  },
  {
    codice: "I",
    titolo: "ATTIVITÀ DEI SERVIZI DI ALLOGGIO E DI RISTORAZIONE",
    divisioni: [
      {
        codice: "55",
        descrizione: "Alloggio",
        gruppi: [
          { codice: "55.1", descrizione: "Alberghi e strutture simili" },
          { codice: "55.2", descrizione: "Alloggi per vacanze e altre strutture per brevi soggiorni" },
          { codice: "55.3", descrizione: "Aree di campeggio e aree attrezzate per camper e roulotte" },
          { codice: "55.9", descrizione: "Altri alloggi" }
        ]
      },
      {
        codice: "56",
        descrizione: "Attività dei servizi di ristorazione",
        gruppi: [
          { codice: "56.1", descrizione: "Ristoranti e attività di ristorazione mobile" },
          { codice: "56.2", descrizione: "Fornitura di pasti preparati (catering) e altri servizi di ristorazione" },
          { codice: "56.3", descrizione: "Bar e altri esercizi simili senza cucina" }
        ]
      }
    ]
  },
  {
    codice: "J",
    titolo: "SERVIZI DI INFORMAZIONE E COMUNICAZIONE",
    divisioni: [
      {
        codice: "58",
        descrizione: "Attività editoriali",
        gruppi: [
          { codice: "58.1", descrizione: "Edizione di libri, periodici ed altre attività editoriali" },
          { codice: "58.2", descrizione: "Edizione di software" }
        ]
      },
      {
        codice: "59",
        descrizione: "Attività di produzione cinematografica, di video e di programmi televisivi, di registrazioni musicali e sonore",
        gruppi: [
          { codice: "59.1", descrizione: "Attività di produzione cinematografica, di video e di programmi televisivi" },
          { codice: "59.2", descrizione: "Attività di registrazione sonora e di editoria musicale" }
        ]
      },
      {
        codice: "60",
        descrizione: "Attività di programmazione e trasmissione",
        gruppi: [
          { codice: "60.1", descrizione: "Trasmissioni radiofoniche" },
          { codice: "60.2", descrizione: "Attività di programmazione e trasmissioni televisive" }
        ]
      },
      {
        codice: "61",
        descrizione: "Telecomunicazioni",
        gruppi: [
          { codice: "61.1", descrizione: "Telecomunicazioni fisse" },
          { codice: "61.2", descrizione: "Telecomunicazioni mobili" },
          { codice: "61.3", descrizione: "Telecomunicazioni satellitari" },
          { codice: "61.9", descrizione: "Altre attività di telecomunicazione" }
        ]
      },
      {
        codice: "62",
        descrizione: "Produzione di software, consulenza informatica e attività connesse",
        gruppi: [
          { codice: "62.0", descrizione: "Produzione di software, consulenza informatica e attività connesse" }
        ]
      },
      {
        codice: "63",
        descrizione: "Attività dei servizi d'informazione e altri servizi informatici",
        gruppi: [
          { codice: "63.1", descrizione: "Elaborazione dei dati, hosting e attività connesse; portali web" },
          { codice: "63.9", descrizione: "Altre attività dei servizi d'informazione" }
        ]
      }
    ]
  },
  {
    codice: "K",
    titolo: "ATTIVITÀ FINANZIARIE E ASSICURATIVE",
    divisioni: [
      {
        codice: "64",
        descrizione: "Attività di servizi finanziari (escluse le assicurazioni e i fondi pensione)",
        gruppi: [
          { codice: "64.1", descrizione: "Intermediazione monetaria" },
          { codice: "64.2", descrizione: "Attività delle società di partecipazione (holding)" },
          { codice: "64.3", descrizione: "Fondi comuni e fondi di investimento e altre attività di intermediazione finanziaria" },
          { codice: "64.9", descrizione: "Altre attività di servizi finanziari (escluse le assicurazioni e i fondi pensione)" }
        ]
      },
      {
        codice: "65",
        descrizione: "Assicurazioni, riassicurazioni e fondi pensione (escluse le assicurazioni sociali obbligatorie)",
        gruppi: [
          { codice: "65.1", descrizione: "Assicurazioni" },
          { codice: "65.2", descrizione: "Riassicurazioni" },
          { codice: "65.3", descrizione: "Fondi pensione" }
        ]
      },
      {
        codice: "66",
        descrizione: "Attività ausiliarie dei servizi finanziari e delle attività assicurative",
        gruppi: [
          { codice: "66.1", descrizione: "Attività ausiliarie dei servizi finanziari (escluse le assicurazioni e i fondi pensione)" },
          { codice: "66.2", descrizione: "Attività ausiliarie delle assicurazioni e dei fondi pensione" },
          { codice: "66.3", descrizione: "Attività di gestione dei fondi" }
        ]
      }
    ]
  },
  {
    codice: "L",
    titolo: "ATTIVITÀ IMMOBILIARI",
    divisioni: [
      {
        codice: "68",
        descrizione: "Attività immobiliari",
        gruppi: [
          { codice: "68.1", descrizione: "Compravendita di beni immobili effettuata su beni propri" },
          { codice: "68.2", descrizione: "Affitto e gestione di immobili di proprietà o in leasing" },
          { codice: "68.3", descrizione: "Attività immobiliari per conto terzi" }
        ]
      }
    ]
  },
  {
    codice: "M",
    titolo: "ATTIVITÀ PROFESSIONALI, SCIENTIFICHE E TECNICHE",
    divisioni: [
      {
        codice: "69",
        descrizione: "Attività legali e contabilità",
        gruppi: [
          { codice: "69.1", descrizione: "Attività legali" },
          { codice: "69.2", descrizione: "Contabilità, controllo e revisione contabile; consulenza in materia fiscale e del lavoro" }
        ]
      },
      {
        codice: "70",
        descrizione: "Attività di direzione aziendale e di consulenza gestionale",
        gruppi: [
          { codice: "70.1", descrizione: "Attività di direzione aziendale" },
          { codice: "70.2", descrizione: "Consulenza gestionale" }
        ]
      },
      {
        codice: "71",
        descrizione: "Attività degli studi di architettura e d'ingegneria; collaudi ed analisi tecniche",
        gruppi: [
          { codice: "71.1", descrizione: "Attività degli studi di architettura, ingegneria ed altri studi tecnici" },
          { codice: "71.2", descrizione: "Collaudi ed analisi tecniche" }
        ]
      },
      {
        codice: "72",
        descrizione: "Ricerca scientifica e sviluppo",
        gruppi: [
          { codice: "72.1", descrizione: "Ricerca e sviluppo sperimentale nel campo delle scienze naturali e dell'ingegneria" },
          { codice: "72.2", descrizione: "Ricerca e sviluppo sperimentale nel campo delle scienze sociali e umanistiche" }
        ]
      },
      {
        codice: "73",
        descrizione: "Pubblicità e ricerche di mercato",
        gruppi: [
          { codice: "73.1", descrizione: "Pubblicità" },
          { codice: "73.2", descrizione: "Ricerche di mercato e sondaggi di opinione" }
        ]
      },
      {
        codice: "74",
        descrizione: "Altre attività professionali, scientifiche e tecniche",
        gruppi: [
          { codice: "74.1", descrizione: "Attività di design specializzate" },
          { codice: "74.2", descrizione: "Attività fotografiche" },
          { codice: "74.3", descrizione: "Traduzione e interpretariato" },
          { codice: "74.9", descrizione: "Altre attività professionali, scientifiche e tecniche n.c.a." }
        ]
      },
      {
        codice: "75",
        descrizione: "Servizi veterinari",
        gruppi: [
          { codice: "75.0", descrizione: "Servizi veterinari" }
        ]
      }
    ]
  },
  {
    codice: "N",
    titolo: "NOLEGGIO, AGENZIE DI VIAGGIO, SERVIZI DI SUPPORTO ALLE IMPRESE",
    divisioni: [
      {
        codice: "77",
        descrizione: "Attività di noleggio e leasing operativo",
        gruppi: [
          { codice: "77.1", descrizione: "Noleggio di autoveicoli" },
          { codice: "77.2", descrizione: "Noleggio di beni per uso personale e per la casa" },
          { codice: "77.3", descrizione: "Noleggio di altre macchine, attrezzature e beni materiali" },
          { codice: "77.4", descrizione: "Concessione dei diritti di sfruttamento di proprietà intellettuale e prodotti simili (escluse le opere protette dal copyright)" }
        ]
      },
      {
        codice: "78",
        descrizione: "Attività di ricerca, selezione, fornitura di personale",
        gruppi: [
          { codice: "78.1", descrizione: "Attività di agenzie di collocamento" },
          { codice: "78.2", descrizione: "Attività delle agenzie di fornitura di lavoro temporaneo (interinale)" },
          { codice: "78.3", descrizione: "Altre attività di fornitura e gestione di risorse umane" }
        ]
      },
      {
        codice: "79",
        descrizione: "Attività dei servizi delle agenzie di viaggio, dei tour operator e servizi di prenotazione e attività connesse",
        gruppi: [
          { codice: "79.1", descrizione: "Attività delle agenzie di viaggio e dei tour operator" },
          { codice: "79.9", descrizione: "Altri servizi di prenotazione e attività connesse" }
        ]
      },
      {
        codice: "80",
        descrizione: "Servizi di vigilanza e investigazione",
        gruppi: [
          { codice: "80.1", descrizione: "Servizi di vigilanza privata" },
          { codice: "80.2", descrizione: "Servizi connessi ai sistemi di vigilanza" },
          { codice: "80.3", descrizione: "Servizi investigativi privati" }
        ]
      },
      {
        codice: "81",
        descrizione: "Attività di servizi per edifici e paesaggio",
        gruppi: [
          { codice: "81.1", descrizione: "Servizi integrati di gestione agli edifici" },
          { codice: "81.2", descrizione: "Attività di pulizia e disinfestazione" },
          { codice: "81.3", descrizione: "Cura e manutenzione del paesaggio" }
        ]
      },
      {
        codice: "82",
        descrizione: "Attività di supporto per le funzioni d'ufficio e altri servizi di supporto alle imprese",
        gruppi: [
          { codice: "82.1", descrizione: "Attività di supporto per le funzioni d'ufficio" },
          { codice: "82.2", descrizione: "Attività dei call center" },
          { codice: "82.3", descrizione: "Organizzazione di convegni e fiere" },
          { codice: "82.9", descrizione: "Servizi di supporto alle imprese n.c.a." }
        ]
      }
    ]
  },
  {
    codice: "P",
    titolo: "ISTRUZIONE",
    divisioni: [
      {
        codice: "85",
        descrizione: "Istruzione",
        gruppi: [
          { codice: "85.1", descrizione: "Istruzione prescolastica" },
          { codice: "85.2", descrizione: "Istruzione primaria" },
          { codice: "85.3", descrizione: "Istruzione secondaria" },
          { codice: "85.4", descrizione: "Istruzione post-secondaria universitaria e non universitaria" },
          { codice: "85.5", descrizione: "Altri servizi di istruzione" },
          { codice: "85.6", descrizione: "Attività di supporto all'istruzione" }
        ]
      }
    ]
  },
  {
    codice: "Q",
    titolo: "SANITÀ E ASSISTENZA SOCIALE",
    divisioni: [
      {
        codice: "86",
        descrizione: "Assistenza sanitaria",
        gruppi: [
          { codice: "86.1", descrizione: "Servizi ospedalieri" },
          { codice: "86.2", descrizione: "Servizi degli studi medici e odontoiatrici" },
          { codice: "86.9", descrizione: "Altre attività di assistenza sanitaria" }
        ]
      },
      {
        codice: "87",
        descrizione: "Servizi di assistenza sociale residenziale",
        gruppi: [
          { codice: "87.1", descrizione: "Strutture di assistenza infermieristica residenziale" },
          { codice: "87.2", descrizione: "Strutture di assistenza residenziale per persone affette da ritardi mentali, disturbi mentali o che abusano di sostanze stupefacenti" },
          { codice: "87.3", descrizione: "Strutture di assistenza residenziale per anziani e disabili" },
          { codice: "87.9", descrizione: "Altre strutture di assistenza sociale residenziale" }
        ]
      },
      {
        codice: "88",
        descrizione: "Assistenza sociale non residenziale",
        gruppi: [
          { codice: "88.1", descrizione: "Assistenza sociale non residenziale per anziani e disabili" },
          { codice: "88.9", descrizione: "Altre attività di assistenza sociale non residenziale" }
        ]
      }
    ]
  },
  {
    codice: "R",
    titolo: "ATTIVITÀ ARTISTICHE, SPORTIVE, DI INTRATTENIMENTO E DIVERTIMENTO",
    divisioni: [
      {
        codice: "90",
        descrizione: "Attività creative, artistiche e di intrattenimento",
        gruppi: [
          { codice: "90.0", descrizione: "Attività creative, artistiche e di intrattenimento" }
        ]
      },
      {
        codice: "91",
        descrizione: "Attività di biblioteche, archivi, musei ed altre attività culturali",
        gruppi: [
          { codice: "91.0", descrizione: "Attività di biblioteche, archivi, musei ed altre attività culturali" }
        ]
      },
      {
        codice: "92",
        descrizione: "Attività riguardanti le lotterie, le scommesse, le case da gioco",
        gruppi: [
          { codice: "92.0", descrizione: "Attività riguardanti le lotterie, le scommesse, le case da gioco" }
        ]
      },
      {
        codice: "93",
        descrizione: "Attività sportive, di intrattenimento e di divertimento",
        gruppi: [
          { codice: "93.1", descrizione: "Attività sportive" },
          { codice: "93.2", descrizione: "Attività ricreative e di divertimento" }
        ]
      }
    ]
  },
  {
    codice: "S",
    titolo: "ALTRE ATTIVITÀ DI SERVIZI",
    divisioni: [
      {
        codice: "94",
        descrizione: "Attività di organizzazioni associative",
        gruppi: [
          { codice: "94.1", descrizione: "Attività di organizzazioni economiche, di datori di lavoro e professionali" },
          { codice: "94.2", descrizione: "Attività dei sindacati di lavoratori dipendenti" },
          { codice: "94.9", descrizione: "Attività di altre organizzazioni associative" }
        ]
      },
      {
        codice: "95",
        descrizione: "Riparazione di computer e di beni per uso personale e per la casa",
        gruppi: [
          { codice: "95.1", descrizione: "Riparazione di computer e di apparecchiature per le comunicazioni" },
          { codice: "95.2", descrizione: "Riparazione di beni per uso personale e per la casa" }
        ]
      },
      {
        codice: "96",
        descrizione: "Altre attività di servizi per la persona",
        gruppi: [
          { codice: "96.0", descrizione: "Altre attività di servizi per la persona" }
        ]
      }
    ]
  }
];
