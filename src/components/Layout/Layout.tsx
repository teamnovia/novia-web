import { Outlet, useNavigate } from 'react-router-dom';
import { useNDK } from '../../utils/ndk';
import { useEffect } from 'react';
import useLocalStorageState from '../../utils/useLocalStorageState';
import ScrollToTop from '../ScrollToTop';
import { Cog6ToothIcon, PlusIcon } from '@heroicons/react/24/outline';
import LoginButton from '../LoginButton';
import { Notifications } from '../Notifications';

export const Layout = () => {
  const { user, loginWithExtension, logout } = useNDK();
  // const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [autoLogin, setAutoLogin] = useLocalStorageState('autologin', { defaultValue: false });
  const navigate = useNavigate();
  useEffect(() => {
    if (!user && autoLogin) loginWithExtension();
  }, []);

  return (
    <div className="flex flex-col justify-center">
      <ScrollToTop />
      <div className="navbar bg-base-300 min-h-0">
        <div className="navbar-start">
          <img src="/dl.png" className="w-8 ml-2 cursor-pointer" onClick={() => navigate('/')}></img>
          <div className="p-2 md:p-4 text-2xl cursor-pointer" onClick={() => navigate('/')}>
            <span>novia</span>
            <span className=" text-zinc-600 hidden md:inline"> - the nostr video archive</span>
          </div>
        </div>
        <div className="navbar-center hidden md:flex gap-2"></div>
        <div className="navbar-end flex gap-1 md:gap-2">
          {user?.profile?.displayName && (
            <button className="btn btn-primary" onClick={() => navigate('/archive')}>
              <PlusIcon />
            </button>
          )}
          <Notifications userServers={[]} />
          <button className="btn btn-ghost" onClick={() => navigate('/settings')}>
            <Cog6ToothIcon />
          </button>

          {user?.profile?.image ? (
            <div className="avatar pr-2">
              <div className="w-12 rounded-full">
                <a
                  className="link"
                  onClick={() => {
                    setAutoLogin(false);
                    logout();
                  }}
                >
                  <img src={user?.profile?.image} />
                </a>
              </div>
            </div>
          ) : (
            <LoginButton></LoginButton>
          )}
        </div>
      </div>
      <div className="flex flex-col self-center md:w-10/12 w-full min-h-[80vh] px-2 md:px-4">{<Outlet />}</div>
      <div className="justify-center gap-1 text-base-content pt-12 pb-12">
        <span className="flex flex-row gap-1 justify-center items-center">
          made with <span>💜</span>by team
          <a
            href="https://njump.me/npub1htfus9ztjchzlhjvjvqmrewfsw4fhdc8j6r4p0epjlglw9lhra4sa5re40"
            target="_blank"
            className="flex flex-row gap-1 items-center"
          >
            <div className="avatar">
              <div className="w-8 mx-1 rounded-full">
                <img src="/dl.png" />
              </div>
            </div>
            novia
          </a>
        </span>
      </div>
    </div>
  );
};
