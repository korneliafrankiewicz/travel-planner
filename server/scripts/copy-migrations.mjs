// The SQL migrations are read from disk at start-up, so the build copies them next to the
// compiled code (tsc only copies .ts files).
import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist/db', { recursive: true });
await cp('src/db/migrations', 'dist/db/migrations', { recursive: true });
console.log('Copied the SQL migrations to dist/db/migrations');
