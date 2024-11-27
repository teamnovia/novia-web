import { formatDate, toTime, VideoData } from '../../utils/utils';
import { useNavigate } from 'react-router-dom';
import { VideoThumb } from './VideoThumb';

export const VideoElement = ({
  video,
  vertical,
  author,
  skipBlur,
  onClick,
  userServers,
}: {
  video: VideoData;
  author?: string;
  vertical: boolean;
  skipBlur: boolean;
  onClick: React.MouseEventHandler<HTMLImageElement>;
  userServers: string[];
}) => {
  const navigate = useNavigate();

  return (
    <a className="flex flex-col cursor-pointer">
      <VideoThumb
        onClick={onClick}
        vertical={vertical}
        skipBlur={skipBlur}
        video={video}
        userServers={userServers}
      ></VideoThumb>
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
  );
};
