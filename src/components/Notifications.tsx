import { BellIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { useDvmEvents } from '../utils/useDvmEvents';
import { useNDK } from '../utils/ndk';
import { DVM_VIDEO_UPLOAD_RESULT_KIND } from '../env';
import { NDKRelaySet } from '@nostr-dev-kit/ndk';
import { mapVideoData, VideoData } from '../utils/utils';
import { useNavigate } from 'react-router-dom';
import { uniqBy } from 'lodash';
import { VideoThumb } from '../pages/Home/VideoThumb';

export const Notifications = ({ userServers }: { userServers: string[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { ndk, user } = useNDK();
  const { events } = useDvmEvents({ pubkey: user?.pubkey });
  const [videoNotifications, setVideoNotifications] = useState<VideoData[]>([]);
  const navigate = useNavigate();

  // Toggle dropdown open state
  const toggleDropdown = () => {
    setIsOpen(prevState => !prevState);
  };

  // Close dropdown
  const closeDropdown = () => {
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    const doAsync = async () => {
      const eventIds = events
        .filter(e => e.kind == DVM_VIDEO_UPLOAD_RESULT_KIND)
        .map(e => e.tags.find(t => t[0] == 'i'))
        .map(t => t && { eventId: t[1], relay: t[3] })
        .filter(v => !!v);

      const uniqueEventIds = uniqBy(eventIds, e => e.eventId).slice(0, 10);

      const videoEvents = await Promise.all(
        uniqueEventIds.map(ev => ndk.fetchEvent(ev.eventId, {}, NDKRelaySet.fromRelayUrls([ev.relay], ndk)))
      );

      const videos = videoEvents.map(ve => ve && mapVideoData(ve)).filter(v => !!v) as VideoData[];
      setVideoNotifications(videos);
    };
    doAsync();
  }, [events]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        tabIndex={0}
        onClick={toggleDropdown}
        disabled={videoNotifications.length == 0}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="btn btn-ghost flex items-center"
      >
        <BellIcon />
      </button>
      {isOpen && (
        <ul
          tabIndex={0}
          role="menu"
          className={`z-50 w-96 md:w-[48em] absolute right-0 dropdown-content border-primary border menu p-2 shadow-xl shadow-base-300 bg-base-100 rounded-box`}
        >
          {videoNotifications.map(v => (
            <li
              key={v.identifier}
              onClick={() => {
                navigate(`/v/${v.naddr}`);
                setIsOpen(false);
              }}
            >
              <div className="flex flex-row items-center">
                <div>
                  <PlayIcon className="w-8" />
                </div>
                <VideoThumb
                className='w-20 min-w-20'
                  video={v}
                  skipBlur={false}
                  onClick={() => {
                    navigate(`/v/${v.naddr}`);
                    setIsOpen(false);
                  }}
                  userServers={userServers}
                  vertical={false}
                />

                <div className="flex-grow">{v.title}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
