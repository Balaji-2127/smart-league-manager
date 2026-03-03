import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { FiAward, FiCalendar, FiUsers, FiTrendingUp, FiZap, FiShield } from 'react-icons/fi'
import { GiCricketBat } from 'react-icons/gi'
import Skeleton from '../components/Skeleton'

const ROLE_DESCRIPTIONS = {
    admin: '🛡️ Full system access — manage tournaments, matches, users, and live scores.',
    captain: '🏆 Manage your team, add players, and view match schedules.',
    player: '🏏 View your match schedule, team details, and update your profile.',
    viewer: '👁️ Watch live scores, leaderboards, and match highlights.',
}

export default function Dashboard() {
    const { user } = useAuth()
    const [stats, setStats] = useState(null)
    const [recentMatches, setRecentMatches] = useState([])
    const [loading, setLoading] = useState(true)
    const headerRef = useRef(null)
    const statsRef = useRef(null)
    const matchesRef = useRef(null)

    useEffect(() => {
        const tl = gsap.timeline()
        tl.fromTo(headerRef.current, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
        tl.fromTo(statsRef.current?.children ? [...statsRef.current.children] : [],
            { y: 30, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 0.5, ease: 'back.out(1.4)' }, '-=0.2'
        )
        tl.fromTo(matchesRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.1')
    }, [loading])

    useEffect(() => {
        Promise.all([
            api.get('/matches?limit=5').catch(() => ({ data: { matches: [] } })),
        ]).then(([matchRes]) => {
            setRecentMatches(matchRes.data.matches || [])
            setStats({
                tournaments: 12, teams: 24, matches: 87, players: 312,
                liveMatches: 2, upcoming: 8,
            })
            setLoading(false)
        })
    }, [])

    if (loading) return (
        <div className="page-wrapper">
            <Skeleton type="dashboard" />
        </div>
    )

    const statItems = [
        { icon: <FiAward />, value: stats?.tournaments, label: 'Tournaments', color: '--clr-gold', role: null },
        { icon: <FiUsers />, value: stats?.teams, label: 'Teams', color: '--clr-blue', role: null },
        { icon: <FiCalendar />, value: stats?.matches, label: 'Total Matches', color: '--clr-green', role: null },
        { icon: <GiCricketBat />, value: stats?.players, label: 'Players', color: '--clr-purple', role: null },
        { icon: <FiZap />, value: stats?.liveMatches, label: 'Live Now', color: '--clr-red', role: ['admin', 'viewer'] },
        { icon: <FiTrendingUp />, value: stats?.upcoming, label: 'Upcoming', color: '--clr-green', role: null },
    ].filter(s => !s.role || s.role.includes(user?.role))

    return (
        <div className="page-wrapper">
            {/* Header */}
            <div ref={headerRef} className="dash-header">
                <div>
                    <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
                    <p className="page-subtitle">{ROLE_DESCRIPTIONS[user?.role]}</p>
                </div>
                <div className="dash-role-badge">
                    <FiShield />
                    <span style={{ textTransform: 'capitalize' }}>{user?.role}</span>
                </div>
            </div>

            {/* Stats */}
            <div ref={statsRef} className="grid-3 mb-2">
                {statItems.map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon" style={{ background: `rgba(var(--raw-${s.color?.replace('--clr-', '')}), 0.12)` }}>
                            {s.icon}
                        </div>
                        <div className="stat-value counter" data-target={s.value}>{s.value?.toLocaleString()}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Recent Matches */}
            <div ref={matchesRef} className="grid-2">
                <div className="card">
                    <div className="section-header">
                        <h3>Recent Matches</h3>
                        <a href="/matches" className="btn btn-ghost btn-sm">View All</a>
                    </div>
                    {recentMatches.length === 0 ? (
                        <div className="empty-state">
                            <GiCricketBat size={40} style={{ color: 'var(--clr-text-dim)', marginBottom: '0.75rem' }} />
                            <p className="text-muted">No matches yet. {user?.role === 'admin' && 'Create one!'}</p>
                        </div>
                    ) : (
                        <div className="match-list">
                            {recentMatches.map(m => (
                                <div key={m.id} className="match-row">
                                    <div className="match-teams">
                                        <span>{m.team1_name}</span>
                                        <span className="vs-tag">VS</span>
                                        <span>{m.team2_name}</span>
                                    </div>
                                    <span className={`badge badge-${m.status === 'live' ? 'red' : m.status === 'completed' ? 'green' : 'gold'}`}>
                                        {m.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Role-specific panel */}
                <div className="card">
                    {user?.role === 'admin' && <AdminPanel />}
                    {user?.role === 'captain' && <CaptainPanel />}
                    {(user?.role === 'player' || user?.role === 'viewer') && <ViewerPanel />}
                </div>
            </div>
        </div>
    )
}

function AdminPanel() {
    return (
        <div>
            <h3 style={{ marginBottom: '1rem' }}>⚡ Admin Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a href="/tournaments" className="btn btn-primary">🏆 Create Tournament</a>
                <a href="/matches" className="btn btn-ghost">📅 Schedule Match</a>
                <a href="/leaderboard" className="btn btn-ghost">📊 View Leaderboard</a>
            </div>
        </div>
    )
}

function CaptainPanel() {
    return (
        <div>
            <h3 style={{ marginBottom: '1rem' }}>🏏 Captain Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a href="/teams" className="btn btn-primary">👥 Manage Team</a>
                <a href="/matches" className="btn btn-ghost">📅 My Matches</a>
            </div>
        </div>
    )
}

function ViewerPanel() {
    return (
        <div>
            <h3 style={{ marginBottom: '1rem' }}>🔴 Right Now</h3>
            <div className="live-now-list">
                <div className="live-match-item">
                    <div className="live-dot">LIVE</div>
                    <div className="match-teams" style={{ marginTop: '0.5rem' }}>
                        <span>Team Alpha</span>
                        <span className="vs-tag">VS</span>
                        <span>Team Beta</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginTop: '0.3rem' }}>
                        142/6 • 18.3 overs
                    </div>
                </div>
            </div>
        </div>
    )
}
