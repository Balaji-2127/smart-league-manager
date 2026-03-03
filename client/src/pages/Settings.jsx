import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { FiSave, FiLock } from 'react-icons/fi'

export default function Settings() {
    const { user, login, token } = useAuth()
    const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' })
    const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
    const [loading, setLoading] = useState(false)
    const pageRef = useRef(null)

    useEffect(() => {
        gsap.fromTo(pageRef.current?.children ? [...pageRef.current.children] : [],
            { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out' }
        )
    }, [])

    const handleProfileSave = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await api.put(`/players/${user?.id}`, form)
            login({ ...user, name: form.name, email: form.email }, token)
            toast.success('Profile updated!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed')
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        if (passForm.newPassword !== passForm.confirm) {
            toast.error('Passwords do not match')
            return
        }
        setLoading(true)
        try {
            await api.put('/auth/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword })
            toast.success('Password changed!')
            setPassForm({ currentPassword: '', newPassword: '', confirm: '' })
        } catch (err) {
            toast.error(err.response?.data?.message || 'Password change failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <h1 className="page-title">⚙️ Settings</h1>
                <p className="page-subtitle">Manage your account preferences</p>
            </div>

            <div ref={pageRef} className="grid-2">
                {/* Profile Settings */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.25rem' }}>Profile Information</h3>
                    <form onSubmit={handleProfileSave}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label>Role</label>
                            <input value={user?.role} disabled style={{ opacity: 0.5 }} />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            <FiSave /> Save Changes
                        </button>
                    </form>
                </div>

                {/* Password Change */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.25rem' }}><FiLock style={{ marginRight: '0.4rem' }} />Change Password</h3>
                    <form onSubmit={handlePasswordChange}>
                        <div className="form-group">
                            <label>Current Password</label>
                            <input type="password" value={passForm.currentPassword}
                                onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input type="password" value={passForm.newPassword}
                                onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input type="password" value={passForm.confirm}
                                onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))} required />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            <FiLock /> Update Password
                        </button>
                    </form>
                </div>

                {/* App Info */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>About</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                            ['Platform', 'Smart League Manager'],
                            ['Version', '1.0.0'],
                            ['Environment', 'Development'],
                            ['Role', user?.role],
                            ['User ID', `#${user?.id}`],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between items-center">
                                <span className="text-muted text-sm">{k}</span>
                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Danger Zone (admin only) */}
                {user?.role === 'admin' && (
                    <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                        <h3 style={{ marginBottom: '0.5rem', color: 'var(--clr-red)' }}>⚠️ Danger Zone</h3>
                        <p className="text-muted text-sm mb-2">These actions are irreversible. Proceed with caution.</p>
                        <button className="btn btn-danger" onClick={() => toast.error('This would clear cached data in production.')}>
                            Clear Cache
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
