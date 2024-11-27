import { useEffect, useMemo, useState } from 'react';
import { useNDK } from '../utils/ndk';
import { nip19 } from 'nostr-tools';
import { AddressPointer } from 'nostr-tools/nip19';
import { NDKFilter, NDKRelaySet } from '@nostr-dev-kit/ndk';
import { mapVideoData, VideoData } from '../utils/utils';
import { useSettings } from './Settings/useSettings';

const checkUrl = async (url: string): Promise<string> => {
  // Create an instance of AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(); // Abort the fetch request after 10 seconds
  }, 5000); // 10000 milliseconds = 10 seconds

  try {
    // Pass the abort signal to the fetch options
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    if (response.ok) {
      return url; // File is available
    } else {
      throw new Error(`Status ${response.status}`);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 5 seconds');
    }
    throw error; // Re-throw other errors
  } finally {
    clearTimeout(timeoutId); // Clear the timeout to prevent memory leaks
  }
};

/**
 * Finds the first available server that hosts the file corresponding to the given hash.
 *
 * @param servers - An array of server base URLs.
 * @param hash - The hash string to append to each server URL.
 * @returns A Promise that resolves to the first available full URL or null if none are available.
 */
export async function findFirstAvailableServer(servers: string[], hash: string): Promise<string | undefined> {
  // Construct full URLs by combining each server with the hash
  const firstUrls = servers.map(server => `${server.replace(/\/+$/, '')}/${hash}`);

  // Create an array of Promises for each HEAD request
  const fetchPromises = firstUrls.map(url => checkUrl(url));

  try {
    // Promise.any resolves as soon as any Promise resolves
    const firstAvailableUrl = await Promise.any(fetchPromises);
    return firstAvailableUrl;
  } catch (error) {}
}

export async function findFirstAvailableServerMultiPass(
  serverLists: string[][],
  hash: string
): Promise<string | undefined> {
  for (const serverList of serverLists) {
    try {
      const url = await findFirstAvailableServer(serverList, hash);
      if (url) return url;
    } catch (e) {}
  }
}

export const useVideoData = (video?: string) => {
  const { ndk } = useNDK();
  const [videoData, setVideoData] = useState<VideoData>();

  const naddr = useMemo(() => nip19.decode(video as string).data as AddressPointer, [video]);

  const filter = useMemo(() => {
    return {
      kinds: [naddr.kind],
      authors: [naddr.pubkey],
      '#d': [naddr.identifier],
    } as NDKFilter;
  }, [naddr]);

  useEffect(() => {
    ndk.fetchEvent(filter, undefined, NDKRelaySet.fromRelayUrls(naddr.relays || [], ndk)).then(event => {
      if (event) {
        setVideoData(mapVideoData(event));
      } else {
        setVideoData(undefined);
      }
    });
  }, [filter, naddr.relays]);

  return {
    videoData,
  };
};

export function usePlayableVideoUrl(videoData: VideoData | undefined, userServers: string[]) {
  const [videoUrl, setVideoUrl] = useState<string>();
  const [noServerFound, setNoServerFound] = useState(false);
  const { blossomServersForDownload } = useSettings();

  const findVideoUrl = async (x?: string) => {
    setVideoUrl(undefined);
    if (x) {
      setNoServerFound(false);
      const vidUrl = await findFirstAvailableServerMultiPass([blossomServersForDownload, userServers], x);
      if (vidUrl) {
        setVideoUrl(vidUrl);
      } else {
        setNoServerFound(true);
      }
    }
  };

  useEffect(() => {
    findVideoUrl(videoData?.x);
  }, [videoData, videoData?.x]);

  return {
    videoUrl,
    findVideoUrl,
    noServerFound,
  };
}
