/**
 * src/pages/admin/LeaderboardPage.jsx
 * Admin: View leaderboard — top batsmen, bowlers, and points table from real API data.
 */
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { FiRefreshCw, FiAward } from 'react-icons/fi'
import { GiCricketBat } from 'react-icons/gi'
import Table from '../../components/Table'
import { leaderboardService } from '../../api/services'

export default function LeaderboardPage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await leaderboardService.get()
            setData(res.data.data)
        } catch (err) {
            toast.error('Failed to load leaderboard')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const batsmenCols = [
        { key: 'name', label: 'Player', render: (v, r) => <strong>{v || r.email}</strong> },
        { key: 'team_name', label: 'Team', render: v => v || '—' },
        { key: 'runs', label: 'Runs', render: v => <span style={{ color: 'var(--clr-green)', fontWeight: 700 }}>{v}</span> },
        { key: 'batting_avg', label: 'Avg', render: v => v ? parseFloat(v).toFixed(1) : '—' },
        { key: 'strike_rate', label: 'SR', render: v => v ? parseFloat(v).toFixed(1) : '—' },
        { key: 'matches_played', label: 'Matches' },
    ]

    const bowlerCols = [
        { key: 'name', label: 'Player', render: (v, r) => <strong>{v || r.email}</strong> },
        { key: 'team_name', label: 'Team', render: v => v || '—' },
        { key: 'wickets', label: 'Wickets', render: v => <span style={{ color: 'var(--clr-red)', fontWeight: 700 }}>{v}</span> },
        { key: 'economy', label: 'Economy', render: v => v ? parseFloat(v).toFixed(2) : '—' },
        { key: 'matches_played', label: 'Matches' },
    ]

    const pointsCols = [
        { key: 'team_name', label: 'Team', render: (v, r) => <strong>{r.id}</strong> },
        { key: 'id', label: 'Team', render: (_, r) => r.team_name || '—' },
        { key: 'played', label: 'Played' },
        { key: 'won', label: 'Won', render: v => <span style={{ color: 'var(--clr-green)', fontWeight: 700 }}>{v}</span> },
        { key: 'lost', label: 'Lost', render: v => <span style={{ color: 'var(--clr-red)' }}>{v}</span> },
        { key: 'points', label: 'Points', render: v => <strong style={{ color: 'var(--clr-gold)' }}>{v}</strong> },
    ]

    return (
        <div>
            <div className="section-header mb-2">
                <div>
                    <h3><FiAward style={{ marginRight: '0.4rem' }} />Leaderboard</h3>
                    <p className="text-muted text-sm">Live rankings from the database.</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={load}><FiRefreshCw /></button>
            </div>

            <div className="grid-2" style={{ gap: '1.5rem' }}>
                {/* Top Batsmen */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '1rem 1rem 0' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <GiCricketBat style={{ color: 'var(--clr-green)' }} /> Top Batsmen
                        </h4>
                    </div>
                    <Table
                        columns={batsmenCols}
                        rows={data?.top_batsmen || []}
                        loading={loading}
                        emptyText="No batting stats yet."
                    />
                </div>

                {/* Top Bowlers */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '1rem 1rem 0' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FiAward style={{ color: 'var(--clr-red)' }} /> Top Bowlers
                        </h4>
                    </div>
                    <Table
                        columns={bowlerCols}
                        rows={data?.top_bowlers || []}
                        loading={loading}
                        emptyText="No bowling stats yet."
                    />
                </div>
            </div>

            {/* Points Table */}
            <div className="card" style={{ marginTop: '1.5rem', padding: 0 }}>
                <div style={{ padding: '1rem 1rem 0' }}>
                    <h4>🏆 Points Table</h4>
                </div>
                <Table
                    columns={[
                        { key: 'team_name', label: 'Team', render: (_, r) => <strong>{r.team_name}</strong> },
                        { key: 'played', label: 'P' },
                        { key: 'won', label: 'W', render: v => <span style={{ color: 'var(--clr-green)', fontWeight: 700 }}>{v}</span> },
                        { key: 'lost', label: 'L', render: v => <span style={{ color: 'var(--clr-red)' }}>{v}</span> },
                        { key: 'points', label: 'Pts', render: v => <strong style={{ color: 'var(--clr-gold)' }}>{v}</strong> },
                    ]}
                    rows={data?.points_table || []}
                    loading={loading}
                    emptyText="No completed matches yet."
                />
            </div>
        </div>
    )
}
