import { describe, expect, it } from 'vitest';

import { createConsoleMailer } from './mailer.js';

describe('console mailer', () => {
  it('prints the reset link, for development, instead of sending an email', async () => {
    const lines: string[] = [];
    const mailer = createConsoleMailer({ info: (message) => void lines.push(message) });

    await mailer.sendPasswordReset(
      { email: 'anna@example.com', name: 'Anna' },
      'travel-planner://reset-password?token=abc',
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('anna@example.com');
    expect(lines[0]).toContain('travel-planner://reset-password?token=abc');
  });
});
