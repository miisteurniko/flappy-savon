import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zbrjpvtzmdmkacsffsni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicmpwdnR6bWRta2Fjc2Zmc25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Njg1NzQsImV4cCI6MjA4MjM0NDU3NH0.xOPdO47EoRIE_e1t60nbRR3QH4XXtPOZ9zmy4O7_ZFw';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface AnalyticsEvent {
    id: number;
    session_id: string;
    event: string;
    data: Record<string, unknown>;
    created_at: string;
}

export interface DashboardStats {
    totalSessions: number;
    totalGames: number;
    totalRegistrations: number;
    conversionRate: number;
    avgGameDuration: number;
    gamesPerDay: { date: string; count: number }[];
    scoreDistribution: { range: string; count: number }[];
    recentRegistrations: { id: number; pseudo: string; email: string; created_at: string; optin: boolean }[];
}

export type DateRange = '7d' | '14d' | '30d' | 'today' | 'all';

export function getDateRangeLabel(range: DateRange): string {
    switch (range) {
        case 'today': return "Aujourd'hui";
        case '7d': return '7 derniers jours';
        case '14d': return '14 derniers jours';
        case '30d': return '30 derniers jours';
        case 'all': return 'Depuis le début';
    }
}

export async function getDashboardStats(range: DateRange = '7d'): Promise<DashboardStats> {
    const now = new Date();
    let startDate: Date;
    let daysCount: number;

    switch (range) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            daysCount = 1;
            break;
        case '7d':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            daysCount = 7;
            break;
        case '14d':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 14);
            startDate.setHours(0, 0, 0, 0);
            daysCount = 14;
            break;
        case '30d':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
            daysCount = 30;
            break;
        case 'all':
            startDate = new Date('2024-01-01');
            daysCount = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
            break;
    }

    const startDateIso = startDate.toISOString();

    // 1. Fetch exact counts for Tiles (parallel)
    const countQuery = (event: string) => {
        let q = supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true }) // head:true means no data, just count
            .eq('event', event);
        if (range !== 'all') q = q.gte('created_at', startDateIso);
        return q;
    };

    const [
        { count: sessionCount },
        { count: gameCount },
        { count: regCount },
        { data: events } // Fetch latest events for charts
    ] = await Promise.all([
        countQuery('session_start'),
        countQuery('game_end'),
        countQuery('registration_complete'),
        (async () => {
            let q = supabase
                .from('analytics_events')
                .select('*')
                .in('event', ['session_start', 'game_end', 'registration_complete'])
                .order('created_at', { ascending: false })
                .limit(10000);
            if (range !== 'all') q = q.gte('created_at', startDateIso);
            return q;
        })()
    ]);

    const allEvents = events || [];
    const gameEnds = allEvents.filter(e => e.event === 'game_end');

    // Games per day (Chart - based on sample)
    const gamesPerDay: Record<string, number> = {};
    gameEnds.forEach(e => {
        const date = new Date(e.created_at).toISOString().split('T')[0];
        gamesPerDay[date] = (gamesPerDay[date] || 0) + 1;
    });

    // Fill in missing days
    const chartDays = Math.min(daysCount, 30);
    const gamesArray: { date: string; count: number }[] = [];
    for (let i = chartDays - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const date = d.toISOString().split('T')[0];
        gamesArray.push({ date, count: gamesPerDay[date] || 0 });
    }

    // Score distribution (based on sample)
    const scores = gameEnds.map(e => {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        return data?.score || 0;
    });

    const scoreRanges = [
        { range: '0-5', min: 0, max: 5 },
        { range: '6-10', min: 6, max: 10 },
        { range: '11-20', min: 11, max: 20 },
        { range: '21-30', min: 21, max: 30 },
        { range: '30+', min: 31, max: Infinity },
    ];

    const scoreDistribution = scoreRanges.map(({ range, min, max }) => ({
        range,
        count: scores.filter(s => s >= min && s <= max).length,
    }));

    // Avg game duration (based on sample)
    const durations = gameEnds.map(e => {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        return data?.duration_ms || 0;
    }).filter(d => d > 0);

    const avgDuration = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length / 1000
        : 0;

    // All registrations from scores table (limit 5000 for recent list)
    const { data: recentUsers } = await supabase
        .from('scores')
        .select('id, pseudo, email, created_at, optin')
        .order('created_at', { ascending: false })
        .limit(5000);

    return {
        totalSessions: sessionCount || 0,
        totalGames: gameCount || 0,
        totalRegistrations: regCount || 0,
        conversionRate: (sessionCount || 0) > 0
            ? ((regCount || 0) / (sessionCount || 0)) * 100
            : 0,
        avgGameDuration: Math.round(avgDuration * 10) / 10,
        gamesPerDay: gamesArray,
        scoreDistribution,
        recentRegistrations: (recentUsers || []).map(u => ({ ...u, optin: !!u.optin })),
    };
}

