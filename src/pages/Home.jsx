import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Wrench, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { SHOP_CONFIG } from '../config';

export default function Home() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace('#', '');
    if (cleanCode) {
      navigate(`/suivi/${cleanCode}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 flex flex-col justify-between">
      {/* En-tête */}
      <header className="p-6 flex justify-between items-center max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm shadow-blue-200">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-lg block leading-none">
              {SHOP_CONFIG.name}
            </span>
            <span className="text-[11px] text-slate-500">{SHOP_CONFIG.tagline}</span>
          </div>
        </div>
        <Link
          to="/admin"
          className="text-xs font-medium text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition"
        >
          <ShieldCheck className="w-4 h-4" />
          Espace Atelier
        </Link>
      </header>

      {/* Carte centrale */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white/90 backdrop-blur p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 max-w-md w-full text-center">

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Où en est votre appareil ?
          </h1>
          <p className="text-slate-500 text-sm mb-7">
            Entrez le code à 4 chiffres inscrit sur votre ticket papier pour suivre la réparation en direct.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex : 4829"
                maxLength={8}
                className="w-full pl-11 pr-4 py-3.5 text-center text-xl font-mono font-bold tracking-[0.25em] uppercase bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold py-3.5 rounded-2xl shadow-md shadow-blue-200 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              Suivre ma réparation
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Pied de page */}
      <footer className="p-6 text-center text-xs text-slate-400 space-y-1">
        <p className="font-medium text-slate-500">{SHOP_CONFIG.name} • {SHOP_CONFIG.hours}</p>
        <p>{SHOP_CONFIG.address} — Tél : {SHOP_CONFIG.phone}</p>
      </footer>
    </div>
  );
}