import { screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { PillButton } from './PillButton';

describe('PillButton', () => {
  it('shows its label and works as a button', async () => {
    await renderWithProviders(<PillButton label="New trip" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'New trip' })).toBeVisible();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await renderWithProviders(<PillButton label="New trip" onPress={onPress} />);

    await user.press(screen.getByRole('button', { name: 'New trip' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each(['primary', 'secondary'] as const)('renders the %s variant', async (variant) => {
    await renderWithProviders(<PillButton label="Go" variant={variant} onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Go' })).toBeVisible();
  });
});
