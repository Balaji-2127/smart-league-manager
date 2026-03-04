/**
 * src/components/Table.jsx
 * Reusable data table with loading skeleton, empty state and optional search.
 */
import { useState } from 'react'

export default function Table({ columns = [], rows = [], loading = false, emptyText = 'No data found.', searchable = false }) {
    const [search, setSearch] = useState('')

    const filtered = searchable && search
        ? rows.filter(r => columns.some(c => String(r[c.key] ?? '').toLowerCase().includes(search.toLowerCase())))
        : rows

    if (loading) return (
        <div className="table-skeleton">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
        </div>
    )

    return (
        <div>
            {searchable && (
                <div className="table-search">
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="🔍 Search…"
                    />
                </div>
            )}
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? filtered.map((row, i) => (
                            <tr key={row.id ?? i}>
                                {columns.map(c => (
                                    <td key={c.key}>
                                        {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                                    </td>
                                ))}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--clr-text-muted)', padding: '2rem' }}>
                                    {emptyText}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
