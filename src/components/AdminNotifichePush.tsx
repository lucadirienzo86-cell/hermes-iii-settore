import { useState, useEffect } from "react";
import { Send, Users, Building2, UserCheck, Bell, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserWithSubscription {
  id: string;
  email: string;
  nome: string | null;
  cognome: string | null;
  roles: string[];
  hasSubscription: boolean;
}

type TargetType = "all" | "aziende" | "docenti" | "gestori" | "custom";

export default function AdminNotifichePush() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);
  const [subscriberCount, setSubscriberCount] = useState(0);

  useEffect(() => {
    loadUsers();
    loadSubscriberCount();
  }, []);

  const loadSubscriberCount = async () => {
    const { count } = await supabase
      .from("push_subscriptions")
      .select("*", { count: "exact", head: true });
    setSubscriberCount(count || 0);
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, nome, cognome")
        .order("email");

      if (profilesError) throw profilesError;

      // Get all subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from("push_subscriptions")
        .select("user_id");

      if (subsError) throw subsError;

      const subscribedUserIds = new Set(subscriptions?.map(s => s.user_id) || []);

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);

          return {
            ...profile,
            roles: rolesData?.map(r => r.role) || [],
            hasSubscription: subscribedUserIds.has(profile.id),
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Errore nel caricamento degli utenti");
    } finally {
      setIsLoading(false);
    }
  };

  const getTargetUserIds = (): string[] => {
    switch (targetType) {
      case "all":
        return users.filter(u => u.hasSubscription).map(u => u.id);
      case "aziende":
        return users.filter(u => u.hasSubscription && u.roles.includes("azienda")).map(u => u.id);
      case "docenti":
        return users.filter(u => u.hasSubscription && u.roles.includes("docente")).map(u => u.id);
      case "gestori":
        return users.filter(u => u.hasSubscription && u.roles.includes("gestore")).map(u => u.id);
      case "custom":
        return selectedUsers;
      default:
        return [];
    }
  };

  const getTargetCount = (): number => {
    return getTargetUserIds().length;
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Inserisci titolo e messaggio");
      return;
    }

    const targetUserIds = getTargetUserIds();
    if (targetUserIds.length === 0) {
      toast.error("Nessun destinatario selezionato o nessun utente con notifiche attive");
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          user_ids: targetUserIds,
          payload: {
            title: title.trim(),
            body: body.trim(),
            url: url.trim() || undefined,
            tag: "admin-manual",
          },
        },
      });

      if (error) throw error;

      setSendResult({ sent: data.sent, failed: data.failed });
      
      if (data.sent > 0) {
        toast.success(`Notifica inviata a ${data.sent} utenti`);
        // Reset form
        setTitle("");
        setBody("");
        setUrl("");
        setSelectedUsers([]);
      } else {
        toast.error("Nessuna notifica inviata");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Errore nell'invio della notifica");
    } finally {
      setIsSending(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllWithSubscription = () => {
    setSelectedUsers(users.filter(u => u.hasSubscription).map(u => u.id));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-300";
      case "gestore":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "azienda":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "docente":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const filteredUsers = users.filter(u => {
    if (targetType === "custom") return true;
    if (targetType === "aziende") return u.roles.includes("azienda");
    if (targetType === "docenti") return u.roles.includes("docente");
    if (targetType === "gestori") return u.roles.includes("gestore");
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{subscriberCount}</p>
                <p className="text-sm text-muted-foreground">Iscritti alle notifiche</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{getTargetCount()}</p>
                <p className="text-sm text-muted-foreground">Destinatari selezionati</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Utenti totali</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose Notification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Componi Notifica
            </CardTitle>
            <CardDescription>
              Scrivi il messaggio da inviare agli utenti selezionati
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                placeholder="Es: Nuovo bando disponibile!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">{title.length}/100 caratteri</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Messaggio *</Label>
              <Textarea
                id="body"
                placeholder="Es: È stato pubblicato un nuovo bando che potrebbe interessarti..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{body.length}/500 caratteri</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Link (opzionale)</Label>
              <Input
                id="url"
                placeholder="Es: /app/bandi"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Percorso relativo dove l'utente verrà reindirizzato
              </p>
            </div>

            {sendResult && (
              <Alert variant={sendResult.sent > 0 ? "default" : "destructive"}>
                {sendResult.sent > 0 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  Inviate: {sendResult.sent} | Fallite: {sendResult.failed}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSend}
              disabled={isSending || !title.trim() || !body.trim() || getTargetCount() === 0}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Invio in corso...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Invia a {getTargetCount()} utenti
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Target Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Destinatari
            </CardTitle>
            <CardDescription>
              Seleziona a chi inviare la notifica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={targetType} onValueChange={(v) => setTargetType(v as TargetType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  Tutti gli iscritti ({users.filter(u => u.hasSubscription).length})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="aziende" id="aziende" />
                <Label htmlFor="aziende" className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="h-4 w-4" />
                  Solo Aziende ({users.filter(u => u.hasSubscription && u.roles.includes("azienda")).length})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="docenti" id="docenti" />
                <Label htmlFor="docenti" className="flex items-center gap-2 cursor-pointer">
                  📚 Solo Docenti ({users.filter(u => u.hasSubscription && u.roles.includes("docente")).length})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gestori" id="gestori" />
                <Label htmlFor="gestori" className="flex items-center gap-2 cursor-pointer">
                  👤 Solo Professionisti ({users.filter(u => u.hasSubscription && u.roles.includes("gestore")).length})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="cursor-pointer">
                  Selezione manuale
                </Label>
              </div>
            </RadioGroup>

            {targetType === "custom" && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Selezionati: {selectedUsers.length}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllWithSubscription}>
                      Seleziona tutti
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedUsers([])}>
                      Deseleziona
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[300px] border rounded-lg p-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                            selectedUsers.includes(user.id)
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-accent"
                          } ${!user.hasSubscription ? "opacity-50" : ""}`}
                          onClick={() => user.hasSubscription && toggleUserSelection(user.id)}
                        >
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            disabled={!user.hasSubscription}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.nome && user.cognome
                                ? `${user.nome} ${user.cognome}`
                                : user.email}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            {user.roles.slice(0, 2).map((role) => (
                              <Badge
                                key={role}
                                variant="outline"
                                className={`text-xs ${getRoleBadgeColor(role)}`}
                              >
                                {role}
                              </Badge>
                            ))}
                            {!user.hasSubscription && (
                              <Badge variant="secondary" className="text-xs">
                                No notifiche
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadUsers();
                loadSubscriberCount();
              }}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Aggiorna lista utenti
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
