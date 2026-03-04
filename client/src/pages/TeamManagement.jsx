import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation, gql } from '@apollo/client'
import toast from 'react-hot-toast'
import { FiPlus, FiTrash2, FiUpload } from 'react-icons/fi'
import Skeleton from '../components/Skeleton'

const GET_MY_TEAM = gql`
  query GetMyTeam {
    teams {
      id
      name
      logo_url
      captain {
        id
        name
      }
      players {
        id
        role
        runs
        wickets
        matches_played
        user {
          name
        }
      }
    }
    users {
      id
      name
      email
    }
  }
`

const CREATE_TEAM = gql`
  mutation CreateTeam($name: String!, $captainId: ID!, $logoUrl: String) {
    createTeam(name: $name, captain_id: $captainId, logo_url: $logoUrl) {
      id
      name
    }
  }
`

const ADD_PLAYER = gql`
  mutation AddPlayer($teamId: ID!, $userId: ID!, $role: String!) {
    addPlayerToTeam(team_id: $teamId, user_id: $userId, role: $role) {
      id
      role
    }
  }
`

export default function TeamManagement() {
    const { user } = useAuth()
    const { data, loading, error, refetch } = useQuery(GET_MY_TEAM)
    const [createTeam] = useMutation(CREATE_TEAM)
    const [addPlayer] = useMutation(ADD_PLAYER)

    const [showCreate, setShowCreate] = useState(false)
    const [showAddPlayer, setShowAddPlayer] = useState(false)
    const [teamForm, setTeamForm] = useState({ name: '' })
    const [playerForm, setPlayerForm] = useState({ userId: '', role: 'batsman' })
    const [logo, setLogo] = useState(null)

    const headerRef = useRef(null)
    const contentRef = useRef(null)

    useEffect(() => {
        gsap.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
    }, [])

    const team = data?.teams?.find(t => t.captain?.id === user?.id) || data?.teams?.[0]
    const players = team?.players || []

    const handleCreateTeam = async (e) => {
        e.preventDefault()
        try {
            await createTeam({
                variables: {
                    name: teamForm.name,
                    captainId: user?.id,
                    logoUrl: null // Placeholder for now (REST handles actual file upload)
                }
            })
            toast.success('Team created! 🏏')
            setShowCreate(false)
            refetch()
        } catch (err) {
            toast.error(err.message || 'Failed to create team')
        }
    }

    const handleAddPlayer = async (e) => {
        e.preventDefault()
        try {
            await addPlayer({
                variables: {
                    teamId: team?.id,
                    userId: playerForm.userId,
                    role: playerForm.role
                }
            })
            toast.success('Player added!')
            setPlayerForm({ userId: '', role: 'batsman' })
            setShowAddPlayer(false)
            refetch()
        } catch (err) {
            toast.error(err.message || 'Failed to add player')
        }
    }

    if (loading) return <div className="page-wrapper"><Skeleton type="cards" /></div>
    if (error) return <div className="page-wrapper"><p className="text-red">Error loading teams: {error.message}</p></div>

    return (
        <div className="page-wrapper">
            <div ref={headerRef} className="section-header page-header">
                <div>
                    <h1 className="page-title">👥 Team Management</h1>
                    <p className="page-subtitle">Manage your squad and roster</p>
                </div>
                {!team && (user?.role === 'captain' || user?.role === 'admin') && (
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
                                <p className="text-muted text-sm">Captain: {team.captain?.name} • {players.length} players</p>
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
                                        <label>Select User</label>
                                        <select value={playerForm.userId} onChange={e => setPlayerForm(f => ({ ...f, userId: e.target.value }))} required>
                                            <option value="">-- Select Member --</option>
                                            {data?.users?.map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                            ))}
                                        </select>
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map((p, i) => (
                                        <tr key={p.id}>
                                            <td>{i + 1}</td>
                                            <td>
                                                <div className="flex items-center gap-1">
                                                    <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>
                                                        {p.user?.name?.charAt(0)}
                                                    </div>
                                                    <strong>{p.user?.name}</strong>
                                                </div>
                                            </td>
                                            <td><span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>{p.role}</span></td>
                                            <td className="text-green">{p.runs ?? 0}</td>
                                            <td>{p.wickets ?? 0}</td>
                                            <td className="text-muted">{p.matches_played ?? 0}</td>
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
                        {user?.role === 'captain' || user?.role === 'admin' ? "You haven't created a team. Click 'Create Team' to get started!" : 'No teams found on this platform yet.'}
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
