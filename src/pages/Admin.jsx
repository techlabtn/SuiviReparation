import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { SHOP_CONFIG } from '../config';
import { QRCodeSVG } from 'qrcode.react';
import {
  Wrench,
  Plus,
  Copy,
  Check,
  QrCode,
  MessageCircle,
  LogOut,
  X,
  Printer,
  BellRing,
  ExternalLink,
  Search,
  XCircle,
  Clock,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

const DEVICE_TYPES = ['Smartphone', 'PC / Laptop', 'Tablette', 'Électroménager', 'Autre'];

const STATUS_OPTIONS = [
  { key: 'waiting', label: 'En attente', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { key: 'in_progress', label: 'En cours', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { key: 'ready', label: 'Prêt', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { key: 'delivered', label: 'Récupéré', color: 'bg-slate-200 text-slate-700 border-slate-300' },
];

export default function Admin() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Formulaire nouveau ticket
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [deviceType, setDeviceType] = useState('Smartphone');
  const [deviceModel, setDeviceModel] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Liste, filtres & recherche
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('active'); // 'active' | 'delivered' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Modales
  const [qrTicket, setQrTicket] = useState(null);
  const [ticketToPrint, setTicketToPrint] = useState(null);
  const [cancelModalTicket, setCancelModalTicket] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchTickets();
  }, [session]);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTickets(data);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError('Email ou mot de passe incorrect.');
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const trackingCode = String(Math.floor(1000 + Math.random() * 9000));

    const { error } = await supabase.from('tickets').insert([
      {
        tracking_code: trackingCode,
        client_name: clientName.trim(),
        client_phone: clientPhone.replace(/\s+/g, ''),
        device_type: deviceType,
        device_model: deviceModel.trim() || null,
        note: note.trim() || null,
        status: 'waiting',
      },
    ]);

    if (!error) {
      setClientName('');
      setClientPhone('');
      setDeviceModel('');
      setNote('');
      fetchTickets();
    } else {
      alert('Erreur lors de la création : ' + error.message);
    }
    setSubmitting(false);
  };

  const updateStatus = async (id, newStatus) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    await supabase.from('tickets').update({ status: newStatus }).eq('id', id);
  };

  const confirmCancelTicket = async (e) => {
    e.preventDefault();
    if (!cancelModalTicket) return;

    const updatedNote = cancelReason.trim()
      ? cancelReason.trim()
      : cancelModalTicket.note;

    setTickets((prev) =>
      prev.map((t) =>
        t.id === cancelModalTicket.id
          ? { ...t, status: 'cancelled', note: updatedNote }
          : t
      )
    );

    const { error } = await supabase
      .from('tickets')
      .update({ status: 'cancelled', note: updatedNote })
      .eq('id', cancelModalTicket.id);

    if (error) {
      alert("Erreur lors de l'annulation : " + error.message);
      fetchTickets();
    }

    setCancelModalTicket(null);
    setCancelReason('');
  };

  const handleDeleteTicket = async (ticket) => {
    const ok = window.confirm(
      `Supprimer définitivement le ticket #${ticket.tracking_code} (${ticket.client_name}) ?`
    );
    if (!ok) return;

    setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
    await supabase.from('tickets').delete().eq('id', ticket.id);
  };

