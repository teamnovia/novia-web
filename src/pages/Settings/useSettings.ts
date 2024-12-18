import useLocalStorageState from '../../utils/useLocalStorageState';

export const useSettings = () => {
  const [relays, setRelays] = useLocalStorageState<string[]>('relays', {
    defaultValue: ['wss://noviatest.nostr1.com'],
  });

  const [blossomServersForUploads, setBlossomServersForUploads] = useLocalStorageState('blossomServersForUploads', {
    defaultValue: ['https://nostr.download'],
  });

  const [blossomServersForDownload, setBlossomServersForDownload] = useLocalStorageState('blossomServersForDownloads', {
    defaultValue: ['https://nostr.download'],
  });

  return {
    relays,
    setRelays,
    blossomServersForUploads,
    setBlossomServersForUploads,
    blossomServersForDownload,
    setBlossomServersForDownload,
  };
};
