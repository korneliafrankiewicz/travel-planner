# travel-planner server

The back end of travel-planner: accounts and sessions (more to come). Node.js, TypeScript,
Fastify and PostgreSQL.

```bash
npm install
cp env.example .env   # optional; every setting has a default
npm run dev           # http://127.0.0.1:3000, with a development database in .data/
npm test
```

Documentation is in the main repository:

- [Back end](../docs/backend.md): how to run it, settings, how it is built, security decisions, and
  what is missing before production
- [API](../docs/api.md): the endpoints the app calls

Lint (`npm run lint`), typecheck (`npm run typecheck`) and the tests must pass before a task is done.
