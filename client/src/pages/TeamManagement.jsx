import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { FiPlus, FiTrash2, FiUpload } from 'react-icons/fi'
import Skeleton from '../components/Skeleton'

export default function TeamManagement() {
    const { user } = useAuth()
    const [team, setTeam] = useState(null)
    const [players, setPlayers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [showAddPlayer, setShowAddPlayer] = useState(false)
    const [teamForm, setTeamForm] = useState({ name: '' })
    const [playerForm, setPlayerForm] = useState({ email: '', role: 'batsman' })
    const [logo, setLogo] = useState(null)
    const headerRef = useRef(null)
    const contentRef = useRef(null)

    useEffect(() => {
        gsap.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
        fetchTeam()
    }, [])

    const fetchTeam = () => {
        // If captain, load their team; if admin, load all teams
        const endpoint = user?.role === 'admin' ? '/teams' : '/teams/my'
        api.get(endpoint)
            .then(res => {
                const data = res.data
                if (Array.isArray(data.teams)) {
                    setTeam(data.teams[0] || null)
                    setPlayers(data.teams[0]?.players || [])
                } else {
                    setTeam(data.team || null)
                    setPlayers(data.players || [])
                }
            })
            .catch(() => {
                // Use dummy data
                setTeam(DUMMY_TEAM)
                setPlayers(DUMMY_PLAYERS)
            })
            .finally(() => setLoading(false))
    }

    const handleCreateTeam = async (e) => {
        e.preventDefault()
        try {
            const fd = new FormData()
            fd.append('name', teamForm.name)
            if (logo) fd.append('logo', logo)
            const { data } = await api.post('/teams', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            setTeam(data.team)
            toast.success('Team created! 🏏')
            setShowCreate(false)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create team')
        }
    }

    const handleAddPlayer = async (e) => {
        e.preventDefault()
        try {
            const { data } = await api.post(`/teams/${team?.id}/add-player`, playerForm)
            setPlayers(prev => [...prev, data.player])
            toast.success('Player added!')
            setPlayerForm({ email: '', role: 'batsman' })
            setShowAddPlayer(false)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add player')
        }
    }

    const handleRemovePlayer = async (playerId) => {
        if (!confirm('Remove this player from the team?')) return
        try {
            await api.delete(`/teams/${team?.id}/players/${playerId}`)
            setPlayers(prev => prev.filter(p => p.id !== playerId))
            toast.success('Player removed.')
        } catch {
            toast.error('Failed to remove player')
        }
    }

    if (loading) return <div className="page-wrapper"><Skeleton type="cards" /></div>

    return (
        <div className="page-wrapper">
            <div ref={headerRef} className="section-header page-header">
                <div>
                    <h1 className="page-title">👥 Team Management</h1>
                    <p className="page-subtitle">Manage your squad and roster</p>
                </div>
                {!team && user?.role === 'captain' && (
                    <button className="btn btn-primary" onClick={() => setShowCreate(v => !v)}>
                        <FiPlus /> Create Team
                    </button>
                )}
            </div>

            {/* Create Team Form */}
            {showCreate && (
                <div className="card mb-2">
                    <h3 style={{ marginBottom: '1.25rem' }}>Create Your Team</h3>
                    <form onSubmit={handleCreateTeam}>
                        <div className="form-group">
                            <label>Team Name</label>
                            <input placeholder="e.g. Royal Challengers" value={teamForm.name}
                                onChange={e => setTeamForm({ name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Team Logo (optional)</label>
                            <div className="upload-box" onClick={() => document.getElementById('logo-input').click()}>
                                <FiUpload size={24} style={{ color: 'var(--clr-text-muted)' }} />
                                <span className="text-muted">{logo ? logo.name : 'Click to upload PNG/JPG'}</span>
                            </div>
                            <input id="logo-input" type="file" accept="image/*" hidden
                                onChange={e => setLogo(e.target.files[0])} />
                        </div>
                        <button type="submit" className="btn btn-primary">Create Team</button>
                    </form>
                </div>
            )}

            {/* Team Info */}
            {team ? (
                <div ref={contentRef}>
                    <div className="card mb-2">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="avatar avatar-lg" style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)' }}>
                                {team.logo_url ? <img src={team.logo_url} alt="logo" /> : team.name?.charAt(0)}
                            </div>
                            <div>
                                <h2>{team.name}</h2>
                                <p className="text-muted text-sm">Captain: {team.captain_name || user?.name} • {players.length} players</p>
                            </div>
                        </div>
                        {user?.role !== 'viewer' && (
                            <button className="btn btn-primary btn-sm" onClick={() => setShowAddPlayer(v => !v)}>
                                <FiPlus /> Add Player
                            </button>
                        )}
                    </div>

                    {/* Add Player Form */}
                    {showAddPlayer && (
                        <div className="card mb-2">
                            <h4 style={{ marginBottom: '1rem' }}>Add Player</h4>
                            <form onSubmit={handleAddPlayer}>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Player Email</label>
                                        <input type="email" placeholder="player@email.com" value={playerForm.email}
                                            onChange={e => setPlayerForm(f => ({ ...f, email: e.target.value }))} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Role</label>
                                        <select value={playerForm.role} onChange={e => setPlayerForm(f => ({ ...f, role: e.target.value }))}>
                                            <option value="batsman">Batsman</option>
                                            <option value="bowler">Bowler</option>
                                            <option value="all-rounder">All-Rounder</option>
                                            <option value="wicket-keeper">Wicket Keeper</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary">Add to Team</button>
                            </form>
                        </div>
                    )}

                    {/* Players List */}
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem' }}>Squad ({players.length})</h3>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Player</th>
                                        <th>Role</th>
                                        <th>Runs</th>
                                        <th>Wickets</th>
                                        <th>Matches</th>
                                        {(user?.role === 'admin' || user?.role === 'captain') && <th>Action</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map((p, i) => (
                                        <tr key={p.id}>
                                            <td>{i + 1}</td>
                                            <td>
                                                <div className="flex items-center gap-1">
                                                    <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>
                                                        {p.photo_url ? <img src={p.photo_url} alt={p.name} /> : p.name?.charAt(0)}
                                                    </div>
                                                    <strong>{p.name}</strong>
                                                </div>
                                            </td>
                                            <td><span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>{p.role}</span></td>
                                            <td className="text-green">{p.runs ?? 0}</td>
                                            <td>{p.wickets ?? 0}</td>
                                            <td className="text-muted">{p.matches_played ?? 0}</td>
                                            {(user?.role === 'admin' || user?.role === 'captain') && (
                                                <td>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleRemovePlayer(p.id)}>
                                                        <FiTrash2 />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏏</div>
                    <h3>No Team Yet</h3>
                    <p className="text-muted mt-1">
                        {user?.role === 'captain' ? "You haven't created a team. Click 'Create Team' to get started!" : 'No teams found on this platform yet.'}
                    </p>
                </div>
            )}

            <style>{`
        .upload-box { border: 2px dashed rgba(34,197,94,0.25); border-radius: 12px; padding: 2rem; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; cursor: pointer; transition: border-color 0.2s; }
        .upload-box:hover { border-color: rgba(34,197,94,0.5); }
      `}</style>
        </div>
    )
}

const DUMMY_TEAM = { id: 1, name: 'Royal Challengers', captain_name: 'Virat Kohli', logo_url: null }
const DUMMY_PLAYERS = [
    { id: 1, name: 'Virat Kohli', role: 'batsman', runs: 892, wickets: 0, matches_played: 14 },
    { id: 2, name: 'Glenn Maxwell', role: 'all-rounder', runs: 543, wickets: 8, matches_played: 14 },
    { id: 3, name: 'Mohammed Siraj', role: 'bowler', runs: 42, wickets: 19, matches_played: 14 },
    { id: 4, name: 'Faf du Plessis', role: 'batsman', runs: 412, wickets: 0, matches_played: 12 },
    { id: 5, name: 'Dinesh Karthik', role: 'wicket-keeper', runs: 287, wickets: 0, matches_played: 14 },
]
