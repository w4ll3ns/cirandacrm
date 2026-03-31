import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users2, Plus, RefreshCw, Trash2, UserPlus, UserMinus, Link2, RotateCcw, Eye, Loader2, Copy, Check, MessageSquare, Send, Image, AudioLines, LinkIcon, Upload, Search, X, Video, Download, Phone, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, Ban, Power, Film, Clock, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useData } from '@/contexts/DataContext';

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

type BroadcastType = 'text' | 'image' | 'audio' | 'video' | 'gif' | 'link';
type BroadcastResult = { groupPhone: string; status: string; error?: string };

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
  const navigate = useNavigate();
  const { conversas = [] } = useData();
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
  const [subGroupCounts, setSubGroupCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [communityParticipantCounts, setCommunityParticipantCounts] = useState<Record<string, number>>({});
  const [loadingParticipantCounts, setLoadingParticipantCounts] = useState(false);

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

  // Broadcast state
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastType, setBroadcastType] = useState<BroadcastType>('text');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastMediaUrl, setBroadcastMediaUrl] = useState('');
  const [broadcastCaption, setBroadcastCaption] = useState('');
  const [broadcastLinkUrl, setBroadcastLinkUrl] = useState('');
  const [broadcastLinkTitle, setBroadcastLinkTitle] = useState('');
  const [broadcastLinkDesc, setBroadcastLinkDesc] = useState('');
  const [broadcastLinkImage, setBroadcastLinkImage] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [broadcastRunning, setBroadcastRunning] = useState(false);
  const [broadcastResults, setBroadcastResults] = useState<BroadcastResult[] | null>(null);

  // File upload & link preview states
  const [mentionAll, setMentionAll] = useState(false);
  const [broadcastFile, setBroadcastFile] = useState<File | null>(null);
  const [broadcastFilePreview, setBroadcastFilePreview] = useState<string | null>(null);
  const [uploadingBroadcastFile, setUploadingBroadcastFile] = useState(false);
  const [mediaInputMode, setMediaInputMode] = useState<'url' | 'file'>('file');
  const [fetchingLinkPreview, setFetchingLinkPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Disabled communities state
  const [disabledIds, setDisabledIds] = useState<Set<string>>(new Set());

  // Delete confirmation dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string>('');
  const [deleteTargetName, setDeleteTargetName] = useState<string>('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Contacts state
  const [communityContacts, setCommunityContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsSearch, setContactsSearch] = useState('');
  const [contactsFilter, setContactsFilter] = useState('all');
  const [syncingContacts, setSyncingContacts] = useState<string | null>(null);
  const [pageTab, setPageTab] = useState<'communities' | 'contacts' | 'history'>('communities');
  const [contactsPage, setContactsPage] = useState(1);
  const CONTACTS_PER_PAGE = 200;

  // Broadcast history state
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Scheduling state
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduledBroadcasts, setScheduledBroadcasts] = useState<any[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // All available groups from loaded communities (exclude disabled)
  const allGroups = useMemo(() => {
    const groups: { name: string; phone: string; isGroupAnnouncement: boolean; communityName: string }[] = [];
    communities.forEach(c => {
      if (disabledIds.has(c.id)) return;
      const cName = c.name || c.communityName || 'Sem nome';
      const sgs = Array.isArray(c.subGroups) ? c.subGroups : [];
      sgs.forEach(sg => {
        groups.push({ ...sg, communityName: cName });
      });
    });
    return groups;
  }, [communities, disabledIds]);

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callCommunities('list', { page: 1, pageSize: 50 });
      const list: Community[] = Array.isArray(data) ? data : data?.communities || data?.data || [];
      setCommunities(list);

      // Enrich each community with metadata (subGroups)
      const enriched = await Promise.all(
        list.map(async (c) => {
          try {
            const meta = await callCommunities('metadata', { communityId: c.id });
            return { ...c, ...meta, subGroups: meta.subGroups || [] };
          } catch {
            return c;
          }
        })
      );
      setCommunities(enriched);

      // Fetch participant counts from metadata (participants array)
      setLoadingParticipantCounts(true);
      const counts: Record<string, number> = {};
      enriched.forEach((c: any) => {
        if (c.participants?.length != null) {
          counts[c.id] = c.participants.length;
        }
      });
      setCommunityParticipantCounts(counts);
      setLoadingParticipantCounts(false);

      toast.success('Comunidades carregadas');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao listar comunidades');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch disabled communities
  const fetchDisabledIds = useCallback(async () => {
    const { data } = await supabase.from('community_disabled').select('community_id');
    if (data) setDisabledIds(new Set(data.map(d => d.community_id)));
  }, []);

  const fetchBroadcastHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('broadcast_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setBroadcastHistory(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const fetchScheduledBroadcasts = useCallback(async () => {
    setLoadingScheduled(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_broadcasts')
        .select('*')
        .order('scheduled_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      setScheduledBroadcasts(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar agendamentos:', err);
    } finally {
      setLoadingScheduled(false);
    }
  }, []);

  const handleCancelScheduled = async (id: string) => {
    setCancellingId(id);
    try {
      const { error } = await supabase
        .from('scheduled_broadcasts')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('status', 'pending');
      if (error) throw error;
      toast.success('Disparo agendado cancelado');
      fetchScheduledBroadcasts();
    } catch (err: any) {
      toast.error('Erro ao cancelar: ' + (err.message || ''));
    } finally {
      setCancellingId(null);
    }
  };

  const handleScheduleBroadcast = async () => {
    if (!canSendBroadcast() || !scheduleDate || !scheduleTime) return;
    setBroadcastRunning(true);

    try {
      let mediaUrl = broadcastMediaUrl || undefined;

      // Upload file if selected
      if (broadcastFile && (broadcastType === 'image' || broadcastType === 'audio' || broadcastType === 'video' || broadcastType === 'gif')) {
        setUploadingBroadcastFile(true);
        try {
          mediaUrl = await uploadFileToStorage(broadcastFile);
        } finally {
          setUploadingBroadcastFile(false);
        }
      }

      const [hours, minutes] = scheduleTime.split(':').map(Number);
      const scheduledAt = new Date(scheduleDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('scheduled_broadcasts').insert({
        user_id: user?.id,
        scheduled_at: scheduledAt.toISOString(),
        type: broadcastType,
        message: broadcastMessage || null,
        media_url: mediaUrl || null,
        caption: broadcastCaption || null,
        link_url: broadcastLinkUrl || null,
        link_title: broadcastLinkTitle || null,
        link_description: broadcastLinkDesc || null,
        link_image: broadcastLinkImage || null,
        group_phones: Array.from(selectedGroups),
        mention_all: mentionAll,
      });

      if (error) throw error;

      toast.success(`Disparo agendado para ${format(scheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`);
      setShowBroadcast(false);
      resetBroadcast();
      fetchScheduledBroadcasts();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao agendar disparo');
    } finally {
      setBroadcastRunning(false);
    }
  };

  useEffect(() => { fetchCommunities(); fetchDisabledIds(); }, [fetchCommunities, fetchDisabledIds]);

  const handleToggleDisable = async (communityId: string) => {
    const isDisabled = disabledIds.has(communityId);
    try {
      if (isDisabled) {
        await supabase.from('community_disabled').delete().eq('community_id', communityId);
        toast.success('Comunidade reativada no sistema');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('community_disabled').insert({ community_id: communityId, disabled_by: user?.id });
        toast.success('Comunidade desativada no sistema');
      }
      fetchDisabledIds();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar status');
    }
  };

  const openDeleteConfirm = (communityId: string, communityName: string) => {
    setDeleteTargetId(communityId);
    setDeleteTargetName(communityName);
    setDeleteConfirmText('');
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText.toLowerCase() !== 'excluir') return;
    setLoadingAction(`deactivate-${deleteTargetId}`);
    setShowDeleteConfirm(false);
    try {
      await callCommunities('deactivate', { communityId: deleteTargetId });
      toast.success('Comunidade excluída do WhatsApp');
      fetchCommunities();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir comunidade');
    } finally {
      setLoadingAction(null);
    }
  };

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
    setSubGroupCounts({});
    try {
      const data = await callCommunities('metadata', { communityId });
      setMetadata(data);
      setShowMeta(true);

      // Fetch participant counts for each subgroup in parallel
      if (data?.subGroups?.length) {
        setLoadingCounts(true);
        const counts: Record<string, number> = {};
        await Promise.all(
          data.subGroups.map(async (sg: { phone: string }) => {
            try {
              const groupData = await callCommunities('group-metadata', { groupPhone: sg.phone });
              counts[sg.phone] = groupData?.participants?.length || 0;
            } catch {
              counts[sg.phone] = -1; // error indicator
            }
          })
        );
        setSubGroupCounts(counts);
        setLoadingCounts(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao buscar metadados');
    } finally {
      setLoadingAction(null);
    }
  };

  // handleDeactivate removed — replaced by handleToggleDisable + handleConfirmDelete

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

  // Broadcast handlers
  const toggleGroup = (phone: string) => {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedGroups.size === allGroups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(allGroups.map(g => g.phone)));
    }
  };

  const canSendBroadcast = () => {
    if (selectedGroups.size === 0) return false;
    switch (broadcastType) {
      case 'text': return !!broadcastMessage.trim();
      case 'image': return !!(broadcastMediaUrl.trim() || broadcastFile);
      case 'audio': return !!(broadcastMediaUrl.trim() || broadcastFile);
      case 'video': return !!(broadcastMediaUrl.trim() || broadcastFile);
      case 'gif': return !!(broadcastMediaUrl.trim() || broadcastFile);
      case 'link': return !!broadcastLinkUrl.trim();
    }
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'bin';
    const path = `broadcast/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('chat-media').upload(path, file);
    if (error) throw new Error('Erro ao fazer upload: ' + error.message);
    const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleBroadcast = async () => {
    if (!canSendBroadcast()) return;
    setBroadcastRunning(true);
    setBroadcastResults(null);

    try {
      let mediaUrl = broadcastMediaUrl || undefined;

      // Upload file if selected
      if (broadcastFile && (broadcastType === 'image' || broadcastType === 'audio' || broadcastType === 'video' || broadcastType === 'gif')) {
        setUploadingBroadcastFile(true);
        try {
          mediaUrl = await uploadFileToStorage(broadcastFile);
        } finally {
          setUploadingBroadcastFile(false);
        }
      }

      const { data, error } = await supabase.functions.invoke('zapi-community-broadcast', {
        body: {
          type: broadcastType,
          message: broadcastMessage,
          media_url: mediaUrl,
          caption: broadcastCaption || undefined,
          link_url: broadcastLinkUrl || undefined,
          link_title: broadcastLinkTitle || undefined,
          link_description: broadcastLinkDesc || undefined,
          link_image: broadcastLinkImage || undefined,
          group_phones: Array.from(selectedGroups),
          mention_all: mentionAll || undefined,
        },
      });

      if (error) throw new Error(error.message);

      const results: BroadcastResult[] = data?.results || [];
      setBroadcastResults(results);

      const sent = results.filter(r => r.status === 'sent').length;
      const errors = results.filter(r => r.status === 'error').length;

      // Save broadcast log
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('broadcast_logs').insert({
          user_id: user?.id,
          type: broadcastType,
          message: broadcastMessage || null,
          media_url: broadcastMediaUrl || null,
          caption: broadcastCaption || null,
          link_url: broadcastLinkUrl || null,
          link_title: broadcastLinkTitle || null,
          link_description: broadcastLinkDesc || null,
          link_image: broadcastLinkImage || null,
          group_phones: Array.from(selectedGroups),
          results: results as any,
          sent_count: sent,
          error_count: errors,
        });
      } catch (logErr) {
        console.error('Erro ao salvar log do disparo:', logErr);
      }

      if (errors === 0) {
        toast.success(`Disparo concluído! ${sent} mensagens enviadas.`);
      } else {
        toast.warning(`Disparo concluído: ${sent} enviadas, ${errors} com erro.`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro no disparo');
    } finally {
      setBroadcastRunning(false);
    }
  };

  const resetBroadcast = () => {
    setBroadcastType('text');
    setBroadcastMessage('');
    setBroadcastMediaUrl('');
    setBroadcastCaption('');
    setBroadcastLinkUrl('');
    setBroadcastLinkTitle('');
    setBroadcastLinkDesc('');
    setBroadcastLinkImage('');
    setSelectedGroups(new Set());
    setBroadcastResults(null);
    setBroadcastFile(null);
    setBroadcastFilePreview(null);
    setMediaInputMode('file');
    setMentionAll(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBroadcastFile(file);
    setBroadcastMediaUrl('');
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setBroadcastFilePreview(url);
    } else {
      setBroadcastFilePreview(null);
    }
  };

  const clearFile = () => {
    setBroadcastFile(null);
    setBroadcastFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFetchLinkPreview = async () => {
    if (!broadcastLinkUrl.trim()) return;
    setFetchingLinkPreview(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-link-preview', {
        body: { url: broadcastLinkUrl },
      });
      if (error) throw new Error(error.message);
      if (data?.title) setBroadcastLinkTitle(data.title);
      if (data?.description) setBroadcastLinkDesc(data.description);
      if (data?.image) setBroadcastLinkImage(data.image);
      toast.success('Preview carregado!');
    } catch (err: any) {
      toast.error('Não foi possível buscar o preview: ' + (err.message || 'Erro'));
    } finally {
      setFetchingLinkPreview(false);
    }
  };

  // Fetch contacts from DB
  const fetchContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      let allData: any[] = [];
      const PAGE_SIZE = 1000;
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('community_contacts')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        if (data && data.length > 0) {
          allData = allData.concat(data);
          from += PAGE_SIZE;
          if (data.length < PAGE_SIZE) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      setCommunityContacts(allData);
    } catch (err: any) {
      toast.error('Erro ao carregar contatos: ' + (err.message || ''));
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleSyncContacts = async (communityId: string, communityName: string) => {
    setSyncingContacts(communityId);
    try {
      const data = await callCommunities('sync-participants', { communityId, communityName });
      toast.success(`Sincronização concluída! ${data.totalNew || 0} contatos processados, ${data.totalErrors || 0} erros.`);
      fetchContacts();
    } catch (err: any) {
      toast.error('Erro ao sincronizar: ' + (err.message || ''));
    } finally {
      setSyncingContacts(null);
    }
  };

  // Unique community names for filter
  const uniqueCommunities = useMemo(() => {
    const names = new Set(communityContacts.map(c => c.community_name).filter(Boolean));
    return Array.from(names);
  }, [communityContacts]);

  const filteredContacts = useMemo(() => {
    return communityContacts.filter(c => {
      const matchSearch = !contactsSearch ||
        c.phone?.includes(contactsSearch) ||
        c.name?.toLowerCase().includes(contactsSearch.toLowerCase()) ||
        c.group_name?.toLowerCase().includes(contactsSearch.toLowerCase());
      const matchFilter = contactsFilter === 'all' || c.community_name === contactsFilter;
      return matchSearch && matchFilter;
    });
  }, [communityContacts, contactsSearch, contactsFilter]);

  // Reset page when filters change
  useEffect(() => { setContactsPage(1); }, [contactsSearch, contactsFilter]);

  const totalPages = Math.ceil(filteredContacts.length / CONTACTS_PER_PAGE);
  const paginatedContacts = filteredContacts.slice(
    (contactsPage - 1) * CONTACTS_PER_PAGE,
    contactsPage * CONTACTS_PER_PAGE
  );

  const exportCSV = () => {
    const header = ['Telefone', 'Nome', 'Comunidade', 'Grupo', 'Data'];
    const rows = filteredContacts.map(c => [
      c.phone || '',
      c.name || '',
      c.community_name || '',
      c.group_name || '',
      c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contatos_comunidades_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filteredContacts.length} contatos exportados em CSV`);
  };

  const exportXLSX = () => {
    const data = filteredContacts.map(c => ({
      Telefone: c.phone || '',
      Nome: c.name || '',
      Comunidade: c.community_name || '',
      Grupo: c.group_name || '',
      Data: c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contatos');
    ws['!cols'] = [{ wch: 18 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 12 }];
    XLSX.writeFile(wb, `contatos_comunidades_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`${filteredContacts.length} contatos exportados em XLSX`);
  };

  const contactCountByCommunity = useMemo(() => {
    const counts: Record<string, number> = {};
    communityContacts.forEach(c => {
      if (c.community_id) {
        counts[c.community_id] = (counts[c.community_id] || 0) + 1;
      }
    });
    return counts;
  }, [communityContacts]);

  const estimatedTime = useMemo(() => {
    const count = selectedGroups.size;
    if (count <= 1) return null;
    const minSec = (count - 1) * 15;
    const maxSec = (count - 1) * 25;
    return `~${Math.round(minSec / 60)}-${Math.round(maxSec / 60)} min`;
  }, [selectedGroups.size]);

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
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchCommunities} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Carregando...' : 'Carregar'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { resetBroadcast(); setShowBroadcast(true); }} disabled={allGroups.length === 0}>
            <Send className="w-4 h-4 mr-1" />
            Disparar Mensagem
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Nova Comunidade
          </Button>
        </div>
      </div>

      <Tabs value={pageTab} onValueChange={(v) => {
        setPageTab(v as 'communities' | 'contacts' | 'history');
        if (v === 'history') fetchBroadcastHistory();
      }} className="w-full">
        <TabsList>
          <TabsTrigger value="communities">Comunidades</TabsTrigger>
          <TabsTrigger value="contacts">
            Contatos
            {communityContacts.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] py-0 px-1.5">{communityContacts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="communities" className="space-y-4">
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
            {communities.map((c) => {
              const isDisabled = disabledIds.has(c.id);
              return (
              <Card key={c.id} className={`group ${isDisabled ? 'opacity-50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate">{c.name || c.communityName || 'Sem nome'}</CardTitle>
                      <CardDescription className="text-xs mt-1 font-mono truncate">{c.id}</CardDescription>
                    </div>
                    {isDisabled && (
                      <Badge variant="destructive" className="shrink-0">Desativada</Badge>
                    )}
                    <Badge variant="secondary" className="shrink-0">
                      {c.subGroups?.length || 0} grupo(s)
                    </Badge>
                    {communityParticipantCounts[c.id] != null ? (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        <Users2 className="w-3 h-3 mr-1" />
                        {communityParticipantCounts[c.id]} participantes
                      </Badge>
                    ) : loadingParticipantCounts ? (
                      <Badge variant="outline" className="shrink-0 text-xs animate-pulse">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ...
                      </Badge>
                    ) : null}
                    {contactCountByCommunity[c.id] != null && contactCountByCommunity[c.id] > 0 && (
                      <Badge variant="outline" className="shrink-0 text-xs text-primary">
                        <Phone className="w-3 h-3 mr-1" />
                        {contactCountByCommunity[c.id]} contatos
                      </Badge>
                    )}
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
                    <Button variant="outline" size="sm" className="h-7 text-xs"
                      disabled={syncingContacts === c.id}
                      onClick={() => handleSyncContacts(c.id, c.name || c.communityName || '')}>
                      {syncingContacts === c.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Download className="w-3 h-3 mr-1" />}
                      Sync
                    </Button>
                    <Button
                      variant={isDisabled ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleToggleDisable(c.id)}
                    >
                      {isDisabled ? <Power className="w-3 h-3 mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                      {isDisabled ? 'Ativar' : 'Desativar'}
                    </Button>
                    <Button variant="destructive" size="sm" className="h-7 text-xs"
                      disabled={loadingAction === `deactivate-${c.id}`}
                      onClick={() => openDeleteConfirm(c.id, c.name || c.communityName || 'Sem nome')}>
                      {loadingAction === `deactivate-${c.id}` ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />}
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por telefone, nome ou grupo..."
                value={contactsSearch}
                onChange={e => setContactsSearch(e.target.value)}
                className="pl-9 h-9"
              />
              {contactsSearch && (
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0" onClick={() => setContactsSearch('')}>
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={contactsFilter}
              onChange={e => setContactsFilter(e.target.value)}
            >
              <option value="all">Todas comunidades</option>
              {uniqueCommunities.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={fetchContacts} disabled={loadingContacts}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loadingContacts ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Badge variant="secondary">{filteredContacts.length} contatos</Badge>
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={filteredContacts.length === 0}>
              <FileText className="w-4 h-4 mr-1" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportXLSX} disabled={filteredContacts.length === 0}>
              <FileSpreadsheet className="w-4 h-4 mr-1" />
              XLSX
            </Button>
          </div>

          {filteredContacts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Phone className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">Nenhum contato registrado</p>
                <p className="text-sm text-muted-foreground mt-1">Sincronize os contatos nas comunidades para vê-los aqui</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[60vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Comunidade</TableHead>
                        <TableHead>Grupo</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedContacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-mono text-xs">{contact.phone}</TableCell>
                          <TableCell className="text-sm">{contact.name || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{contact.community_name || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{contact.group_name || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(contact.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Mostrando {((contactsPage - 1) * CONTACTS_PER_PAGE) + 1}–{Math.min(contactsPage * CONTACTS_PER_PAGE, filteredContacts.length)} de {filteredContacts.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={contactsPage <= 1} onClick={() => setContactsPage(p => p - 1)}>
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {contactsPage} de {totalPages}
                      </span>
                      <Button variant="outline" size="sm" disabled={contactsPage >= totalPages} onClick={() => setContactsPage(p => p + 1)}>
                        Próximo
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : broadcastHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Send className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">Nenhum disparo registrado</p>
                <p className="text-sm text-muted-foreground mt-1">O histórico aparecerá aqui após o primeiro disparo</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {broadcastHistory.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const typeBadgeMap: Record<string, string> = {
                  text: 'Texto', image: 'Imagem', audio: 'Áudio', video: 'Vídeo', link: 'Link'
                };
                const results = Array.isArray(log.results) ? log.results : [];
                return (
                  <Card key={log.id} className="cursor-pointer" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Badge variant="outline" className="shrink-0">{typeBadgeMap[log.type] || log.type}</Badge>
                          <span className="text-sm truncate text-muted-foreground">
                            {log.message ? (log.message.length > 60 ? log.message.slice(0, 60) + '…' : log.message) : log.media_url ? 'Mídia' : log.link_url || '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-xs">
                          <span className="text-muted-foreground">{log.group_phones?.length || 0} grupos</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">{log.sent_count} ✓</Badge>
                          {log.error_count > 0 && (
                            <Badge variant="destructive">{log.error_count} ✗</Badge>
                          )}
                          <span className="text-muted-foreground">
                            {new Date(log.created_at).toLocaleDateString('pt-BR')} {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 border-t pt-3 space-y-2">
                          {log.message && (
                            <div><span className="text-xs font-medium text-muted-foreground">Mensagem:</span><p className="text-sm mt-0.5">{log.message}</p></div>
                          )}
                          {log.media_url && (
                            <div><span className="text-xs font-medium text-muted-foreground">Mídia:</span><p className="text-sm mt-0.5 break-all">{log.media_url}</p></div>
                          )}
                          {log.link_url && (
                            <div><span className="text-xs font-medium text-muted-foreground">Link:</span><p className="text-sm mt-0.5 break-all">{log.link_url}</p></div>
                          )}
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Resultados por grupo:</span>
                            <div className="mt-1 space-y-1">
                              {results.map((r: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <span className="font-mono">{r.groupPhone}</span>
                                  {r.status === 'sent' ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-[10px]">Enviado</Badge>
                                  ) : (
                                    <Badge variant="destructive" className="text-[10px]">Erro: {r.error || 'desconhecido'}</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
                      const groupPhone = sg.phone?.replace('-group', '').replace('@g.us', '');
                      const existingConversation = conversas.find(c => c.telefone === sg.phone || c.telefone === groupPhone);
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs py-2 px-3 rounded-md bg-muted hover:bg-muted/80 transition-colors">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${sg.isGroupAnnouncement ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                          <span className="truncate flex-1 font-medium">{sg.name}</span>
                          {sg.isGroupAnnouncement && <Badge variant="outline" className="text-[9px] py-0 px-1 shrink-0">Anúncios</Badge>}
                          {loadingCounts ? (
                            <Loader2 className="w-3 h-3 animate-spin shrink-0 text-muted-foreground" />
                          ) : subGroupCounts[sg.phone] !== undefined && subGroupCounts[sg.phone] >= 0 ? (
                            <Badge variant="secondary" className="text-[9px] py-0 px-1.5 shrink-0">
                              {subGroupCounts[sg.phone]} participantes
                            </Badge>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 shrink-0 text-xs gap-1"
                            onClick={() => {
                              if (existingConversation) {
                                navigate(`/app/conversas/${existingConversation.id}`);
                                setShowMeta(false);
                              } else {
                                toast.info('Nenhuma conversa encontrada para este grupo. Envie uma mensagem primeiro.');
                              }
                            }}
                            title="Abrir conversa do grupo"
                          >
                            <MessageSquare className="w-3 h-3" />
                            {existingConversation ? 'Abrir' : 'Sem conversa'}
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

              {/* Sync Contacts Button */}
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={syncingContacts === metadata.id}
                  onClick={() => handleSyncContacts(metadata.id, metadata.name || metadata.communityName || '')}
                >
                  {syncingContacts === metadata.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sincronizando contatos...</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" /> Sincronizar Contatos</>
                  )}
                </Button>
                {contactCountByCommunity[metadata.id] != null && (
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {contactCountByCommunity[metadata.id]} contatos registrados
                  </p>
                )}
              </div>
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

      {/* Broadcast Dialog */}
      <Dialog open={showBroadcast} onOpenChange={(open) => { if (!broadcastRunning) setShowBroadcast(open); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Disparar Mensagem
            </DialogTitle>
            <DialogDescription>
              Envie mensagens em massa para grupos das suas comunidades com delay aleatório (15-25s) entre envios.
            </DialogDescription>
          </DialogHeader>

          {broadcastResults ? (
            /* Results view */
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">
                  {broadcastResults.filter(r => r.status === 'sent').length} enviadas
                </Badge>
                {broadcastResults.some(r => r.status === 'error') && (
                  <Badge variant="destructive" className="text-sm">
                    {broadcastResults.filter(r => r.status === 'error').length} com erro
                  </Badge>
                )}
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {broadcastResults.map((r, i) => {
                  const group = allGroups.find(g => g.phone === r.groupPhone);
                  return (
                    <div key={i} className={`flex items-center gap-2 text-xs py-2 px-3 rounded-md ${r.status === 'sent' ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${r.status === 'sent' ? 'bg-primary' : 'bg-destructive'}`} />
                      <span className="truncate flex-1 font-medium">{group?.name || r.groupPhone}</span>
                      <span className={`text-[10px] ${r.status === 'sent' ? 'text-primary' : 'text-destructive'}`}>
                        {r.status === 'sent' ? 'Enviada' : r.error || 'Erro'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBroadcast(false)}>Fechar</Button>
                <Button onClick={() => setBroadcastResults(null)}>Novo Disparo</Button>
              </DialogFooter>
            </div>
          ) : (
            /* Composer view */
            <div className="space-y-5">
              {/* Message type tabs */}
              <Tabs value={broadcastType} onValueChange={(v) => setBroadcastType(v as BroadcastType)}>
                <TabsList className="grid grid-cols-6 w-full">
                  <TabsTrigger value="text" className="text-xs gap-1"><MessageSquare className="w-3.5 h-3.5" /> Texto</TabsTrigger>
                  <TabsTrigger value="image" className="text-xs gap-1"><Image className="w-3.5 h-3.5" /> Imagem</TabsTrigger>
                  <TabsTrigger value="audio" className="text-xs gap-1"><AudioLines className="w-3.5 h-3.5" /> Áudio</TabsTrigger>
                  <TabsTrigger value="video" className="text-xs gap-1"><Video className="w-3.5 h-3.5" /> Vídeo</TabsTrigger>
                  <TabsTrigger value="gif" className="text-xs gap-1"><Film className="w-3.5 h-3.5" /> GIF</TabsTrigger>
                  <TabsTrigger value="link" className="text-xs gap-1"><LinkIcon className="w-3.5 h-3.5" /> Link</TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-3 mt-3">
                  <div>
                    <Label>Mensagem *</Label>
                    <Textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} placeholder="Digite a mensagem..." rows={4} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="mention-all-text" checked={mentionAll} onCheckedChange={setMentionAll} />
                    <Label htmlFor="mention-all-text" className="text-xs text-muted-foreground cursor-pointer">Mencionar todos os participantes</Label>
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-3 mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Button variant={mediaInputMode === 'file' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => { setMediaInputMode('file'); setBroadcastMediaUrl(''); }}>
                      <Upload className="w-3 h-3 mr-1" /> Enviar Arquivo
                    </Button>
                    <Button variant={mediaInputMode === 'url' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => { setMediaInputMode('url'); clearFile(); }}>
                      <LinkIcon className="w-3 h-3 mr-1" /> Colar URL
                    </Button>
                  </div>
                  {mediaInputMode === 'file' ? (
                    <div>
                      <Label>Arquivo de Imagem *</Label>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="block w-full text-sm text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer mt-1" />
                      {broadcastFilePreview && (
                        <div className="relative mt-2 inline-block">
                          <img src={broadcastFilePreview} alt="Preview" className="max-h-32 rounded-md border" />
                          <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5" onClick={clearFile}><X className="w-3 h-3" /></Button>
                        </div>
                      )}
                      {broadcastFile && !broadcastFilePreview && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{broadcastFile.name}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={clearFile}><X className="w-3 h-3" /></Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label>URL da Imagem *</Label>
                      <Input value={broadcastMediaUrl} onChange={e => setBroadcastMediaUrl(e.target.value)} placeholder="https://exemplo.com/imagem.jpg" />
                    </div>
                  )}
                  <div>
                    <Label>Legenda</Label>
                    <Textarea value={broadcastCaption || broadcastMessage} onChange={e => { setBroadcastCaption(e.target.value); setBroadcastMessage(e.target.value); }} placeholder="Legenda da imagem (opcional)" rows={3} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="mention-all-image" checked={mentionAll} onCheckedChange={setMentionAll} />
                    <Label htmlFor="mention-all-image" className="text-xs text-muted-foreground cursor-pointer">Mencionar todos os participantes</Label>
                  </div>
                </TabsContent>

                <TabsContent value="audio" className="space-y-3 mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Button variant={mediaInputMode === 'file' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => { setMediaInputMode('file'); setBroadcastMediaUrl(''); }}>
                      <Upload className="w-3 h-3 mr-1" /> Enviar Arquivo
                    </Button>
                    <Button variant={mediaInputMode === 'url' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => { setMediaInputMode('url'); clearFile(); }}>
                      <LinkIcon className="w-3 h-3 mr-1" /> Colar URL
                    </Button>
                  </div>
                  {mediaInputMode === 'file' ? (
                    <div>
                      <Label>Arquivo de Áudio *</Label>
                      <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileSelect} className="block w-full text-sm text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer mt-1" />
                      {broadcastFile && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <AudioLines className="w-4 h-4" />
                          <span>{broadcastFile.name}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={clearFile}><X className="w-3 h-3" /></Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label>URL do Áudio *</Label>
                      <Input value={broadcastMediaUrl} onChange={e => setBroadcastMediaUrl(e.target.value)} placeholder="https://exemplo.com/audio.mp3" />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="video" className="space-y-3 mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Button variant={mediaInputMode === 'file' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => { setMediaInputMode('file'); setBroadcastMediaUrl(''); }}>
                      <Upload className="w-3 h-3 mr-1" /> Enviar Arquivo
                    </Button>
                    <Button variant={mediaInputMode === 'url' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => { setMediaInputMode('url'); clearFile(); }}>
                      <LinkIcon className="w-3 h-3 mr-1" /> Colar URL
                    </Button>
                  </div>
                  {mediaInputMode === 'file' ? (
                    <div>
                      <Label>Arquivo de Vídeo *</Label>
                      <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="block w-full text-sm text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer mt-1" />
                      {broadcastFile && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Video className="w-4 h-4" />
                          <span>{broadcastFile.name}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={clearFile}><X className="w-3 h-3" /></Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label>URL do Vídeo *</Label>
                      <Input value={broadcastMediaUrl} onChange={e => setBroadcastMediaUrl(e.target.value)} placeholder="https://exemplo.com/video.mp4" />
                    </div>
                  )}
                  <div>
                    <Label>Legenda</Label>
                    <Textarea value={broadcastCaption || broadcastMessage} onChange={e => { setBroadcastCaption(e.target.value); setBroadcastMessage(e.target.value); }} placeholder="Legenda do vídeo (opcional)" rows={3} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="mention-all-video" checked={mentionAll} onCheckedChange={setMentionAll} />
                    <Label htmlFor="mention-all-video" className="text-xs text-muted-foreground cursor-pointer">Mencionar todos os participantes</Label>
                  </div>
                </TabsContent>

                <TabsContent value="gif" className="space-y-3 mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Button variant={mediaInputMode === 'file' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => { setMediaInputMode('file'); setBroadcastMediaUrl(''); }}>
                      <Upload className="w-3 h-3 mr-1" /> Enviar Arquivo
                    </Button>
                    <Button variant={mediaInputMode === 'url' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => { setMediaInputMode('url'); clearFile(); }}>
                      <LinkIcon className="w-3 h-3 mr-1" /> Colar URL
                    </Button>
                  </div>
                  {mediaInputMode === 'file' ? (
                    <div>
                      <Label>Arquivo GIF (MP4) *</Label>
                      <input ref={fileInputRef} type="file" accept="video/mp4" onChange={handleFileSelect} className="block w-full text-sm text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer mt-1" />
                      {broadcastFile && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Film className="w-4 h-4" />
                          <span>{broadcastFile.name}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={clearFile}><X className="w-3 h-3" /></Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label>URL do GIF (MP4) *</Label>
                      <Input value={broadcastMediaUrl} onChange={e => setBroadcastMediaUrl(e.target.value)} placeholder="https://exemplo.com/animacao.mp4" />
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground bg-muted rounded-md px-2 py-1.5">
                    ⚠️ O arquivo deve ser <strong>MP4</strong> — o WhatsApp reproduz como GIF automaticamente.
                  </p>
                  <div className="flex items-center gap-2">
                    <Switch id="mention-all-gif" checked={mentionAll} onCheckedChange={setMentionAll} />
                    <Label htmlFor="mention-all-gif" className="text-xs text-muted-foreground cursor-pointer">Mencionar todos os participantes</Label>
                  </div>
                </TabsContent>

                <TabsContent value="link" className="space-y-3 mt-3">
                  <div>
                    <Label>URL do Link *</Label>
                    <div className="flex gap-2">
                      <Input value={broadcastLinkUrl} onChange={e => setBroadcastLinkUrl(e.target.value)} placeholder="https://exemplo.com" className="flex-1" />
                      <Button variant="secondary" size="sm" onClick={handleFetchLinkPreview} disabled={!broadcastLinkUrl.trim() || fetchingLinkPreview}>
                        {fetchingLinkPreview ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Search className="w-4 h-4 mr-1" />}
                        Buscar Preview
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Mensagem</Label>
                    <Textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} placeholder="Texto que acompanha o link" rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Título do Preview</Label>
                      <Input value={broadcastLinkTitle} onChange={e => setBroadcastLinkTitle(e.target.value)} placeholder="Título" />
                    </div>
                    <div>
                      <Label>Imagem do Preview</Label>
                      <Input value={broadcastLinkImage} onChange={e => setBroadcastLinkImage(e.target.value)} placeholder="URL da imagem" />
                    </div>
                  </div>
                  <div>
                    <Label>Descrição do Preview</Label>
                    <Input value={broadcastLinkDesc} onChange={e => setBroadcastLinkDesc(e.target.value)} placeholder="Descrição curta" />
                  </div>
                  {broadcastLinkImage && (
                    <div className="border rounded-md p-3 bg-muted/30">
                      <p className="text-[10px] text-muted-foreground mb-1.5">Preview</p>
                      <div className="flex gap-3 items-start">
                        <img src={broadcastLinkImage} alt="Preview" className="w-16 h-16 rounded object-cover shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        <div className="min-w-0">
                          {broadcastLinkTitle && <p className="text-xs font-medium truncate">{broadcastLinkTitle}</p>}
                          {broadcastLinkDesc && <p className="text-[10px] text-muted-foreground line-clamp-2">{broadcastLinkDesc}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Switch id="mention-all-link" checked={mentionAll} onCheckedChange={setMentionAll} />
                    <Label htmlFor="mention-all-link" className="text-xs text-muted-foreground cursor-pointer">Mencionar todos os participantes</Label>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Group selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Selecionar Grupos ({selectedGroups.size}/{allGroups.length})</Label>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={toggleAll}>
                    {selectedGroups.size === allGroups.length ? 'Desmarcar todos' : 'Selecionar todos'}
                  </Button>
                </div>
                {allGroups.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center bg-muted rounded-md">
                    Carregue as comunidades primeiro para ver os grupos disponíveis.
                  </p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto border rounded-md p-2">
                    {allGroups.map((g, i) => (
                      <label key={i} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded hover:bg-muted cursor-pointer transition-colors">
                        <Checkbox
                          checked={selectedGroups.has(g.phone)}
                          onCheckedChange={() => toggleGroup(g.phone)}
                        />
                        <span className="truncate flex-1">{g.name}</span>
                        <span className="text-muted-foreground text-[10px] shrink-0">{g.communityName}</span>
                        {g.isGroupAnnouncement && <Badge variant="outline" className="text-[9px] py-0 px-1 shrink-0">Anúncios</Badge>}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Estimated time */}
              {estimatedTime && selectedGroups.size > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                  <Loader2 className="w-3 h-3" />
                  <span>Tempo estimado: {estimatedTime} (delay aleatório de 15-25s entre cada envio)</span>
                </div>
              )}

              {/* Sending state */}
              {broadcastRunning && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">Enviando mensagens...</span>
                  </div>
                  <Progress value={undefined} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Aguarde enquanto as mensagens são enviadas com delay entre cada grupo para evitar bloqueios.
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBroadcast(false)} disabled={broadcastRunning}>Cancelar</Button>
                <Button onClick={handleBroadcast} disabled={!canSendBroadcast() || broadcastRunning}>
                  {broadcastRunning ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Enviando...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-1" /> Iniciar Disparo ({selectedGroups.size} grupos)</>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Comunidade</DialogTitle>
            <DialogDescription>
              Esta ação irá desconectar a comunidade <strong>{deleteTargetName}</strong> do WhatsApp permanentemente. Todos os grupos serão desconectados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Para confirmar, digite <strong className="text-destructive">excluir</strong> no campo abaixo:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Digite 'excluir' para confirmar"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText.toLowerCase() !== 'excluir'}
              onClick={handleConfirmDelete}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
