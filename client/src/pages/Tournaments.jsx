import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { FiPlus } from 'react-icons/fi'
import Skeleton from '../components/Skeleton'

export default function Tournaments() {
    const { user } = useAuth()
    const [tournaments, setTournaments] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', year: new Date().getFullYear(), status: 'upcoming' })
    const listRef = useRef(null)
    const headerRef = useRef(null)

    useEffect(() => {
        gsap.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
        fetchTournaments()
    }, [])

    useEffect(() => {
        if (!listRef.current || loading) return
        gsap.fromTo([...listRef.current.children],
            { y: 30, opacity: 0, scale: 0.97 },
            { y: 0, opacity: 1, scale: 1, stagger: 0.08, duration: 0.45, ease: 'back.out(1.3)' }
        )
    }, [loading])

    const fetchTournaments = () => {
        api.get('/tournaments')
            .then(res => setTournaments(res.data.tournaments || DUMMY_TOURNAMENTS))
            .catch(() => setTournaments(DUMMY_TOURNAMENTS))
            .finally(() => setLoading(false))
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        try {
            const { data } = await api.post('/tournaments', form)
            setTournaments(prev => [data.tournament, ...prev])
            toast.success('Tournament created! 🏆')
            setShowForm(false)
            setForm({ name: '', year: new Date().getFullYear(), status: 'upcoming' })
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create tournament')
        }
    }

    return (
        <div className="page-wrapper">
            <div ref={headerRef} className="section-header page-header">
                <div>
                    <h1 className="page-title">🏆 Tournaments</h1>
                    <p className="page-subtitle">All cricket tournaments on the platform</p>
                </div>
                {user?.role === 'admin' && (
                    <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
                        <FiPlus /> {showForm ? 'Cancel' : 'Create Tournament'}
                    </button>
                )}
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="card mb-2">
                    <h3 style={{ marginBottom: '1.25rem' }}>New Tournament</h3>
                    <form onSubmit={handleCreate}>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Tournament Name</label>
                                <input placeholder="e.g. IPL 2025" value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label>Year</label>
                                <input type="number" value={form.year}
                                    onChange={e => setForm(f => ({ ...f, year: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="ongoing">Ongoing</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary">Create Tournament</button>
                    </form>
                </div>
            )}

            {loading ? <Skeleton type="cards" /> : (
                <div ref={listRef} className="grid-2">
                    {tournaments.map(t => (
                        <div key={t.id} className="card">
                            <div className="flex justify-between items-center mb-2">
                                <div className="tour-icon">🏆</div>
                                <span className={`badge badge-${t.status === 'ongoing' ? 'green' : t.status === 'upcoming' ? 'gold' : 'blue'}`}>
                                    {t.status}
                                </span>
                            </div>
                            <h3 style={{ marginBottom: '0.3rem' }}>{t.name}</h3>
                            <p className="text-muted text-sm">{t.year} • {t.total_matches || '–'} matches</p>
                            <div className="mt-2 flex gap-1">
                                <a href="/matches" className="btn btn-ghost btn-sm">View Matches</a>
                                <a href="/leaderboard" className="btn btn-ghost btn-sm">Standings</a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`.tour-icon { font-size: 2rem; }`}</style>
        </div>
    )
}

const DUMMY_TOURNAMENTS = [
    { id: 1, name: 'IPL 2025', year: 2025, status: 'ongoing', total_matches: 74 },
    { id: 2, name: 'T20 World Cup', year: 2025, status: 'upcoming', total_matches: 55 },
    { id: 3, name: 'Ranji Trophy', year: 2024, status: 'completed', total_matches: 128 },
    { id: 4, name: 'Vijay Hazare', year: 2024, status: 'completed', total_matches: 44 },
]
