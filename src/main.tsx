import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import './index.css';
import ReactDOM from 'react-dom/client';
import React from 'react';
import { NDKContextProvider } from './utils/ndk';
import Home from './pages/Home/index';
import Video from './pages/Video';
import Recover from './pages/Recover';
import Archive from './pages/Archive';
import Settings from './pages/Settings/index';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      <Route path="/author/:author" element={<Home />} />
      <Route path="/v/:video" element={<Video />} />
      <Route path="/recover/:video" element={<Recover />} />
      <Route path="/archive" element={<Archive />} />
      <Route path="/settings" element={<Settings />} />
    </Route>
  )
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NDKContextProvider>
      <RouterProvider router={router} />
    </NDKContextProvider>
  </React.StrictMode>
);
