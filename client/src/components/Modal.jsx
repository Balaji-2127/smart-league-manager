/**
 * src/components/Modal.jsx
 * Reusable modal dialog with backdrop, animation, title and close button.
 */
import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
    // Close on Escape key
    useEffect(() => {
        if (!open) return
        const handler = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [open, onClose])

    if (!open) return null

    const maxWidths = { sm: '360px', md: '480px', lg: '640px', xl: '800px' }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                style={{ maxWidth: maxWidths[size] }}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    )
}
