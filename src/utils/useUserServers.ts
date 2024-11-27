import { useEffect, useState } from 'react';
import { useNDK } from './ndk';
import { NDKKind } from '@nostr-dev-kit/ndk';

const USER_BLOSSOM_SERVER_LIST_KIND = 10063;

export const useUserServers = () => {
  const [userServers, setUserServers] = useState<string[]>([]);
  const { ndk, user } = useNDK();

  useEffect(() => {
    const doAsync = async () => {
      if (!user) {
        return;
      }

      const blossomServerEvent = await ndk.fetchEvent({
        kinds: [USER_BLOSSOM_SERVER_LIST_KIND as NDKKind],
        authors: [user.pubkey],
      });
      if (!blossomServerEvent) {
        console.warn('no blossom servers found for user');
        return;
      }

      const allServers = blossomServerEvent.tags
        .filter(t => t[0] == 'r' || t[0] == 'server')
        .flatMap(t => t[1])
        .filter(s => !s.match(/https?:\/\/localhost/));

      setUserServers(allServers);
    };

    doAsync();
  }, [user, ndk]);

  return { userServers };
};
