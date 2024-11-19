import { useNavigate, useParams } from 'react-router-dom';
import { useVideoData } from './useVideoData';
import { formatDate, formatFileSize, getProxyUrl, toTime, VideoData } from '../utils/utils';
import { Fragment, useEffect, useState } from 'react';
import { NDKDVMRequest, NDKEvent, NDKKind, NDKRelaySet } from '@nostr-dev-kit/ndk';
import { useNDK } from '../utils/ndk';
import { nip19 } from 'nostr-tools';
import Avatar from '../components/Avatar';
import { ArrowPathIcon } from '@heroicons/react/16/solid';
import { uniqBy } from 'lodash';
import { DVM_STATUS_UPDATE, DVM_VIDEO_ARCHIVE_REQUEST_KIND, DVM_VIDEO_ARCHIVE_RESULT_KIND } from '../env';
import { DvmStatus, StatusType } from '../types';
import { useSettings } from './Settings/useSettings';
import { ConfigNeeded } from './Home/ConfigNeeded';

function Recover() {
  const { video } = useParams();
  const { videoData } = useVideoData(video);
  const { ndk } = useNDK();
  const [recoveryRequestId, setRecoveryRequestId] = useState<string | undefined>();
  const navigate = useNavigate();
  const [statusEvents, setStatusEvents] = useState<StatusType[]>([]);
  const [events, setEvents] = useState<NDKEvent[]>([]);
  const [trigger, setTrigger] = useState(0);
  const { relays, blossomServersForUploads } = useSettings();

  useEffect(() => {
    document.title = 'novia | Recover';
  }, []);

  useEffect(() => {
    if (recoveryRequestId && trigger >= 0) {
      const filter = {
        kinds: [DVM_VIDEO_ARCHIVE_RESULT_KIND as NDKKind, DVM_STATUS_UPDATE],
        '#e': [recoveryRequestId || ''],
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
  }, [recoveryRequestId, trigger]);

  // for longer running uploads I have to resubscribe

  useEffect(() => {
    const newStatusMessages: StatusType[] = [];
    console.log(events);
    events
      .sort((a, b) => (a.created_at && b.created_at && a.created_at > b.created_at ? 1 : -1))
      .forEach(e => {
        if (e.kind == DVM_VIDEO_ARCHIVE_RESULT_KIND && e.tagValue('e') == recoveryRequestId) {
          setTrigger(-1); // disable subscription refresh
          navigate(`/v/${video}`);
        }
        if (e.kind == 7000 && e.tagValue('e') == recoveryRequestId) {
          let data: { msg?: string; thumb?: string } = {};
          try {
            data = JSON.parse(e.content) as { msg?: string; thumb?: string };
          } catch (e) {
            console.error(e);
          }

          newStatusMessages.push({
            id: e.id,
            npub: nip19.npubEncode(e.pubkey),
            status: e.tagValue('status') as DvmStatus,
            msg: data.msg || '',
            //thumb: data.thumb,
            /*payment: {
              amount: paymentRequest?.amount,
              unit: paymentRequest?.unit,
              pr,
            },*/
          });

          // Handle status messages
        }
      });
    setStatusEvents(newStatusMessages);
  }, [events, recoveryRequestId, ndk]);

  const publishRecoveryRequest = async (videoData: VideoData) => {
    if (!videoData.x || !videoData.relayUrl) return;

    const request = new NDKDVMRequest(ndk);
    request.kind = DVM_VIDEO_ARCHIVE_REQUEST_KIND;
    request.addInput(videoData.eventId, 'event', videoData.relayUrl, 'upload');
    request.addParam('x', videoData.x);
    for (const server of blossomServersForUploads) {
      request.addParam('target', server);
    }
    await request.publish(NDKRelaySet.fromRelayUrls(relays, ndk));
    setRecoveryRequestId(request.id);
  };

  useEffect(() => {
    if (videoData) {
      publishRecoveryRequest(videoData);
    }
  }, [videoData]);

  if (blossomServersForUploads.length == 0) {
    return <ConfigNeeded message="No servers for videos uploads found" />;
  }

  return (
    videoData && (
      <div className="mt-8 gap-4 flex flex-col w-full">
        <h2 className="text-2xl mb-2">Recovering video from archives</h2>
        <div className="flex flex-row gap-4">
          <div className="flex-grow ">
            <div className="grid grid-cols-[12em_1fr] gap-1">
              <div>Originally archived by:</div>
              <div className="text-white">
                <Avatar npub={videoData.archivedByNpub} />
              </div>
              <div>Author / Channel:</div>
              <div className="text-white">{videoData.author}</div>
              <div>Title: </div>
              <div className="text-white">{videoData.title}</div>
              <div>Source: </div>
              <div className="text-white">{videoData.source}</div>
              <div>Size: </div>
              <div className="text-white">{formatFileSize(videoData.size)}</div>
              <div>Video Hash: </div>
              <div className="text-white break-words">{videoData.x}</div>
              <div>Published: </div>
              <div className="text-white">{formatDate(videoData.published_at)}</div>
              {videoData.dim && (
                <>
                  <div>Dimension: </div>
                  <div className="text-white">{videoData.dim}</div>
                </>
              )}
              <div>Duration: </div>
              <div className="text-white">{toTime(videoData.duration)}</div>
            </div>
          </div>
          {videoData.image && (
            <div className=" flex-shrink hidden lg:block">
              <img className="min-w-32 max-w-96 max-h-96 rounded-lg" src={getProxyUrl(videoData.image)}></img>
            </div>
          )}
        </div>
        {videoData && videoData.size > 500 * 1024 * 1024 && (
          <div className="alert border-warning text-warning">
            The video is bigger than 500MB. This can cause problems when uploading. Most servers do not support files of
            this size.
          </div>
        )}
        {recoveryRequestId && (
          <div className="block py-4">
            looking for archives that have the video...
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
                    <ArrowPathIcon className=" animate-spin w-6 "></ArrowPathIcon>
                  </div>
                  <div>{s.msg && s.msg}</div>
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  );
}

export default Recover;
