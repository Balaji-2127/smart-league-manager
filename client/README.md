# Smart League Manager – Client

A modern cricket league management platform built with **React + Vite**.  
Manage tournaments, teams, players, live scores, and leaderboards in real time.

> Last Updated: March 2026

## Features
- 🏏 Live score updates via WebSocket
- 📊 Leaderboard & player stats
- 🔐 Role-based access (Admin / Captain / Player / Viewer)
- ⚡ GraphQL + REST API integration

## CI/CD – Jenkins Pipeline
- 🔗 **GitHub Webhook** configured to trigger Jenkins on every `git push`
- 🛠️ Jenkins pipeline stages:
  1. **Clone Repository** – pulls latest code from GitHub
  2. **Install Backend Dependencies** – runs `npm install` in `/server`
  3. **Build Docker Image** – builds `smart-league-backend` Docker image
- Webhook URL: `http://<jenkins-host>:8080/github-webhook/`

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

Prometheus monitoring enabled
