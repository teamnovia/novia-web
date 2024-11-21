import React from 'react';
import { useNDK } from '../utils/ndk';
import useLocalStorageState from '../utils/useLocalStorageState';
import { UserCircleIcon } from '@heroicons/react/24/outline';

const LoginButton: React.FC = () => {
  const { loginWithExtension } = useNDK();
  const [_, setAutoLogin] = useLocalStorageState('autologin', { defaultValue: false });

  const handleLogin = async () => {
    try {
      await loginWithExtension();
      setAutoLogin(true);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  return (
    <button className="btn btn-ghost mr-2" onClick={handleLogin} title="Login with extension (NIP07)">
      <UserCircleIcon />
    </button>
  );
};

export default LoginButton;
