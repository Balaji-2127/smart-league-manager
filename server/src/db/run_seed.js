const db = require('./pool');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('[SEED] Clearing database...');
        await db.query('TRUNCATE scores, matches, players, teams, tournaments, users RESTART IDENTITY CASCADE');

        console.log('[SEED] Creating Admin User...');
        const hash = await bcrypt.hash('password123', 12);
        await db.query(`INSERT INTO users (id, name, email, password_hash, role) VALUES (1, 'System Admin', 'admin@smartleague.com', $1, 'admin')`, [hash]);

        console.log('[SEED] Creating Tournament...');
        await db.query(`INSERT INTO tournaments (id, name, year, status) VALUES (1, 'National Cricket Premier League 2026', 2026, 'upcoming')`);

        console.log('[SEED] Inserting Teams and Captains...');
        // Users for captains
        await db.query(`INSERT INTO users (id, name, email, password_hash, role) VALUES 
            (2, 'Akash Rahane', 'akash@league.com', $1, 'captain'),
            (3, 'Anil Gowtham', 'anil@league.com', $1, 'captain'),
            (4, 'Basil Jadhav', 'basil@league.com', $1, 'captain'),
            (5, 'Arjun Rahul', 'arjun@league.com', $1, 'captain')
        `, [hash]);

        // Teams
        await db.query(`INSERT INTO teams (id, name, captain_id) VALUES 
            (1, 'Hyderabad Hawks', 2),
            (2, 'Bangalore Blasters', 3),
            (3, 'Chennai Chargers', 4),
            (4, 'Mumbai Mavericks', 5)
        `);

        console.log('[SEED] Inserting Players...');
        // Users for players
        await db.query(`INSERT INTO users (id, name, email, password_hash, role) VALUES 
            (6, 'Ishant Meredith', 'ishant@league.com', $1, 'player'),
            (7, 'Aryan Nair', 'aryan@league.com', $1, 'player'),
            (8, 'Riley Arora', 'riley@league.com', $1, 'player'),
            (9, 'Vijay Warrier', 'vijay@league.com', $1, 'player'),
            (10, 'Prasidh Markande', 'prasidh@league.com', $1, 'player'),
            (11, 'Shivam Sams', 'shivam@league.com', $1, 'player'),
            (12, 'Karun Nair', 'karun@league.com', $1, 'player'),
            (13, 'Ravi Singh', 'ravi@league.com', $1, 'player')
        `, [hash]);

        // Players for team 1 (Hyderabad Hawks) and team 2 (Bangalore Blasters)
        await db.query(`INSERT INTO players (user_id, team_id, role, runs, wickets, matches_played) VALUES 
            (2, 1, 'batsman', 419, 0, 12),
            (6, 1, 'wicket-keeper', 446, 7, 9),
            (7, 1, 'wicket-keeper', 454, 10, 8),
            (8, 1, 'batsman', 10, 11, 9),
            (3, 2, 'batsman', 55, 14, 11),
            (9, 2, 'wicket-keeper', 25, 11, 5),
            (10, 2, 'batsman', 211, 8, 11),
            (11, 2, 'all-rounder', 165, 11, 14),
            (4, 3, 'batsman', 118, 4, 12),
            (12, 3, 'bowler', 336, 19, 11),
            (5, 4, 'batsman', 438, 16, 10),
            (13, 4, 'wicket-keeper', 287, 17, 8)
        `);

        console.log('[SEED] Creating Matches and Scores...');
        await db.query(`INSERT INTO matches (id, tournament_id, team1_id, team2_id, scheduled_date, status, winner_id) VALUES 
            (1, 1, 1, 2, '2026-06-01T15:00:00.000Z', 'completed', 2),
            (2, 1, 1, 3, '2026-06-02T15:00:00.000Z', 'completed', 1),
            (3, 1, 2, 4, '2026-06-03T15:00:00.000Z', 'live', NULL),
            (4, 1, 3, 4, '2026-06-04T15:00:00.000Z', 'upcoming', NULL)
        `);

        await db.query(`INSERT INTO scores (match_id, team_id, runs, wickets, overs) VALUES 
            (1, 1, 181, 8, 20.0),
            (1, 2, 186, 9, 20.0),
            (2, 1, 181, 7, 20.0),
            (2, 3, 177, 9, 20.0),
            (3, 2, 140, 4, 15.2),
            (3, 4, 0, 0, 0)
        `);

        console.log('[SEED] ✅ Database seeded successfully!');
    } catch (err) {
        console.error('[SEED] ❌ Failed:', err.message);
        process.exit(1);
    } finally {
        await db.close();
    }
}

seed();
