/**
 * src/api/services.js
 * Centralized API service layer — every function calls the backend REST API.
 * JWT is automatically attached by the axios interceptor (axios.js).
 *
 * Future compatibility:
 *  - GraphQL queries can be mixed in via apollo.js
 *  - WebSocket updates can be layered on top of REST fetch results
 */

import api from './axios'

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authService = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
}

// ─── TEAMS ────────────────────────────────────────────────────────────────────
export const teamService = {
    getAll: () => api.get('/teams'),
    getById: (id) => api.get(`/teams/${id}`),
    create: (data) => api.post('/teams', data),
    addPlayer: (teamId, data) => api.post(`/teams/${teamId}/players`, data),
}

// ─── TOURNAMENTS ──────────────────────────────────────────────────────────────
export const tournamentService = {
    getAll: (params) => api.get('/tournaments', { params }),
    getById: (id) => api.get(`/tournaments/${id}`),
    create: (data) => api.post('/tournaments', data),
    updateStatus: (id, status) => api.put(`/tournaments/${id}`, { status }),
}

// ─── MATCHES ──────────────────────────────────────────────────────────────────
export const matchService = {
    getAll: (params) => api.get('/matches', { params }),
    getById: (id) => api.get(`/matches/${id}`),
    create: (data) => api.post('/matches', data),
    updateStatus: (id, data) => api.put(`/matches/${id}`, data),
    updateScore: (id, data) => api.put(`/matches/${id}/score`, data),
}

// ─── PLAYERS ──────────────────────────────────────────────────────────────────
export const playerService = {
    getAll: (params) => api.get('/players', { params }),
    getById: (id) => api.get(`/players/${id}`),
    update: (id, data) => api.put(`/players/${id}`, data),
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
export const leaderboardService = {
    get: () => api.get('/leaderboard'),
}
