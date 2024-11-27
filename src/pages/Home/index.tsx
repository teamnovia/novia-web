import { useEffect, useMemo, useState } from 'react';
import { mapVideoData, VideoData, VideoFormat } from '../../utils/utils';
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
import { useUserServers } from '../../utils/useUserServers';
import { VideoElement } from './VideoElement';

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
  const [source, setSource] = useState<string | 'all'>('all');
  const [videoFilter, setVideoFilter] = useState<NDKFilter>({
    kinds: [NDKKind.HorizontalVideo, NDKKind.VerticalVideo],
    limit: 400,
  });
  const [loading, setLoading] = useState(false);
  const [unblurred, setUnblurred] = useState<Record<string, boolean>>({});
  const [allSources, setAllSources] = useState<Record<string, boolean>>({});
  const [allYears, setAllYears] = useState<Record<number, boolean>>({});
  const [year, setYear] = useState('');
  const { relays, blossomServersForDownload } = useSettings();
  const { userServers } = useUserServers();

  useEffect(() => {
    if (author) {
      document.title = 'novia | ' + author;
    } else {
      document.title = 'novia - NOSTR Video Archive';
    }
  }, [author]);

  useEffect(() => {
    setVideoFilter(prev => {
      const newFilter = { ...prev };
      if (author && source != 'all') {
        newFilter['#c'] = [author, source];
      } else if (author) {
        newFilter['#c'] = [author];
      } else if (source != 'all') {
        newFilter['#c'] = [source];
      } else {
        delete newFilter['#c'];
      }
      delete newFilter['until'];

      return newFilter;
    });
  }, [author, source]);

  useEffect(() => {
    let foundANewEvent = false;
    let oldestTimestamp = Infinity;

    if (videoFilter.until == undefined) {
      miniSearch.removeAll(); // clear the search index
    }

    console.log('videoFilter', videoFilter);
    const archiveSubscription = ndk.subscribe(
      videoFilter,
      {
        cacheUsage: NDKSubscriptionCacheUsage.PARALLEL,
        closeOnEose: true,
      },
      NDKRelaySet.fromRelayUrls(relays, ndk)
    );

    archiveSubscription.on('event', e => {
      setLoading(true);
      const video = mapVideoData(e); // today handle newer events (replacable!!)

      if (video.contentWarning) return; // ignore adult content (for now)

      if (video.source && !allSources[video.source]) {
        setAllSources(old => ({ ...old, [video.source as string]: true }));
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
      newVideos.sort((a, b) => (a.published_at > b.published_at ? -1 : 1)); // published_at DESC
      setVideos(author ? newVideos : newVideos.slice(0, 200));
    }
  }

  const verticalVideoRatio = useMemo(() => {
    if (!videos) return 0;
    const numVertical = videos.reduce((prev, current) => prev + (current.format == 'vertical' ? 1 : 0), 0);
    return numVertical / videos.length;
  }, [videos]);

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
      default:
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
    return <ConfigNeeded message="No Relays found" />;
  }

  if (blossomServersForDownload.length == 0) {
    return <ConfigNeeded message="No servers to look up videos found" />;
  }

  return (
    <>
      {loading && <progress className="progress progress-primary absolute left-0 w-full h-1 " />}

      <div className="flex flex-col mx-auto max-w-[80em] w-full">
        <div className="flex items-center justify-center py-2 md:py-4 gap-2 md:gap-4 w-full">
          <DropDown value={source} setValue={v => handleSourceSelection(v)} options={sourceOptions} />
          <Input
            className="w-1/2"
            placeholder="Search"
            value={searchText}
            setValue={v => setSearchText(v)}
            icon={<SearchIcon className="w-6" />}
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
          <div
            className={`grid gap-4 md:gap-8 rounded-md ${format == 'vertical' || verticalVideoRatio > 0.95 ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'}`}
          >
            {videos.map(
              v =>
                v.image && (
                  <LazyLoad key={v.eventId}>
                    <VideoElement
                      vertical={format == 'vertical' || verticalVideoRatio > 0.95}
                      onClick={() => videoClicked(v)}
                      skipBlur={unblurred[v.eventId]}
                      video={v}
                      author={author}
                      userServers={userServers}
                    ></VideoElement>
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
