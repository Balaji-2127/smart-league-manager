import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../context/AuthContext'
import { useWebSocket } from '../hooks/useWebSocket'
import { useQuery, useMutation, gql } from '@apollo/client'
import toast from 'react-hot-toast'
import { FiEdit2, FiSave } from 'react-icons/fi'

const GET_MATCH_DETAILS = gql`
  query GetMatchDetails($id: ID!) {
    match(id: $id) {
      id
      status
      scheduled_date
      tournament { name }
      team1 { id name }
      team2 { id name }
      score1 { runs wickets overs }
      score2 { runs wickets overs }
    }
  }
`

const UPDATE_SCORE = gql`
  mutation UpdateScore($matchId: ID!, $teamId: ID!, $runs: Int!, $wickets: Int!, $overs: Float!) {
    updateScore(match_id: $matchId, team_id: $teamId, runs: $runs, wickets: $wickets, overs: $overs) {
      runs
      wickets
      overs
    }
  }
`

export default function LiveScore() {
    const { id } = useParams()
    const { user } = useAuth()
    const { data, loading, error, refetch } = useQuery(GET_MATCH_DETAILS, { variables: { id } })
    const [updateScore] = useMutation(UPDATE_SCORE)

    const [editing, setEditing] = useState(false)
    const [scoreForm, setScoreForm] = useState({ teamId: '', runs: '', wickets: '', overs: '' })

    const scoreRef = useRef(null)
    const runRef1 = useRef(null)
    const runRef2 = useRef(null)

    const match = data?.match

    // WebSocket live updates
    const onMessage = useCallback((msg) => {
        if (msg.type === 'SCORE_UPDATE' && String(msg.match_id) === String(id)) {
            // Refetch to get latest consistent state
            refetch()
            toast.success('🏏 Score updated live!', { id: 'score-toast' })
        }
    }, [id, refetch])

    useWebSocket(onMessage)

    // Animate score when it changes
    useEffect(() => {
        if (!match) return
        gsap.fromTo(scoreRef.current,
            { scale: 1.05, filter: 'brightness(1.2)' },
            { scale: 1, filter: 'brightness(1)', duration: 0.6, ease: 'elastic.out(1.2, 0.5)' }
        )
    }, [match?.score1, match?.score2])

    const handleScoreUpdate = async () => {
        try {
            await updateScore({
                variables: {
                    matchId: id,
                    teamId: scoreForm.teamId,
                    runs: parseInt(scoreForm.runs),
                    wickets: parseInt(scoreForm.wickets),
                    overs: parseFloat(scoreForm.overs)
                }
            })
            setEditing(false)
            toast.success('Score updated and broadcasted!')
            // Local refetch (already handled by broadcast if lucky, but good for local)
            refetch()
        } catch (err) {
            toast.error(err.message || 'Failed to update score')
        }
    }

    if (loading) return <div className="page-wrapper"><div className="spinner" /></div>
    if (error) return <div className="page-wrapper text-red">Error: {error.message}</div>
    if (!match) return <div className="page-wrapper">Match not found.</div>

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div className="flex items-center gap-2">
                    <div className="live-dot">{match.status.toUpperCase()}</div>
                    <h1 className="page-title" style={{ fontSize: '1.6rem' }}>
                        {match.team1?.name} vs {match.team2?.name}
                    </h1>
                </div>
                <p className="page-subtitle">{match.tournament?.name} • {new Date(match.scheduled_date).toLocaleDateString()}</p>
            </div>

            {/* Scoreboard */}
            <div ref={scoreRef} className="score-display" style={{ marginBottom: '2rem' }}>
                <div className="score-team">
                    <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                        {match.team1?.name}
                    </div>
                    <div className="score-runs">
                        <span ref={runRef1}>{match.score1?.runs || 0}</span>
                        <span style={{ fontSize: '1.8rem' }}>/{match.score1?.wickets || 0}</span>
                    </div>
                    <div className="score-wickets">{match.score1?.overs || '0.0'} overs</div>
                </div>

                <div className="score-vs">VS</div>

                <div className="score-team">
                    <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                        {match.team2?.name}
                    </div>
                    <div className="score-runs">
                        <span ref={runRef2}>{match.score2?.runs || 0}</span>
                        <span style={{ fontSize: '1.8rem' }}>/{match.score2?.wickets || 0}</span>
                    </div>
                    <div className="score-wickets">{match.score2?.overs || '0.0'} overs</div>
                </div>
            </div>

            {/* Admin Score Update Panel */}
            {user?.role === 'admin' && (
                <div className="card">
                    <div className="section-header">
                        <h3>Update Score</h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(v => !v)}>
                            <FiEdit2 /> {editing ? 'Cancel' : 'Edit'}
                        </button>
                    </div>
                    {editing && (
                        <div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Team</label>
                                    <select value={scoreForm.teamId} onChange={e => setScoreForm(f => ({ ...f, teamId: e.target.value }))}>
                                        <option value="">Select team…</option>
                                        <option value={match.team1?.id}>{match.team1?.name}</option>
                                        <option value={match.team2?.id}>{match.team2?.name}</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Runs</label>
                                    <input type="number" placeholder="e.g. 142" value={scoreForm.runs}
                                        onChange={e => setScoreForm(f => ({ ...f, runs: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label>Wickets</label>
                                    <input type="number" placeholder="e.g. 6" min="0" max="10" value={scoreForm.wickets}
                                        onChange={e => setScoreForm(f => ({ ...f, wickets: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label>Overs</label>
                                    <input type="text" placeholder="e.g. 18.3" value={scoreForm.overs}
                                        onChange={e => setScoreForm(f => ({ ...f, overs: e.target.value }))} />
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={handleScoreUpdate}>
                                <FiSave /> Update & Broadcast
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Final Polish: Live Feed Placeholder */}
            <div className="card mt-2">
                <h3 style={{ marginBottom: '1rem' }}>📡 Live Feed</h3>
                <div className="live-feed">
                    <div className="feed-item">
                        <span className="feed-over">18.3</span>
                        <span className="feed-text">FOUR! Driven through covers — beautiful timing!</span>
                    </div>
                    <div className="feed-item">
                        <span className="feed-over">18.2</span>
                        <span className="feed-text">Dot ball. Good length delivery, played back.</span>
                    </div>
                    <div className="feed-item">
                        <span className="feed-over">18.1</span>
                        <span className="feed-text">SIX! Over mid-wicket for a maximum!</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
