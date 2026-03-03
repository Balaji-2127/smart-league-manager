import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { FiX } from 'react-icons/fi'

/**
 * CreateMatchModal – Admin-only modal to schedule a new match.
 * Props: onClose(), onCreated(match)
 */
export default function CreateMatchModal({ onClose, onCreated }) {
    const [form, setForm] = useState({ tournament_id: '', team1_id: '', team2_id: '', scheduled_date: '' })
    const [tournaments, setTournaments] = useState([])
    const [teams, setTeams] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        api.get('/tournaments').then(r => setTournaments(r.data.tournaments || FALLBACK_TOURNAMENTS)).catch(() => setTournaments(FALLBACK_TOURNAMENTS))
        api.get('/teams').then(r => setTeams(r.data.teams || FALLBACK_TEAMS)).catch(() => setTeams(FALLBACK_TEAMS))
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.team1_id === form.team2_id) { toast.error('Teams must be different'); return }
        setLoading(true)
        try {
            const { data } = await api.post('/matches', form)
            toast.success('Match scheduled! 📅')
            onCreated?.(data.match || { ...form, id: Date.now(), status: 'upcoming' })
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create match')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h3>Schedule New Match</h3>
                    <button className="modal-close" onClick={onClose}><FiX /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tournament</label>
                        <select value={form.tournament_id} onChange={e => setForm(f => ({ ...f, tournament_id: e.target.value }))} required>
                            <option value="">Select tournament…</option>
                            {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Team 1</label>
                            <select value={form.team1_id} onChange={e => setForm(f => ({ ...f, team1_id: e.target.value }))} required>
                                <option value="">Select team…</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Team 2</label>
                            <select value={form.team2_id} onChange={e => setForm(f => ({ ...f, team2_id: e.target.value }))} required>
                                <option value="">Select team…</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Match Date & Time</label>
                        <input type="datetime-local" value={form.scheduled_date}
                            onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} required />
                    </div>
                    <div className="flex gap-1 justify-between">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Scheduling…' : '📅 Schedule Match'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const FALLBACK_TOURNAMENTS = [
    { id: 1, name: 'IPL 2025' },
    { id: 2, name: 'T20 World Cup 2025' },
]
const FALLBACK_TEAMS = [
    { id: 1, name: 'Royal Challengers' },
    { id: 2, name: 'Mumbai Titans' },
    { id: 3, name: 'Delhi Destroyers' },
    { id: 4, name: 'Chennai Lions' },
]
