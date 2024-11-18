import { useEffect, useMemo, useState } from 'react';
import { formatDate, getProxyUrl, mapVideoData, toTime, VideoData, VideoFormat } from '../../utils/utils';
import LazyLoad from 'react-lazyload';
import MiniSearch from 'minisearch';
import { useNDK } from '../../utils/ndk';
import { NDKFilter, NDKKind, NDKRelaySet, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import { useNavigate, useParams } from 'react-router-dom';
import { SearchIcon } from '../../components/icons/SearchIcon';
import {
  CalendarDaysIcon,
  DevicePhoneMobileIcon,
  FunnelIcon,
  GlobeEuropeAfricaIcon,
  RectangleGroupIcon,
  SparklesIcon,
  TvIcon,
} from '@heroicons/react/24/outline';
import { DropDown } from '../../components/DropDown';
import { Input } from '../../components/Input';
import { useSettings } from '../Settings/useSettings';
import { ConfigNeeded } from './ConfigNeeded';

const miniSearch = new MiniSearch<VideoData>({
  idField: 'eventId',
  fields: ['title', 'd', 'description', 'author', 'tags'], // fields to index for full-text search
  storeFields: ['duration', 'published_year', 'format', 'source', 'author'], // fields to return with search results
  searchOptions: {
    boost: { title: 2 },
    fuzzy: 0.2,
  },
});

let allVideos: Record<string, VideoData> = {};
function Home() {
  const { ndk } = useNDK();
  const { author } = useParams();
  const [videos, setVideos] = useState<VideoData[] | undefined>(undefined);
  const navigate = useNavigate();
  const [format, setFormat] = useState<VideoFormat | 'both'>('widescreen');
  const [searchText, setSearchText] = useState('');
  const [source, setSource] = useState<string | 'all'>('youtube');
  const [videoFilter, setVideoFilter] = useState<NDKFilter | undefined>();
  const [loading, setLoading] = useState(false);
  const [unblurred, setUnblurred] = useState<Record<string, boolean>>({});
  const [allSources, setAllSources] = useState<Record<string, boolean>>({});
  const [allYears, setAllYears] = useState<Record<number, boolean>>({});
  const [year, setYear] = useState('');
  const { relays, blossomServersForDownload } = useSettings();

  useEffect(() => {
    if (author) {
      document.title = 'novia | ' + author;
    } else {
      document.title = 'novia - NOSTR Video Archive';
    }
  }, [author]);

  useEffect(() => {
    const main: NDKFilter = {
      kinds: [NDKKind.HorizontalVideo, NDKKind.VerticalVideo],
      limit: 200,
    };
    if (author) {
      setVideoFilter({ ...main, '#c': [author] });
      setFormat('both');
      setSource('all');
      setSearchText('');
    } else {
      setVideoFilter(vf => {
        const filter = { ...vf };
        delete filter['#c'];
        delete filter['until'];
        return filter;
      });
    }
  }, [author]);

  useEffect(() => {
    if (!videoFilter) return;
    let foundANewEvent = false;

    let oldestTimestamp = Infinity;
    // if (Object.keys(allVideos).length == 0) {
    const archiveSubscription = ndk.subscribe(
      videoFilter,
      {
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
        closeOnEose: true,
      },
      NDKRelaySet.fromRelayUrls(relays, ndk)
    );

    archiveSubscription.on('event', e => {
      setLoading(true);
      const video = mapVideoData(e); // today handle newer events (replacable!!)

      if (video.contentWarning) return; // ignore adult content (for now)

      if (video.source && !allSources[video.source]) {
        const s = video.source;
        setAllSources(old => ({ ...old, [s]: true }));
      }
      if (video.published_year && video.published_at > 0 && !allSources[video.published_year]) {
        setAllYears(old => ({ ...old, [video.published_year]: true }));
      }

      if (!miniSearch.has(video.eventId)) {
        foundANewEvent = true;
        allVideos[video.eventId] = video;
        miniSearch.add(video);
      }
      oldestTimestamp = Math.min(oldestTimestamp, e.created_at || oldestTimestamp);
    });
    archiveSubscription.on('eose', () => {
      console.log('Video count on ose', Object.keys(allVideos).length);
      doSearch();
      if (foundANewEvent) {
        setVideoFilter(vf => ({ ...vf, until: oldestTimestamp - 1 }));
      } else {
        setLoading(false);
      }
    });
    archiveSubscription.on('close', () => {
      doSearch();
    });

    archiveSubscription.start();
  }, [videoFilter]);

  function doSearch() {
    if (searchText) {
      setVideos(
        miniSearch
          .search(searchText, {
            filter: result =>
              (format == 'both' || result.format == format) &&
              (source == 'all' || result.source == source) &&
              (year == '' || result.published_year == year) &&
              (author == undefined || result.author == author),
          })
          .map(sr => allVideos[sr.id])
      );
    } else {
      const newVideos = Object.values(allVideos)
        .filter(v => format == 'both' || v.format == format)
        .filter(v => source == 'all' || v.source == source)
        .filter(v => year == '' || v.published_year == year)
        .filter(v => author == undefined || v.author == author);
      newVideos.sort((a, b) => (a.published_at > b.published_at ? -1 : 1));
      setVideos(newVideos.slice(0, 200));
    }
  }

  useEffect(() => {
    doSearch();
  }, [searchText, format, source, author, year]);

  const handleSourceSelection = (newSource: string) => {
    navigate('/');
    setSource(newSource);
    setYear('');

    switch (newSource) {
      case 'youtube':
        setFormat('widescreen');
        break;
      case 'twitter':
        setFormat('vertical');
        break;
      case 'tiktok':
        setFormat('vertical');
        break;
      case 'all':
        setFormat('both');
        break;
    }
  };

  const videoClicked = (video: VideoData) => {
    if (video.contentWarning && !unblurred[video.eventId]) {
      setUnblurred(old => ({ ...old, [video.eventId]: true }));
    } else {
      navigate(`/v/${video.naddr}`);
    }
  };

  const sourceOptions = useMemo(() => {
    const srcs = Object.keys(allSources);
    return [
      {
        value: 'all',
        label: 'all sources',
        icon: <SparklesIcon className="w-4" />,
      },
      ...srcs.sort().map(o => ({
        value: o,
        label: o,
        icon: <GlobeEuropeAfricaIcon className="w-4" />,
      })),
    ];
  }, [allSources]);

  const yearOptions = useMemo(() => {
    const years = Object.keys(allYears);
    return [
      {
        value: '',
        label: 'all years',
        icon: <FunnelIcon className="w-4" />,
      },
      ...years
        .sort((a, b) => (a < b ? -1 : 1))
        .map(o => ({
          value: o,
          label: o,
          icon: <CalendarDaysIcon className="w-4" />,
        })),
    ];
  }, [allSources]);

  const formatOptions = useMemo(
    () => [
      {
        value: 'both',
        label: 'all formats',
        icon: <RectangleGroupIcon className="w-4" />,
      },
      {
        value: 'widescreen',
        label: 'widescreen',
        icon: <TvIcon className="w-4" />,
      },
      {
        value: 'vertical',
        label: 'vertical',
        icon: <DevicePhoneMobileIcon className="w-4" />,
      },
    ],
    []
  );

  if (relays.length == 0) {
    return <ConfigNeeded message='No Relays found'/>
  }

  if (blossomServersForDownload.length == 0) {
    return <ConfigNeeded message='No servers to look up videos found'/>
  }

  return (
    <>
      {loading && <progress className="progress progress-primary absolute left-0 w-full h-1 " />}

      <div className="flex flex-col mx-auto max-w-[80em] w-full">
        <div className="flex items-center justify-center py-2 md:py-4 gap-2 md:gap-4 w-full">
          <DropDown value={source} setValue={v => handleSourceSelection(v)} options={sourceOptions} />
          <Input
            className="w-1/2"
            placeholder="filter videos"
            value={searchText}
            setValue={v => setSearchText(v)}
            icon={<SearchIcon className='w-6'/>}
          />
          <DropDown value={year} setValue={v => setYear(v)} options={yearOptions} />
          <DropDown
            value={format}
            align="right"
            setValue={(v: string) => setFormat(v as VideoFormat | 'both')}
            options={formatOptions}
          />
        </div>
        {author && (
          <div className="text-2xl py-4 mb-4">
            All videos by <span className="text-white">{author}</span>
          </div>
        )}
        {videos && videos.length > 0 && (
          <div className="grid gap-4 md:gap-8 rounded-md grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {videos.map(
              v =>
                v.image && (
                  <LazyLoad key={v.eventId}>
                    <a className="flex flex-col cursor-pointer">
                      <div className="h-48 w-full relative">
                        <img
                          onClick={() => videoClicked(v)}
                          className={`rounded-lg object-cover w-full h-full ${v.contentWarning && !unblurred[v.eventId] && 'blur-md '}`}
                          src={getProxyUrl(v.image)}
                          loading="lazy"
                          alt={v.title} // Always good to include alt text for accessibility
                        />
                        {v.contentWarning && !unblurred[v.eventId] && (
                          <div className="absolute top-1/2 w-full text-white text-center pointer-events-none">
                            {v.contentWarning}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 font-bold text-white" onClick={() => navigate(`/author/${v.author}`)}>
                        {v.author}
                      </div>
                      <div className="text-sm text-left">{v.title}</div>
                      {v.duration && (
                        <div className="text-xs text-right text-white mt-1 ">
                          {toTime(v.duration)} | {formatDate(v.published_at)}
                        </div>
                      )}
                    </a>
                  </LazyLoad>
                )
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Home;
