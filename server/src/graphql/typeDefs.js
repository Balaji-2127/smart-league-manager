/**
 * src/graphql/typeDefs.js
 * GraphQL type definitions for the Smart League Manager.
 */
'use strict'

const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    created_at: String
  }

  type Team {
    id: ID!
    name: String!
    captain: User
    logo_url: String
    created_at: String
    players: [Player]
  }

  type Player {
    id: ID!
    user: User!
    team: Team
    role: String
    photo_url: String
    runs: Int
    wickets: Int
    matches_played: Int
    batting_avg: Float
    strike_rate: Float
    economy: Float
  }

  type Tournament {
    id: ID!
    name: String!
    year: Int!
    status: String!
    created_at: String
  }

  type Match {
    id: ID!
    tournament: Tournament
    team1: Team!
    team2: Team!
    scheduled_date: String
    status: String!
    winner: Team
    score1: Score
    score2: Score
  }

  type Score {
    id: ID!
    match_id: ID!
    team: Team!
    runs: Int
    wickets: Int
    overs: Float
    extras: Int
    updated_at: String
  }

  type Stats {
    top_batsmen: [Player]
    top_bowlers: [Player]
    points_table: [TeamStats]
  }

  type TeamStats {
    team: Team!
    played: Int
    won: Int
    lost: Int
    points: Int
  }

  type Query {
    # Users
    me: User
    users: [User]
    
    # Teams
    teams: [Team]
    team(id: ID!): Team

    # Players
    players: [Player]
    player(id: ID!): Player

    # Tournaments
    tournaments: [Tournament]
    tournament(id: ID!): Tournament

    # Matches
    matches(tournament_id: ID, status: String): [Match]
    match(id: ID!): Match

    # Leaderboard
    leaderboard: Stats
  }

  type Mutation {
    # Teams
    createTeam(name: String!, captain_id: ID, logo_url: String): Team
    addPlayerToTeam(team_id: ID!, user_id: ID!, role: String): Player

    # Tournaments
    createTournament(name: String!, year: Int!): Tournament
    updateTournamentStatus(id: ID!, status: String!): Tournament

    # Matches
    createMatch(tournament_id: ID!, team1_id: ID!, team2_id: ID!, scheduled_date: String): Match
    updateMatchStatus(id: ID!, status: String!, winner_id: ID): Match

    # Scores
    updateScore(match_id: ID!, team_id: ID!, runs: Int!, wickets: Int!, overs: Float!, extras: Int): Score
  }
`

module.exports = typeDefs
