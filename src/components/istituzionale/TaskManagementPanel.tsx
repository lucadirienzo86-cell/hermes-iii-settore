import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  Plus, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  Send,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Task {
  id: string;
  titolo: string;
  tipo: 'verifica' | 'invio' | 'approvazione' | 'integrazione';
  stato: 'aperta' | 'in_corso' | 'in_attesa' | 'completata' | 'inviata';
  assegnatoA: string;
  creatoIl: Date;
  scadenza?: Date;
  associazioneNome?: string;
  note?: string;
}

const mockTasks: Task[] = [
  {
    id: '1',
    titolo: 'Verifica documentazione APS Volontari',
    tipo: 'verifica',
    stato: 'in_attesa',
    assegnatoA: 'Mario Rossi',
    creatoIl: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 giorni fa
    scadenza: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    associazioneNome: 'APS Volontari Cassino'
  },
  {
    id: '2',
    titolo: 'Richiesta integrazione documenti',
    tipo: 'integrazione',
    stato: 'inviata',
    assegnatoA: 'Laura Bianchi',
    creatoIl: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    associazioneNome: 'Pro Natura ODV'
  },
  {
    id: '3',
    titolo: 'Approvazione iscrizione Albo',
    tipo: 'approvazione',
    stato: 'aperta',
    assegnatoA: 'Non assegnato',
    creatoIl: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    scadenza: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    associazioneNome: 'Associazione Culturale Aurora'
  },
  {
    id: '4',
    titolo: 'Verifica RUNTS completata',
    tipo: 'verifica',
    stato: 'completata',
    assegnatoA: 'Mario Rossi',
    creatoIl: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    associazioneNome: 'Croce Rossa Locale'
  }
];

const getStatoBadge = (stato: Task['stato']) => {
  const config = {
    aperta: { label: 'Aperta', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    in_corso: { label: 'In Corso', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    in_attesa: { label: 'In Attesa', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    completata: { label: 'Completata', className: 'bg-green-100 text-green-700 border-green-200' },
    inviata: { label: 'Inviata', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  };
  return config[stato];
};

const getTipoIcon = (tipo: Task['tipo']) => {
  const icons = {
    verifica: Eye,
    invio: Send,
    approvazione: CheckCircle,
    integrazione: ClipboardList,
  };
  return icons[tipo];
};

const isOverdue = (task: Task) => {
  if (!task.scadenza) return false;
  return new Date() > task.scadenza && task.stato !== 'completata';
};

const isNearDeadline = (task: Task) => {
  if (!task.scadenza) return false;
  const diff = task.scadenza.getTime() - Date.now();
  const twoDays = 2 * 24 * 60 * 60 * 1000;
  return diff > 0 && diff < twoDays && task.stato !== 'completata';
};

export const TaskManagementPanel = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filter, setFilter] = useState<'tutte' | 'aperte' | 'in_attesa' | 'completate'>('tutte');

  const filteredTasks = tasks.filter(t => {
    if (filter === 'tutte') return true;
    if (filter === 'aperte') return t.stato === 'aperta' || t.stato === 'in_corso';
    if (filter === 'in_attesa') return t.stato === 'in_attesa' || t.stato === 'inviata';
    if (filter === 'completate') return t.stato === 'completata';
    return true;
  });

  const handleCompleteTask = (taskId: string) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, stato: 'completata' as const } : t
    ));
  };

  const handleAssignTask = (taskId: string) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, assegnatoA: 'Mario Rossi', stato: 'in_corso' as const } : t
    ));
  };

  const stats = {
    aperte: tasks.filter(t => t.stato === 'aperta' || t.stato === 'in_corso').length,
    inAttesa: tasks.filter(t => t.stato === 'in_attesa' || t.stato === 'inviata').length,
    completate: tasks.filter(t => t.stato === 'completata').length,
    inRitardo: tasks.filter(t => isOverdue(t)).length,
  };

  return (
    <Card className="border border-gray-200 shadow-sm bg-white">
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#1a1a2e]">
            <div className="w-8 h-8 rounded-lg bg-[#003399] flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            Gestione Attività
          </CardTitle>
          <Button 
            size="sm" 
            className="bg-[#003399] hover:bg-[#002266] text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuova Attività
          </Button>
        </div>

        {/* Mini Stats */}
        <div className="flex gap-4 mt-4">
          <button 
            onClick={() => setFilter('aperte')}
            className={`text-center p-2 rounded-lg transition-colors ${filter === 'aperte' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
          >
            <p className="text-xl font-bold text-[#003399]">{stats.aperte}</p>
            <p className="text-xs text-gray-500">Aperte</p>
          </button>
          <button 
            onClick={() => setFilter('in_attesa')}
            className={`text-center p-2 rounded-lg transition-colors ${filter === 'in_attesa' ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
          >
            <p className="text-xl font-bold text-orange-600">{stats.inAttesa}</p>
            <p className="text-xs text-gray-500">In Attesa</p>
          </button>
          <button 
            onClick={() => setFilter('completate')}
            className={`text-center p-2 rounded-lg transition-colors ${filter === 'completate' ? 'bg-green-50' : 'hover:bg-gray-50'}`}
          >
            <p className="text-xl font-bold text-green-600">{stats.completate}</p>
            <p className="text-xs text-gray-500">Completate</p>
          </button>
          {stats.inRitardo > 0 && (
            <div className="text-center p-2 rounded-lg bg-red-50">
              <p className="text-xl font-bold text-red-600">{stats.inRitardo}</p>
              <p className="text-xs text-red-500">In Ritardo!</p>
            </div>
          )}
          <button 
            onClick={() => setFilter('tutte')}
            className={`text-center p-2 rounded-lg transition-colors ml-auto ${filter === 'tutte' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <p className="text-xs text-gray-500">Mostra Tutte</p>
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <ul className="divide-y divide-gray-100">
          {filteredTasks.map((task) => {
            const TipoIcon = getTipoIcon(task.tipo);
            const statoBadge = getStatoBadge(task.stato);
            const overdue = isOverdue(task);
            const nearDeadline = isNearDeadline(task);

            return (
              <li 
                key={task.id} 
                className={`py-3 ${overdue ? 'bg-red-50/50 -mx-4 px-4 rounded-lg' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      overdue ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      <TipoIcon className={`w-4 h-4 ${overdue ? 'text-red-600' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-[#1a1a2e] text-sm truncate">
                          {task.titolo}
                        </p>
                        {overdue && (
                          <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            In Ritardo!
                          </span>
                        )}
                        {nearDeadline && !overdue && (
                          <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                            <Clock className="w-3 h-3" />
                            Scade presto
                          </span>
                        )}
                      </div>
                      {task.associazioneNome && (
                        <p className="text-xs text-gray-500 truncate">{task.associazioneNome}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <Badge variant="outline" className={statoBadge.className}>
                          {statoBadge.label}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <User className="w-3 h-3" />
                          {task.assegnatoA}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(task.creatoIl, { addSuffix: true, locale: it })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {task.stato !== 'completata' && (
                        <>
                          <DropdownMenuItem onClick={() => handleCompleteTask(task.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Segna Completata
                          </DropdownMenuItem>
                          {task.assegnatoA === 'Non assegnato' && (
                            <DropdownMenuItem onClick={() => handleAssignTask(task.id)}>
                              <User className="w-4 h-4 mr-2" />
                              Assegna a me
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizza Dettagli
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            );
          })}
        </ul>

        {filteredTasks.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nessuna attività</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
