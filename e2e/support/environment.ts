// Addresses and files shared by the Playwright config and the tests. Not the ports the
// development setup uses (3000 and 8081), so both can run at the same time.
export const API_URL = 'http://127.0.0.1:3100';
export const APP_URL = 'http://localhost:8099';

// Everything the run creates (database, server log). Git-ignored.
export const STATE_DIR = 'e2e/.tmp';
export const LOG_FILE = `${STATE_DIR}/server.log`;
