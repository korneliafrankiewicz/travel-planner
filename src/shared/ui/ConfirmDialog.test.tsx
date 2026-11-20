import { fireEvent, screen, userEvent } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { ConfirmDialog } from './ConfirmDialog';

const renderDialog = (props: Partial<ComponentProps<typeof ConfirmDialog>> = {}) => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  return {
    onConfirm,
    onCancel,
    ready: renderWithProviders(
      <ConfirmDialog
        visible
        title="Delete this trip?"
        message='"Rome" will be removed.'
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...props}
      />,
    ),
  };
};

describe('ConfirmDialog', () => {
  it('shows the title, the message and both actions', async () => {
    await renderDialog().ready;

    expect(screen.getByRole('header', { name: 'Delete this trip?' })).toBeVisible();
    expect(screen.getByText('"Rome" will be removed.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  it('hides the backdrop from screen readers, which use the Cancel button instead', async () => {
    await renderDialog().ready;

    expect(screen.getAllByRole('button', { name: 'Cancel' })).toHaveLength(1);
    expect(
      screen.getAllByRole('button', { name: 'Cancel', includeHiddenElements: true }),
    ).toHaveLength(2);
  });

  it('shows nothing when it is not visible', async () => {
    await renderDialog({ visible: false }).ready;
    expect(screen.queryByText('Delete this trip?')).toBeNull();
  });

  it('confirms only when the destructive action is pressed', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel, ready } = renderDialog();
    await ready;

    await user.press(screen.getByRole('button', { name: 'Delete' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels from the Cancel button', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel, ready } = renderDialog();
    await ready;

    await user.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('cancels when the backdrop outside the dialog is tapped', async () => {
    const { onConfirm, onCancel, ready } = renderDialog();
    await ready;

    const [backdrop] = screen
      .getAllByRole('button', { name: 'Cancel', includeHiddenElements: true })
      .filter((element) => element !== screen.getByRole('button', { name: 'Cancel' }));
    await fireEvent.press(backdrop);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
