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

function KPICard({ title, value, subtitle, icon }: { title: string; value: string | number; subtitle?: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg md:text-2xl">{icon}</span>
        <span className="text-gray-500 text-xs md:text-sm font-medium">{title}</span>
      </div>
      <div className="text-2xl md:text-3xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1 truncate">{subtitle}</div>}
    </div>
  );
}

function DateRangeSelector({ value, onChange }: { value: DateRange; onChange: (v: DateRange) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DateRange)}
      className="px-3 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
    >
      {DATE_RANGES.map((range) => (
        <option key={range} value={range}>
          {getDateRangeLabel(range)}
        </option>
      ))}
    </select>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">🧼 Flappy Analytics</h1>
            <p className="text-gray-500">
              {getDateRangeLabel(dateRange)}
              {refreshing && <span className="ml-2 text-amber-500">⟳</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
            <button
              onClick={() => { localStorage.removeItem('flappy_admin_auth'); setIsAuthenticated(false); }}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              🚪
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <KPICard icon="👥" title="Sessions" value={stats.totalSessions} subtitle={getDateRangeLabel(dateRange)} />
          <KPICard icon="🎮" title="Parties jouées" value={stats.totalGames} subtitle={getDateRangeLabel(dateRange)} />
          <KPICard icon="📊" title="Taux conversion" value={`${stats.conversionRate.toFixed(1)}%`} subtitle="Inscriptions / Sessions" />
          <KPICard icon="⏱️" title="Durée moyenne" value={`${stats.avgGameDuration}s`} subtitle="Par partie" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sessions per day */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">📈 Sessions par jour</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.sessionsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(val) => new Date(val).toLocaleDateString('fr-FR')}
                  formatter={(val) => [val, 'Sessions']}
                />
                <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Score distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">🏆 Distribution des scores</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => [val, 'Parties']} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent registrations */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">📋 Inscriptions ({stats.recentRegistrations.length})</h3>
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
              className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition flex items-center gap-2"
            >
              📥 Exporter CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm">
                  <th className="pb-3">Pseudo</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-gray-400 py-4 text-center">Aucune inscription récente</td>
                  </tr>
                ) : (
                  stats.recentRegistrations.map((user, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="py-3 font-medium">{user.pseudo || 'Anonyme'}</td>
                      <td className="py-3 text-gray-500">{user.email}</td>
                      <td className="py-3 text-gray-400 text-sm">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
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
