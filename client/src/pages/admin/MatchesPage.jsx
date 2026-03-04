/**
 * src/pages/admin/MatchesPage.jsx
 * Admin: Manage Matches — schedule, change status, update score (+ WS broadcast).
 */
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiZap, FiCheckCircle, FiRefreshCw } from 'react-icons/fi'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import { matchService, teamService, tournamentService } from '../../api/services'

const STATUS_BADGE = { upcoming: 'badge-gold', live: 'badge-red', completed: 'badge-green', cancelled: 'badge-purple' }

export default function MatchesPage({ onScoreUpdate }) {
    const [matches, setMatches] = useState([])
    const [teams, setTeams] = useState([])
    const [tournaments, setTournaments] = useState([])
    const [loading, setLoading] = useState(true)
    const [createOpen, setCreateOpen] = useState(false)
    const [scoreOpen, setScoreOpen] = useState(false)
    const [selectedMatch, setSelectedMatch] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [page, setPage] = useState(1)
    const [totalMatches, setTotalMatches] = useState(0)

    const [matchForm, setMatchForm] = useState({ tournament_id: '', team1_id: '', team2_id: '', scheduled_date: '' })
    const [scoreForm, setScoreForm] = useState({ team_id: '', runs: 0, wickets: 0, overs: 0, extras: 0 })

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [matchRes, teamRes, tourneyRes] = await Promise.all([
                matchService.getAll({ page, limit: 10 }),
                teamService.getAll(),
                tournamentService.getAll(),
            ])
            setMatches(matchRes.data.data || [])
            setTotalMatches(matchRes.data.pagination?.total || 0)
            setTeams(teamRes.data.data || [])
            setTournaments(tourneyRes.data.data || [])
        } catch (err) {
            toast.error('Failed to load match data')
        } finally {
            setLoading(false)
        }
    }, [page])

    useEffect(() => { load() }, [load])

    const handleCreateMatch = async (e) => {
        e.preventDefault()
        if (!matchForm.team1_id || !matchForm.team2_id) return toast.error('Both teams are required')
        if (matchForm.team1_id === matchForm.team2_id) return toast.error('Teams must be different')
        setSubmitting(true)
        try {
            await matchService.create(matchForm)
            toast.success('Match scheduled!')
            setCreateOpen(false)
            setMatchForm({ tournament_id: '', team1_id: '', team2_id: '', scheduled_date: '' })
            load()
        } catch (err) {
            toast.error(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Failed to schedule match')
        } finally {
            setSubmitting(false)
        }
    }

    const handleStatusChange = async (match, status) => {
        try {
            await matchService.updateStatus(match.id, { status })
            toast.success(`Match is now "${status}"`)
            load()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Status update failed')
        }
    }

    const openScore = (match) => {
        setSelectedMatch(match)
        setScoreForm({ team_id: match.team1_id || '', runs: 0, wickets: 0, overs: 0, extras: 0 })
        setScoreOpen(true)
    }

    const handleScoreUpdate = async (e) => {
        e.preventDefault()
        if (!scoreForm.team_id) return toast.error('Select a team')
        setSubmitting(true)
        try {
            await matchService.updateScore(selectedMatch.id, {
                team_id: parseInt(scoreForm.team_id),
                runs: parseInt(scoreForm.runs),
                wickets: parseInt(scoreForm.wickets),
                overs: parseFloat(scoreForm.overs),
                extras: parseInt(scoreForm.extras || 0),
            })
            toast.success('⚡ Score updated & broadcast via WebSocket!')
            setScoreOpen(false)
            onScoreUpdate?.()
            load()
        } catch (err) {
            toast.error(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Score update failed')
        } finally {
            setSubmitting(false)
        }
    }

    const mf = e => setMatchForm(f => ({ ...f, [e.target.name]: e.target.value }))
    const sf = e => setScoreForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const teamOptions = teams.map(t => ({ value: t.id, label: t.name }))
    const tourneyOptions = tournaments.map(t => ({ value: t.id, label: `${t.name} (${t.year})` }))

    const columns = [
        { key: 'team1_name', label: 'Match', render: (v, row) => <strong>{v} vs {row.team2_name}</strong> },
        { key: 'tournament_name', label: 'Tournament', render: v => v || <span className="text-muted">—</span> },
        { key: 'status', label: 'Status', render: v => <span className={`badge ${STATUS_BADGE[v] || 'badge-gold'}`}>{v}</span> },
        {
            key: 'scheduled_date', label: 'Scheduled',
            render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
        },
        {
            key: 'id', label: 'Actions',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {row.status === 'upcoming' && (
                        <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--clr-red)', border: '1px solid rgba(239,68,68,0.3)' }}
                            onClick={() => handleStatusChange(row, 'live')}>
                            <FiZap /> Go Live
                        </button>
                    )}
                    {row.status === 'live' && (
                        <>
                            <button className="btn btn-primary btn-sm" onClick={() => openScore(row)}>
                                <FiEdit2 /> Score
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(row, 'completed')}>
                                <FiCheckCircle /> End
                            </button>
                        </>
                    )}
                    {row.status === 'upcoming' && (
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-text-muted)' }}
                            onClick={() => handleStatusChange(row, 'cancelled')}>
                            Cancel
                        </button>
                    )}
                </div>
            )
        },
    ]

    const totalPages = Math.ceil(totalMatches / 10)

    return (
        <div>
            <div className="section-header mb-2">
                <div>
                    <h3>Matches <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>{totalMatches}</span></h3>
                    <p className="text-muted text-sm">Schedule matches and manage live scores.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={load}><FiRefreshCw /></button>
                    <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}><FiPlus /> Schedule Match</button>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <Table columns={columns} rows={matches} loading={loading} emptyText="No matches yet. Schedule one!" />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    <span style={{ padding: '0.4rem 0.75rem', color: 'var(--clr-text-muted)' }}>Page {page} / {totalPages}</span>
                    <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
            )}

            {/* Schedule Match Modal */}
            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="📅 Schedule Match" size="lg">
                <form onSubmit={handleCreateMatch}>
                    <div className="grid-2" style={{ gap: '1rem' }}>
                        <FormField label="Tournament" name="tournament_id" type="select" value={matchForm.tournament_id} onChange={mf} options={tourneyOptions} hint="Optional" />
                        <FormField label="Date & Time" name="scheduled_date" type="datetime-local" value={matchForm.scheduled_date} onChange={mf} />
                        <FormField label="Team 1 *" name="team1_id" type="select" value={matchForm.team1_id} onChange={mf} options={teamOptions} required />
                        <FormField label="Team 2 *" name="team2_id" type="select" value={matchForm.team2_id} onChange={mf} options={teamOptions} required />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Scheduling…' : 'Schedule'}</button>
                        <button type="button" className="btn btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
                    </div>
                </form>
            </Modal>

            {/* Score Update Modal */}
            <Modal open={scoreOpen} onClose={() => setScoreOpen(false)} title="🏏 Update Live Score" size="md">
                <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>
                    {selectedMatch?.team1_name} vs {selectedMatch?.team2_name}
                </p>
                <form onSubmit={handleScoreUpdate}>
                    <FormField
                        label="Batting Team *" name="team_id" type="select"
                        value={scoreForm.team_id} onChange={sf} required
                        options={[
                            { value: selectedMatch?.team1_id, label: selectedMatch?.team1_name },
                            { value: selectedMatch?.team2_id, label: selectedMatch?.team2_name },
                        ].filter(o => o.value)}
                    />
                    <div className="grid-2" style={{ gap: '1rem' }}>
                        <FormField label="Runs *" name="runs" type="number" value={scoreForm.runs} onChange={sf} min={0} required />
                        <FormField label="Wickets *" name="wickets" type="number" value={scoreForm.wickets} onChange={sf} min={0} max={10} required />
                        <FormField label="Overs *" name="overs" type="number" value={scoreForm.overs} onChange={sf} min={0} step={0.1} required />
                        <FormField label="Extras" name="extras" type="number" value={scoreForm.extras} onChange={sf} min={0} />
                    </div>
                    <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '1rem' }} disabled={submitting}>
                        {submitting ? 'Broadcasting…' : '⚡ Update & Broadcast via WebSocket'}
                    </button>
                </form>
            </Modal>
        </div>
    )
}
