/**
 * Skeleton – loading placeholder components
 * Usage: <Skeleton type="dashboard" /> | <Skeleton type="table" /> | <Skeleton type="cards" />
 */
export default function Skeleton({ type = 'cards', rows = 5 }) {
    if (type === 'dashboard') return (
        <div>
            <div className="skeleton skeleton-title" style={{ width: '40%', marginBottom: '0.5rem' }} />
            <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: '2rem' }} />
            <div className="grid-3" style={{ marginBottom: '2rem' }}>
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton skeleton-card" />
                ))}
            </div>
            <div className="grid-2">
                <div className="skeleton skeleton-card" style={{ height: 200 }} />
                <div className="skeleton skeleton-card" style={{ height: 200 }} />
            </div>
        </div>
    )

    if (type === 'table') return (
        <div className="card">
            <div className="skeleton skeleton-title" style={{ width: '30%', marginBottom: '1.5rem' }} />
            {[...Array(rows)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: '0.4rem' }} />
                        <div className="skeleton skeleton-text" style={{ width: '40%', height: 10 }} />
                    </div>
                    <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 6 }} />
                </div>
            ))}
        </div>
    )

    if (type === 'profile') return (
        <div>
            <div className="card mb-2">
                <div className="flex gap-2 items-center">
                    <div className="skeleton" style={{ width: 96, height: 96, borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div className="skeleton skeleton-title" style={{ width: '50%', marginBottom: '0.5rem' }} />
                        <div className="skeleton skeleton-text" style={{ width: '70%' }} />
                    </div>
                </div>
            </div>
            <div className="grid-3">
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton skeleton-card" style={{ height: 100 }} />)}
            </div>
        </div>
    )

    if (type === 'list') return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)' }} />
            ))}
        </div>
    )

    // Default: cards
    return (
        <div className="grid-2">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton skeleton-card" style={{ height: 160 }} />
            ))}
        </div>
    )
}
