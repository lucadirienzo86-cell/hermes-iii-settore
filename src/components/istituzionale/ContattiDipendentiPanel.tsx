import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Plus, 
  Phone, 
  Mail, 
  Trash2, 
  Edit2, 
  Check, 
  X 
} from 'lucide-react';

interface Dipendente {
  id: string;
  nome: string;
  ruolo: string;
  telefono: string;
  email: string;
}

export const ContattiDipendentiPanel = () => {
  const [dipendenti, setDipendenti] = useState<Dipendente[]>([
    { id: '1', nome: 'Mario Rossi', ruolo: 'Responsabile Ufficio', telefono: '+39 0776 123456', email: 'mario.rossi@comune.it' },
    { id: '2', nome: 'Laura Bianchi', ruolo: 'Funzionario', telefono: '+39 0776 123457', email: 'laura.bianchi@comune.it' },
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDipendente, setNewDipendente] = useState({ nome: '', ruolo: '', telefono: '', email: '' });

  const handleAdd = () => {
    if (newDipendente.nome && newDipendente.email) {
      setDipendenti([
        ...dipendenti,
        { ...newDipendente, id: Date.now().toString() }
      ]);
      setNewDipendente({ nome: '', ruolo: '', telefono: '', email: '' });
      setIsAdding(false);
    }
  };

  const handleDelete = (id: string) => {
    setDipendenti(dipendenti.filter(d => d.id !== id));
  };

  const handleEdit = (id: string, field: keyof Omit<Dipendente, 'id'>, value: string) => {
    setDipendenti(dipendenti.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#1a1a2e]">
            <div className="w-8 h-8 rounded-lg bg-[#003399] flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            Contatti Ufficio
          </CardTitle>
          <Button 
            size="sm" 
            onClick={() => setIsAdding(true)}
            className="bg-[#003399] hover:bg-[#002266] text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Aggiungi
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Add new form */}
        {isAdding && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Input
                placeholder="Nome e Cognome"
                value={newDipendente.nome}
                onChange={(e) => setNewDipendente({ ...newDipendente, nome: e.target.value })}
                className="text-sm"
              />
              <Input
                placeholder="Ruolo"
                value={newDipendente.ruolo}
                onChange={(e) => setNewDipendente({ ...newDipendente, ruolo: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Input
                placeholder="Telefono"
                value={newDipendente.telefono}
                onChange={(e) => setNewDipendente({ ...newDipendente, telefono: e.target.value })}
                className="text-sm"
              />
              <Input
                placeholder="Email"
                type="email"
                value={newDipendente.email}
                onChange={(e) => setNewDipendente({ ...newDipendente, email: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                <X className="w-4 h-4 mr-1" />
                Annulla
              </Button>
              <Button size="sm" onClick={handleAdd} className="bg-[#003399] hover:bg-[#002266]">
                <Check className="w-4 h-4 mr-1" />
                Salva
              </Button>
            </div>
          </div>
        )}

        {/* Contacts list */}
        <ul className="divide-y divide-gray-100">
          {dipendenti.map((dip) => (
            <li key={dip.id} className="py-3 group">
              {editingId === dip.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={dip.nome}
                      onChange={(e) => handleEdit(dip.id, 'nome', e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      value={dip.ruolo}
                      onChange={(e) => handleEdit(dip.id, 'ruolo', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={dip.telefono}
                      onChange={(e) => handleEdit(dip.id, 'telefono', e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      value={dip.email}
                      onChange={(e) => handleEdit(dip.id, 'email', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <Button size="sm" onClick={() => setEditingId(null)} className="bg-[#003399]">
                    <Check className="w-4 h-4 mr-1" />
                    Fine
                  </Button>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-[#1a1a2e]">{dip.nome}</p>
                    <p className="text-xs text-gray-500 mb-2">{dip.ruolo}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <a href={`tel:${dip.telefono}`} className="flex items-center gap-1 hover:text-[#003399]">
                        <Phone className="w-3.5 h-3.5" />
                        {dip.telefono}
                      </a>
                      <a href={`mailto:${dip.email}`} className="flex items-center gap-1 hover:text-[#003399]">
                        <Mail className="w-3.5 h-3.5" />
                        {dip.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(dip.id)}>
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(dip.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        {dipendenti.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nessun contatto inserito</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};