import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { FiPlus, FiEye, FiCalendar, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { GiCricketBat } from 'react-icons/gi'
import Skeleton from '../components/Skeleton'
import CreateMatchModal from '../components/CreateMatchModal'

const STATUS_COLORS = { live: 'red', upcoming: 'gold', completed: 'green' }

export default function Matches() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [matches, setMatches] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [filter, setFilter] = useState('all')
    const [showModal, setShowModal] = useState(false)
    const listRef = useRef(null)
    const headerRef = useRef(null)

    useEffect(() => {
        gsap.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
    }, [])

    useEffect(() => {
        fetchMatches()
    }, [page, filter])

    const fetchMatches = () => {
        setLoading(true)
        const status = filter !== 'all' ? `&status=${filter}` : ''
        api.get(`/matches?page=${page}&limit=8${status}`)
            .then(res => {
                setMatches(res.data.matches || DUMMY_MATCHES)
                setTotalPages(res.data.totalPages || 1)
            })
            .catch(() => {
                setMatches(DUMMY_MATCHES)
                setTotalPages(2)
            })
            .finally(() => {
                setLoading(false)
                if (listRef.current) {
                    gsap.fromTo([...listRef.current.children],
                        { y: 20, opacity: 0 },
                        { y: 0, opacity: 1, stagger: 0.07, duration: 0.4, ease: 'power2.out' }
                    )
                }
            })
    }

    const handleMatchCreated = (newMatch) => {
        setMatches(prev => [newMatch, ...prev])
        setShowModal(false)
    }

    return (
        <div className="page-wrapper">
            <div ref={headerRef} className="page-header section-header">
                <div>
                    <h1 className="page-title">📅 Matches</h1>
                    <p className="page-subtitle">Browse all scheduled & completed matches</p>
                </div>
                {user?.role === 'admin' && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <FiPlus /> Schedule Match
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-1 mb-2" style={{ flexWrap: 'wrap' }}>
                {['all', 'live', 'upcoming', 'completed'].map(f => (
                    <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => { setFilter(f); setPage(1) }}>
                        <FiFilter style={{ fontSize: '0.75rem' }} />
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? <Skeleton type="list" /> : (
                <>
                    <div ref={listRef} className="match-grid">
                        {matches.map(match => (
                            <div key={match.id} className="card match-card">
                                <div className="match-card-header">
                                    <span className="text-muted text-xs">{match.tournament_name}</span>
                                    <span className={`badge badge-${STATUS_COLORS[match.status] || 'green'}`}>
                                        {match.status === 'live' && '🔴 '}{match.status}
                                    </span>
                                </div>
                                <div className="match-card-teams">
                                    <div className="match-card-team">
                                        <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                                            {match.team1_name?.charAt(0)}
                                        </div>
                                        <span>{match.team1_name}</span>
                                    </div>
                                    <div className="match-vs">VS</div>
                                    <div className="match-card-team">
                                        <span>{match.team2_name}</span>
                                        <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                                            {match.team2_name?.charAt(0)}
                                        </div>
                                    </div>
                                </div>
                                <div className="match-card-footer">
                                    <span className="text-muted text-xs">
                                        <FiCalendar style={{ marginRight: '0.3rem' }} />
                                        {match.scheduled_date ? new Date(match.scheduled_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD'}
                                    </span>
                                    {match.status === 'live' ? (
                                        <button className="btn btn-sm btn-danger" onClick={() => navigate(`/match/${match.id}/live`)}>
                                            🔴 Watch Live
                                        </button>
                                    ) : (
                                        <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/match/${match.id}/live`)}>
                                            <FiEye /> View
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="pagination">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}><FiChevronLeft /></button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button key={i} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>
                                {i + 1}
                            </button>
                        ))}
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><FiChevronRight /></button>
                    </div>
                </>
            )}

            {showModal && <CreateMatchModal onClose={() => setShowModal(false)} onCreated={handleMatchCreated} />}

            <style>{`
        .match-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
        .match-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .match-card-teams { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 1rem; }
        .match-card-team { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.9rem; }
        .match-vs { font-family: 'Outfit', sans-serif; font-weight: 800; color: var(--clr-text-muted); font-size: 0.85rem; }
        .match-card-footer { display: flex; justify-content: space-between; align-items: center; }
      `}</style>
        </div>
    )
}

const DUMMY_MATCHES = [
    { id: 1, team1_name: 'Royal Challengers', team2_name: 'Mumbai Titans', status: 'live', tournament_name: 'IPL 2025', scheduled_date: new Date().toISOString() },
    { id: 2, team1_name: 'Delhi Destroyers', team2_name: 'Chennai Lions', status: 'upcoming', tournament_name: 'IPL 2025', scheduled_date: new Date(Date.now() + 86400000).toISOString() },
    { id: 3, team1_name: 'Kolkata Knights', team2_name: 'Pune Warriors', status: 'completed', tournament_name: 'IPL 2025', scheduled_date: new Date(Date.now() - 86400000).toISOString() },
    { id: 4, team1_name: 'Royal Challengers', team2_name: 'Delhi Destroyers', status: 'upcoming', tournament_name: 'T20 Cup', scheduled_date: new Date(Date.now() + 172800000).toISOString() },
    { id: 5, team1_name: 'Mumbai Titans', team2_name: 'Chennai Lions', status: 'completed', tournament_name: 'T20 Cup', scheduled_date: new Date(Date.now() - 172800000).toISOString() },
    { id: 6, team1_name: 'Pune Warriors', team2_name: 'Royal Challengers', status: 'upcoming', tournament_name: 'T20 Cup', scheduled_date: new Date(Date.now() + 259200000).toISOString() },
]