export async function getConfig() {
    const { data } = await supabase.from('app_config').select('key,value');
    if (!data) return {};
    return data.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
    }, {} as Record<string, string>);
}

export async function updateConfig(key: string, value: string) {
    // Upsert is safer: creates if missing, updates if exists.
    // Handles 'key' uniqueness automatically.
    const { error } = await supabase
        .from('app_config')
        .upsert({ key, value }, { onConflict: 'key' });

    if (error) {
        console.error('[Supabase] Config update failed:', error);
        throw error;
    }
}

export async function getContestParticipants() {
    const { data, error } = await supabase
        .from('scores')
        .select('pseudo, email, contest_best, optin')
        .gt('contest_best', 0)
        .order('contest_best', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function resetContestScores() {
    const { error } = await supabase.rpc('reset_contest_scores');
    if (error) throw error;
}

// Detail functions for KPI modals
export async function getSessionsDetail(range: DateRange) {
    const startDate = getStartDate(range);

    // Get all users for lookup (fallback if pseudo not in event data)
    const { data: users } = await supabase.from('scores').select('email, pseudo');
    const userMap = new Map((users || []).map(u => [u.email?.toLowerCase(), u.pseudo]));

    // Get all game_end events to count games per session (within date range)
    let gamesQuery = supabase
        .from('analytics_events')
        .select('session_id')
        .eq('event', 'game_end')
        .not('session_id', 'is', null);

    if (range !== 'all') {
        gamesQuery = gamesQuery.gte('created_at', startDate.toISOString());
    }

    const { data: games } = await gamesQuery;

    const gamesPerSession = new Map<string, number>();
    (games || []).forEach(g => {
        if (g.session_id) {
            gamesPerSession.set(g.session_id, (gamesPerSession.get(g.session_id) || 0) + 1);
        }
    });

    let query = supabase
        .from('analytics_events')
        .select('session_id, created_at, data')
        .eq('event', 'session_start')
        .not('session_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5000);

    if (range !== 'all') {
        query = query.gte('created_at', startDate.toISOString());
    }

    const { data } = await query;
    return (data || []).map(e => {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        // Try to get pseudo from event data first, then from lookup
        const pseudo = d?.pseudo || (d?.email ? userMap.get(d.email.toLowerCase()) : null);
        return {
            session_id: e.session_id,
            created_at: e.created_at,
            pseudo: pseudo || 'Visiteur',
            games_count: gamesPerSession.get(e.session_id) || 0,
            data: d
        };
    });
}

export async function getGamesDetail(range: DateRange) {
    const startDate = getStartDate(range);

    // Get all users for lookup (fallback if pseudo not in event data)
    const { data: users } = await supabase.from('scores').select('email, pseudo');
    const userMap = new Map((users || []).map(u => [u.email?.toLowerCase(), u.pseudo]));

    let query = supabase
        .from('analytics_events')
        .select('session_id, created_at, data')
        .eq('event', 'game_end')
        .order('created_at', { ascending: false })
        .limit(5000);

    if (range !== 'all') {
        query = query.gte('created_at', startDate.toISOString());
    }

    const { data } = await query;
    return (data || []).map(e => {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        // Try to get pseudo from event data first, then from lookup
        const pseudo = d?.pseudo || (d?.email ? userMap.get(d.email.toLowerCase()) : null);
        return {
            session_id: e.session_id,
            created_at: e.created_at,
            pseudo: pseudo || 'Visiteur',
            score: d?.score || 0,
            duration_ms: d?.duration_ms || 0
        };
    });
}

export async function getRegistrationsDetail(range: DateRange) {
    const startDate = getStartDate(range);

    let query = supabase
        .from('scores')
        .select('id, pseudo, email, created_at, optin, best')
        .order('created_at', { ascending: false })
        .limit(5000);

    if (range !== 'all') {
        query = query.gte('created_at', startDate.toISOString());
    }

    const { data } = await query;
    return data || [];
}

function getStartDate(range: DateRange): Date {
    const now = new Date();
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);

    switch (range) {
        case 'today':
            return d;
        case '7d':
            d.setDate(now.getDate() - 7);
            return d;
        case '14d':
            d.setDate(now.getDate() - 14);
            return d;
        case '30d':
            d.setDate(now.getDate() - 30);
            return d;
        case 'all':
        default:
            return new Date('2024-01-01');
    }
}

