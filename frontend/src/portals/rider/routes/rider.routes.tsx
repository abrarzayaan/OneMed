import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { RiderGuard } from '../components/RiderGuard';
import { RiderLoginPage } from '../pages/RiderLoginPage';
import { RiderRegisterPage } from '../pages/RiderRegisterPage';
import { RiderPendingPage } from '../pages/RiderPendingPage';
import { RiderDashboardPage } from '../pages/RiderDashboardPage';
import { RiderOrdersPage } from '../pages/RiderOrdersPage';
import { RiderProfilePage } from '../pages/RiderProfilePage';

export const riderRoutes: RouteObject[] = [
  {
    path: '/rider/login',
    element: <RiderLoginPage />,
  },
  {
    path: '/rider/register',
    element: <RiderRegisterPage />,
  },
  {
    path: '/rider',
    element: <RiderGuard />,
    children: [
      {
        index: true,
        element: <Navigate to="/rider/dashboard" replace />,
      },
      {
        path: 'pending',
        element: <RiderPendingPage />,
      },
      {
        path: 'dashboard',
        element: <RiderDashboardPage />,
      },
      {
        path: 'orders',
        element: <RiderOrdersPage />,
      },
      {
        path: 'profile',
        element: <RiderProfilePage />,
      },
    ],
  },
];
