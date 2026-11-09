# HX8 Gaming Lounge — starter project

This is a custom HX8-branded gaming portal starter. It includes a responsive landing page, working navigation, real account registration/login, password hashing, server-side sessions, SQLite user storage, and a basic admin member list.

## Important scope and legal note
This starter is **not** a clone of KX8's proprietary source code or assets. It uses an original layout and a unique midnight-blue / teal / lime palette. It does **not** include real-money betting, deposits, withdrawals, wallet balances, odds, or payment processing. Those functions must not be activated unless you have confirmed the applicable Bangladesh/local legal permissions, licensing, approved providers, age controls, AML/KYC obligations, and security/compliance requirements.

Game tiles are integration placeholders for games you are authorized to distribute. They are not playable games yet.

## Requirements
- Node.js 18 or newer
- npm

## Run locally
1. Extract the ZIP.
2. Open a terminal in this folder.
3. Install packages:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env`.
5. Change `SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `.env`.
6. Start:
   ```bash
   npm start
   ```
7. Visit `http://localhost:3000`.

The first admin account is created from `ADMIN_EMAIL` and `ADMIN_PASSWORD` when the database is first initialized. Keep `.env` private and change the initial admin password before public launch.

## Before public launch
- Use HTTPS and set `NODE_ENV=production`.
- Set a long random `SESSION_SECRET`.
- Use a managed database and persistent storage/backups.
- Add email verification, password reset, CSRF protection, audit logs, admin MFA, monitoring, privacy policy, terms, and age/access controls.
- Review local law and obtain required approvals before adding any regulated gaming or payment functionality.

## Project structure
- `server.js` — Express backend, SQLite database, sessions, authentication, admin API
- `public/index.html` — pages and UI
- `public/style.css` — theme and responsive styling
- `public/app.js` — navigation and frontend behavior
