import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
    FiShield, FiAward, FiUsers, FiCalendar, FiBarChart2,
    FiRefreshCw, FiUser, FiTarget
} from 'react-icons/fi'

// Sub-pages
import TeamsPage from './admin/TeamsPage'
import PlayersPage from './admin/PlayersPage'
import TournamentsPage from './admin/TournamentsPage'
import MatchesPage from './admin/MatchesPage'
import LeaderboardPage from './admin/LeaderboardPage'

// API
import { teamService, tournamentService, matchService, playerService } from '../api/services'

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'overview', label: 'Overview', icon: <FiShield /> },
    { id: 'tournaments', label: 'Tournaments', icon: <FiAward /> },
    { id: 'teams', label: 'Teams', icon: <FiUsers /> },
    { id: 'matches', label: 'Matches', icon: <FiCalendar /> },
    { id: 'players', label: 'Players', icon: <FiUser /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <FiBarChart2 /> },
]

export default function AdminPanel() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('overview')
    const [stats, setStats] = useState({ tournaments: 0, teams: 0, matches: 0, players: 0, liveMatches: 0 })
    const [recentMatches, setRecentMatches] = useState([])
    const [statsLoading, setStatsLoading] = useState(true)
    const pageRef = useRef(null)

    // Guard: redirect non-admins
    useEffect(() => {
        if (user && user.role !== 'admin') {
            toast.error('Admin access only')
            navigate('/dashboard')
        }
    }, [user, navigate])

    // Page enter animation
    useEffect(() => {
        gsap.fromTo(pageRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
        )
    }, [])

    // Load overview stats
    const loadStats = async () => {
        setStatsLoading(true)
        try {
            const [teamRes, tourneyRes, matchRes, playerRes] = await Promise.all([
                teamService.getAll(),
                tournamentService.getAll(),
                matchService.getAll({ limit: 5 }),
                playerService.getAll(),
            ])
            const matches = matchRes.data.data || []
            setStats({
                tournaments: tourneyRes.data.data?.length ?? 0,
                teams: teamRes.data.data?.length ?? 0,
                matches: matchRes.data.pagination?.total ?? matches.length,
                players: playerRes.data.data?.length ?? 0,
                liveMatches: matches.filter(m => m.status === 'live').length,
            })
            setRecentMatches(matches.slice(0, 5))
        } catch (err) {
            toast.error('Failed to load overview stats')
        } finally {
            setStatsLoading(false)
        }
    }

    useEffect(() => { if (user?.role === 'admin') loadStats() }, [user])

    if (user?.role !== 'admin') return null

    return (
        <div ref={pageRef} className="page-wrapper">
            {/* Header */}
            <div className="section-header mb-2" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiShield style={{ color: 'var(--clr-red)' }} /> Admin Portal
                    </h1>
                    <p className="page-subtitle">Full system control — teams, players, tournaments, matches, scores.</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={loadStats}><FiRefreshCw /> Refresh</button>
            </div>

            {/* Tabs */}
            <div className="admin-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon} {tab.label}
                        {tab.id === 'matches' && stats.liveMatches > 0 && (
                            <span className="badge badge-red" style={{ marginLeft: '0.4rem', fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                {stats.liveMatches} LIVE
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="admin-content">
                {activeTab === 'overview' && <OverviewTab stats={stats} recentMatches={recentMatches} loading={statsLoading} onNavigate={setActiveTab} />}
                {activeTab === 'tournaments' && <TournamentsPage />}
                {activeTab === 'teams' && <TeamsPage />}
                {activeTab === 'matches' && <MatchesPage onScoreUpdate={loadStats} />}
                {activeTab === 'players' && <PlayersPage />}
                {activeTab === 'leaderboard' && <LeaderboardPage />}
            </div>
        </div>
    )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
const STATUS_BADGE = { upcoming: 'badge-gold', live: 'badge-red', completed: 'badge-green', cancelled: 'badge-purple' }

function OverviewTab({ stats, recentMatches, loading, onNavigate }) {
    const cards = [
        { icon: <FiAward />, label: 'Tournaments', value: stats.tournaments, color: 'var(--clr-gold)', tab: 'tournaments' },
        { icon: <FiUsers />, label: 'Teams', value: stats.teams, color: 'var(--clr-blue)', tab: 'teams' },
        { icon: <FiCalendar />, label: 'Matches', value: stats.matches, color: 'var(--clr-green)', tab: 'matches' },
        { icon: <FiUser />, label: 'Players', value: stats.players, color: 'var(--clr-purple)', tab: 'players' },
        { icon: <FiTarget />, label: 'Live Now', value: stats.liveMatches, color: 'var(--clr-red)', tab: 'matches' },
    ]

    return (
        <div>
            {/* Stat Cards */}
            <div className="grid-3 mb-2">
                {cards.map((c, i) => (
                    <div key={i} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate(c.tab)}>
                        <div className="stat-icon" style={{ background: `${c.color}20`, color: c.color }}>{c.icon}</div>
                        <div className="stat-value">{loading ? '…' : c.value}</div>
                        <div className="stat-label">{c.label}</div>
                    </div>
                ))}
            </div>

            {/* Quick nav + Recent matches */}
            <div className="grid-2">
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Recent Matches</h3>
                    {loading ? (
                        <div className="table-skeleton">
                            {[...Array(4)].map((_, i) => <div key={i} className="skeleton-row" />)}
                        </div>
                    ) : recentMatches.length === 0 ? (
                        <p className="text-muted text-sm">No matches yet. Go schedule one!</p>
                    ) : recentMatches.map(m => (
                        <div key={m.id} className="admin-row">
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.team1_name} vs {m.team2_name}</div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{m.tournament_name || 'No tournament'}</div>
                            </div>
                            <span className={`badge ${STATUS_BADGE[m.status] || 'badge-gold'}`}>{m.status}</span>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <button className="btn btn-primary" onClick={() => onNavigate('tournaments')}>
                            <FiAward /> Manage Tournaments
                        </button>
                        <button className="btn btn-ghost" onClick={() => onNavigate('teams')}>
                            <FiUsers /> Manage Teams
                        </button>
                        <button className="btn btn-ghost" onClick={() => onNavigate('matches')}>
                            <FiCalendar /> Manage Matches
                        </button>
                        <button className="btn btn-ghost" onClick={() => onNavigate('players')}>
                            <FiUser /> Manage Players
                        </button>
                        <button className="btn btn-ghost" onClick={() => onNavigate('leaderboard')}>
                            <FiBarChart2 /> View Leaderboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