const getTrackingUrl = (code) => {
    const baseUrl = window.location.href.split('#')[0];
    return `${baseUrl}#/suivi/${code}`;
  };
  const copyLink = (ticket) => {
    navigator.clipboard.writeText(getTrackingUrl(ticket.tracking_code));
    setCopiedId(ticket.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrintTicket = (ticket) => {
    setTicketToPrint(ticket);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const openWhatsApp = (ticket, mode = 'link') => {
    const url = getTrackingUrl(ticket.tracking_code);
    const device = ticket.device_model
      ? `${ticket.device_type} (${ticket.device_model})`
      : ticket.device_type;
    const phone = ticket.client_phone.startsWith('216')
      ? ticket.client_phone
      : `216${ticket.client_phone}`;

    let text = `Bonjour ${ticket.client_name}, votre ${device} a bien été reçu chez ${SHOP_CONFIG.name} (Ticket #${ticket.tracking_code}). Suivez l'avancement en direct ici : ${url}`;

    if (mode === 'ready') {
      text = `Bonjour ${ticket.client_name}, bonne nouvelle ! Votre ${device} (Ticket #${ticket.tracking_code}) est PRÊT chez ${SHOP_CONFIG.name}. Vous pouvez passer le récupérer.`;
    } else if (mode === 'cancelled') {
      const reasonText = ticket.note ? ` Motif : ${ticket.note}.` : '';
      text = `Bonjour ${ticket.client_name}, la réparation de votre ${device} (Ticket #${ticket.tracking_code}) a été annulée.${reasonText} Vous pouvez passer le récupérer chez ${SHOP_CONFIG.name}.`;
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // --- ÉCRAN DE CONNEXION ---
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl mb-6 justify-center">
            <Wrench className="w-6 h-6" />
            <span>{SHOP_CONFIG.name} — Atelier</span>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition cursor-pointer"
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Compteurs KPIs
  const countWaiting = tickets.filter((t) => t.status === 'waiting').length;
  const countInProgress = tickets.filter((t) => t.status === 'in_progress').length;
  const countReady = tickets.filter((t) => t.status === 'ready').length;
  const countCancelled = tickets.filter((t) => t.status === 'cancelled').length;

  // Filtrage onglet + recherche instantanée
  const displayedTickets = tickets
    .filter((t) => {
      if (filter === 'active') return ['waiting', 'in_progress', 'ready'].includes(t.status);
      if (filter === 'delivered') return t.status === 'delivered';
      if (filter === 'cancelled') return t.status === 'cancelled';
      return true;
    })
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.tracking_code.toLowerCase().includes(q) ||
        t.client_name.toLowerCase().includes(q) ||
        t.client_phone.toLowerCase().includes(q) ||
        (t.device_model && t.device_model.toLowerCase().includes(q))
      );
    });

  return (
    <>
      {/* =========================================================
          1. ZONE D'IMPRESSION UNIQUEMENT (Invisible à l'écran)
         ========================================================= */}
      {ticketToPrint && (
        <div className="hidden print:block w-[80mm] mx-auto text-black font-sans p-2">
          <div className="border-2 border-dashed border-black rounded-lg p-4 text-center space-y-3">
            <div className="border-b border-black pb-2">
              <h1 className="text-xl font-black tracking-wide">{SHOP_CONFIG.name}</h1>
            </div>

            <div className="text-left text-sm space-y-1.5 py-1">
              <div className="flex justify-between">
                <span className="font-semibold">Ticket :</span>
                <span className="font-mono font-bold">#{ticketToPrint.tracking_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Client :</span>
                <span>{ticketToPrint.client_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Appareil :</span>
                <span className="text-right">
                  {ticketToPrint.device_type}
                  {ticketToPrint.device_model ? ` — ${ticketToPrint.device_model}` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Date :</span>
                <span>{formatDate(ticketToPrint.created_at)}</span>
              </div>
            </div>

            <div className="border-t border-black pt-3 flex flex-col items-center">
              <QRCodeSVG value={getTrackingUrl(ticketToPrint.tracking_code)} size={135} />
              <p className="text-xs mt-2 leading-tight">
                Scannez pour suivre votre réparation en direct ou entrez le code{' '}
                <strong>{ticketToPrint.tracking_code}</strong> sur notre site.
              </p>
              <p className="text-xs font-bold mt-3 pt-2 border-t border-black/30 w-full">
                Merci pour votre confiance !
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          2. TABLEAU DE BORD ATELIER (Caché lors de l'impression)
         ========================================================= */}
      <div className="min-h-screen bg-slate-50 pb-12 print:hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2.5 text-blue-600 font-bold text-lg">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="text-slate-900">{SHOP_CONFIG.name}</span>
            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
              Atelier
            </span>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-slate-500 hover:text-red-600 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </header>

        <main className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
          {/* Cartes KPIs */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">En attente</p>
                <p className="text-xl font-extrabold text-slate-900">{countWaiting}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">En cours</p>
                <p className="text-xl font-extrabold text-slate-900">{countInProgress}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Prêts</p>
                <p className="text-xl font-extrabold text-slate-900">{countReady}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Annulés</p>
                <p className="text-xl font-extrabold text-slate-900">{countCancelled}</p>
              </div>
            </div>
          </section>

          {/* Formulaire Réception Rapide */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> Nouveau ticket de réception
            </h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {DEVICE_TYPES.map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setDeviceType(type)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition cursor-pointer ${
                      deviceType === type
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Nom du client *"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <input
                  type="tel"
                  placeholder="Téléphone (ex: 55123456) *"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Modèle (optionnel)"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  className="px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Note rapide (optionnel)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Création...' : 'Créer le ticket'}
              </button>
            </form>
          </section>

          {/* Onglets Filtres + Barre de Recherche */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
                  filter === 'active'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                En atelier ({countWaiting + countInProgress + countReady})
              </button>
              <button
                onClick={() => setFilter('delivered')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
                  filter === 'delivered'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                Récupérés ({tickets.filter((t) => t.status === 'delivered').length})
              </button>
              <button
                onClick={() => setFilter('cancelled')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
                  filter === 'cancelled'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white text-rose-600 border border-rose-200'
                }`}
              >
                Annulés ({countCancelled})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher code, nom, tél..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Liste des tickets */}
          <div className="space-y-3">
            {displayedTickets.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
                Aucun ticket trouvé.
              </div>
            ) : (
              displayedTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`bg-white p-5 rounded-2xl shadow-sm border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    ticket.status === 'cancelled' ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
                  }`}
                >
                  {/* Infos ticket */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-sm ${
                          ticket.status === 'cancelled'
                            ? 'text-rose-700 bg-rose-100'
                            : 'text-blue-600 bg-blue-50'
                        }`}
                      >
                        #{ticket.tracking_code}
                      </span>
                      <span className="font-bold text-slate-900">
                        {ticket.device_type} {ticket.device_model && `— ${ticket.device_model}`}
                      </span>
                      {ticket.status === 'cancelled' && (
                        <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          Annulé
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      {ticket.client_name} • <span className="font-mono">{ticket.client_phone}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Reçu le {formatDate(ticket.created_at)}
                      {ticket.note && (
                        <span className="text-slate-600 font-medium"> • Note : {ticket.note}</span>
                      )}
                    </p>
                  </div>

                  {/* Contrôles Statut + Actions */}
                  <div className="flex flex-col items-start md:items-end gap-3">
                    {/* Sélecteur statut + Bouton Annuler */}
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_OPTIONS.map((st) => (
                        <button
                          key={st.key}
                          onClick={() => updateStatus(ticket.id, st.key)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                            ticket.status === st.key
                              ? st.color
                              : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setCancelModalTicket(ticket);
                          setCancelReason(ticket.note || '');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1 ${
                          ticket.status === 'cancelled'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Annuler
                      </button>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex flex-wrap items-center gap-2">
                      {ticket.status === 'ready' && (
                        <button
                          onClick={() => openWhatsApp(ticket, 'ready')}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          <BellRing className="w-3.5 h-3.5" /> Notifier Prêt (WhatsApp)
                        </button>
                      )}
                      {ticket.status === 'cancelled' && (
                        <button
                          onClick={() => openWhatsApp(ticket, 'cancelled')}
                          className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          <BellRing className="w-3.5 h-3.5" /> Notifier Annulation (WhatsApp)
                        </button>
                      )}
                      <button
                        onClick={() => openWhatsApp(ticket, 'link')}
                        className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 text-xs font-medium px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </button>
                      <button
                        onClick={() => copyLink(ticket)}
                        className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        {copiedId === ticket.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copiedId === ticket.id ? 'Copié !' : 'Copier lien'}
                      </button>
                      <button
                        onClick={() => setQrTicket(ticket)}
                        className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" /> QR Code
                      </button>
                      <button
                        onClick={() => handlePrintTicket(ticket)}
                        className="inline-flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> Imprimer ticket
                      </button>
                      <a
                        href={getTrackingUrl(ticket.tracking_code)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-slate-400 hover:text-blue-600 p-1.5"
                        title="Ouvrir la page client"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteTicket(ticket)}
                        className="inline-flex items-center text-slate-300 hover:text-red-600 p-1.5 cursor-pointer"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* Modale Annulation avec motif optionnel */}
        {cancelModalTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative shadow-xl">
              <button
                onClick={() => setCancelModalTicket(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-rose-600 font-bold text-lg mb-2">
                <XCircle className="w-5 h-5" />
                <h3>Annuler le ticket #{cancelModalTicket.tracking_code}</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Le client verra que la réparation est annulée et qu'il peut venir récupérer son appareil.
              </p>
              <form onSubmit={confirmCancelTicket} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Motif (optionnel, visible par le client)
                  </label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Ex : Pièce introuvable, refus devis..."
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelModalTicket(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-xl cursor-pointer"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold py-2.5 rounded-xl cursor-pointer"
                  >
                    Confirmer l'annulation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modale QR Code */}
        {qrTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center relative shadow-xl">
              <button
                onClick={() => setQrTicket(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-slate-900 text-lg mb-1">
                {SHOP_CONFIG.name} — #{qrTicket.tracking_code}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {qrTicket.device_type} {qrTicket.device_model && `— ${qrTicket.device_model}`}
              </p>
              <div className="flex justify-center p-4 bg-white border border-slate-200 rounded-xl mb-4">
                <QRCodeSVG value={getTrackingUrl(qrTicket.tracking_code)} size={180} />
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Scannez pour suivre la réparation en direct ou entrez le code{' '}
                <strong>{qrTicket.tracking_code}</strong> sur le site.
              </p>
              <button
                onClick={() => handlePrintTicket(qrTicket)}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-xl cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimer le ticket
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}