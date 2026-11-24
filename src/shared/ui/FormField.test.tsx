import { createRef } from 'react';
import { Text } from 'react-native';
import { screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { FormField, type TextInputInstance } from './FormField';

const field = (props: Partial<React.ComponentProps<typeof FormField>> = {}) => (
  <FormField label="Email" value="" onChangeText={jest.fn()} {...props} />
);

describe('FormField', () => {
  it('shows its label and tells the user what is typed', async () => {
    const onChangeText = jest.fn();
    const user = userEvent.setup();
    await renderWithProviders(field({ onChangeText }));

    expect(screen.getByText('Email')).toBeVisible();
    await user.type(screen.getByLabelText('Email'), 'a');

    expect(onChangeText).toHaveBeenCalledWith('a');
  });

  it('marks an optional field, in the language of the app', async () => {
    await renderWithProviders(field({ optional: true }), { language: 'pl' });
    expect(screen.getByText('Opcjonalne')).toBeVisible();
  });

  it('shows an error under the field', async () => {
    await renderWithProviders(field({ error: 'Enter a valid email address' }));
    expect(screen.getByText('Enter a valid email address')).toBeVisible();
  });

  it('can leave out the visible label but keeps it for screen readers', async () => {
    await renderWithProviders(field({ hideLabel: true }));

    expect(screen.queryByText('Email')).toBeNull();
    expect(screen.getByLabelText('Email')).toBeVisible();
  });

  describe('for passwords', () => {
    it('hides what is typed when asked to', async () => {
      await renderWithProviders(field({ label: 'Password', secureTextEntry: true }));
      expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
    });

    it('passes on what autofill and password managers need', async () => {
      await renderWithProviders(
        field({
          label: 'Password',
          secureTextEntry: true,
          autoComplete: 'current-password',
          textContentType: 'password',
        }),
      );
      expect(screen.getByLabelText('Password').props).toMatchObject({
        autoComplete: 'current-password',
        textContentType: 'password',
      });
    });

    it('shows a control at the end of the field', async () => {
      await renderWithProviders(field({ accessory: <Text>Show</Text> }));
      expect(screen.getByText('Show')).toBeVisible();
    });
  });

  it('lets the screen focus the field and react to the keyboard’s submit key', async () => {
    const onSubmitEditing = jest.fn();
    const inputRef = createRef<TextInputInstance>();
    const user = userEvent.setup();
    await renderWithProviders(field({ inputRef, onSubmitEditing, returnKeyType: 'next' }));

    expect(inputRef.current).not.toBeNull();
    await user.type(screen.getByLabelText('Email'), 'a', { submitEditing: true });

    expect(onSubmitEditing).toHaveBeenCalled();
    expect(screen.getByLabelText('Email').props.returnKeyType).toBe('next');
  });

  it('can be switched off', async () => {
    await renderWithProviders(field({ editable: false }));
    expect(screen.getByLabelText('Email').props.editable).toBe(false);
  });
});
