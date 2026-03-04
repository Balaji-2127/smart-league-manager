/**
 * src/pages/admin/PlayersPage.jsx
 * Admin: Manage Players — list all players with stats, update player stats.
 */
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { FiEdit2, FiRefreshCw } from 'react-icons/fi'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import { playerService } from '../../api/services'

const ROLES = ['batsman', 'bowler', 'all-rounder', 'wicket-keeper', 'captain'].map(r => ({ value: r, label: r }))

export default function PlayersPage() {
    const [players, setPlayers] = useState([])
    const [loading, setLoading] = useState(true)
    const [editOpen, setEditOpen] = useState(false)
    const [editPlayer, setEditPlayer] = useState(null)
    const [form, setForm] = useState({})
    const [submitting, setSubmitting] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await playerService.getAll()
            setPlayers(res.data.data || [])
        } catch (err) {
            toast.error('Failed to load players: ' + (err.response?.data?.message || err.message))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const openEdit = (player) => {
        setEditPlayer(player)
        setForm({
            role: player.role || 'batsman',
            runs: player.runs ?? 0,
            wickets: player.wickets ?? 0,
            matches_played: player.matches_played ?? 0,
            batting_avg: player.batting_avg ?? 0,
            strike_rate: player.strike_rate ?? 0,
            economy: player.economy ?? 0,
        })
        setEditOpen(true)
    }

    const handleUpdate = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await playerService.update(editPlayer.id, form)
            toast.success(`${editPlayer.name} updated!`)
            setEditOpen(false)
            load()
        } catch (err) {
            toast.error(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Update failed')
        } finally {
            setSubmitting(false)
        }
    }

    const fieldChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const columns = [
        {
            key: 'name', label: 'Name', render: (v, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div className="avatar" style={{ width: 30, height: 30, fontSize: '0.75rem', flexShrink: 0 }}>{v?.[0]}</div>
                    <div>
                        <div style={{ fontWeight: 600 }}>{v}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{row.email}</div>
                    </div>
                </div>
            )
        },
        { key: 'team_name', label: 'Team', render: v => v || <span className="text-muted">Unassigned</span> },
        { key: 'role', label: 'Role', render: v => <span className="badge badge-blue">{v || '—'}</span> },
        { key: 'runs', label: 'Runs' },
        { key: 'wickets', label: 'Wickets' },
        { key: 'matches_played', label: 'Matches' },
        { key: 'batting_avg', label: 'Avg', render: v => v ? parseFloat(v).toFixed(1) : '—' },
        {
            key: 'id', label: 'Actions',
            render: (_, row) => (
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(row)}>
                    <FiEdit2 /> Edit Stats
                </button>
            )
        },
    ]

    return (
        <div>
            <div className="section-header mb-2">
                <div>
                    <h3>Players <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>{players.length}</span></h3>
                    <p className="text-muted text-sm">View and update all player stats.</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={load}><FiRefreshCw /></button>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <Table columns={columns} rows={players} loading={loading} searchable emptyText="No players registered yet." />
            </div>

            {/* Edit Player Modal */}
            <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`✏️ Edit — ${editPlayer?.name}`} size="lg">
                <form onSubmit={handleUpdate}>
                    <FormField label="Role" name="role" type="select" value={form.role} onChange={fieldChange} options={ROLES} />
                    <div className="grid-2" style={{ gap: '1rem' }}>
                        <FormField label="Runs" name="runs" type="number" value={form.runs} onChange={fieldChange} min={0} />
                        <FormField label="Wickets" name="wickets" type="number" value={form.wickets} onChange={fieldChange} min={0} />
                        <FormField label="Matches Played" name="matches_played" type="number" value={form.matches_played} onChange={fieldChange} min={0} />
                        <FormField label="Batting Average" name="batting_avg" type="number" value={form.batting_avg} onChange={fieldChange} min={0} step={0.01} />
                        <FormField label="Strike Rate" name="strike_rate" type="number" value={form.strike_rate} onChange={fieldChange} min={0} step={0.01} />
                        <FormField label="Economy Rate" name="economy" type="number" value={form.economy} onChange={fieldChange} min={0} step={0.01} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save Stats'}</button>
                        <button type="button" className="btn btn-ghost" onClick={() => setEditOpen(false)}>Cancel</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
