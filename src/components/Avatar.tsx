import React, { useEffect, useState } from 'react';
import { useNDK } from '../utils/ndk';
import { NDKUserProfile } from '@nostr-dev-kit/ndk';

interface AvatarProps {
  npub: string;
}

const Avatar: React.FC<AvatarProps> = ({ npub }) => {
  const { ndk } = useNDK();
  const [profiles, setProfiles] = useState<Record<string, NDKUserProfile>>({});

  useEffect(() => {
    ndk
      .getUser({ npub })
      .fetchProfile()
      .then(up => up && setProfiles(profiles => ({ ...profiles, [npub]: up })));
  }, [ndk, npub]);

  const profile = profiles[npub];

  return (
    <div className="flex items-center">
      <img
        className="mr-2 rounded-sm"
        width={32}
        height={32}
        src={profile && profile.image ? profile.image : `https://robohash.org/${npub}.png`}
        alt="Avatar"
      />
      {profile?.displayName || profile?.name || npub.substring(0, 14)}
    </div>
  );
};

export default Avatar;
