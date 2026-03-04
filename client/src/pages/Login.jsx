import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { GiCricketBat } from 'react-icons/gi'
import ThreeBackground from '../components/ThreeBackground'
import './Login.css'

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [isRegister, setIsRegister] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' })

    const cardRef = useRef(null)
    const logoRef = useRef(null)
    const formRef = useRef(null)

    useEffect(() => {
        const tl = gsap.timeline()
        tl.fromTo(logoRef.current, { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' })
        tl.fromTo(cardRef.current, { y: 40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }, '-=0.3')
        tl.fromTo(formRef.current?.children ? [...formRef.current.children] : [],
            { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, ease: 'power2.out' }, '-=0.2'
        )
    }, [])

    const toggleMode = () => {
        gsap.to(cardRef.current, {
            rotateY: 90, duration: 0.25, ease: 'power2.in',
            onComplete: () => {
                setIsRegister(v => !v)
                gsap.fromTo(cardRef.current, { rotateY: -90 }, { rotateY: 0, duration: 0.35, ease: 'power2.out' })
            }
        })
    }

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login'
            const payload = isRegister ? form : { email: form.email, password: form.password }
            const { data } = await api.post(endpoint, payload)
            login(data.user, data.token)
            toast.success(`Welcome${isRegister ? '' : ' back'}, ${data.user.name}! 🏏`)
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <ThreeBackground />
            <div className="login-container">
                <div ref={logoRef} className="login-logo">
                    <div className="login-logo-icon"><GiCricketBat size={28} /></div>
                    <div>
                        <h1 className="login-brand">Smart League Manager</h1>
                        <p className="login-tagline">Cricket League Platform · Real-time · Premium</p>
                    </div>
                </div>

                <div ref={cardRef} className="login-card">
                    <div className="login-tabs">
                        <button className={`login-tab ${!isRegister ? 'active' : ''}`} onClick={() => !isRegister || toggleMode()}>
                            Sign In
                        </button>
                        <button className={`login-tab ${isRegister ? 'active' : ''}`} onClick={() => isRegister || toggleMode()}>
                            Register
                        </button>
                    </div>

                    <form ref={formRef} onSubmit={handleSubmit}>
                        {isRegister && (
                            <div className="form-group">
                                <label>Full Name</label>
                                <input name="name" placeholder="Your full name" value={form.name} onChange={handleChange} required />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Email Address</label>
                            <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <div className="pass-wrap">
                                <input
                                    name="password"
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Enter password"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button type="button" className="pass-toggle" onClick={() => setShowPass(v => !v)}>
                                    {showPass ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>
                        {isRegister && (
                            <div className="form-group">
                                <label>Join As</label>
                                <select name="role" value={form.role} onChange={handleChange}>
                                    <option value="viewer">Viewer</option>
                                    <option value="player">Player</option>
                                    <option value="captain">Team Captain</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        )}
                        <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                            {loading ? 'Please wait…' : isRegister ? '🏏 Create Account' : 'Sign In →'}
                        </button>
                    </form>

                    {/* Demo accounts pill */}
                    <div className="demo-accounts">
                        <p className="text-muted text-xs">Demo: admin@slm.com / captain@slm.com / player@slm.com / viewer@slm.com — all passwords: <strong>password123</strong></p>
                    </div>
                </div>

                <div className="login-footer">
                    <p className="text-muted text-xs">Real-time · WebSockets · Secure JWT · RBAC Enforced</p>
                </div>
            </div>
        </div>
    )
}
