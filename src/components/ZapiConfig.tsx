import { useState, useEffect, useRef, useCallback } from 'react';
import { Wifi, WifiOff, Save, Trash2, Pencil, AlertTriangle, QrCode, Loader2, RefreshCw, Unplug } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ZapiInstance {
  id: string;
  nome_instancia: string;
  instance_id: string;
  token: string;
  client_token: string | null;
  connected: boolean | null;
  phone_number: string | null;
  status: string | null;
}

type ModalState = { open: false } | { open: true; instanceId: string; instanceName: string };

export default function ZapiConfig() {
  const [instances, setInstances] = useState<ZapiInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome_instancia: '', instance_id: '', token: '', client_token: '' });
  const [saving, setSaving] = useState(false);

  // QR Code modal state
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchInstances = async () => {
    const { data } = await supabase.from('zapi_instances').select('*').order('created_at');
    setInstances((data as ZapiInstance[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchInstances(); }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const isIncomplete = (inst: ZapiInstance) => !inst.client_token || !inst.token || !inst.instance_id;

  const callInstanceManager = async (instanceId: string, action: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zapi-instance-manager?action=${action}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ instanceId }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(err.error || `Erro ${res.status}`);
    }

    return res.json();
  };

  const startQrCodeFlow = async (inst: ZapiInstance) => {
    if (isIncomplete(inst)) {
      toast.error('Configure o Client Token antes de conectar');
      handleEdit(inst);
      return;
    }

    setModal({ open: true, instanceId: inst.id, instanceName: inst.nome_instancia });
    setQrImage(null);
    setQrError(null);
    setQrLoading(true);

    try {
      const data = await callInstanceManager(inst.id, 'qrcode');
      if (data.value) {
        setQrImage(data.value);
      } else if (data.image) {
        setQrImage(data.image);
      } else {
        setQrImage(JSON.stringify(data));
      }
    } catch (err: any) {
      setQrError(err.message);
    } finally {
      setQrLoading(false);
    }

    // Start polling status every 3s
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const statusData = await callInstanceManager(inst.id, 'status');
        if (statusData.connected === true) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setModal({ open: false });
          toast.success('WhatsApp conectado com sucesso! ✅');
          fetchInstances();
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);
  };

  const handleDisconnect = async (inst: ZapiInstance) => {
    setDisconnecting(inst.id);
    try {
      await callInstanceManager(inst.id, 'disconnect');
      toast.success('Instância desconectada');
      fetchInstances();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDisconnecting(null);
    }
  };

  const handleCheckStatus = async (inst: ZapiInstance) => {
    if (isIncomplete(inst)) {
      toast.error('Configure o Client Token primeiro');
      return;
    }
    setCheckingStatus(inst.id);
    try {
      const data = await callInstanceManager(inst.id, 'status');
      toast.info(data.connected ? 'Status: Conectado ✅' : 'Status: Desconectado ❌');
      fetchInstances();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCheckingStatus(null);
    }
  };

  const closeModal = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    setModal({ open: false });
    setQrImage(null);
    setQrError(null);
  }, []);

  const handleSave = async () => {
    if (!form.nome_instancia || !form.instance_id || !form.token || !form.client_token) {
      toast.error('Preencha todos os campos, incluindo o Client Token');
      return;
    }
    setSaving(true);

    if (editingId) {
      const { error } = await supabase.from('zapi_instances').update({
        nome_instancia: form.nome_instancia,
        instance_id: form.instance_id,
        token: form.token,
        client_token: form.client_token,
      }).eq('id', editingId);
      if (error) { toast.error('Erro ao atualizar instância'); setSaving(false); return; }
      toast.success('Instância atualizada!');
    } else {
      const { error } = await supabase.from('zapi_instances').insert({
        nome_instancia: form.nome_instancia,
        instance_id: form.instance_id,
        token: form.token,
        client_token: form.client_token,
      });
      if (error) { toast.error('Erro ao salvar instância'); setSaving(false); return; }
      toast.success('Instância Z-API adicionada!');
    }

    setForm({ nome_instancia: '', instance_id: '', token: '', client_token: '' });
    setShowForm(false);
    setEditingId(null);
    setSaving(false);
    fetchInstances();
  };

  const handleEdit = (inst: ZapiInstance) => {
    setForm({
      nome_instancia: inst.nome_instancia,
      instance_id: inst.instance_id,
      token: inst.token,
      client_token: inst.client_token || '',
    });
    setEditingId(inst.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('zapi_instances').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover'); return; }
    toast.success('Instância removida');
    fetchInstances();
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zapi-webhook`;

  if (loading) return <div className="animate-pulse h-20 bg-muted rounded-lg" />;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">WhatsApp (Z-API)</h3>

      {instances.map(inst => (
        <div key={inst.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {inst.connected ? <Wifi className="w-4 h-4 text-success" /> : <WifiOff className="w-4 h-4 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium">{inst.nome_instancia}</p>
                <p className="text-[10px] text-muted-foreground">{inst.phone_number || inst.instance_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => handleEdit(inst)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Editar">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleCheckStatus(inst)}
                disabled={checkingStatus === inst.id}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Verificar status"
              >
                {checkingStatus === inst.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </button>

              {inst.connected ? (
                <button
                  onClick={() => handleDisconnect(inst)}
                  disabled={disconnecting === inst.id}
                  className="text-xs px-3 py-1.5 rounded-full font-medium bg-destructive/10 text-destructive flex items-center gap-1"
                >
                  {disconnecting === inst.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unplug className="w-3 h-3" />}
                  Desconectar
                </button>
              ) : (
                <button
                  onClick={() => startQrCodeFlow(inst)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium bg-primary/10 text-primary flex items-center gap-1"
                >
                  <QrCode className="w-3 h-3" />
                  Conectar
                </button>
              )}

              <button onClick={() => handleDelete(inst.id)} className="p-1.5 text-destructive/60 hover:text-destructive transition-colors" title="Remover">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {isIncomplete(inst) && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-medium">Configuração incompleta — Client Token ausente. O envio não funcionará.</span>
            </div>
          )}
        </div>
      ))}

      {instances.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">URL do Webhook</p>
          <p className="text-xs text-foreground break-all font-mono bg-background rounded px-2 py-1 select-all">{webhookUrl}</p>
          <div className="bg-primary/5 rounded-lg px-3 py-2 space-y-1">
            <p className="text-[10px] font-semibold text-primary">📋 Configuração no painel Z-API:</p>
            <p className="text-[10px] text-muted-foreground">Use esta mesma URL nos dois campos:</p>
            <ul className="text-[10px] text-muted-foreground list-disc list-inside space-y-0.5">
              <li><strong>Webhook Received</strong> — para receber mensagens</li>
              <li><strong>Webhook Message Status</strong> — para confirmação de entrega (✓✓) e leitura</li>
            </ul>
          </div>
        </div>
      )}

      {!showForm ? (
        <button onClick={() => { setEditingId(null); setForm({ nome_instancia: '', instance_id: '', token: '', client_token: '' }); setShowForm(true); }} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
          + Nova Instância
        </button>
      ) : (
        <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
          <p className="text-xs font-semibold text-muted-foreground">{editingId ? 'Editar Instância' : 'Nova Instância'}</p>
          <input value={form.nome_instancia} onChange={e => setForm({ ...form, nome_instancia: e.target.value })} placeholder="Nome da instância *" className="w-full bg-background rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
          <input value={form.instance_id} onChange={e => setForm({ ...form, instance_id: e.target.value })} placeholder="Instance ID *" className="w-full bg-background rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
          <input value={form.token} onChange={e => setForm({ ...form, token: e.target.value })} placeholder="Token *" className="w-full bg-background rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
          <input value={form.client_token} onChange={e => setForm({ ...form, client_token: e.target.value })} placeholder="Client Token *" className={`w-full bg-background rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-primary ${!form.client_token ? 'border-destructive' : 'border-border'}`} />
          {!form.client_token && (
            <p className="text-[10px] text-destructive font-medium">⚠ Client Token é obrigatório para enviar mensagens</p>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 py-2 text-sm text-muted-foreground font-medium">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 text-sm bg-primary text-primary-foreground font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-1">
              <Save className="w-3 h-3" /> {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* QR Code Dialog */}
      <Dialog open={modal.open} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Conectar {modal.open ? modal.instanceName : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrLoading && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
              </div>
            )}
            {qrError && (
              <div className="text-center space-y-2">
                <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
                <p className="text-sm text-destructive font-medium">{qrError}</p>
                <button
                  onClick={() => { if (modal.open) { const inst = instances.find(i => i.id === modal.instanceId); if (inst) startQrCodeFlow(inst); } }}
                  className="text-xs bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium"
                >
                  Tentar novamente
                </button>
              </div>
            )}
            {qrImage && !qrLoading && !qrError && (
              <>
                <div className="bg-background p-3 rounded-xl border border-border">
                  <img
                    src={qrImage.startsWith('data:') ? qrImage : `data:image/png;base64,${qrImage}`}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64 object-contain"
                  />
                </div>
                <div className="text-center space-y-1">
                  <div className="flex items-center gap-2 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <p className="text-sm font-medium text-foreground">Aguardando leitura do QR Code...</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo
                  </p>
                </div>
                <button
                  onClick={() => { if (modal.open) { const inst = instances.find(i => i.id === modal.instanceId); if (inst) startQrCodeFlow(inst); } }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Gerar novo QR Code
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
