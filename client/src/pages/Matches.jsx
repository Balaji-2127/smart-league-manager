import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../context/AuthContext'
import { useQuery, gql } from '@apollo/client'
import toast from 'react-hot-toast'
import { FiPlus, FiEye, FiCalendar, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { GiCricketBat } from 'react-icons/gi'
import Skeleton from '../components/Skeleton'
import CreateMatchModal from '../components/CreateMatchModal'

const GET_MATCHES = gql`
  query GetMatches($status: String) {
    matches(status: $status) {
      id
      scheduled_date
      status
      tournament {
        name
      }
      team1 {
        id
        name
      }
      team2 {
        id
        name
      }
      score1 {
        runs
        wickets
      }
      score2 {
        runs
        wickets
      }
    }
  }
`

const STATUS_COLORS = { live: 'red', upcoming: 'gold', completed: 'green' }

export default function Matches() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [filter, setFilter] = useState('')
    const [showModal, setShowModal] = useState(false)
    const listRef = useRef(null)
    const headerRef = useRef(null)

    const { data, loading, error, refetch } = useQuery(GET_MATCHES, {
        variables: { status: filter === 'all' ? '' : filter }
    })

    useEffect(() => {
        gsap.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
    }, [])

    useEffect(() => {
        if (listRef.current && !loading) {
            gsap.fromTo([...listRef.current.children],
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, stagger: 0.07, duration: 0.4, ease: 'power2.out' }
            )
        }
    }, [loading, data])

    if (error) return <div className="page-wrapper"><p className="text-red">Error: {error.message}</p></div>

    const matches = data?.matches || []

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
                    <button key={f} className={`btn btn-sm ${filter === (f === 'all' ? '' : f) ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setFilter(f === 'all' ? '' : f)}>
                        <FiFilter style={{ fontSize: '0.75rem' }} />
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? <Skeleton type="list" /> : (
                <div ref={listRef} className="match-grid">
                    {matches.map(match => (
                        <div key={match.id} className="card match-card">
                            <div className="match-card-header">
                                <span className="text-muted text-xs">{match.tournament?.name}</span>
                                <span className={`badge badge-${STATUS_COLORS[match.status] || 'green'}`}>
                                    {match.status === 'live' && '🔴 '}{match.status}
                                </span>
                            </div>
                            <div className="match-card-teams">
                                <div className="match-card-team">
                                    <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                                        {match.team1?.name?.charAt(0)}
                                    </div>
                                    <span>{match.team1?.name}</span>
                                </div>
                                <div className="match-vs">VS</div>
                                <div className="match-card-team">
                                    <span>{match.team2?.name}</span>
                                    <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                                        {match.team2?.name?.charAt(0)}
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
                    {matches.length === 0 && !loading && (
                        <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                            <p className="text-muted">No matches found for this filter.</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && <CreateMatchModal onClose={() => setShowModal(false)} onCreated={() => refetch()} />}

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
