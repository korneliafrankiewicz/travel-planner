// Sends the emails of the server. Only one kind exists so far. A real implementation (SMTP or an
// email service) must be added before the server can run in production; the config refuses to
// start in production with the console one.

export type Recipient = { email: string; name: string };

export interface Mailer {
  // `resetUrl` is the full link in the email, with the token in it.
  sendPasswordReset(to: Recipient, resetUrl: string): Promise<void>;
}

type Log = { info: (message: string) => void };

// For development: prints the link in the server log instead of sending an email, so the
// flow can be tried without a mail provider. The link works as a password, so this is never
// acceptable in production.
export const createConsoleMailer = (log: Log): Mailer => ({
  sendPasswordReset: async (to, resetUrl) => {
    log.info(`[dev mail] Password reset for ${to.email}: ${resetUrl}`);
  },
});
