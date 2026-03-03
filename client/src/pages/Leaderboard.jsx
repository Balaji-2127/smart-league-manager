import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import api from '../api/axios'
import { FiTrendingUp } from 'react-icons/fi'
import { GiCricketBat } from 'react-icons/gi'
import Skeleton from '../components/Skeleton'

const TABS = ['Teams', 'Batsmen', 'Bowlers']

export default function Leaderboard() {
    const [activeTab, setActiveTab] = useState('Teams')
    const [teams, setTeams] = useState([])
    const [batsmen, setBatsmen] = useState([])
    const [bowlers, setBowlers] = useState([])
    const [loading, setLoading] = useState(true)
    const listRef = useRef(null)
    const headerRef = useRef(null)

    useEffect(() => {
        gsap.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
        Promise.all([
            api.get('/leaderboard/teams').catch(() => ({ data: { teams: DUMMY_TEAMS } })),
            api.get('/leaderboard/batsmen').catch(() => ({ data: { batsmen: DUMMY_BATSMEN } })),
            api.get('/leaderboard/bowlers').catch(() => ({ data: { bowlers: DUMMY_BOWLERS } })),
        ]).then(([t, b, bw]) => {
            setTeams(t.data.teams || DUMMY_TEAMS)
            setBatsmen(b.data.batsmen || DUMMY_BATSMEN)
            setBowlers(bw.data.bowlers || DUMMY_BOWLERS)
            setLoading(false)
        })
    }, [])

    useEffect(() => {
        if (!listRef.current) return
        const items = [...listRef.current.children]
        gsap.fromTo(items,
            { x: -30, opacity: 0 },
            { x: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: 'power2.out' }
        )
    }, [activeTab, loading])

    const currentData = activeTab === 'Teams' ? teams : activeTab === 'Batsmen' ? batsmen : bowlers

    return (
        <div className="page-wrapper">
            <div ref={headerRef} className="page-header">
                <div>
                    <h1 className="page-title">🏆 Leaderboard</h1>
                    <p className="page-subtitle">Live standings — updated after every match</p>
                </div>
                <FiTrendingUp size={32} style={{ color: 'var(--clr-green)' }} />
            </div>

            {/* Tabs */}
            <div className="lb-tabs">
                {TABS.map(tab => (
                    <button key={tab} className={`lb-tab ${activeTab === tab ? 'lb-tab-active' : ''}`} onClick={() => setActiveTab(tab)}>
                        {tab === 'Teams' ? '🏏' : tab === 'Batsmen' ? '🏏' : '⚡'} {tab}
                    </button>
                ))}
            </div>

            {loading ? <Skeleton type="table" /> : (
                <div className="card">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th width="50">#</th>
                                    {activeTab === 'Teams' ? (
                                        <>
                                            <th>Team</th>
                                            <th>Played</th>
                                            <th>Won</th>
                                            <th>Lost</th>
                                            <th>Points</th>
                                            <th>NRR</th>
                                        </>
                                    ) : (
                                        <>
                                            <th>Player</th>
                                            <th>Team</th>
                                            {activeTab === 'Batsmen' ? <><th>Runs</th><th>Avg</th><th>SR</th></> : <><th>Wickets</th><th>Avg</th><th>Economy</th></>}
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody ref={listRef}>
                                {currentData.map((item, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div className={`rank-badge rank-${i < 3 ? i + 1 : 'other'}`}>{i + 1}</div>
                                        </td>
                                        {activeTab === 'Teams' ? (
                                            <>
                                                <td><div className="flex items-center gap-1">
                                                    <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>{item.name?.charAt(0)}</div>
                                                    <strong>{item.name}</strong>
                                                </div></td>
                                                <td>{item.played}</td>
                                                <td><span className="text-green fw-bold">{item.won}</span></td>
                                                <td><span className="text-red">{item.lost}</span></td>
                                                <td><span className="badge badge-gold">{item.points} pts</span></td>
                                                <td className="text-muted">{item.nrr}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td><strong>{item.name}</strong></td>
                                                <td className="text-muted">{item.team}</td>
                                                {activeTab === 'Batsmen' ? (
                                                    <><td className="text-green fw-bold">{item.runs}</td><td>{item.avg}</td><td>{item.sr}</td></>
                                                ) : (
                                                    <><td className="text-green fw-bold">{item.wickets}</td><td>{item.avg}</td><td>{item.economy}</td></>
                                                )}
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <style>{`
        .lb-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; background: rgba(255,255,255,0.04); border-radius: 14px; padding: 0.3rem; width: fit-content; }
        .lb-tab { padding: 0.55rem 1.2rem; border-radius: 10px; border: none; background: transparent; color: #94a3b8; font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }
        .lb-tab-active { background: linear-gradient(135deg, #16a34a, #22c55e); color: white; box-shadow: 0 4px 12px rgba(34,197,94,0.35); }
      `}</style>
        </div>
    )
}

// Dummy data (replaced by real API)
const DUMMY_TEAMS = [
    { name: 'Royal Challengers', played: 10, won: 8, lost: 2, points: 16, nrr: '+1.24' },
    { name: 'Mumbai Titans', played: 10, won: 7, lost: 3, points: 14, nrr: '+0.87' },
    { name: 'Delhi Destroyers', played: 10, won: 6, lost: 4, points: 12, nrr: '+0.41' },
    { name: 'Chennai Lions', played: 10, won: 5, lost: 5, points: 10, nrr: '-0.12' },
    { name: 'Kolkata Knights', played: 10, won: 3, lost: 7, points: 6, nrr: '-0.78' },
    { name: 'Pune Warriors', played: 10, won: 1, lost: 9, points: 2, nrr: '-1.62' },
]
const DUMMY_BATSMEN = [
    { name: 'Virat Kohli', team: 'Royal Challengers', runs: 892, avg: 64.3, sr: 142.5 },
    { name: 'Rohit Sharma', team: 'Mumbai Titans', runs: 754, avg: 55.1, sr: 138.2 },
    { name: 'KL Rahul', team: 'Delhi Destroyers', runs: 680, avg: 48.6, sr: 132.0 },
    { name: 'Shreyas Iyer', team: 'Kolkata Knights', runs: 620, avg: 44.3, sr: 128.4 },
    { name: 'Suryakumar Y', team: 'Mumbai Titans', runs: 608, avg: 43.4, sr: 168.9 },
]
const DUMMY_BOWLERS = [
    { name: 'Jasprit Bumrah', team: 'Mumbai Titans', wickets: 24, avg: 14.2, economy: 6.1 },
    { name: 'Ravindra Jadeja', team: 'Chennai Lions', wickets: 21, avg: 16.8, economy: 6.8 },
    { name: 'Mohammed Shami', team: 'Delhi Destroyers', wickets: 19, avg: 18.3, economy: 7.2 },
    { name: 'Yuzvendra Chahal', team: 'Royal Challengers', wickets: 17, avg: 19.5, economy: 7.5 },
    { name: 'Rashid Khan', team: 'Pune Warriors', wickets: 16, avg: 20.1, economy: 6.4 },
]
