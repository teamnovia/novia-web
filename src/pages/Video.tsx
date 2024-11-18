import { formatFileSize, toTime } from '../utils/utils';
import { YoutubeLogo } from '../components/icons/YoutubeLogo';
import { TiktokLogo } from '../components/icons/TiktokLogo';
import { usePlayableVideoUrl, useVideoData } from './useVideoData';
import { useNavigate, useParams } from 'react-router-dom';
import { useNDK } from '../utils/ndk';
import { useEffect } from 'react';
import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaVolumeRange,
  MediaPlayButton,
  MediaPipButton,
  MediaMuteButton,
  MediaFullscreenButton,
  MediaPlaybackRateButton,
} from 'media-chrome/react';

function Video() {
  const { user } = useNDK();
  const { video } = useParams();
  const { videoData: vd } = useVideoData(video);
  const { videoUrl, findVideoUrl, noServerFound } = usePlayableVideoUrl(vd);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'novia | ' + vd?.title;
  }, [vd?.title]);

  const handleError = () => {
    // const errorUrl = (e.target as HTMLVideoElement).src;
    findVideoUrl();
  };

  return (
    vd && (
      <div className="mt-4 gap-4 flex flex-col">
        {noServerFound && (
          <div className="alert alert-ghost border-error flex flex-col md:flex-row">
            <div className="flex flex-col gap-2 flex-grow">
              <div>
                This video is not available on any known servers. You can send a recovery request to look for it in
                private video archives.
              </div>
              <div className="text-white flex flex-col md:flex-row gap-4">
                <div>
                  <b>Size:</b> {formatFileSize(vd.size)}
                </div>
                {vd.dim && (
                  <div>
                    <b>Dimensions:</b> {vd.dim}
                  </div>
                )}
                <div>
                  <b>Duration:</b> {toTime(vd.duration)}
                </div>
              </div>
            </div>
            <button className="btn btn-error" disabled={!user} onClick={() => navigate(`/recover/${video}`)}>
              Recover
            </button>
          </div>
        )}
        <MediaController className="content-center ">
          <video
            slot="media"
            className={
              vd.format == 'widescreen'
                ? 'aspect-video w-full h-auto max-h-[100vh] rounded-lg'
                : 'aspect-[9/16] w-full max-h-[100vh] sm:w-4/6 md:w-2/6 mx-auto rounded-lg'
            }
            crossOrigin="anonymous"
            src={videoUrl}
            autoPlay={true}
            poster={vd.image}
            onError={() => handleError()}
          ></video>
          <MediaControlBar autohide hidden={!videoUrl}>
            <MediaPlayButton />
            <MediaPlaybackRateButton />
            <MediaTimeRange />
            <MediaTimeDisplay showDuration></MediaTimeDisplay>
            <MediaMuteButton />
            <MediaVolumeRange />
            <MediaPipButton />
            <MediaFullscreenButton />
          </MediaControlBar>
        </MediaController>

        <div>
          {vd.author && (
            <div className="text-sm cursor-pointer" onClick={() => navigate(`/author/${vd.author}`)}>
              {vd.author}
            </div>
          )}

          <div className="flex flex-row">
            <h2 className="flex-grow text-2xl text-white">{vd?.title}</h2>
            <a href={vd.originalUrl} referrerPolicy="no-referrer">
              {vd.source == 'youtube' ? <YoutubeLogo /> : null}
              {vd.source == 'tiktok' ? <TiktokLogo /> : null}
            </a>
          </div>
        </div>
        <div className=" whitespace-pre-wrap">{vd?.description}</div>
        <div className="break-keep leading-8">
          {vd.tags.map(t => (
            <span key={t} className="inline-block bg-base-200 rounded-xl px-2 my-1 mr-1">
              {t}
            </span>
          ))}
        </div>
      </div>
    )
  );
}

export default Video;
