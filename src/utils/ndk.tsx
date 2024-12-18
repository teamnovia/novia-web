import NDK, { NDKNip07Signer, NDKNip46Signer, NDKPrivateKeySigner, NDKUser } from '@nostr-dev-kit/ndk';
import { generateSecretKey, nip19 } from 'nostr-tools';
import { decrypt } from 'nostr-tools/nip49';
import { bytesToHex } from '@noble/hashes/utils';
import React, { createContext, useContext, useEffect, useState } from 'react';
import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie';

type NDKContextType = {
  ndk: NDK;
  user?: NDKUser;
  logout: () => void;
  loginWithExtension: () => Promise<void>;
  loginWithNostrAddress: (connectionString: string) => Promise<void>;
  loginWithPrivateKey: (key: string) => Promise<void>;
};

const cacheAdapter = new NDKCacheAdapterDexie({ dbName: 'novia' });

const ndk = new NDK({
  cacheAdapter,
  autoConnectUserRelays: true,
  explicitRelayUrls: ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.primal.net', 'wss://purplepag.es'],
});

export const NDKContext = createContext<NDKContextType>({
  ndk,
  logout: () => {},
  loginWithExtension: () => Promise.reject(),
  loginWithNostrAddress: () => Promise.reject(),
  loginWithPrivateKey: () => Promise.reject(),
});

export const NDKContextProvider = ({ children }: { children: React.ReactElement }) => {
  const [user, setUser] = useState(ndk.activeUser);

  const fetchUserData = async function () {
    if (!ndk.signer) return;

    console.log('Fetching user');
    const user = await ndk.signer.user();
    setUser(user);

    console.log('Fetching profile');
    user.fetchProfile();
  };

  const loginWithExtension = async function () {
    const signer: NDKNip07Signer = new NDKNip07Signer();
    console.log('Waiting for NIP-07 signer');
    await signer.blockUntilReady();
    ndk.signer = signer;

    await fetchUserData();
  };

  const loginWithNostrAddress = async function (connectionString: string) {
    const localKey = localStorage.getItem('local-signer') || bytesToHex(generateSecretKey());
    const localSigner = new NDKPrivateKeySigner(localKey);

    let signer: NDKNip46Signer;

    // manually set remote user and pubkey if using NIP05
    if (connectionString.includes('@')) {
      const user = await ndk.getUserFromNip05(connectionString);
      if (!user?.pubkey) throw new Error('Cant find user');
      console.log('Found user', user);

      signer = new NDKNip46Signer(ndk, connectionString, localSigner);

      // signer.r = user;
      //signer.remotePubkey = user.pubkey;
    } else if (connectionString.startsWith('bunker://')) {
      const uri = new URL(connectionString);

      const pubkey = uri.host || uri.pathname.replace('//', '');
      const relays = uri.searchParams.getAll('relay');
      for (const relay of relays) ndk.addExplicitRelay(relay);
      if (relays.length === 0) throw new Error('Missing relays');
      signer = new NDKNip46Signer(ndk, pubkey, localSigner);
      signer.relayUrls = relays;
    } else {
      signer = new NDKNip46Signer(ndk, connectionString, localSigner);
    }

    signer.rpc.on('authUrl', (url: string) => {
      window.open(url, '_blank');
    });

    await signer.blockUntilReady();
    await signer.user();
    ndk.signer = signer;
    localStorage.setItem('local-signer', localSigner.privateKey ?? '');

    await fetchUserData();
  };

  const loginWithPrivateKey = async function (key: string) {
    if (key.startsWith('ncryptsec')) {
      const password = prompt('Enter your private key password');
      if (password === null) throw new Error('No password provided');
      const plaintext = bytesToHex(decrypt(key, password));
      //console.log(plaintext);

      ndk.signer = new NDKPrivateKeySigner(plaintext);
      await ndk.signer.blockUntilReady();
      localStorage.setItem('private-key', key);
    } else if (key.startsWith('nsec')) {
      const decoded = nip19.decode(key);
      if (decoded.type !== 'nsec') throw new Error('Not nsec');
      ndk.signer = new NDKPrivateKeySigner(bytesToHex(decoded.data));
      await ndk.signer.blockUntilReady();
    } else throw new Error('Unknown private format');

    await fetchUserData();
  };

  const logout = function logout() {
    localStorage.removeItem('local-signer');
    localStorage.removeItem('private-key');
    location.reload();
  };

  ndk.connect();

  const performAutoLogin = async () => {
    const autoLogin = localStorage.getItem('auto-login');
    if (autoLogin) {
      try {
        if (autoLogin === 'nip07') {
          await loginWithExtension().catch(() => {});
        } else if (autoLogin === 'nsec') {
          const key = localStorage.getItem('private-key');
          if (key) await loginWithPrivateKey(key);
        } else if (autoLogin.includes('@') || autoLogin.startsWith('bunker://') || autoLogin.includes('#')) {
          await loginWithNostrAddress(autoLogin).catch(() => {});
        }
      } catch (e) {}
    }
    console.log('after init', user);
    if (!user) {
      await loginWithPrivateKey(nip19.nsecEncode(generateSecretKey()));
    }
  };

  useEffect(() => {
    performAutoLogin();
  }, []);

  const value = {
    ndk,
    user,
    logout,
    loginWithExtension,
    loginWithNostrAddress,
    loginWithPrivateKey,
  };

  return <NDKContext.Provider value={value}>{children}</NDKContext.Provider>;
};

export const useNDK = () => useContext(NDKContext);
