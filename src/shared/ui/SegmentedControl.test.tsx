import { screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { SegmentedControl } from './SegmentedControl';

const options = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

describe('SegmentedControl', () => {
  it('shows every option and marks the current one as selected', async () => {
    await renderWithProviders(
      <SegmentedControl label="Theme" options={options} value="dark" onChange={jest.fn()} />,
    );

    expect(screen.getByRole('radio', { name: 'Light' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Light' })).not.toBeSelected();
  });

  it('labels the group for screen readers while keeping each option reachable', async () => {
    await renderWithProviders(
      <SegmentedControl label="Theme" options={options} value="light" onChange={jest.fn()} />,
    );
    // The container is not itself an accessibility element, so the options stay individually
    // focusable; it only carries the group's label.
    expect(screen.getByLabelText('Theme')).toBeVisible();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('calls onChange with the value of the pressed option', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    await renderWithProviders(
      <SegmentedControl label="Theme" options={options} value="light" onChange={onChange} />,
    );

    await user.press(screen.getByRole('radio', { name: 'Dark' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('dark');
  });
});
