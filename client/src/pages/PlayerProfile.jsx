import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../context/AuthContext'
import { playerService } from '../api/services'
import toast from 'react-hot-toast'
import { FiUpload, FiEdit2, FiSave } from 'react-icons/fi'
import { GiCricketBat } from 'react-icons/gi'
import Skeleton from '../components/Skeleton'

export default function PlayerProfile() {
    const { id } = useParams()
    const { user } = useAuth()
    const [player, setPlayer] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({ name: '', email: '' })
    const [photo, setPhoto] = useState(null)
    const profileRef = useRef(null)
    const statsRef = useRef(null)

    const isOwn = String(user?.id) === String(id)
    const canEdit = isOwn || user?.role === 'admin'

    useEffect(() => {
        const fetchPlayer = async () => {
            try {
                const res = await playerService.getById(id)
                const p = res.data.data
                if (p) {
                    setPlayer(p)
                    setForm({ name: p.name, email: p.email })
                }
            } catch (err) {
                console.error('Player fetch error:', err)
                toast.error('Could not load profile')
            } finally {
                setLoading(false)
            }
        }
        fetchPlayer()
    }, [id])

    useEffect(() => {
        if (loading) return
        const tl = gsap.timeline()
        tl.fromTo(profileRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
        if (statsRef.current) {
            tl.fromTo([...statsRef.current.children],
                { y: 30, opacity: 0, scale: 0.9 },
                { y: 0, opacity: 1, scale: 1, stagger: 0.1, ease: 'back.out(1.4)', duration: 0.4 }, '-=0.2'
            )
        }
    }, [loading])

    const handleSave = async () => {
        try {
            await playerService.update(id, form)
            setPlayer(p => ({ ...p, ...form }))
            toast.success('Profile updated!')
            setEditing(false)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed')
        }
    }

    if (loading) return <div className="page-wrapper"><Skeleton type="profile" /></div>

    const STAT_ITEMS = [
        { label: 'Runs', value: player?.runs ?? 0, icon: <GiCricketBat />, color: 'var(--clr-green)' },
        { label: 'Wickets', value: player?.wickets ?? 0, icon: '⚡', color: 'var(--clr-gold)' },
        { label: 'Matches', value: player?.matches_played ?? 0, icon: '📅', color: 'var(--clr-blue)' },
        { label: 'Batting Avg', value: player?.batting_avg ?? '–', icon: '📊', color: 'var(--clr-purple)' },
        { label: 'Strike Rate', value: player?.strike_rate ?? '–', icon: '⚡', color: 'var(--clr-red)' },
        { label: 'Economy', value: player?.economy ?? '–', icon: '🎯', color: 'var(--clr-gold)' },
    ]

    return (
        <div className="page-wrapper">
            {/* Profile Header */}
            <div ref={profileRef} className="card mb-2">
                <div className="profile-header">
                    <div className="profile-avatar-wrap">
                        <div className="avatar avatar-xl">
                            {player?.photo_url ? <img src={player.photo_url} alt={player.name} /> : player?.name?.charAt(0)}
                        </div>
                        {canEdit && (
                            <label className="avatar-upload-btn" title="Change photo">
                                <FiUpload size={14} />
                                <input type="file" accept="image/*" hidden
                                    onChange={e => { setPhoto(e.target.files[0]); setEditing(true) }} />
                            </label>
                        )}
                    </div>
                    <div className="profile-info">
                        {editing ? (
                            <div className="form-group">
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    style={{ fontSize: '1.4rem', fontWeight: 700, background: 'rgba(34,197,94,0.06)' }} />
                            </div>
                        ) : (
                            <h2>{player?.name}</h2>
                        )}
                        <p className="text-muted">{player?.email}</p>
                        <div className="flex gap-1 mt-1">
                            <span className="badge badge-blue">{player?.role || 'All-Rounder'}</span>
                            <span className="badge badge-green">{player?.team_name || 'Free Agent'}</span>
                        </div>
                    </div>
                    {canEdit && (
                        <div style={{ marginLeft: 'auto' }}>
                            {editing ? (
                                <button className="btn btn-primary btn-sm" onClick={handleSave}>
                                    <FiSave /> Save
                                </button>
                            ) : (
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                                    <FiEdit2 /> Edit
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div ref={statsRef} className="grid-3">
                {STAT_ITEMS.map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <style>{`
        .profile-header { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
        .profile-avatar-wrap { position: relative; }
        .avatar-upload-btn {
          position: absolute; bottom: 0; right: 0;
          width: 28px; height: 28px;
          background: var(--grad-green);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: white; cursor: pointer; font-size: 0.75rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .profile-info { flex: 1; }
        .profile-info h2 { margin-bottom: 0.25rem; }
      `}</style>
        </div>
    )
}

const DUMMY_PLAYER = {
    id: 1, name: 'Virat Kohli', email: 'virat@rcb.in',
    role: 'batsman', team_name: 'Royal Challengers',
    runs: 892, wickets: 0, matches_played: 14,
    batting_avg: 63.7, strike_rate: 142.5, economy: null,
}
