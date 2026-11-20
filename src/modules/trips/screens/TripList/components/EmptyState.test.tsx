import { screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('shows the message', async () => {
    await renderWithProviders(<EmptyState message="You have no trips yet" />);
    expect(screen.getByText('You have no trips yet')).toBeVisible();
  });

  it('has no button unless an action is given', async () => {
    await renderWithProviders(<EmptyState message="You have no past trips" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows a button that runs the action', async () => {
    const onAction = jest.fn();
    const user = userEvent.setup();
    await renderWithProviders(
      <EmptyState message="You have no trips yet" actionLabel="New trip" onAction={onAction} />,
    );

    await user.press(screen.getByRole('button', { name: 'New trip' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('hides the button when only one of the label and the action is given', async () => {
    await renderWithProviders(<EmptyState message="x" actionLabel="New trip" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
