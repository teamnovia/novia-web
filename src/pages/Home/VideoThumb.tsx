import { formatDate, getProxyUrl, toTime, VideoData } from '../../utils/utils';
import { useNavigate } from 'react-router-dom';

export const VideoThumb = ({
  video,
  vertical,
  author,
  onClick,
  skipBlur,
}: {
  video: VideoData;
  author?: string;
  vertical: boolean;
  skipBlur: boolean;
  onClick: React.MouseEventHandler<HTMLImageElement>;
}) => {
  const navigate = useNavigate();

  return (
    video.image && (
      <a className="flex flex-col cursor-pointer">
        <div
          className={`w-full relative mb-2 ${vertical ? 'aspect-portrait' : 'aspect-video'} overflow-hidden rounded-lg`}
        >
          <img
            onClick={onClick}
            className={`rounded-lg object-cover absolute top-0 left-0 w-full h-full ${
              video.contentWarning && !skipBlur ? 'blur-md' : ''
            } hover:filter hover:brightness-110`}
            src={getProxyUrl(video.image)}
            loading="lazy"
            alt={video.title} // Always good to include alt text for accessibility
          />
          {video.contentWarning && !skipBlur && (
            <div className="absolute top-1/2 left-0 w-full text-white text-center pointer-events-none transform -translate-y-1/2 px-4">
              {video.contentWarning}
            </div>
          )}
        </div>
        {!author /* skip when author filter is set */ && (
          <div className="font-bold text-white" onClick={() => navigate(`/author/${video.author}`)}>
            {video.author}
          </div>
        )}
        <div className="text-sm text-left">{video.title}</div>
        {video.duration && (
          <div className="text-xs text-right text-white mt-1 ">
            {toTime(video.duration)} | {formatDate(video.published_at)}
          </div>
        )}
      </a>
    )
  );
};
