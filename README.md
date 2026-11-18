# harness-lab-front

Harness Lab's web front: Next.js (App Router) + Mantine UI. The server renders the page from the back's
`GET /api/lab` (repo `harness-lab-back`) on every request.

## Run (local)

Needs bun, Node 20+, and the back running on port 4101.

```bash
bun install
bun run dev        # http://localhost:4100
```

`BACK_URL` (server-only, read at run time) is where the server reaches the back. Default `http://127.0.0.1:4101`;
see `.env.example`.

## Test

```bash
bun test           # lib/lab view-model tests
bun run typecheck
bun run lint
```

## Build

```bash
bun run build      # Next standalone output, with .next/static copied into it
PORT=4100 HOSTNAME=127.0.0.1 BACK_URL=http://127.0.0.1:4101 node .next/standalone/server.js
```

The artifact is the folder `.next/standalone/`. The server starts it with `node server.js` inside that folder.
