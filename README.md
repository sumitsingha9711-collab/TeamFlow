# TeamFlow

TeamFlow is a collaborative project-management SaaS for small teams. The repository is a React/Vite client plus an Express/MongoDB API.

## Run locally (PowerShell)

1. Copy `.env.example` to `.env` and set a strong `SESSION_SECRET`.
2. Start MongoDB locally or provide a managed `MONGODB_URI`.
3. Run `npm install` from the repository root.
4. Run `npm run dev` from the repository root.
5. Open `http://localhost:5173`.

The client proxies API and Socket.IO traffic to the server at port 4000.

## Verification

Run `npm test` and `npm run build -w client` from the repository root. Database-backed API integration tests require a running MongoDB instance and are not yet included.

## Code quality

Run these commands from the repository root:

- `npm run format` formats all project-owned supported files.
- `npm run format:check` verifies formatting without modifying files.
- `npm run lint` runs the shared ESLint configuration.

## Security decisions

- Authentication uses an HTTP-only, `SameSite=Lax` signed session cookie. `Secure` is enabled in production.
- Server routes enforce workspace membership and role checks; browser UI is not treated as an authorization boundary.
- Owners and admins manage workspace settings and membership. Members can create/update tasks, may delete only tasks they created, and cannot archive or delete projects.
- Invitations use random, hashed, seven-day tokens bound to the invited email address. Delivery is intentionally external to the API; return tokens must be passed to an approved email provider rather than logged in production.
