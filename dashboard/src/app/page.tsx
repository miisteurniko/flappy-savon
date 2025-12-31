'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats, DashboardStats, DateRange, getDateRangeLabel } from '@/lib/supabase';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const ADMIN_PASSWORD = 'Deffrkillo@1';

const DATE_RANGES: DateRange[] = ['today', '7d', '14d', '30d', 'all'];

const COLORS = {
  primary: '#4a7c59',
  primaryLight: '#6b9b7a',
  accent: '#e8a838',
  bg: '#f5f0e8',
  card: '#ffffff',
  text: '#2c2416',
  textSecondary: '#7a7265',
};

function KPICard({ title, subtitle, value, icon }: { title: string; subtitle: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e8e3db]">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#f5f0e8] flex items-center justify-center text-lg">
          {icon}
        </div>
        <div>
          <div className="font-semibold text-[#2c2416] text-sm">{title}</div>
          <div className="text-xs text-[#7a7265]">{subtitle}</div>
        </div>
      </div>
      <div className="text-3xl font-bold text-[#2c2416]">{value}</div>
    </div>
  );
}

function DateRangeSelector({ value, onChange }: { value: DateRange; onChange: (v: DateRange) => void }) {
  return (
    <div className="flex items-center gap-1 bg-[#4a7c59] rounded-full px-1 py-1">
      <button className="text-white/60 hover:text-white px-2">‹</button>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as DateRange)}
        className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer appearance-none px-2"
      >
        {DATE_RANGES.map((range) => (
          <option key={range} value={range} className="text-black">
            {getDateRangeLabel(range)}
          </option>
        ))}
      </select>
      <button className="text-white/60 hover:text-white px-2">›</button>
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
    <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-lg max-w-sm w-full border border-[#e8e3db]">
        <h1 className="text-2xl font-bold text-center mb-6 text-[#2c2416]">🧼 Flappy Savon</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-400' : 'border-[#e8e3db]'} focus:outline-none focus:ring-2 focus:ring-[#4a7c59] mb-4 bg-[#f5f0e8]`}
          />
          {error && <p className="text-red-500 text-sm mb-4">Mot de passe incorrect</p>}
          <button
            type="submit"
            className="w-full bg-[#4a7c59] text-white py-3 rounded-xl font-semibold hover:bg-[#3d6649] transition"
          >
            Accéder
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
      const interval = setInterval(loadStats, 60000);
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
      <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
        <div className="text-[#7a7265]">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
        <div className="text-[#7a7265]">Chargement des données...</div>
      </div>
    );
  }

  const pieData = stats.scoreDistribution.map((item, i) => ({
    name: item.range,
    value: item.count,
    color: ['#4a7c59', '#6b9b7a', '#e8a838', '#d4956a', '#8b7355'][i] || '#ccc',
  }));

  const totalGamesForPie = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="min-h-screen bg-[#f5f0e8] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#2c2416]">Tableau de bord</h1>
          <p className="text-[#7a7265] text-sm">Aperçu des performances du jeu</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mb-6">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <button
            onClick={loadStats}
            className="w-9 h-9 rounded-full bg-white border border-[#e8e3db] flex items-center justify-center text-[#7a7265] hover:bg-[#f5f0e8] transition"
          >
            {refreshing ? '⟳' : '↻'}
          </button>
          <div className="ml-auto">
            <button
              onClick={() => { localStorage.removeItem('flappy_admin_auth'); setIsAuthenticated(false); }}
              className="px-4 py-2 text-sm text-[#7a7265] hover:text-[#2c2416] transition"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard icon="👥" title="SESSIONS" subtitle="Visiteurs uniques" value={stats.totalSessions} />
          <KPICard icon="🎮" title="PARTIES" subtitle="Jeux lancés" value={stats.totalGames} />
          <KPICard icon="📊" title="CONVERSION" subtitle="Inscriptions" value={`${stats.conversionRate.toFixed(1)}%`} />
          <KPICard icon="⏱️" title="DURÉE MOY." subtitle="Par partie" value={`${stats.avgGameDuration}s`} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Area Chart - Sessions */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e8e3db]">
            <h3 className="font-semibold text-[#2c2416] mb-4">Évolution des sessions</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.sessionsPerDay}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4a7c59" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4a7c59" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e3db" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#7a7265' }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#7a7265' }} axisLine={false} tickLine={false} />
                <Tooltip
                  labelFormatter={(val) => new Date(val).toLocaleDateString('fr-FR')}
                  formatter={(val) => [val, 'Sessions']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e8e3db' }}
                />
                <Area type="monotone" dataKey="count" stroke="#4a7c59" strokeWidth={2} fill="url(#colorSessions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart - Score Distribution */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e8e3db]">
            <h3 className="font-semibold text-[#2c2416] mb-4">Répartition des scores</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [val, 'Parties']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e8e3db' }}
                  />
                  <text x="50%" y="45%" textAnchor="middle" fill="#7a7265" fontSize={12}>Total</text>
                  <text x="50%" y="58%" textAnchor="middle" fill="#2c2416" fontSize={20} fontWeight="bold">{totalGamesForPie}</text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[#7a7265]">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e8e3db]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#2c2416]">📋 Inscriptions ({stats.recentRegistrations.length})</h3>
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
              className="px-4 py-2 bg-[#4a7c59] text-white rounded-xl text-sm font-medium hover:bg-[#3d6649] transition"
            >
              📥 Exporter CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[#7a7265] text-sm border-b border-[#e8e3db]">
                  <th className="pb-3">Pseudo</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-[#7a7265] py-4 text-center">Aucune inscription</td>
                  </tr>
                ) : (
                  stats.recentRegistrations.slice(0, 10).map((user, i) => (
                    <tr key={i} className="border-b border-[#f5f0e8] last:border-0">
                      <td className="py-3 font-medium text-[#2c2416]">{user.pseudo || 'Anonyme'}</td>
                      <td className="py-3 text-[#7a7265]">{user.email}</td>
                      <td className="py-3 text-[#7a7265] text-sm">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
