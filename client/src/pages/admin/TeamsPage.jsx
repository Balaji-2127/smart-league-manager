/**
 * src/pages/admin/TeamsPage.jsx
 * Admin: Manage Teams — list all teams, create a new team, add players.
 */
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { FiPlus, FiUsers, FiUserPlus, FiRefreshCw } from 'react-icons/fi'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import { teamService, playerService } from '../../api/services'

export default function TeamsPage() {
    const [teams, setTeams] = useState([])
    const [players, setPlayers] = useState([])
    const [loading, setLoading] = useState(true)
    const [createOpen, setCreateOpen] = useState(false)
    const [addPlayerOpen, setAddPlayerOpen] = useState(false)
    const [selectedTeam, setSelectedTeam] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    const [teamForm, setTeamForm] = useState({ name: '', logo_url: '' })
    const [playerForm, setPlayerForm] = useState({ user_id: '', role: 'batsman' })

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [teamsRes, playersRes] = await Promise.all([
                teamService.getAll(),
                playerService.getAll(),
            ])
            setTeams(teamsRes.data.data || [])
            setPlayers(playersRes.data.data || [])
        } catch (err) {
            toast.error('Failed to load teams: ' + (err.response?.data?.message || err.message))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const handleCreateTeam = async (e) => {
        e.preventDefault()
        if (!teamForm.name.trim()) return toast.error('Team name is required')
        setSubmitting(true)
        try {
            await teamService.create(teamForm)
            toast.success(`Team "${teamForm.name}" created!`)
            setCreateOpen(false)
            setTeamForm({ name: '', logo_url: '' })
            load()
        } catch (err) {
            toast.error(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Failed to create team')
        } finally {
            setSubmitting(false)
        }
    }

    const handleAddPlayer = async (e) => {
        e.preventDefault()
        if (!playerForm.user_id) return toast.error('Please select a player')
        setSubmitting(true)
        try {
            await teamService.addPlayer(selectedTeam.id, playerForm)
            toast.success(`Player added to ${selectedTeam.name}!`)
            setAddPlayerOpen(false)
            setPlayerForm({ user_id: '', role: 'batsman' })
            load()
        } catch (err) {
            toast.error(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Failed to add player')
        } finally {
            setSubmitting(false)
        }
    }

    const columns = [
        { key: 'name', label: 'Team Name', render: (v) => <strong>{v}</strong> },
        { key: 'captain_name', label: 'Captain' },
        { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
        {
            key: 'id', label: 'Actions',
            render: (id, row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedTeam(row); setAddPlayerOpen(true) }}>
                        <FiUserPlus /> Add Player
                    </button>
                </div>
            )
        },
    ]

    const availablePlayers = players.filter(p => !p.team_id)

    return (
        <div>
            <div className="section-header mb-2">
                <div>
                    <h3>Teams <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>{teams.length}</span></h3>
                    <p className="text-muted text-sm">Create and manage all teams in the league.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={load}><FiRefreshCw /></button>
                    <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}><FiPlus /> New Team</button>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <Table columns={columns} rows={teams} loading={loading} searchable emptyText="No teams yet. Create one!" />
            </div>

            {/* Create Team Modal */}
            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="✨ Create New Team">
                <form onSubmit={handleCreateTeam}>
                    <FormField label="Team Name" name="name" value={teamForm.name} onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Royal Challengers" required />
                    <FormField label="Logo URL" name="logo_url" value={teamForm.logo_url} onChange={e => setTeamForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="https://…/logo.png" hint="Optional — leave blank for a generated avatar" />
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating…' : 'Create Team'}</button>
                        <button type="button" className="btn btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
                    </div>
                </form>
            </Modal>

            {/* Add Player Modal */}
            <Modal open={addPlayerOpen} onClose={() => setAddPlayerOpen(false)} title={`👥 Add Player to ${selectedTeam?.name}`}>
                <form onSubmit={handleAddPlayer}>
                    <FormField
                        label="Select Player" name="user_id" type="select"
                        value={playerForm.user_id}
                        onChange={e => setPlayerForm(f => ({ ...f, user_id: e.target.value }))}
                        required
                        options={availablePlayers.map(p => ({ value: p.user_id, label: p.name }))}
                        hint={availablePlayers.length === 0 ? 'No unassigned players available' : `${availablePlayers.length} player(s) available`}
                    />
                    <FormField
                        label="Player Role" name="role" type="select"
                        value={playerForm.role}
                        onChange={e => setPlayerForm(f => ({ ...f, role: e.target.value }))}
                        options={['batsman', 'bowler', 'all-rounder', 'wicket-keeper', 'captain'].map(r => ({ value: r, label: r }))}
                    />
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting || !availablePlayers.length}>{submitting ? 'Adding…' : 'Add Player'}</button>
                        <button type="button" className="btn btn-ghost" onClick={() => setAddPlayerOpen(false)}>Cancel</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
