import type { auth as en } from '../en/auth';
import type { Translations } from '../../types';

export const auth: Translations<typeof en> = {
  checkingSession: 'Sprawdzam Twoją sesję…',
  welcome: {
    title: 'Planuj podróże dzień po dniu',
    subtitle: 'Mapy, trasy i miejsca dla każdego punktu, wszystko w jednym miejscu.',
    logIn: 'Zaloguj się',
    createAccount: 'Załóż konto',
  },
  logIn: {
    title: 'Witaj ponownie',
    subtitle: 'Zaloguj się, aby dalej planować swoje podróże.',
    submit: 'Zaloguj się',
    submitting: 'Logowanie…',
    forgotPassword: 'Nie pamiętasz hasła?',
    noAccount: 'Nie masz jeszcze konta?',
    createOne: 'Załóż je',
  },
  signUp: {
    title: 'Załóż konto',
    subtitle: 'To zajmie tylko chwilę.',
    submit: 'Załóż konto',
    submitting: 'Zakładanie konta…',
    haveAccount: 'Masz już konto?',
    logIn: 'Zaloguj się',
    terms: 'Akceptuję Regulamin i Politykę prywatności',
  },
  forgotPassword: {
    title: 'Zresetuj hasło',
    subtitle: 'Podaj swój adres e-mail, a wyślemy Ci link do zresetowania hasła.',
    submit: 'Wyślij link',
    submitting: 'Wysyłanie…',
    sentTitle: 'Sprawdź skrzynkę',
    sentMessage:
      'Jeśli istnieje konto dla adresu {{email}}, wysłaliśmy link do zresetowania hasła.',
    backToLogIn: 'Wróć do logowania',
  },
  fields: {
    name: {
      label: 'Imię',
      placeholder: 'Twoje imię',
    },
    email: {
      label: 'E-mail',
      placeholder: 'ty@example.com',
    },
    password: {
      label: 'Hasło',
      show: 'Pokaż hasło',
      hide: 'Ukryj hasło',
    },
    confirmPassword: {
      label: 'Powtórz hasło',
    },
  },
  strength: {
    label: 'Siła hasła',
    weak: 'Słabe',
    fair: 'Średnie',
    strong: 'Mocne',
    hint: 'Użyj co najmniej 8 znaków, w tym liter i cyfr.',
  },
  errors: {
    nameRequired: 'Podaj swoje imię',
    emailRequired: 'Podaj adres e-mail',
    emailInvalid: 'Podaj prawidłowy adres e-mail',
    passwordRequired: 'Podaj hasło',
    passwordTooShort: 'Użyj co najmniej 8 znaków',
    passwordTooWeak: 'Użyj liter i cyfr',
    passwordsDoNotMatch: 'Hasła nie są takie same',
    termsRequired: 'Zaakceptuj regulamin, aby założyć konto',
  },
  formErrors: {
    invalidCredentials: 'Nieprawidłowy e-mail lub hasło',
    emailTaken: 'Konto z tym adresem e-mail już istnieje',
    network: 'Nie udało się połączyć z serwerem. Sprawdź połączenie i spróbuj ponownie.',
    unknown: 'Coś poszło nie tak. Spróbuj ponownie.',
  },
};
