import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  FolderKanban, 
  Receipt, 
  CreditCard, 
  Files, 
  Bell,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

type StatusColor = 'green' | 'yellow' | 'red' | 'gray';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: {
    label: string;
    color: StatusColor;
  };
  count?: number;
  countLabel?: string;
  route: string;
  cta: string;
}

const statusColors: Record<StatusColor, string> = {
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  yellow: 'bg-amber-100 text-amber-800 border-amber-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  gray: 'bg-muted text-muted-foreground border-border'
};

const statusIcons: Record<StatusColor, React.ReactNode> = {
  green: <CheckCircle className="h-3 w-3" />,
  yellow: <Clock className="h-3 w-3" />,
  red: <AlertTriangle className="h-3 w-3" />,
  gray: null
};

const DashboardCard = ({ title, description, icon, status, count, countLabel, route, cta }: DashboardCardProps) => (
  <Link to={route} className="block group">
    <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/40 group-hover:scale-[1.02]">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            {icon}
          </div>
          {status && (
            <Badge className={`${statusColors[status.color]} flex items-center gap-1`}>
              {statusIcons[status.color]}
              {status.label}
            </Badge>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 flex-grow">{description}</p>

        {/* Count (optional) */}
        {count !== undefined && (
          <div className="mb-4">
            <span className="text-3xl font-bold text-foreground">{count}</span>
            {countLabel && <span className="text-sm text-muted-foreground ml-2">{countLabel}</span>}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
          {cta}
          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  </Link>
);

interface AssociazioneDashboardCardsProps {
  bandiAperti?: number;
  progettiAttivi?: number;
  ultimoRendiconto?: { stato: 'completato' | 'in_lavorazione' | 'da_fare'; data?: string };
  abbonamentoAttivo?: boolean;
  documentiCaricati?: number;
  notifichePendenti?: number;
  scadenzeImminenti?: number;
}

const AssociazioneDashboardCards = ({
  bandiAperti = 0,
  progettiAttivi = 0,
  ultimoRendiconto = { stato: 'da_fare' },
  abbonamentoAttivo = false,
  documentiCaricati = 0,
  notifichePendenti = 0,
  scadenzeImminenti = 0
}: AssociazioneDashboardCardsProps) => {
  const getRendicontoStatus = (): { label: string; color: StatusColor } => {
    switch (ultimoRendiconto.stato) {
      case 'completato':
        return { label: 'Completato', color: 'green' };
      case 'in_lavorazione':
        return { label: 'In lavorazione', color: 'yellow' };
      default:
        return { label: 'Da fare', color: 'red' };
    }
  };

  const cards: DashboardCardProps[] = [
    {
      title: 'Bandi Attivi',
      description: 'Scopri i bandi aperti e le opportunità di finanziamento per la tua associazione.',
      icon: <FileText className="h-6 w-6" />,
      count: bandiAperti,
      countLabel: bandiAperti === 1 ? 'bando aperto' : 'bandi aperti',
      route: '/associazione/bandi',
      cta: 'Vedi bandi',
      status: bandiAperti > 0 ? { label: 'Opportunità', color: 'green' } : undefined
    },
    {
      title: 'Progetti / CIG / CUP',
      description: 'Gestisci i progetti attivi, monitora lo stato e segui l\'avanzamento.',
      icon: <FolderKanban className="h-6 w-6" />,
      count: progettiAttivi,
      countLabel: progettiAttivi === 1 ? 'progetto attivo' : 'progetti attivi',
      route: '/associazione/progetti',
      cta: 'Gestisci progetti',
      status: progettiAttivi > 0 ? { label: 'In corso', color: 'yellow' } : { label: 'Nessun progetto', color: 'gray' }
    },
    {
      title: 'Rendiconti',
      description: 'Elabora i rendiconti dei progetti finanziati e tieni traccia delle spese.',
      icon: <Receipt className="h-6 w-6" />,
      route: '/associazione/progetti',
      cta: 'Elabora rendiconto',
      status: getRendicontoStatus()
    },
    {
      title: 'Pagamenti e Abbonamenti',
      description: 'Gestisci gli abbonamenti attivi per CIG/CUP e i metodi di pagamento.',
      icon: <CreditCard className="h-6 w-6" />,
      route: '/associazione/pagamenti',
      cta: 'Gestisci pagamenti',
      status: abbonamentoAttivo 
        ? { label: 'Attivo', color: 'green' } 
        : { label: 'Da attivare', color: 'yellow' }
    },
    {
      title: 'Documenti',
      description: 'Bandi caricati, rendiconti prodotti, ricevute e tutta la documentazione.',
      icon: <Files className="h-6 w-6" />,
      count: documentiCaricati,
      countLabel: documentiCaricati === 1 ? 'documento' : 'documenti',
      route: '/associazione/documenti',
      cta: 'Vedi documenti'
    },
    {
      title: 'Notifiche',
      description: 'Scadenze bandi, scadenze rendiconti, alert documenti mancanti.',
      icon: <Bell className="h-6 w-6" />,
      route: '/associazione/notifiche',
      cta: 'Vedi notifiche',
      count: notifichePendenti,
      countLabel: 'da leggere',
      status: scadenzeImminenti > 0 
        ? { label: `${scadenzeImminenti} scadenze`, color: 'red' } 
        : notifichePendenti > 0 
          ? { label: 'Nuove', color: 'yellow' }
          : { label: 'Tutto ok', color: 'green' }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <DashboardCard key={card.route} {...card} />
      ))}
    </div>
  );
};

export default AssociazioneDashboardCards;
