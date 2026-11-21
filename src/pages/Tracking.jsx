import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { SHOP_CONFIG } from '../config';
import {
  Clock,
  Wrench,
  CheckCircle2,
  PackageCheck,
  XCircle,
  Smartphone,
  Laptop,
  Tablet,
  Cpu,
  ArrowLeft,
  AlertCircle,
  Phone,
  MapPin,
} from 'lucide-react';

const STEPS = [
  { key: 'waiting', label: 'En attente', desc: 'Appareil bien réceptionné à l’atelier', icon: Clock },
  { key: 'in_progress', label: 'En réparation', desc: 'Nos techniciens travaillent dessus', icon: Wrench },
  { key: 'ready', label: 'Prêt à récupérer', desc: 'Votre appareil vous attend à l’atelier', icon: CheckCircle2 },
];

export default function Tracking() {
  const { code } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const trackingCode = code.trim().toUpperCase();

    const fetchTicket = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('tracking_code', trackingCode)
        .single();

      if (error || !data) {
        setError(true);
      } else {
        setTicket(data);
        setError(false);
      }
      setLoading(false);
    };

    fetchTicket();

    // Écoute des changements en temps réel via Supabase Realtime
    const channel = supabase
      .channel(`ticket-${trackingCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'suivi_reparation',
          table: 'tickets',
          filter: `tracking_code=eq.${trackingCode}`,
        },
        (payload) => {
          setTicket(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code]);

  const getDeviceIcon = (type) => {
    if (type === 'Smartphone') return <Smartphone className="w-6 h-6" />;
    if (type === 'PC / Laptop') return <Laptop className="w-6 h-6" />;
    if (type === 'Tablette') return <Tablet className="w-6 h-6" />;
    return <Cpu className="w-6 h-6" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Chargement du suivi...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Ticket introuvable</h2>
          <p className="text-slate-500 text-sm mb-6">
            Aucun appareil trouvé avec le code <span className="font-mono font-bold text-slate-800">#{code}</span>.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Réessayer
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex =
    ticket.status === 'waiting' ? 0 : ticket.status === 'in_progress' ? 1 : 2;

  const progressPercent =
    ticket.status === 'waiting' ? 15 : ticket.status === 'in_progress' ? 58 : 100;

  const isReady = ticket.status === 'ready';
  const isDelivered = ticket.status === 'delivered';
  const isCancelled = ticket.status === 'cancelled';

  const deviceTitle = ticket.device_model
    ? `${ticket.device_type} — ${ticket.device_model}`
    : ticket.device_type;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Barre haute */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <span className="text-sm font-bold text-slate-800">{SHOP_CONFIG.name}</span>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          {/* En-tête appareil */}
          <div
            className={`p-6 text-white transition-colors duration-700 ${
              isCancelled ? 'bg-rose-600' : isReady ? 'bg-emerald-600' : 'bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-white/15 backdrop-blur rounded-2xl">
                {getDeviceIcon(ticket.device_type)}
              </div>
              <div>
                <p className="text-xs text-white/70 font-mono uppercase tracking-wider">
                  Ticket #{ticket.tracking_code}
                </p>
                <h1 className="text-lg font-bold leading-snug">{deviceTitle}</h1>
              </div>
            </div>

            {/* Barre de progression animée (masquée si annulé) */}
            {!isCancelled && (
              <div className="mt-6">
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Bandeau spécial ANNULÉ */}
            {isCancelled && (
              <div className="bg-rose-50 border-2 border-rose-200 text-rose-900 p-4 rounded-2xl flex items-start gap-3">
                <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Réparation annulée</p>
                  <p className="text-sm text-rose-700 mt-0.5">
                    Bonjour {ticket.client_name}, la réparation de votre appareil a été annulée. Vous pouvez passer le récupérer chez <strong>{SHOP_CONFIG.name}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Bandeau spécial PRÊT */}
            {isReady && (
              <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-start gap-3 shadow-sm shadow-emerald-100 transition-all duration-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <p className="font-bold">Bonne nouvelle, {ticket.client_name} !</p>
                  <p className="text-sm text-emerald-700 mt-0.5">
                    Votre appareil est prêt. Vous pouvez passer le récupérer chez <strong>{SHOP_CONFIG.name}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Bandeau spécial RÉCUPÉRÉ */}
            {isDelivered && (
              <div className="bg-slate-100 border border-slate-200 text-slate-700 p-4 rounded-2xl flex items-start gap-3">
                <PackageCheck className="w-6 h-6 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Appareil récupéré</p>
                  <p className="text-sm text-slate-600">
                    Merci pour votre confiance, {ticket.client_name} !
                  </p>
                </div>
              </div>
            )}

            {/* Étapes détaillées (masquées si annulé) */}
            {!isCancelled && (
              <div className="space-y-4">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex && !isDelivered;

                  return (
                    <div
                      key={step.key}
                      className={`flex items-start gap-4 p-3 rounded-2xl transition-all duration-500 ${
                        isCurrent ? 'bg-slate-50 border border-slate-200/80' : ''
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                          isCompleted
                            ? step.key === 'ready'
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                              : 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                            : 'bg-slate-100 text-slate-400'
                        } ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="pt-0.5">
                        <p className={`font-bold text-sm ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Note atelier (affiche aussi la raison d'annulation si saisie) */}
            {ticket.note && (
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/60 text-sm text-amber-900">
                <span className="font-semibold">Note atelier : </span>
                {ticket.note}
              </div>
            )}

            {/* Infos client & horodatage */}
            <div className="pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-400">
              <span>
                Client : <strong className="text-slate-600">{ticket.client_name}</strong>
              </span>
              <span>
                Mis à jour à{' '}
                {new Date(ticket.updated_at).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Carte Contact Atelier */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" /> {SHOP_CONFIG.address}
            </p>
            <p>{SHOP_CONFIG.hours}</p>
          </div>
          <a
            href={`tel:+216${SHOP_CONFIG.phone.replace(/\s+/g, '')}`}
            onClick={() => navigator.clipboard?.writeText(SHOP_CONFIG.phone)}
            title="Appeler (ou copier le numéro sur PC)"
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl shrink-0 transition"
          >
            <Phone className="w-3.5 h-3.5" /> {SHOP_CONFIG.phone}
          </a>
        </div>
      </div>
    </div>
  );
}