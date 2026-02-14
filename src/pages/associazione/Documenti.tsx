import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Files, 
  FileText, 
  FileSpreadsheet, 
  Receipt, 
  Upload,
  Download,
  Eye,
  Folder
} from 'lucide-react';

const AssociazioneDocumenti = () => {
  // Mock data
  const documenti = [
    {
      id: '1',
      nome: 'Bando Cultura 2025.pdf',
      tipo: 'bando',
      data: '2025-01-15',
      dimensione: '2.4 MB'
    },
    {
      id: '2',
      nome: 'Rendiconto Q4 2024.xlsx',
      tipo: 'rendiconto',
      data: '2025-01-10',
      dimensione: '156 KB'
    },
    {
      id: '3',
      nome: 'Ricevuta Pagamento Abb.pdf',
      tipo: 'ricevuta',
      data: '2025-01-01',
      dimensione: '98 KB'
    },
    {
      id: '4',
      nome: 'Delibera Approvazione.pdf',
      tipo: 'documento',
      data: '2024-12-20',
      dimensione: '1.2 MB'
    }
  ];

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'bando':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'rendiconto':
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case 'ricevuta':
        return <Receipt className="h-5 w-5 text-purple-600" />;
      default:
        return <Files className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      bando: 'bg-blue-100 text-blue-800',
      rendiconto: 'bg-green-100 text-green-800',
      ricevuta: 'bg-purple-100 text-purple-800',
      documento: 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={colors[tipo] || colors.documento}>
        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
      </Badge>
    );
  };

  const categorie = [
    { nome: 'Bandi', count: 3, icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { nome: 'Rendiconti', count: 5, icon: FileSpreadsheet, color: 'text-green-600 bg-green-50' },
    { nome: 'Ricevute', count: 8, icon: Receipt, color: 'text-purple-600 bg-purple-50' },
    { nome: 'Altri documenti', count: 4, icon: Folder, color: 'text-gray-600 bg-gray-50' }
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/associazione/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold">Documenti</h1>
                <p className="text-sm text-muted-foreground">Gestisci la documentazione dell'associazione</p>
              </div>
            </div>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Carica documento
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Categorie */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categorie.map((cat) => (
            <Card key={cat.nome} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${cat.color}`}>
                  <cat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{cat.nome}</p>
                  <p className="text-sm text-muted-foreground">{cat.count} file</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lista documenti recenti */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documenti recenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {documenti.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {getTipoIcon(doc.tipo)}
                    </div>
                    <div>
                      <p className="font-medium">{doc.nome}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{new Date(doc.data).toLocaleDateString('it-IT')}</span>
                        <span>•</span>
                        <span>{doc.dimensione}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTipoBadge(doc.tipo)}
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AssociazioneDocumenti;
