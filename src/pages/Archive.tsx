import { NDKDVMRequest, NDKEvent, NDKKind, NDKRelaySet } from '@nostr-dev-kit/ndk';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNDK } from '../utils/ndk';
import { DVM_STATUS_UPDATE, DVM_VIDEO_ARCHIVE_REQUEST_KIND, DVM_VIDEO_ARCHIVE_RESULT_KIND } from '../env';
import { AddressPointer } from 'nostr-tools/nip19';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { uniqBy } from 'lodash';
import { ArrowPathIcon } from '@heroicons/react/16/solid';
import { DvmStatus, StatusType } from '../types';
import Avatar from '../components/Avatar';
import { Input } from '../components/Input';
import { useSettings } from './Settings/useSettings';
import { ConfigNeeded } from './Home/ConfigNeeded';

type ArchiveResult = {
  naddr: AddressPointer;
  eventId: string;
};

function Archive() {
  const { ndk } = useNDK();
  const [url, setUrl] = useState('');
  const [archiveRequestId, setArchiveRequestId] = useState<string | undefined>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<NDKEvent[]>([]);
  const [trigger, setTrigger] = useState(0);
  const [statusEvents, setStatusEvents] = useState<StatusType[]>([]);
  const { relays } = useSettings();

  useEffect(() => {
    document.title = 'novia | Archive';
  }, []);

  const publishArchiveRequest = async (url: string) => {
    const request = new NDKDVMRequest(ndk);
    request.kind = DVM_VIDEO_ARCHIVE_REQUEST_KIND;
    request.addInput(url, 'url', '', 'archive');
    await request.publish(NDKRelaySet.fromRelayUrls(relays, ndk));
    setArchiveRequestId(request.id);
  };

  useEffect(() => {
    if (archiveRequestId && trigger >= 0) {
      const filter = {
        kinds: [DVM_VIDEO_ARCHIVE_RESULT_KIND as NDKKind, DVM_STATUS_UPDATE],
        '#e': [archiveRequestId || ''],
      };

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
        }, 5000);
      });
      return () => {
        sub.stop();
      };
    }
  }, [archiveRequestId, trigger]);

  console.log('statusEvents', events);

  useEffect(() => {
    const newStatusMessages: StatusType[] = [];

    console.log(events);
    events
      .sort((a, b) => (a.created_at && b.created_at && a.created_at > b.created_at ? 1 : -1))
      .forEach(e => {
        if (e.kind == DVM_VIDEO_ARCHIVE_RESULT_KIND && e.tagValue('e') == archiveRequestId) {
          const archiveResult = JSON.parse(e.content) as ArchiveResult;
          navigate(`/v/${nip19.naddrEncode(archiveResult.naddr)}`);
        }
        if (e.kind == 7000 && e.tagValue('e') == archiveRequestId) {
          let data: { msg?: string; thumb?: string } = {};
          try {
            data = JSON.parse(e.content) as { msg?: string };
          } catch (e) {
            console.error(e);
          }

          newStatusMessages.push({
            id: e.id,
            npub: nip19.npubEncode(e.pubkey),
            status: e.tagValue('status') as DvmStatus,
            msg: data.msg || '',
          });

          // Handle status messages
        }
      });
    setStatusEvents(newStatusMessages);
  }, [events, archiveRequestId, ndk]);

  const isError = useMemo(() => statusEvents.filter(se => se.status == 'error').length > 0, [statusEvents]);

  if (relays.length == 0) {
    return <ConfigNeeded message="No Relays found" />;
  }

  return (
    <>
      <div className="flex flex-col mx-auto max-w-[80em] w-full">
        {archiveRequestId ? (
          <div>
            {statusEvents.length > 0 ? (
              <div className=" mt-8 text-sm flex flex-col rounded-md">
                <div className="bg-base-300 p-4 grid grid-cols-3 gap-4 items-center rounded-md">
                  {statusEvents.map(s => (
                    <Fragment key={s.id}>
                      <div>
                        <Avatar npub={s.npub}></Avatar>
                      </div>
                      <div className="flex gap-2">
                        <span className={s.status == 'error' ? ' text-error font-bold' : ''}>{s.status}</span>
                        {!isError && <ArrowPathIcon className=" animate-spin w-6 "></ArrowPathIcon>}
                      </div>
                      <div>{s.msg && s.msg}</div>
                    </Fragment>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-base-300 p-8 mt-8 text-sm flex flex-col gap-4 rounded-md">
                Looking for archives to download the video ...
                <ArrowPathIcon className="inline animate-spin w-6"></ArrowPathIcon>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="bg-base-300 flex items-center justify-center gap-4 p-4 md:p-8 mt-4 md:mt-8 rounded-2xl flex-col md:flex-row  ">
              <Input
                placeholder="Enter a video URL to archive"
                className="w-full"
                value={url}
                setValue={setUrl}
                disabled={!!archiveRequestId}
              ></Input>

              <button
                className="btn btn-primary"
                disabled={!url || !!archiveRequestId}
                onClick={() => publishArchiveRequest(url)}
              >
                Archive
              </button>
            </div>

            <div className="bg-base-300 my-4 md:my-8 p-8 rounded-2xl mx-auto">
              <h2 className="text-2xl pb-4">How does this work?</h2>
              <div className="max-w-[40em]">
                When you add a URL here the video will be{' '}
                <span className="text-white"> downloaded and archived offline </span> by some 3rd-party. Only the
                description and a thumbnail are published automatically. To watch the video later you have to create a
                "recover" request to make the video available online.
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Archive;
