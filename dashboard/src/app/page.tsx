'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats, DashboardStats, DateRange, getDateRangeLabel } from '@/lib/supabase';
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
  )
};

function KPICard({ title, value, subtitle, iconKey }: { title: string; value: string | number; subtitle?: string; iconKey: keyof typeof Icons }) {
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm flex flex-col justify-between h-full min-h-[180px]">
      <div className="flex items-start justify-between w-full">
        {Icons[iconKey]}
        <div className="text-right">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</div>
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-[#1A1A1A] mt-4 mb-2">{value}</div>
        {subtitle && <div className="text-sm text-green-600 font-medium">{subtitle}</div>}
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

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('flappy_admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-1">Tableau de bord</h1>
            <p className="text-gray-500 font-medium">Aperçu de la production, des stocks et des ventes.</p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
            <button
              onClick={loadStats}
              disabled={refreshing}
              className={`p-2 bg-white rounded-full text-[#1A1A1A] hover:bg-gray-50 transition shadow-sm ${refreshing ? 'opacity-70 cursor-wait' : ''}`}
              title="Rafraîchir les données"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? "animate-spin" : ""}><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" /></svg>
            </button>
            <button
              onClick={() => { localStorage.removeItem('flappy_admin_auth'); setIsAuthenticated(false); }}
              className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition shadow-sm"
              title="Déconnexion"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="3" y1="12" y2="12" /></svg>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard iconKey="users" title="SESSIONS" value={stats.totalSessions} subtitle={`+${stats.sessionsPerDay.length > 0 ? stats.sessionsPerDay[stats.sessionsPerDay.length - 1].count : 0} auj, une belle journée !`} />
          <KPICard iconKey="store" title="PARTIES JOUÉES" value={stats.totalGames} subtitle="Ça joue dur !" />
          <KPICard iconKey="chart" title="TAUX CONVERSION" value={`${stats.conversionRate.toFixed(1)}%`} subtitle="Inscriptions / Sessions" />
          <KPICard iconKey="timer" title="DURÉE MOYENNE" value={`${stats.avgGameDuration}s`} subtitle="Par partie" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sessions per day */}
          <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm">
            <h3 className="font-bold text-xl text-[#1A1A1A] mb-8">Évolution des sessions</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.sessionsPerDay}>
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
                  formatter={(val) => [val, 'Sessions']}
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
                const csv = 'Pseudo,Email,Date\n' + stats.recentRegistrations
                  .map(u => `"${u.pseudo || ''}","${u.email}","${new Date(u.created_at).toLocaleDateString('fr-FR')}"`)
                  .join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `emails_flappy_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="px-5 py-2.5 bg-[#4E8D6B] text-white rounded-full text-sm font-semibold hover:bg-[#3d7054] transition flex items-center gap-2 shadow-md shadow-green-900/10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
              Exporter CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                  <th className="pb-4 pl-4">Pseudo</th>
                  <th className="pb-4">Email</th>
                  <th className="pb-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-gray-400 py-4 text-center">Aucune inscription récente</td>
                  </tr>
                ) : (
                  stats.recentRegistrations.map((user, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                      <td className="py-4 pl-4 font-bold text-[#1A1A1A]">{user.pseudo || 'Anonyme'}</td>
                      <td className="py-4 text-gray-500">{user.email}</td>
                      <td className="py-4 text-gray-400 text-sm font-medium">
                        {new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
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
