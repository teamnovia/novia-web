import { sha256 } from '@noble/hashes/sha256';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import dayjs from 'dayjs';
import { nip19 } from 'nostr-tools';
import { PROXY_URL } from '../env';

export const formatFileSize = (size: number) => {
  if (size < 1024) {
    return size + ' B';
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(1) + ' KB';
  } else if (size < 1024 * 1024 * 1024) {
    return (size / 1024 / 1024).toFixed(1) + ' MB';
  } else {
    return (size / 1024 / 1024 / 1024).toFixed(1) + ' GB';
  }
};

interface MyObject {
  [key: string]: any;
}

export function hashSha256(obj: MyObject): string {
  const jsonString = JSON.stringify(obj);

  const hashBuffer = sha256(new TextEncoder().encode(jsonString));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/** returns the last sha256 in a URL */
export function getHashFromURL(url: string | URL) {
  if (typeof url === 'string') url = new URL(url);

  const hashes = Array.from(url.pathname.matchAll(/[0-9a-f]{64}/gi));
  if (hashes.length > 0) return hashes[hashes.length - 1][0];

  return null;
}

export const formatDate = (unixTimeStamp: number): string => {
  const ts = unixTimeStamp > 1711200000000 ? unixTimeStamp / 1000 : unixTimeStamp;
  if (ts == 0) return 'never';
  return dayjs(ts * 1000).format('YYYY-MM-DD');
};

export function extractDomain(url: string): string | null {
  const regex = /^(https?:\/\/)([^/]+)/;
  const match = url.match(regex);
  return match ? match[2]?.toLocaleLowerCase() : null;
}

export const getProxyUrl = (url: string) => {
  if (url.startsWith('blob:')) {
    return url;
  }
  return `${PROXY_URL}${encodeURI(url)}`;
};

export const toTime = (seconds: number) => {
  return `${Math.floor(seconds / 60)}m ${seconds % 60 >= 10 ? seconds % 60 : '0' + (seconds % 60)}s`;
};

export const getTagValue = (ev: NDKEvent, tagKey: string, postfix?: string): string | undefined => {
  const tag = ev.tags.find(t => t[0] == tagKey && (postfix == undefined || postfix == t[2]));
  if (!tag) return undefined;
  return tag[1];
};

export type VideoFormat = 'widescreen' | 'vertical';

export type VideoData = {
  eventId: string;
  archivedByNpub: string;
  identifier: string;
  x?: string;
  url: string | undefined;
  published_at: number;
  published_year: string;
  image: string | undefined;
  author?: string;
  source?: string;
  title: string | undefined;
  duration: number;
  description?: string;
  size: number;
  naddr: `naddr1${string}`;
  originalUrl?: string;
  dim?: string;
  tags: string[];
  format: VideoFormat;
  relayUrl?: string;
  contentWarning?: string;
  language?: string;
};

export function mapVideoData(ev: NDKEvent): VideoData {
  const pub = parseInt(getTagValue(ev, 'published_at') || '0', 10);

  //`dim ${video.width}x${video.height}`,

  const iMetaTags = ev.tags.filter(t => t[0] == 'imeta');

  let dim = undefined;
  if (iMetaTags.length > 0) {
    const dimField = iMetaTags[0].find(s => s.startsWith('dim '));
    if (dimField) {
      dim = dimField.substring(4);
    }
  }

  return {
    eventId: ev.id,
    archivedByNpub: nip19.npubEncode(ev.pubkey),
    identifier: getTagValue(ev, 'd') || ev.id,
    x: getTagValue(ev, 'x'),
    url: getTagValue(ev, 'url'), // todo add imeta parsing
    published_at: pub,
    published_year: `${new Date(pub * 1000).getUTCFullYear()}`,
    image: getTagValue(ev, 'image'), // todo add imeta parsing
    title: getTagValue(ev, 'title'),
    duration: parseInt(getTagValue(ev, 'duration') || '0', 10),
    source: getTagValue(ev, 'c', 'source'),
    author: getTagValue(ev, 'c', 'author'),
    description: getTagValue(ev, 'summary'),
    size: parseInt(getTagValue(ev, 'size') || '0', 10),
    originalUrl: getTagValue(ev, 'r'),
    tags: ev.tags.filter(t => t[0] == 't').map(t => t[1]),
    format: ev.kind == NDKKind.HorizontalVideo ? 'widescreen' : 'vertical',
    contentWarning: getTagValue(ev, 'content-warning'),
    language: getTagValue(ev, 'l', 'ISO-639-1'),
    dim,
    naddr: nip19.naddrEncode({
      identifier: getTagValue(ev, 'd'),
      pubkey: ev.pubkey,
      kind: ev.kind,
      relays: ev.relay?.url && [ev.relay.url],
    } as nip19.AddressPointer),
    relayUrl: ev.relay?.url,
  };
}
