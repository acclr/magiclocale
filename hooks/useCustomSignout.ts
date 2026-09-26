import { signOut } from 'next-auth/react';

const LOGIN_PATH = '/auth/login';

export function useCustomSignOut() {
  const signOutUser = async () => {
    try {
      await fetch('/api/auth/custom-signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error during sign out:', error);
    }

    try {
      await signOut({ redirect: false });
    } catch (error) {
      console.error('Error during sign out:', error);
    }

    window.location.assign(LOGIN_PATH);
  };

  return signOutUser;
}
