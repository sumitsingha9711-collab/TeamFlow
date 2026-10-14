# TeamFlow

TeamFlow is a collaborative project-management SaaS for small teams. The repository is a React/Vite client plus an Express/MongoDB API.

## Run locally (PowerShell)

1. Copy `.env.example` to `.env` and set `MONGODB_URI` and a strong `SESSION_SECRET`.
   The server always reads this repository-root `.env` file, including when it is
   started through the workspace development script.
2. Start MongoDB locally or provide a managed `MONGODB_URI`.
3. Run `npm install` from the repository root.
4. Run `npm run dev` from the repository root.
5. Wait for `TeamFlow API listening on 4000`, then open `http://localhost:5173`.

The client proxies API and Socket.IO traffic to the server at port 4000.

## Development demo login

The default `.env.example` enables a development-only demo account. After the
API connects to MongoDB, it creates or resets this account on every development
startup:

```text
Email:    demo@teamflow.local
Password: DemoPassword123!
```

Change the `DEMO_USER_NAME`, `DEMO_USER_EMAIL`, and `DEMO_USER_PASSWORD` values
in `.env` if needed. Set `DEMO_USER_ENABLED=false` to disable it. Demo-user
seeding is always disabled when `NODE_ENV=production`.

Before login, the browser may show a `401 Unauthorized` response for
`/api/v1/auth/me`. This is the normal session check when no login cookie exists;
it should return `200` after a successful sign-in.

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
- The demo login is development-only and is not seeded in production.
