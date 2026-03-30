import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users2, Plus, RefreshCw, Trash2, UserPlus, UserMinus, Link2, RotateCcw, Eye, Loader2, Copy, Check, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

type Community = {
  id: string;
  owner?: string;
  name?: string;
  communityName?: string;
  subGroups?: { name: string; phone: string; isGroupAnnouncement: boolean }[];
};

type CommunityMetadata = {
  id: string;
  name?: string;
  communityName?: string;
  owner?: string;
  description?: string;
  invitationLink?: string;
  subGroups?: { name: string; phone: string; isGroupAnnouncement: boolean }[];
  participants?: { phone: string; name?: string; isAdmin?: boolean }[];
};

async function callCommunities(action: string, params: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const { data, error } = await supabase.functions.invoke('zapi-communities', {
    body: { action, ...params },
  });

  if (error) throw new Error(error.message);
  return data;
}

export default function Communities() {
  const isMobile = useIsMobile();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Metadata dialog
  const [showMeta, setShowMeta] = useState(false);
  const [metadata, setMetadata] = useState<CommunityMetadata | null>(null);

  // Add participant dialog
  const [showAddPart, setShowAddPart] = useState(false);
  const [addPartCommunityId, setAddPartCommunityId] = useState('');
  const [addPartPhones, setAddPartPhones] = useState('');

  // Remove participant dialog
  const [showRemovePart, setShowRemovePart] = useState(false);
  const [removePartCommunityId, setRemovePartCommunityId] = useState('');
  const [removePartPhones, setRemovePartPhones] = useState('');

  // Invite link dialog
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLinkCommunityId, setInviteLinkCommunityId] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callCommunities('list', { page: 1, pageSize: 50 });
      setCommunities(Array.isArray(data) ? data : data?.communities || data?.data || []);
      toast.success('Comunidades carregadas');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao listar comunidades');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoadingAction('create');
    try {
      await callCommunities('create', { name: newName, description: newDesc || undefined });
      toast.success('Comunidade criada com sucesso!');
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      fetchCommunities();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar comunidade');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleViewMeta = async (communityId: string) => {
    setLoadingAction(`meta-${communityId}`);
    try {
      const data = await callCommunities('metadata', { communityId });
      setMetadata(data);
      setShowMeta(true);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao buscar metadados');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeactivate = async (communityId: string) => {
    if (!confirm('Tem certeza que deseja desativar esta comunidade? Todos os grupos serão desconectados.')) return;
    setLoadingAction(`deactivate-${communityId}`);
    try {
      await callCommunities('deactivate', { communityId });
      toast.success('Comunidade desativada');
      fetchCommunities();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao desativar comunidade');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAddParticipant = async () => {
    const phones = addPartPhones.split(/[,;\n]/).map(p => p.trim()).filter(Boolean);
    if (!phones.length || !addPartCommunityId) return;
    setLoadingAction('add-participant');
    try {
      await callCommunities('add-participant', { communityId: addPartCommunityId, phones, autoInvite: true });
      toast.success('Participante(s) adicionado(s)');
      setShowAddPart(false);
      setAddPartPhones('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar participantes');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemoveParticipant = async () => {
    const phones = removePartPhones.split(/[,;\n]/).map(p => p.trim()).filter(Boolean);
    if (!phones.length || !removePartCommunityId) return;
    setLoadingAction('remove-participant');
    try {
      await callCommunities('remove-participant', { communityId: removePartCommunityId, phones });
      toast.success('Participante(s) removido(s)');
      setShowRemovePart(false);
      setRemovePartPhones('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover participantes');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGetInviteLink = async (communityId: string) => {
    setLoadingAction(`invite-${communityId}`);
    try {
      const data = await callCommunities('invite-link', { communityId });
      setInviteLink(data?.invitationLink || data?.inviteLink || '');
      setInviteLinkCommunityId(communityId);
      setShowInviteLink(true);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao obter link de convite');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRedefineInviteLink = async () => {
    setLoadingAction('redefine-link');
    try {
      const data = await callCommunities('redefine-invite-link', { communityId: inviteLinkCommunityId });
      setInviteLink(data?.invitationLink || data?.inviteLink || '');
      toast.success('Link de convite redefinido!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao redefinir link');
    } finally {
      setLoadingAction(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users2 className="w-6 h-6 text-primary" />
            Comunidades
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas comunidades do WhatsApp</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCommunities} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Carregando...' : 'Carregar'}
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Nova Comunidade
          </Button>
        </div>
      </div>

      {communities.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhuma comunidade carregada</p>
            <p className="text-sm text-muted-foreground mt-1">Clique em "Carregar" para buscar suas comunidades</p>
          </CardContent>
        </Card>
      )}

      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {communities.map((c) => (
          <Card key={c.id} className="group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base truncate">{c.name || c.communityName || 'Sem nome'}</CardTitle>
                  <CardDescription className="text-xs mt-1 font-mono truncate">{c.id}</CardDescription>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {c.subGroups?.length || 0} grupo(s)
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {c.subGroups && c.subGroups.length > 0 && (
                <div className="mb-3 space-y-1">
                  {c.subGroups.slice(0, 3).map((sg, i) => (
                    <div key={i} className="text-xs flex items-center gap-1.5 text-muted-foreground">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sg.isGroupAnnouncement ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                      <span className="truncate">{sg.name}</span>
                      {sg.isGroupAnnouncement && <Badge variant="outline" className="text-[9px] py-0 px-1">Anúncios</Badge>}
                    </div>
                  ))}
                  {c.subGroups.length > 3 && (
                    <p className="text-[10px] text-muted-foreground">+{c.subGroups.length - 3} grupos</p>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-xs"
                  disabled={loadingAction === `meta-${c.id}`}
                  onClick={() => handleViewMeta(c.id)}>
                  {loadingAction === `meta-${c.id}` ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                  Detalhes
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs"
                  onClick={() => { setAddPartCommunityId(c.id); setShowAddPart(true); }}>
                  <UserPlus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs"
                  onClick={() => { setRemovePartCommunityId(c.id); setShowRemovePart(true); }}>
                  <UserMinus className="w-3 h-3 mr-1" />
                  Remover
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs"
                  disabled={loadingAction === `invite-${c.id}`}
                  onClick={() => handleGetInviteLink(c.id)}>
                  {loadingAction === `invite-${c.id}` ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Link2 className="w-3 h-3 mr-1" />}
                  Convite
                </Button>
                <Button variant="destructive" size="sm" className="h-7 text-xs"
                  disabled={loadingAction === `deactivate-${c.id}`}
                  onClick={() => handleDeactivate(c.id)}>
                  {loadingAction === `deactivate-${c.id}` ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />}
                  Desativar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Community Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Comunidade</DialogTitle>
            <DialogDescription>Crie uma nova comunidade no WhatsApp</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome da comunidade" />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descrição (opcional)" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || loadingAction === 'create'}>
              {loadingAction === 'create' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metadata Dialog */}
      <Dialog open={showMeta} onOpenChange={setShowMeta}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{metadata?.name || metadata?.communityName || 'Detalhes'}</DialogTitle>
            <DialogDescription>Metadados e grupos da comunidade</DialogDescription>
          </DialogHeader>
          {metadata && (
            <div className="space-y-4">
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono text-xs break-all">{metadata.id}</span>
                {metadata.owner && (
                  <>
                    <span className="text-muted-foreground">Owner:</span>
                    <span className="font-mono text-xs">{metadata.owner}</span>
                  </>
                )}
                {metadata.description && (
                  <>
                    <span className="text-muted-foreground">Descrição:</span>
                    <span className="text-xs">{metadata.description}</span>
                  </>
                )}
                {metadata.invitationLink && (
                  <>
                    <span className="text-muted-foreground">Convite:</span>
                    <a href={metadata.invitationLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate">
                      {metadata.invitationLink}
                    </a>
                  </>
                )}
              </div>

              {metadata.subGroups && metadata.subGroups.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Grupos ({metadata.subGroups.length})</h4>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {metadata.subGroups.map((sg, i) => {
                      const groupLink = `https://wa.me/group/${sg.phone?.replace('-group', '').replace('@g.us', '')}`;
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs py-2 px-3 rounded-md bg-muted hover:bg-muted/80 transition-colors">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${sg.isGroupAnnouncement ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                          <span className="truncate flex-1 font-medium">{sg.name}</span>
                          {sg.isGroupAnnouncement && <Badge variant="outline" className="text-[9px] py-0 px-1 shrink-0">Anúncios</Badge>}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 shrink-0"
                            onClick={() => {
                              const whatsappLink = `https://api.whatsapp.com/group/${sg.phone?.replace('-group', '').replace('@g.us', '')}`;
                              window.open(whatsappLink, '_blank');
                            }}
                            title="Abrir grupo no WhatsApp"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {metadata.participants && metadata.participants.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Participantes ({metadata.participants.length})</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {metadata.participants.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted">
                        <span className="font-mono">{p.phone}</span>
                        {p.isAdmin && <Badge variant="secondary" className="text-[9px] py-0 px-1">Admin</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Participant Dialog */}
      <Dialog open={showAddPart} onOpenChange={setShowAddPart}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Participantes</DialogTitle>
            <DialogDescription>Adicione participantes à comunidade. Quem não puder ser adicionado receberá um convite automático.</DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Telefones (separados por vírgula ou linha)</label>
            <Textarea value={addPartPhones} onChange={e => setAddPartPhones(e.target.value)} placeholder="5511999999999&#10;5521988888888" rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPart(false)}>Cancelar</Button>
            <Button onClick={handleAddParticipant} disabled={!addPartPhones.trim() || loadingAction === 'add-participant'}>
              {loadingAction === 'add-participant' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <UserPlus className="w-4 h-4 mr-1" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Participant Dialog */}
      <Dialog open={showRemovePart} onOpenChange={setShowRemovePart}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Participantes</DialogTitle>
            <DialogDescription>Remova participantes da comunidade</DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Telefones (separados por vírgula ou linha)</label>
            <Textarea value={removePartPhones} onChange={e => setRemovePartPhones(e.target.value)} placeholder="5511999999999&#10;5521988888888" rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemovePart(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRemoveParticipant} disabled={!removePartPhones.trim() || loadingAction === 'remove-participant'}>
              {loadingAction === 'remove-participant' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <UserMinus className="w-4 h-4 mr-1" />}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Link Dialog */}
      <Dialog open={showInviteLink} onOpenChange={setShowInviteLink}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de Convite</DialogTitle>
            <DialogDescription>Gerencie o link de convite da comunidade</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {inviteLink ? (
              <div className="flex items-center gap-2">
                <Input value={inviteLink} readOnly className="text-xs font-mono" />
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => copyToClipboard(inviteLink)}>
                  {copiedLink ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum link de convite disponível</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteLink(false)}>Fechar</Button>
            <Button variant="secondary" onClick={handleRedefineInviteLink} disabled={loadingAction === 'redefine-link'}>
              {loadingAction === 'redefine-link' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RotateCcw className="w-4 h-4 mr-1" />}
              Redefinir Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
