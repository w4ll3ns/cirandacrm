import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Plus, Copy, Check, Loader2, Trash2, ExternalLink, ToggleLeft, ToggleRight, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

type Campaign = {
  id: string;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  cor_primaria: string;
  cor_fundo: string;
  slug: string;
  ativa: boolean;
  created_at: string;
};

type CampaignGroup = {
  id: string;
  campaign_id: string;
  community_id: string;
  community_name: string;
  group_phone: string;
  group_name: string;
  max_participants: number;
  sort_order: number;
};

type Community = {
  id: string;
  name?: string;
  communityName?: string;
  subGroups?: { name: string; phone: string; isGroupAnnouncement: boolean }[];
};

async function callCommunities(action: string, params: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sessão não encontrada');
  const { data, error } = await supabase.functions.invoke('zapi-communities', {
    body: { action, ...params },
  });
  if (error) throw new Error(error.message);
  return data;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).substring(2, 8);
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formColorPrimary, setFormColorPrimary] = useState('#8B5CF6');
  const [formColorBg, setFormColorBg] = useState('#FFFFFF');
  const [saving, setSaving] = useState(false);

  // Group selection
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [groupParticipantCounts, setGroupParticipantCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<
    { communityId: string; communityName: string; groupPhone: string; groupName: string; maxParticipants: number; sortOrder: number }[]
  >([]);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('community_campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    setCampaigns((data as Campaign[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const fetchCommunities = useCallback(async () => {
    setLoadingCommunities(true);
    try {
      const list = await callCommunities('list', { page: 1, pageSize: 50 });
      const comms: Community[] = Array.isArray(list) ? list : list?.communities || list?.data || [];

      // Enrich with metadata to get subGroups
      const enriched = await Promise.all(
        comms.map(async (c: Community) => {
          try {
            const meta = await callCommunities('metadata', { communityId: c.id });
            return { ...c, ...meta, subGroups: meta.subGroups || [] };
          } catch {
            return c;
          }
        })
      );
      setCommunities(enriched);

      // Fetch participant counts for all subgroups
      setLoadingCounts(true);
      const counts: Record<string, number> = {};
      const allSubs = enriched.flatMap((c: Community) =>
        (c.subGroups || []).filter(s => !s.isGroupAnnouncement).map(s => s.phone)
      );
      await Promise.all(
        allSubs.map(async (phone: string) => {
          try {
            const meta = await callCommunities('group-metadata', { groupPhone: phone });
            counts[phone] = meta?.participants?.length ?? 0;
          } catch {
            counts[phone] = 0;
          }
        })
      );
      setGroupParticipantCounts(counts);
      setLoadingCounts(false);
    } catch (err) {
      toast.error('Erro ao carregar comunidades');
    }
    setLoadingCommunities(false);
  }, []);

  const openNewForm = () => {
    setEditingId(null);
    setFormName('');
    setFormDesc('');
    setFormImage('');
    setFormColorPrimary('#8B5CF6');
    setFormColorBg('#FFFFFF');
    setSelectedGroups([]);
    setShowForm(true);
    fetchCommunities();
  };

  const openEditForm = async (campaign: Campaign) => {
    setEditingId(campaign.id);
    setFormName(campaign.nome);
    setFormDesc(campaign.descricao || '');
    setFormImage(campaign.imagem_url || '');
    setFormColorPrimary(campaign.cor_primaria);
    setFormColorBg(campaign.cor_fundo);

    // Load existing groups
    const { data: groups } = await supabase
      .from('campaign_groups')
      .select('*')
      .eq('campaign_id', campaign.id)
      .order('sort_order');

    setSelectedGroups(
      (groups as CampaignGroup[] || []).map(g => ({
        communityId: g.community_id,
        communityName: g.community_name,
        groupPhone: g.group_phone,
        groupName: g.group_name,
        maxParticipants: g.max_participants,
        sortOrder: g.sort_order,
      }))
    );

    setShowForm(true);
    fetchCommunities();
  };

  const toggleGroup = (communityId: string, communityName: string, groupPhone: string, groupName: string) => {
    setSelectedGroups(prev => {
      const exists = prev.find(g => g.groupPhone === groupPhone);
      if (exists) {
        return prev.filter(g => g.groupPhone !== groupPhone);
      }
      return [...prev, { communityId, communityName, groupPhone, groupName, maxParticipants: 1000, sortOrder: prev.length }];
    });
  };

  const updateGroupLimit = (groupPhone: string, max: number) => {
    setSelectedGroups(prev =>
      prev.map(g => g.groupPhone === groupPhone ? { ...g, maxParticipants: max } : g)
    );
  };

  const saveCampaign = async () => {
    if (!formName.trim()) {
      toast.error('Nome da campanha é obrigatório');
      return;
    }
    if (selectedGroups.length === 0) {
      toast.error('Selecione ao menos um grupo');
      return;
    }

    setSaving(true);
    try {
      let campaignId = editingId;

      if (editingId) {
        const { error } = await supabase
          .from('community_campaigns')
          .update({
            nome: formName,
            descricao: formDesc || null,
            imagem_url: formImage || null,
            cor_primaria: formColorPrimary,
            cor_fundo: formColorBg,
          })
          .eq('id', editingId);
        if (error) throw error;

        // Delete old groups and re-insert
        await supabase.from('campaign_groups').delete().eq('campaign_id', editingId);
      } else {
        const slug = generateSlug(formName);
        const { data, error } = await supabase
          .from('community_campaigns')
          .insert({
            nome: formName,
            descricao: formDesc || null,
            imagem_url: formImage || null,
            cor_primaria: formColorPrimary,
            cor_fundo: formColorBg,
            slug,
          })
          .select()
          .single();
        if (error) throw error;
        campaignId = data.id;
      }

      // Insert groups
      const groupRows = selectedGroups.map((g, i) => ({
        campaign_id: campaignId!,
        community_id: g.communityId,
        community_name: g.communityName,
        group_phone: g.groupPhone,
        group_name: g.groupName,
        max_participants: g.maxParticipants,
        sort_order: i,
      }));

      const { error: grpErr } = await supabase.from('campaign_groups').insert(groupRows);
      if (grpErr) throw grpErr;

      toast.success(editingId ? 'Campanha atualizada!' : 'Campanha criada!');
      setShowForm(false);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar campanha');
    }
    setSaving(false);
  };

  const toggleActive = async (campaign: Campaign) => {
    await supabase
      .from('community_campaigns')
      .update({ ativa: !campaign.ativa })
      .eq('id', campaign.id);
    fetchCampaigns();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;
    await supabase.from('community_campaigns').delete().eq('id', id);
    toast.success('Campanha excluída');
    fetchCampaigns();
  };

  const copyLink = (slug: string, id: string) => {
    const url = `${window.location.origin}/entrar/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6" /> Campanhas
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie campanhas com links de entrada para comunidades</p>
        </div>
        <Button onClick={openNewForm}>
          <Plus className="h-4 w-4 mr-1" /> Nova Campanha
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma campanha criada ainda. Crie a primeira!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map(c => (
            <Card key={c.id} className="relative overflow-hidden">
              {c.imagem_url && (
                <div className="h-32 overflow-hidden">
                  <img src={c.imagem_url} alt={c.nome} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{c.nome}</CardTitle>
                  <Badge variant={c.ativa ? 'default' : 'secondary'}>{c.ativa ? 'Ativa' : 'Inativa'}</Badge>
                </div>
                {c.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{c.descricao}</p>}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 font-mono truncate">
                  /entrar/{c.slug}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => copyLink(c.slug, c.id)}>
                    {copiedId === c.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(`/entrar/${c.slug}`, '_blank')}>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditForm(c)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(c)}>
                    {c.ativa ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteCampaign(c.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
            <DialogDescription>Configure os dados da campanha e selecione os grupos</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Turma 2026" />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Descrição exibida na landing page" rows={3} />
            </div>

            <div>
              <Label>URL da Imagem de Capa</Label>
              <Input value={formImage} onChange={e => setFormImage(e.target.value)} placeholder="https://..." />
              {formImage && <img src={formImage} alt="preview" className="mt-2 h-24 rounded-lg object-cover" />}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cor Primária</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={formColorPrimary} onChange={e => setFormColorPrimary(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                  <Input value={formColorPrimary} onChange={e => setFormColorPrimary(e.target.value)} className="flex-1" />
                </div>
              </div>
              <div>
                <Label>Cor de Fundo</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={formColorBg} onChange={e => setFormColorBg(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                  <Input value={formColorBg} onChange={e => setFormColorBg(e.target.value)} className="flex-1" />
                </div>
              </div>
            </div>

            {/* Group Selection */}
            <div>
              <Label className="mb-2 block">Grupos / Subgrupos *</Label>
              {loadingCommunities ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando comunidades...
                </div>
              ) : communities.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <p className="text-sm text-muted-foreground">Nenhuma comunidade encontrada.</p>
                  <Button variant="outline" size="sm" onClick={fetchCommunities}>
                    <Loader2 className="h-3 w-3 mr-1" /> Tentar novamente
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                  {communities.map(comm => {
                    const commName = comm.communityName || comm.name || comm.id;
                    const subs = comm.subGroups || [];
                    if (subs.length === 0) return null;
                    return (
                      <div key={comm.id}>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">{commName}</p>
                        {subs.map(sub => {
                          const selected = selectedGroups.find(g => g.groupPhone === sub.phone);
                          return (
                            <div key={sub.phone} className="flex items-center gap-2 py-1.5 pl-3">
                              <input
                                type="checkbox"
                                checked={!!selected}
                                onChange={() => toggleGroup(comm.id, commName, sub.phone, sub.name)}
                                className="rounded"
                              />
                              <span className="text-sm flex-1 truncate">{sub.name}</span>
                              {selected && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">Máx:</span>
                                  <Input
                                    type="number"
                                    value={selected.maxParticipants}
                                    onChange={e => updateGroupLimit(sub.phone, parseInt(e.target.value) || 1)}
                                    className="w-20 h-7 text-xs"
                                    min={1}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
              {selectedGroups.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{selectedGroups.length} grupo(s) selecionado(s)</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={saveCampaign} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingId ? 'Salvar' : 'Criar Campanha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
