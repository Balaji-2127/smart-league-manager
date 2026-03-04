/**
 * src/pages/admin/TournamentsPage.jsx
 * Admin: Manage Tournaments — list, create, update status.
 */
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { FiPlus, FiRefreshCw } from 'react-icons/fi'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import { tournamentService } from '../../api/services'

const STATUS_OPTIONS = ['upcoming', 'ongoing', 'completed'].map(s => ({ value: s, label: s }))
const STATUS_BADGE = { upcoming: 'badge-gold', ongoing: 'badge-blue', completed: 'badge-green' }

export default function TournamentsPage() {
    const [tournaments, setTournaments] = useState([])
    const [loading, setLoading] = useState(true)
    const [createOpen, setCreateOpen] = useState(false)
    const [statusOpen, setStatusOpen] = useState(false)
    const [selected, setSelected] = useState(null)
    const [form, setForm] = useState({ name: '', year: new Date().getFullYear() })
    const [newStatus, setNewStatus] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await tournamentService.getAll()
            setTournaments(res.data.data || [])
        } catch (err) {
            toast.error('Failed to load tournaments')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const handleCreate = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await tournamentService.create({ name: form.name, year: parseInt(form.year) })
            toast.success(`Tournament "${form.name}" created!`)
            setCreateOpen(false)
            setForm({ name: '', year: new Date().getFullYear() })
            load()
        } catch (err) {
            toast.error(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Creation failed')
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdateStatus = async (e) => {
        e.preventDefault()
        if (!newStatus) return toast.error('Select a status')
        setSubmitting(true)
        try {
            await tournamentService.updateStatus(selected.id, newStatus)
            toast.success(`Status updated to "${newStatus}"`)
            setStatusOpen(false)
            load()
        } catch (err) {
            toast.error(err.response?.data?.errors?.[0]?.message || 'Update failed')
        } finally {
            setSubmitting(false)
        }
    }

    const columns = [
        { key: 'name', label: 'Tournament', render: v => <strong>{v}</strong> },
        { key: 'year', label: 'Year' },
        { key: 'status', label: 'Status', render: v => <span className={`badge ${STATUS_BADGE[v] || 'badge-gold'}`}>{v}</span> },
        { key: 'created_at', label: 'Created', render: v => v ? new Date(v).toLocaleDateString() : '—' },
        {
            key: 'id', label: 'Actions',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {['upcoming', 'ongoing', 'completed'].filter(s => s !== row.status).map(s => (
                        <button key={s} className="btn btn-ghost btn-sm"
                            onClick={() => { setSelected(row); setNewStatus(s); setStatusOpen(true) }}>
                            → {s}
                        </button>
                    ))}
                </div>
            )
        },
    ]

    return (
        <div>
            <div className="section-header mb-2">
                <div>
                    <h3>Tournaments <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>{tournaments.length}</span></h3>
                    <p className="text-muted text-sm">Create and manage all tournaments.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={load}><FiRefreshCw /></button>
                    <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}><FiPlus /> New Tournament</button>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <Table columns={columns} rows={tournaments} loading={loading} emptyText="No tournaments yet. Create one!" />
            </div>

            {/* Create Modal */}
            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="🏆 Create Tournament">
                <form onSubmit={handleCreate}>
                    <FormField label="Tournament Name" name="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. IPL 2025" required />
                    <FormField label="Year" name="year" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} min={2000} max={2100} required />
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating…' : 'Create'}</button>
                        <button type="button" className="btn btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
                    </div>
                </form>
            </Modal>

            {/* Update Status Modal */}
            <Modal open={statusOpen} onClose={() => setStatusOpen(false)} title={`Update Status — ${selected?.name}`} size="sm">
                <form onSubmit={handleUpdateStatus}>
                    <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>
                        Current: <span className={`badge ${STATUS_BADGE[selected?.status]}`}>{selected?.status}</span>
                        &nbsp;→&nbsp;
                        <span className={`badge ${STATUS_BADGE[newStatus]}`}>{newStatus}</span>
                    </p>
                    <FormField label="New Status" name="status" type="select" value={newStatus} onChange={e => setNewStatus(e.target.value)} options={STATUS_OPTIONS} required />
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Updating…' : 'Apply'}</button>
                        <button type="button" className="btn btn-ghost" onClick={() => setStatusOpen(false)}>Cancel</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
