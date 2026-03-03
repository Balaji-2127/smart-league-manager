import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../context/AuthContext'
import {
    FiHome, FiAward, FiCalendar, FiZap, FiBarChart2,
    FiUsers, FiUser, FiSettings, FiLogOut, FiMenu, FiX
} from 'react-icons/fi'
import { GiCricketBat } from 'react-icons/gi'
import './Navbar.css'

const roleLabel = { admin: 'Admin', captain: 'Captain', player: 'Player', viewer: 'Viewer' }
const roleBadge = { admin: 'badge-red', captain: 'badge-gold', player: 'badge-blue', viewer: 'badge-purple' }

const navLinks = [
    { to: '/dashboard', icon: <FiHome />, label: 'Dashboard', roles: null },
    { to: '/tournaments', icon: <FiAward />, label: 'Tournaments', roles: null },
    { to: '/matches', icon: <FiCalendar />, label: 'Matches', roles: null },
    { to: '/leaderboard', icon: <FiBarChart2 />, label: 'Leaderboard', roles: null },
    { to: '/teams', icon: <FiUsers />, label: 'My Team', roles: ['admin', 'captain'] },
    { to: '/settings', icon: <FiSettings />, label: 'Settings', roles: null },
]

export default function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [mobileOpen, setMobileOpen] = useState(false)
    const navRef = useRef(null)
    const itemsRef = useRef([])

    useEffect(() => {
        gsap.fromTo(navRef.current,
            { x: -280, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
        )
        gsap.fromTo(itemsRef.current,
            { x: -30, opacity: 0 },
            { x: 0, opacity: 1, stagger: 0.06, delay: 0.3, duration: 0.4, ease: 'power2.out' }
        )
    }, [])

    const handleLogout = () => {
        gsap.to(navRef.current, {
            x: -280, opacity: 0, duration: 0.4, onComplete: () => {
                logout()
                navigate('/login')
            }
        })
    }

    const filteredLinks = navLinks.filter(l => !l.roles || l.roles.includes(user?.role))

    return (
        <>
            {/* Mobile Hamburger */}
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(v => !v)}>
                {mobileOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* Overlay */}
            {mobileOpen && <div className="nav-overlay" onClick={() => setMobileOpen(false)} />}

            <nav ref={navRef} className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="logo-icon"><GiCricketBat size={22} /></div>
                    <div>
                        <div className="logo-title">Smart League</div>
                        <div className="logo-sub">Manager</div>
                    </div>
                </div>

                {/* User card */}
                <div className="sidebar-user">
                    <div className="avatar">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                        <div className="user-name">{user?.name}</div>
                        <span className={`badge ${roleBadge[user?.role]}`}>{roleLabel[user?.role]}</span>
                    </div>
                </div>

                {/* Links */}
                <nav className="sidebar-links">
                    <div className="links-label">Navigation</div>
                    {filteredLinks.map((link, i) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            ref={el => itemsRef.current[i] = el}
                            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <span className="nav-icon">{link.icon}</span>
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom */}
                <div className="sidebar-bottom">
                    <NavLink to={`/profile/${user?.id}`} className="nav-link" onClick={() => setMobileOpen(false)}>
                        <span className="nav-icon"><FiUser /></span>
                        My Profile
                    </NavLink>
                    <button className="nav-link nav-logout" onClick={handleLogout}>
                        <span className="nav-icon"><FiLogOut /></span>
                        Sign Out
                    </button>
                </div>
            </nav>
        </>
    )
}
