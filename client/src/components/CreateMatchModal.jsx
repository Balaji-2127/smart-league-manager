import { useState } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import toast from 'react-hot-toast'
import { FiX } from 'react-icons/fi'

const GET_LISTS = gql`
  query GetLists {
    tournaments { id name }
    teams { id name }
  }
`

const CREATE_MATCH = gql`
  mutation CreateMatch($tournamentId: ID!, $team1Id: ID!, $team2Id: ID!, $date: String!) {
    createMatch(tournament_id: $tournamentId, team1_id: $team1Id, team2_id: $team2Id, scheduled_date: $date) {
      id
      status
    }
  }
`

export default function CreateMatchModal({ onClose, onCreated }) {
    const { data } = useQuery(GET_LISTS)
    const [createMatch, { loading }] = useMutation(CREATE_MATCH)
    const [form, setForm] = useState({ tournament_id: '', team1_id: '', team2_id: '', scheduled_date: '' })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.team1_id === form.team2_id) { toast.error('Teams must be different'); return }
        try {
            await createMatch({
                variables: {
                    tournamentId: form.tournament_id,
                    team1Id: form.team1_id,
                    team2Id: form.team2_id,
                    date: form.scheduled_date
                }
            })
            toast.success('Match scheduled! 📅')
            onCreated?.()
            onClose()
        } catch (err) {
            toast.error(err.message || 'Failed to create match')
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
                            {data?.tournaments?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Team 1</label>
                            <select value={form.team1_id} onChange={e => setForm(f => ({ ...f, team1_id: e.target.value }))} required>
                                <option value="">Select team…</option>
                                {data?.teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Team 2</label>
                            <select value={form.team2_id} onChange={e => setForm(f => ({ ...f, team2_id: e.target.value }))} required>
                                <option value="">Select team…</option>
                                {data?.teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
