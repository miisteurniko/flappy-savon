'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats, DashboardStats, DateRange, getDateRangeLabel, getConfig, updateConfig, getContestParticipants, resetContestScores, getSessionsDetail, getGamesDetail, getRegistrationsDetail } from '@/lib/supabase';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const ADMIN_PASSWORD = 'Deffrkillo@1';

const DATE_RANGES: DateRange[] = ['today', '7d', '14d', '30d', 'all'];

// SVG Icons for stats
const Icons = {
  store: (
    <div className="p-3 bg-blue-100 rounded-2xl w-fit">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" /></svg>
    </div>
  ),
  users: (
    <div className="p-3 bg-purple-100 rounded-2xl w-fit">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    </div>
  ),
  chart: (
    <div className="p-3 bg-green-100 rounded-2xl w-fit">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>
    </div>
  ),
  timer: (
    <div className="p-3 bg-amber-100 rounded-2xl w-fit">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    </div>
  ),
  calendar: (
    <div className="p-3 bg-amber-100 rounded-2xl w-fit">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
    </div>
  )
};

function KPICard({ title, value, subtitle, iconKey, onClick }: { title: string; value: string | number; subtitle?: string; iconKey: keyof typeof Icons; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[32px] p-6 shadow-sm flex flex-col justify-between h-full min-h-[180px] transition-all hover:shadow-md ${onClick ? 'cursor-pointer hover:scale-[1.02] ring-2 ring-transparent hover:ring-amber-400/50' : ''}`}
    >
      <div className="flex items-start justify-between w-full">
        {Icons[iconKey]}
        <div className="text-right">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</div>
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-[#1A1A1A] mt-4 mb-2 truncate">{value}</div>
        {subtitle && <div className={`text-sm font-medium ${onClick ? 'text-amber-600' : 'text-green-600'}`}>{subtitle}</div>}
      </div>
    </div>
  );
}

function DateRangeSelector({ value, onChange }: { value: DateRange; onChange: (v: DateRange) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as DateRange)}
        className="appearance-none px-4 py-2 pr-8 rounded-full text-sm font-medium bg-[#1A1A1A] text-white border-none focus:outline-none cursor-pointer"
      >
        {DATE_RANGES.map((range) => (
          <option key={range} value={range}>
            {getDateRangeLabel(range)}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
      </div>
    </div>
  );
}

type DetailModalType = 'sessions' | 'games' | 'registrations' | null;

function DetailModal({ type, dateRange, onClose }: { type: DetailModalType; dateRange: DateRange; onClose: () => void }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!type) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        let result: any[] = [];
        if (type === 'sessions') result = await getSessionsDetail(dateRange);
        else if (type === 'games') result = await getGamesDetail(dateRange);
        else if (type === 'registrations') result = await getRegistrationsDetail(dateRange);
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type, dateRange]);

  const titles: Record<string, string> = {
    sessions: 'Détail des Sessions',
    games: 'Détail des Parties',
    registrations: 'Détail des Inscriptions'
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] p-8 max-w-2xl w-full shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{titles[type!]}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div></div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <div className="text-sm text-gray-500 mb-4">{data.length} résultat(s)</div>

            {type === 'sessions' && (
              <div className="space-y-2">
                {data.slice(0, 100).map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                        {(s.pseudo || 'V')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{s.pseudo || 'Visiteur'}</div>
                        {s.pseudo && s.pseudo !== 'Visiteur' && (
                          <div className="text-xs text-gray-500">{s.games_count || 0} partie{s.games_count !== 1 ? 's' : ''}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      {new Date(s.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {type === 'games' && (
              <div className="space-y-2">
                {data.slice(0, 100).map((g, i) => (
                  <div key={i} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                        {(g.pseudo || 'V')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{g.pseudo || 'Visiteur'}</div>
                        <div className="text-xs text-gray-500">Score: {g.score} • {Math.round(g.duration_ms / 1000)}s</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      {new Date(g.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {type === 'registrations' && (
              <div className="space-y-2">
                {data.slice(0, 100).map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                        {(u.pseudo || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{u.pseudo || 'Anonyme'}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">Best: {u.best || 0}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(u.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('flappy_admin_auth', 'true');
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-lg max-w-sm w-full">
        <h1 className="text-2xl font-bold text-center mb-6">🧼 Flappy Savon Admin</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4`}
          />
          {error && <p className="text-red-500 text-sm mb-4">Mot de passe incorrect</p>}
          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition"
          >
            Accéder au dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

function ConfigModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('https://n8n.miisteurniko.fr/webhook/0ea2cf71-d691-4df2-9c94-c289dcbd0fd9');

  // Prizes
  const [prize1, setPrize1] = useState('');
  const [prize2, setPrize2] = useState('');
  const [prize3, setPrize3] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getConfig().then(config => {
      if (config.contest_start) setStartDate(config.contest_start.split('T')[0]);
      if (config.contest_end) setEndDate(config.contest_end.split('T')[0]);
      if (config.contest_webhook_url) setWebhookUrl(config.contest_webhook_url);

      // Load prizes
      if (config.contest_prize_1) setPrize1(config.contest_prize_1);
      if (config.contest_prize_2) setPrize2(config.contest_prize_2);
      if (config.contest_prize_3) setPrize3(config.contest_prize_3);

      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    // Validations
    if (!startDate || !endDate) return alert("Veuillez remplir les deux dates.");
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return alert("Date invalide.");
    if (start > end) return alert("La date de début doit être avant la date de fin.");

    setSaving(true);
    end.setHours(23, 59, 59, 999);

    try {
      await updateConfig('contest_start', start.toISOString());
      await updateConfig('contest_end', end.toISOString());
      await updateConfig('contest_webhook_url', webhookUrl);

      // Save prizes
      await updateConfig('contest_prize_1', prize1);
      await updateConfig('contest_prize_2', prize2);
      await updateConfig('contest_prize_3', prize3);

      onSave(); // Refresh parent
      onClose();
    } catch {
      alert("Erreur serveur.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
      <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 w-full max-w-lg shadow-2xl transform transition-all max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 md:mb-8 shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Configuration Concours</h2>
            <p className="text-gray-500 text-xs md:text-sm mt-1">Définez la période active du jeu</p>
          </div>
          <div className="p-2 md:p-3 bg-amber-100 text-amber-600 rounded-2xl">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div></div>
        ) : (
          <div className="space-y-6 overflow-y-auto pr-2 flex-1 min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date de début</label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none transition font-medium text-gray-700 min-w-0"
                  />
                  <svg className="absolute left-3 top-3.5 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date de fin</label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none transition font-medium text-gray-700 min-w-0"
                  />
                  <svg className="absolute left-3 top-3.5 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </div>
              </div>
            </div>

            {/* Prizes Section */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Lots à gagner</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">🥇</span>
                  <input
                    type="text"
                    placeholder="Ex: 1 an de savon"
                    value={prize1}
                    onChange={e => setPrize1(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-50 border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none text-sm min-w-0"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">🥈</span>
                  <input
                    type="text"
                    placeholder="Ex: Coffret découverte"
                    value={prize2}
                    onChange={e => setPrize2(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-50 border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none text-sm min-w-0"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">🥉</span>
                  <input
                    type="text"
                    placeholder="Ex: Bon d'achat"
                    value={prize3}
                    onChange={e => setPrize3(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-50 border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none text-sm min-w-0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Webhook de fin (n8n)</label>
              <div className="relative">
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://n8n..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none transition font-medium text-gray-700 text-sm min-w-0"
                />
                <svg className="absolute left-3 top-3.5 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              </div>
            </div>

            {/* Duration Preview */}
            {startDate && endDate && !isNaN(new Date(startDate).getTime()) && !isNaN(new Date(endDate).getTime()) && (
              <div className="bg-amber-50 rounded-xl p-4 flex items-center gap-3 text-amber-800 text-sm">
                <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                <span>Durée du concours : <strong>{Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} jours</strong></span>
              </div>
            )}

            <div className="pt-6 border-t border-gray-100 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Actions Concours</h3>
                <p className="text-xs text-gray-500 mb-4">Gérez la fin de période : exportez les gagnants puis réinitialisez pour le prochain.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={async () => {
                    try {
                      const loadingBtn = document.getElementById('btn-export-contest');
                      if (loadingBtn) loadingBtn.innerText = 'Chargement...';
                      const rows = await getContestParticipants();
                      const csv = [
                        ['Pseudo', 'Email', 'Score Concours', 'Newsletter'].join(','),
                        ...rows.map((r: any) => [r.pseudo, r.email, r.contest_best, r.optin ? 'Oui' : 'Non'].join(','))
                      ].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `concours-resultats-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      if (loadingBtn) loadingBtn.innerText = 'Exporter Résultats';
                    } catch (e) {
                      alert("Erreur lors de l'export.");
                    }
                  }}
                  id="btn-export-contest"
                  className="flex-1 px-4 py-3 bg-green-50 text-green-700 font-semibold rounded-xl hover:bg-green-100 transition flex items-center justify-center gap-2 text-sm border border-green-200 cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Exporter Résultats
                </button>
                <button
                  onClick={async () => {
                    if (!webhookUrl) return alert("Veuillez configurer l'URL du Webhook.");
                    const btn = document.getElementById('btn-webhook');
                    if (btn) btn.innerText = 'Envoi...';

                    try {
                      const rows = await getContestParticipants();
                      const payload = {
                        contest_end: endDate,
                        winners: rows,
                        prizes: {
                          rank1: prize1,
                          rank2: prize2,
                          rank3: prize3
                        }
                      };

                      await fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                      });
                      alert("Données envoyées avec succès au Webhook !");
                    } catch (e) {
                      alert("Erreur lors de l'envoi au Webhook.");
                      console.error(e);
                    } finally {
                      if (btn) btn.innerText = 'Envoyer via Webhook';
                    }
                  }}
                  id="btn-webhook"
                  className="flex-1 px-4 py-3 bg-blue-50 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 transition flex items-center justify-center gap-2 text-sm border border-blue-200 cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                  Envoyer via Webhook
                </button>
                <button
                  onClick={async () => {
                    if (confirm("ATTENTION : Cela va remettre à 0 tous les scores 'concours' de tous les joueurs.\n\nÊtes-vous sûr de vouloir démarrer une nouvelle période ?")) {
                      try {
                        await resetContestScores();
                        alert("Scores réinitialisés avec succès !");
                      } catch (e: any) {
                        console.error(e);
                        alert(`Erreur : ${e.message || e.error_description || JSON.stringify(e)}`);
                      }
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-red-50 text-red-700 font-semibold rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2 text-sm border border-red-200 cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end mt-6 md:mt-10 pt-4 border-t border-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 md:px-6 py-3 text-gray-500 font-semibold hover:bg-gray-50 rounded-xl transition text-sm md:text-base"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 md:px-6 py-3 bg-[#1A1A1A] text-white font-semibold rounded-xl hover:bg-black transition flex items-center gap-2 shadow-lg shadow-gray-200 disabled:opacity-50 text-sm md:text-base"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [contestConfig, setContestConfig] = useState<{ start: string, end: string } | null>(null);
  const [detailModal, setDetailModal] = useState<DetailModalType>(null);

  useEffect(() => {
    const auth = localStorage.getItem('flappy_admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const fetchConfigData = async () => {
    const cfg = await getConfig();
    const start = cfg['contest_start'] ? new Date(cfg['contest_start']).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '--/--';
    const end = cfg['contest_end'] ? new Date(cfg['contest_end']).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '--/--';
    const year = cfg['contest_end'] ? new Date(cfg['contest_end']).getFullYear() : '';
    setContestConfig({ start, end: end + (year ? `/${year}` : '') });
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
      fetchConfigData();
      const interval = setInterval(loadStats, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, dateRange]);

  const loadStats = async () => {
    setRefreshing(true);
    const data = await getDashboardStats(dateRange);
    setStats(data);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-gray-500">Chargement des données...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 md:p-6 font-sans">
      {showConfig && <ConfigModal onClose={() => setShowConfig(false)} onSave={fetchConfigData} />}
      {detailModal && <DetailModal type={detailModal} dateRange={dateRange} onClose={() => setDetailModal(null)} />}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-2">Statistiques Flappy Savon</h1>
            <p className="text-gray-500 font-medium text-lg">Suivi des joueurs, scores et performances.</p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeSelector value={dateRange} onChange={setDateRange} />

            <div className="h-8 w-px bg-gray-200 mx-1"></div>

            <button
              onClick={loadStats}
              disabled={refreshing}
              className={`p-2.5 bg-white rounded-full text-gray-700 hover:bg-gray-50 transition shadow-sm border border-gray-100 ${refreshing ? 'opacity-70 cursor-wait' : ''}`}
              title="Rafraîchir les données"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? "animate-spin" : ""}><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" /></svg>
            </button>
            <button
              onClick={() => { localStorage.removeItem('flappy_admin_auth'); setIsAuthenticated(false); }}
              className="p-2.5 bg-white rounded-full text-red-500 hover:bg-red-50 transition shadow-sm border border-gray-100"
              title="Déconnexion"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="3" y1="12" y2="12" /></svg>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <KPICard
            iconKey="calendar"
            title="CONCOURS"
            value={contestConfig ? `${contestConfig.start} → ${contestConfig.end}` : "Chargement..."}
            subtitle="Cliquez pour configurer les dates"
            onClick={() => setShowConfig(true)}
          />
          <KPICard iconKey="users" title="SESSIONS" value={stats.totalSessions} subtitle="Cliquez pour voir" onClick={() => setDetailModal('sessions')} />
          <KPICard iconKey="store" title="PARTIES" value={stats.totalGames} subtitle="Cliquez pour voir" onClick={() => setDetailModal('games')} />
          <KPICard iconKey="chart" title="CONVERSION" value={`${stats.conversionRate.toFixed(1)}%`} subtitle="Cliquez pour voir" onClick={() => setDetailModal('registrations')} />
          <KPICard iconKey="timer" title="DURÉE MOY." value={`${stats.avgGameDuration}s`} subtitle="Par partie" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Games per day */}
          <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm">
            <h3 className="font-bold text-xl text-[#1A1A1A] mb-8">Évolution des parties jouées</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.gamesPerDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(val) => new Date(val).toLocaleDateString('fr-FR')}
                  formatter={(val) => [val, 'Parties']}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#4E8D6B"
                  strokeWidth={4}
                  dot={false}
                  activeDot={{ r: 8, fill: '#4E8D6B' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Score distribution */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm flex flex-col items-center justify-center">
            <h3 className="font-bold text-xl text-[#1A1A1A] mb-2 self-start w-full">Répartition scores</h3>
            <div className="w-full h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.scoreDistribution} layout="vertical">
                  <CartesianGrid horizontal={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="range" type="category" width={40} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px' }} />
                  <Bar dataKey="count" fill="#D97706" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <div className="text-3xl font-bold text-[#1A1A1A]">Top Score</div>
              <div className="text-sm text-gray-400">Distribution par paliers</div>
            </div>
          </div>
        </div>

        {/* Recent registrations */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl text-[#1A1A1A]">Dernières inscriptions</h3>
            <button
              onClick={() => {
                const csv = [
                  ['Pseudo', 'Email', 'Date', 'Opt-in'].join(','),
                  ...stats.recentRegistrations.map(r => [
                    r.pseudo,
                    r.email,
                    new Date(r.created_at).toLocaleString(),
                    r.optin ? 'Oui' : 'Non'
                  ].join(','))
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `flappy-inscriptions-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#346648] text-white rounded-full text-sm font-bold hover:bg-[#2a523a] transition cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Exporter CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Joueur</th>
                  <th className="text-left py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="text-right py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="text-right py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Newsletter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentRegistrations.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="py-4">
                      <div className="font-bold text-[#1A1A1A]">{user.pseudo || 'Anonyme'}</div>
                    </td>
                    <td className="py-4 text-gray-600">{user.email}</td>
                    <td className="py-4 text-right text-gray-500 text-sm">
                      {new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-4 text-right">
                      {user.optin ?
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Oui
                        </span>
                        :
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Non
                        </span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm mt-8">
          Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
        </div>
      </div>
    </div>
  );
}
