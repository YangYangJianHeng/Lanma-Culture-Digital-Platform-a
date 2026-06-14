import React, { useEffect } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '../store/useAuthStore';
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';

const Home = React.lazy(() => import('../pages/home/Home'));
const Museum = React.lazy(() => import('../pages/culture/Museum'));
const Publication = React.lazy(() => import('../pages/culture/Publication'));
const PublicationDetail = React.lazy(() => import('../pages/culture/PublicationDetail'));
const Map = React.lazy(() => import('../pages/culture/Map'));
const Stories = React.lazy(() => import('../pages/stories/Stories'));
const StoryDetail = React.lazy(() => import('../pages/stories/StoryDetail'));
const Weather = React.lazy(() => import('../pages/culture/Weather'));
const MarathonIntro = React.lazy(() => import('../pages/culture/MarathonIntro'));
const Food = React.lazy(() => import('../pages/culture/Food'));
const FoodDetail = React.lazy(() => import('../pages/culture/FoodDetail'));
const Tourism = React.lazy(() => import('../pages/culture/Tourism'));
const TourismDetail = React.lazy(() => import('../pages/culture/TourismDetail'));
const AiAssistant = React.lazy(() => import('../pages/culture/AiAssistant'));
const Login = React.lazy(() => import('../pages/auth/Login'));
const Register = React.lazy(() => import('../pages/auth/Register'));
const DashboardHome = React.lazy(() => import('../pages/dashboard/DashboardHome'));
const StoryEditor = React.lazy(() => import('../pages/dashboard/StoryEditor'));
const Profile = React.lazy(() => import('../pages/dashboard/Profile'));
const AdminHome = React.lazy(() => import('../pages/admin/AdminHome'));
const UserManage = React.lazy(() => import('../pages/admin/UserManage'));
const MarathonManage = React.lazy(() => import('../pages/admin/MarathonManage'));
const MedalManage = React.lazy(() => import('../pages/admin/MedalManage'));
const LandmarkManage = React.lazy(() => import('../pages/admin/LandmarkManage'));
const StoryManage = React.lazy(() => import('../pages/admin/StoryManage'));
const WeatherManage = React.lazy(() => import('../pages/admin/WeatherManage'));
const FoodManage = React.lazy(() => import('../pages/admin/FoodManage'));
const TourismManage = React.lazy(() => import('../pages/admin/TourismManage'));
const CommentManage = React.lazy(() => import('../pages/admin/CommentManage'));
const PublicationManage = React.lazy(() => import('../pages/admin/PublicationManage'));
const RoleManage = React.lazy(() => import('../pages/admin/RoleManage'));
const AdminLogin = React.lazy(() => import('../pages/auth/AdminLogin'));

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <React.Suspense fallback={
    <div className="flex justify-center items-center" style={{ minHeight: 400 }}>
      <Spin size="large" />
    </div>
  }>
    {children}
  </React.Suspense>
);

const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initialized, init } = useAuthStore();

  useEffect(() => {
    init();
  }, []);

  if (!initialized) {
    return (
      <div className="flex justify-center items-center h-screen flex-col gap-2">
        <Spin size="large" />
        <span style={{ color: '#999', fontSize: 14 }}>加载中...</span>
      </div>
    );
  }

  return <>{children}</>;
};

export const router = (createBrowserRouter as any)([
  {
    path: '/',
    element: (
      <AppInitializer>
        <MainLayout />
      </AppInitializer>
    ),
    children: [
      { index: true, element: <SuspenseWrapper><Home /></SuspenseWrapper> },
      { path: 'museum', element: <SuspenseWrapper><Museum /></SuspenseWrapper> },
      { path: 'publications', element: <SuspenseWrapper><Publication /></SuspenseWrapper> },
      { path: 'publications/:id', element: <SuspenseWrapper><PublicationDetail /></SuspenseWrapper> },
      { path: 'map', element: <SuspenseWrapper><Map /></SuspenseWrapper> },
      { path: 'stories', element: <SuspenseWrapper><Stories /></SuspenseWrapper> },
      { path: 'stories/:id', element: <SuspenseWrapper><StoryDetail /></SuspenseWrapper> },
      { path: 'marathons', element: <SuspenseWrapper><MarathonIntro /></SuspenseWrapper> },
      { path: 'weather', element: <SuspenseWrapper><Weather /></SuspenseWrapper> },
      { path: 'food', element: <SuspenseWrapper><Food /></SuspenseWrapper> },
      { path: 'food/:id', element: <SuspenseWrapper><FoodDetail /></SuspenseWrapper> },
      { path: 'tourism', element: <SuspenseWrapper><Tourism /></SuspenseWrapper> },
      { path: 'tourism/:id', element: <SuspenseWrapper><TourismDetail /></SuspenseWrapper> },
      { path: 'ai', element: <SuspenseWrapper><AiAssistant /></SuspenseWrapper> },
      { path: 'login', element: <SuspenseWrapper><Login /></SuspenseWrapper> },
      { path: 'register', element: <SuspenseWrapper><Register /></SuspenseWrapper> }
    ]
  },
  {
    path: '/dashboard',
    element: (
      <AppInitializer>
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      </AppInitializer>
    ),
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <SuspenseWrapper><DashboardHome /></SuspenseWrapper> },
          { path: 'stories/new', element: <SuspenseWrapper><StoryEditor /></SuspenseWrapper> },
          { path: 'stories/:id/edit', element: <SuspenseWrapper><StoryEditor /></SuspenseWrapper> },
          { path: 'profile', element: <SuspenseWrapper><Profile /></SuspenseWrapper> }
        ]
      }
    ]
  },
  {
    path: '/admin',
    element: (
      <AppInitializer>
        <ProtectedRoute requireAdmin>
          <MainLayout />
        </ProtectedRoute>
      </AppInitializer>
    ),
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <SuspenseWrapper><AdminHome /></SuspenseWrapper> },
          { path: 'users', element: <SuspenseWrapper><UserManage /></SuspenseWrapper> },
          { path: 'marathons', element: <SuspenseWrapper><MarathonManage /></SuspenseWrapper> },
          { path: 'medals', element: <SuspenseWrapper><MedalManage /></SuspenseWrapper> },
          { path: 'landmarks', element: <SuspenseWrapper><LandmarkManage /></SuspenseWrapper> },
          { path: 'stories', element: <SuspenseWrapper><StoryManage /></SuspenseWrapper> },
          { path: 'weather', element: <SuspenseWrapper><WeatherManage /></SuspenseWrapper> },
          { path: 'foods', element: <SuspenseWrapper><FoodManage /></SuspenseWrapper> },
          { path: 'tourism', element: <SuspenseWrapper><TourismManage /></SuspenseWrapper> },
          { path: 'comments', element: <SuspenseWrapper><CommentManage /></SuspenseWrapper> },
          { path: 'publications', element: <SuspenseWrapper><PublicationManage /></SuspenseWrapper> },
          { path: 'roles', element: <SuspenseWrapper><RoleManage /></SuspenseWrapper> }
        ]
      }
    ]
  },
  {
    path: '/admin/login',
    element: (
      <AppInitializer>
        <SuspenseWrapper><AdminLogin /></SuspenseWrapper>
      </AppInitializer>
    )
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
], { future: { v7_startTransition: true } });
