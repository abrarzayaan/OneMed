import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { VendorLayout } from '../components/VendorLayout';
import { VendorGuard } from '../components/VendorGuard';
import { VendorLoginPage } from '../pages/VendorLoginPage';
import { VendorRegisterPage } from '../pages/VendorRegisterPage';
import { VendorDashboardPage } from '../pages/VendorDashboardPage';
import { VendorInventoryPage } from '../pages/VendorInventoryPage';
import { VendorProfilePage } from '../pages/VendorProfilePage';
import { VendorPendingPage } from '../pages/VendorPendingPage';

export const vendorRoutes: RouteObject[] = [
  // Public Vendor Auth Routes
  {
    path: '/vendor/login',
    element: <VendorLoginPage />,
  },
  {
    path: '/vendor/register',
    element: <VendorRegisterPage />,
  },

  // Protected Vendor Routes (Authenticated)
  {
    element: <VendorGuard />,
    children: [
      {
        path: '/vendor/pending',
        element: <VendorPendingPage />,
      },
      {
        element: <VendorLayout />,
        children: [
          {
            path: '/vendor',
            element: <VendorDashboardPage />,
          },
          {
            path: '/vendor/dashboard',
            element: <VendorDashboardPage />,
          },
          {
            path: '/vendor/inventory',
            element: <VendorInventoryPage />,
          },
          {
            path: '/vendor/profile',
            element: <VendorProfilePage />,
          },
        ],
      },
    ],
  },
];
