import { NDKEvent, NDKFilter, NDKKind, NDKRelaySet } from '@nostr-dev-kit/ndk';
import { useEffect, useState } from 'react';
import { DVM_STATUS_UPDATE, DVM_VIDEO_ARCHIVE_RESULT_KIND, DVM_VIDEO_UPLOAD_RESULT_KIND } from '../env';
import { useSettings } from '../pages/Settings/useSettings';
import { useNDK } from './ndk';
import { uniqBy } from 'lodash';

type DvmEventFilter = {
  recoveryRequestId?: string;
  pubkey?: string;
  delay?: number;
  limit?: number;
};

export const useDvmEvents = ({ recoveryRequestId, pubkey, delay = 30000, limit = 30 }: DvmEventFilter) => {
  const [events, setEvents] = useState<NDKEvent[]>([]);
  const [trigger, setTrigger] = useState(0);
  const { relays } = useSettings();
  const { ndk } = useNDK();

  useEffect(() => {
    if (trigger >= 0) {
      const filter = {
        kinds: [DVM_VIDEO_ARCHIVE_RESULT_KIND as NDKKind, DVM_VIDEO_UPLOAD_RESULT_KIND, DVM_STATUS_UPDATE],
        limit
      } as NDKFilter;

      if (recoveryRequestId) {
        filter['#e'] = [recoveryRequestId || ''];
      }

      if (pubkey) {
        filter['#p'] = [pubkey || ''];
      }

      const relaySet = (relays?.length ?? 0 > 0) ? NDKRelaySet.fromRelayUrls(relays as string[], ndk) : undefined;
      const sub = ndk.subscribe(filter, { closeOnEose: false }, relaySet);
      sub.on('event', (ev: NDKEvent) => {
        setEvents(evs => {
          const newEvents = evs.concat([ev]).sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
          return uniqBy(newEvents, (e: NDKEvent) => e.tagId());
        });
      });
      sub.on('eose', () => {
        setTimeout(() => {
          setTrigger(t => t + 1);
        }, delay);
      });
      return () => {
        sub.stop();
      };
    }
  }, [recoveryRequestId, trigger]);

  return {
    events,
    stopAutorefresh: () => {
      setTrigger(-1);
    },
  };
};
