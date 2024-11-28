import { ArrowPathIcon } from '@heroicons/react/24/outline';
import Avatar from './Avatar';
import { Fragment } from 'react/jsx-runtime';
import { useEffect, useState } from 'react';
import { DvmStatus, StatusType } from '../types';
import { nip19 } from 'nostr-tools';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';

type DvmResponseStatusListProps = {
  originalRequestId: string | undefined;
  events: NDKEvent[];
  onFinished: (resultEvent: NDKEvent) => void;
  infoText: string;
  resultKind: NDKKind;
};

export const DvmResponseStatusList = ({
  originalRequestId,
  events,
  onFinished,
  infoText,
  resultKind,
}: DvmResponseStatusListProps) => {
  const [statusEvents, setStatusEvents] = useState<StatusType[]>([]);

  useEffect(() => {
    const statusMap = new Map<string, StatusType>();

    // Sort events by created_at in ascending order
    const sortedEvents = events.sort((a, b) => {
      if (a.created_at && b.created_at) {
        return a.created_at > b.created_at ? 1 : -1;
      }
      return 0;
    });

    sortedEvents.forEach(e => {
      // Handle video upload result kind
      if (e.kind === resultKind && e.tagValue('e') === originalRequestId) {
        onFinished(e);
      }

      // Handle generic DVM status kind 7000 events
      if (e.kind === 7000 && e.tagValue('e') === originalRequestId) {
        let data: { msg?: string; thumb?: string } = {};
        try {
          data = JSON.parse(e.content) as { msg?: string; thumb?: string };
        } catch (error) {
          console.error('Failed to parse event content:', error);
        }

        const npub = nip19.npubEncode(e.pubkey);
        const status = e.tagValue('status') as DvmStatus;
        const key = `${npub}_${status}`; // Unique key for npub and status

        // Update the map with the latest event for each npub and status
        statusMap.set(key, {
          id: e.id,
          npub,
          status,
          msg: data.msg || '',
          created_at: e.created_at || 0, // Ensure created_at is present

          active: false, // Initialize as false; will set to true later

          // thumb: data.thumb, // Uncomment if you decide to use thumb
          // payment: {
          //   amount: paymentRequest?.amount,
          //   unit: paymentRequest?.unit,
          //   pr,
          // }, // Uncomment and ensure paymentRequest is defined if needed
        });
      }
    });
    // Convert the map values to an array to get unique latest status messages per (npub, status)
    const uniqueStatusMessages: StatusType[] = Array.from(statusMap.values());

    // Map to track the latest message per npub
    const latestPerNpubMap = new Map<string, StatusType>();

    uniqueStatusMessages.forEach(msg => {
      const existing = latestPerNpubMap.get(msg.npub);
      if (!existing || msg.created_at > existing.created_at) {
        latestPerNpubMap.set(msg.npub, msg);
      }
    });

    // Set active: true for the latest message per npub
    const finalStatusMessages = uniqueStatusMessages.map(msg => ({
      ...msg,
      active: latestPerNpubMap.get(msg.npub)?.id === msg.id,
    }));

    setStatusEvents(finalStatusMessages);
  }, [events, originalRequestId]);

  return (
    <>
      {originalRequestId && (
        <div className="block py-4">
          {infoText}
          {statusEvents.length == 0 && <ArrowPathIcon className="inline animate-spin w-6 "></ArrowPathIcon>}
        </div>
      )}

      {statusEvents.length > 0 && (
        <div className="text-sm flex flex-col rounded-md">
          <div className="bg-base-300 p-4 grid grid-cols-3 gap-4 items-center rounded-md">
            {statusEvents.map(s => (
              <Fragment key={s.id}>
                <div>
                  <Avatar npub={s.npub}></Avatar>
                </div>
                <div className="flex gap-2">
                  <span className={s.status == 'error' ? ' text-error font-bold' : ''}>{s.status}</span>
                  {s.status != 'error' && s.active && <ArrowPathIcon className=" animate-spin w-6 "></ArrowPathIcon>}
                </div>
                <div>{s.msg && s.msg}</div>
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
