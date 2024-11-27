import { Outlet, useNavigate } from 'react-router-dom';
import { useNDK } from '../../utils/ndk';
import './Layout.css';
import { useEffect } from 'react';
import useLocalStorageState from '../../utils/useLocalStorageState';
import ScrollToTop from '../ScrollToTop';
import {  Cog6ToothIcon, PlusIcon } from '@heroicons/react/24/outline';
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
    <div className="main">
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
      <div className="content">{<Outlet />}</div>
      <div className="footer">
        <span className="flex flex-row gap-1 items-center">
          made with <span>💜</span>by team
          <a href="https://njump.me/" className="flex flex-row gap-1 items-center">
            <div className="avatar">
              <div className="w-8 rounded-full">
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
