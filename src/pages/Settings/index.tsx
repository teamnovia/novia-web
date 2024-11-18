import { useEffect } from 'react';
import { ServerList } from './ServerList';
import { useSettings } from './useSettings';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

function Settings() {
  const {
    relays,
    setRelays,
    blossomServersForUploads,
    setBlossomServersForUploads,
    blossomServersForDownload,
    setBlossomServersForDownload,
  } = useSettings();

  useEffect(() => {
    document.title = 'novia | Settings';
  }, []);

  // TODO add button to reset cache

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8 mt-4 md:mt-8 w-full">
      <div className="bg-base-200 rounded-2xl p-4 md:p-8  w-full md:w-1/2">
        <ServerList
          title="Relays"
          values={relays}
          setValues={setRelays}
          validate={r => r.startsWith('wss://') || r.startsWith('ws://')}
          placeholder="new relay url"
        />
        <div className="alert border-info text-info mt-8">
          <InformationCircleIcon className="w-8" /> We look for archived videos on these relays and publish recovery
          requests here.
        </div>
      </div>

      <div className="bg-base-200 rounded-2xl p-4 md:p-8 w-full md:w-1/2">
        <ServerList
          title="Video Lookup Servers"
          values={blossomServersForDownload}
          setValues={setBlossomServersForDownload}
          validate={r => r.startsWith('http://') || r.startsWith('https://')}
          placeholder="new server url (blossom)"
        />
        <div className="alert border-info text-info mt-8">
          <InformationCircleIcon className="w-8" />
          We try to play videos and show images from these servers.
        </div>
      </div>

      <div className="bg-base-200 rounded-2xl p-4 md:p-8 w-full md:w-1/2">
        <ServerList
          title="Video Upload Servers"
          values={blossomServersForUploads}
          setValues={setBlossomServersForUploads}
          validate={r => r.startsWith('http://') || r.startsWith('https://')}
          placeholder="new upload server url (blossom)"
        />
        <div className="alert border-info text-info mt-8">
          <InformationCircleIcon className="w-8" />
          When you recover videos they are uploaded to these servers.
        </div>
      </div>

      <div className=''>

      
</div>
    </div>


  );
}

export default Settings;
