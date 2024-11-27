import { useState } from 'react';
import { getHashFromURL, getProxyUrl, VideoData } from '../../utils/utils';
import { findFirstAvailableServerMultiPass } from '../useVideoData';
import { useSettings } from '../Settings/useSettings';

export const VideoThumb = ({
  video,
  onClick,
  skipBlur,
  userServers,
  vertical,
  className = 'w-full mb-2'
}: {
  video: VideoData;
  skipBlur: boolean;
  onClick: React.MouseEventHandler<HTMLImageElement>;
  userServers: string[];
  vertical: boolean;
  className?: string;
}) => {
  const [imageUrl, setImageUrl] = useState(video.image);
  const { blossomServersForDownload } = useSettings();

  const lookupImageUrl = async (url?: string) => {
    if (!url) return;
    const hash = getHashFromURL(url);

    if (hash) {
      const url = await findFirstAvailableServerMultiPass([blossomServersForDownload, userServers], hash);
      if (url) {
        console.log('using fallback image url ' + url);
        setImageUrl(getProxyUrl(url));
        return;
      }
    }

    // use the plain url without proxy
    setImageUrl(imageUrl);
  };

  return (
    <div className={`${className} relative ${vertical ? 'aspect-portrait' : 'aspect-video'} overflow-hidden rounded-lg`}>
      <img
        onClick={onClick}
        className={`rounded-lg object-cover absolute top-0 left-0 w-full h-full ${
          video.contentWarning && !skipBlur ? 'blur-md' : ''
        } hover:filter hover:brightness-110`}
        src={imageUrl ? getProxyUrl(imageUrl) : imageUrl}
        onError={() => lookupImageUrl(video.image)}
        loading="lazy"
        alt={video.title} // Always good to include alt text for accessibility
      />
      {video.contentWarning && !skipBlur && (
        <div className="absolute top-1/2 left-0 w-full text-white text-center pointer-events-none transform -translate-y-1/2 px-4">
          {video.contentWarning}
        </div>
      )}
    </div>
  );
};
