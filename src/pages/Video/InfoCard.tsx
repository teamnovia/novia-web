import Avatar from '../../components/Avatar';
import { TiktokLogo } from '../../components/icons/TiktokLogo';
import { YoutubeLogo } from '../../components/icons/YoutubeLogo';
import { getLanguageFlag, LanguageCode } from '../../utils/languages';
import { formatDate, toTime, VideoData } from '../../utils/utils';

export const InfoCard = ({ videoData }: { videoData: VideoData }) => {
  return (
    <div className="mt-2 w-[40em] min-w-[20em] card bg-base-300">
      <div className="p-4 grid grid-cols-[auto_minmax(0,1fr)] gap-4 items-center">
        Archivist:
        <div className="text-white">
          <Avatar npub={videoData.archivedByNpub} />
        </div>
        Source:
        <a href={videoData.originalUrl} referrerPolicy="no-referrer">
          {videoData.source == 'youtube' ? <YoutubeLogo /> : null}
          {videoData.source == 'tiktok' ? <TiktokLogo /> : null}
        </a>
        <div>Published: </div>
        <div className="text-white">{formatDate(videoData.published_at)}</div>
        {videoData.language && (
          <>
            <div>Language: </div>
            <div className="text-white">{getLanguageFlag(videoData.language as LanguageCode)}</div>
          </>
        )}
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
  );
};
