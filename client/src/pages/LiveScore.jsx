import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../context/AuthContext'
import { useWebSocket } from '../hooks/useWebSocket'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { FiEdit2, FiSave } from 'react-icons/fi'

export default function LiveScore() {
    const { id } = useParams()
    const { user } = useAuth()
    const [match, setMatch] = useState(null)
    const [score, setScore] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [scoreForm, setScoreForm] = useState({ team_id: '', runs: '', wickets: '', overs: '' })
    const scoreRef = useRef(null)
    const runRef = useRef(null)

    // Fetch initial data
    useEffect(() => {
        Promise.all([
            api.get(`/matches/${id}`).catch(() => ({ data: {} })),
            api.get(`/matches/${id}/score`).catch(() => ({ data: {} })),
        ]).then(([mRes, sRes]) => {
            setMatch(mRes.data?.match || null)
            setScore(sRes.data?.score || null)
            setLoading(false)
        })
    }, [id])

    // Animate score when it changes
    useEffect(() => {
        if (!score) return
        gsap.fromTo(scoreRef.current,
            { scale: 1.08, color: '#22c55e' },
            { scale: 1, color: '#22c55e', duration: 0.5, ease: 'elastic.out(1.2, 0.4)' }
        )
        // Number counter animation
        if (runRef.current) {
            const target = parseInt(score.runs) || 0
            gsap.fromTo({ val: 0 }, { val: target }, {
                duration: 0.8,
                ease: 'power2.out',
                onUpdate: function () {
                    if (runRef.current) runRef.current.textContent = Math.round(this.targets()[0].val)
                }
            })
        }
    }, [score])

    // WebSocket live updates
    const onMessage = useCallback((data) => {
        if (data.type === 'SCORE_UPDATE' && String(data.matchId) === String(id)) {
            setScore(data.score)
            toast.success('🏏 Score updated live!', { id: 'score-toast' })
        }
    }, [id])
    useWebSocket(onMessage)

    const handleScoreUpdate = async () => {
        try {
            const { data } = await api.post(`/matches/${id}/update-score`, scoreForm)
            setScore(data.score)
            setEditing(false)
            toast.success('Score updated and broadcasted!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update score')
        }
    }

    if (loading) return (
        <div className="page-wrapper">
            <div className="loading-screen" style={{ minHeight: '60vh' }}><div className="spinner" /></div>
        </div>
    )

    const team1Score = score?.team1 || { runs: 0, wickets: 0, overs: '0.0' }
    const team2Score = score?.team2 || { runs: 0, wickets: 0, overs: '0.0' }

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div className="flex items-center gap-2">
                    <div className="live-dot">LIVE</div>
                    <h1 className="page-title" style={{ fontSize: '1.6rem' }}>
                        {match?.team1_name || 'Team 1'} vs {match?.team2_name || 'Team 2'}
                    </h1>
                </div>
                <p className="page-subtitle">{match?.tournament_name} • {match?.scheduled_date ? new Date(match.scheduled_date).toLocaleDateString() : 'TBD'}</p>
            </div>

            {/* Scoreboard */}
            <div ref={scoreRef} className="score-display" style={{ marginBottom: '2rem' }}>
                <div className="score-team">
                    <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                        {match?.team1_name || 'Team 1'}
                    </div>
                    <div className="score-runs">
                        <span ref={runRef}>{team1Score.runs}</span>
                        <span style={{ fontSize: '1.8rem' }}>/{team1Score.wickets}</span>
                    </div>
                    <div className="score-wickets">{team1Score.overs} overs</div>
                </div>

                <div className="score-vs">VS</div>

                <div className="score-team">
                    <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                        {match?.team2_name || 'Team 2'}
                    </div>
                    <div className="score-runs">
                        {team2Score.runs}/{team2Score.wickets}
                    </div>
                    <div className="score-wickets">{team2Score.overs} overs</div>
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
                                    <select value={scoreForm.team_id} onChange={e => setScoreForm(f => ({ ...f, team_id: e.target.value }))}>
                                        <option value="">Select team…</option>
                                        <option value={match?.team1_id}>{match?.team1_name}</option>
                                        <option value={match?.team2_id}>{match?.team2_name}</option>
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

            {/* Commentary / Placeholder */}
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
