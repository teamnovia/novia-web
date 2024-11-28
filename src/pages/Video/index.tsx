import { formatFileSize, toTime } from '../../utils/utils';
import { usePlayableVideoUrl, useVideoData } from '../useVideoData';
import { useNavigate, useParams } from 'react-router-dom';
import { useNDK } from '../../utils/ndk';
import { useEffect, useState } from 'react';
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
import { useUserServers } from '../../utils/useUserServers';
import { InfoCard } from './InfoCard';

function Video() {
  const { user } = useNDK();
  const { video } = useParams();
  const { videoData: vd } = useVideoData(video);
  const { userServers } = useUserServers();
  const { videoUrl, findVideoUrl, noServerFound } = usePlayableVideoUrl(vd, userServers);
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    document.title = 'novia | ' + vd?.title;
  }, [vd?.title]);

  const handleError = async (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const error = (e.target as HTMLVideoElement).error;

    if (error) {
      let errorMessage;

      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          errorMessage = 'The video playback was aborted.';
          break;
        case error.MEDIA_ERR_NETWORK:
          errorMessage = 'A network error caused the video download to fail.';
          break;
        case error.MEDIA_ERR_DECODE:
          errorMessage = 'The video playback was aborted due to a decoding error.';
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'The video format is not supported or the file is missing.';
          break;
        default:
          errorMessage = 'An unknown error occurred.';
      }

      setErrorMessage(`Video Error: ${errorMessage}`);
      console.error(`Video Error: ${errorMessage}`);
      await findVideoUrl();
    }
  };

  return (
    vd && (
      <div className="mt-4 gap-4 flex flex-col">
        {errorMessage && <span className="alert alert-error">{errorMessage} </span>}
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
            playsInline
            muted={false}
            poster={vd.image}
            onError={e => handleError(e)}
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

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex flex-col flex-grow">
            <div>
              {vd.author && (
                <div className="text-sm cursor-pointer" onClick={() => navigate(`/author/${vd.author}`)}>
                  {vd.author}
                </div>
              )}
            </div>
            <h2 className="flex-grow text-2xl text-white mb-4">{vd?.title}</h2>

            <div className=" whitespace-pre-wrap break-all">{vd?.description}</div>
            <div className="break-keep leading-8">
              {vd.tags.map(t => (
                <span key={t} className="inline-block bg-base-200 rounded-xl px-2 my-1 mr-1">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <InfoCard videoData={vd}></InfoCard>
        </div>
      </div>
    )
  );
}

export default Video;
