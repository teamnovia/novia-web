import { NDKDVMRequest, NDKRelaySet } from '@nostr-dev-kit/ndk';
import { useEffect, useState } from 'react';
import { useNDK } from '../utils/ndk';
import { DVM_STATUS_UPDATE, DVM_VIDEO_ARCHIVE_REQUEST_KIND, DVM_VIDEO_ARCHIVE_RESULT_KIND } from '../env';
import { AddressPointer } from 'nostr-tools/nip19';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { Input } from '../components/Input';
import { useSettings } from './Settings/useSettings';
import { ConfigNeeded } from './Home/ConfigNeeded';
import { DvmResponseStatusList } from '../components/DvmRepsonseStatusList';
import { useDvmEvents } from '../utils/useDvmEvents';

type ArchiveResult = {
  naddr: AddressPointer;
  eventId: string;
};

function Archive() {
  const { ndk } = useNDK();
  const [url, setUrl] = useState('');
  const [archiveRequestId, setArchiveRequestId] = useState<string | undefined>();
  const navigate = useNavigate();
  const { relays } = useSettings();
  const { events } = useDvmEvents({
    originalRequestId: archiveRequestId,
    delay: 5000,
    kinds: [DVM_VIDEO_ARCHIVE_RESULT_KIND, DVM_STATUS_UPDATE],
  });

  useEffect(() => {
    document.title = 'novia | Archive';
  }, []);

  const publishArchiveRequest = async (url: string) => {
    const request = new NDKDVMRequest(ndk);
    request.kind = DVM_VIDEO_ARCHIVE_REQUEST_KIND;
    request.addInput(url, 'url');
    await request.publish(NDKRelaySet.fromRelayUrls(relays, ndk));
    setArchiveRequestId(request.id);
  };

  if (relays.length == 0) {
    return <ConfigNeeded message="No Relays found" />;
  }

  return (
    <>
      <div className="flex flex-col mx-auto max-w-[80em] w-full">
        {archiveRequestId ? (
          <DvmResponseStatusList
            infoText="Looking for archives to download the video ..."
            originalRequestId={archiveRequestId}
            events={events}
            resultKind={DVM_VIDEO_ARCHIVE_RESULT_KIND}
            onFinished={resultEvent => {
              const archiveResult = JSON.parse(resultEvent.content) as ArchiveResult;
              navigate(`/v/${nip19.naddrEncode(archiveResult.naddr)}`);
            }}
          ></DvmResponseStatusList>
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
