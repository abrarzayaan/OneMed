import { createBrowserRouter, Navigate } from 'react-router-dom';
import React, { lazy, Suspense } from 'react';
import { adminRoutes } from '@/portals/admin/routes/admin.routes';
import { riderRoutes } from '@/portals/rider/routes/rider.routes';
import { vendorRoutes } from '@/portals/vendor/routes/vendor.routes';
import { consumerRoutes } from '@/portals/consumer/routes/consumer.routes';
import PageLoader from '@/components/ui/PageLoader';

const NotFoundPage = lazy(() => import('@/portals/consumer/pages/NotFoundPage'));

export const router = createBrowserRouter([
  // If static server ever redirects to /index.html, gracefully send to root
  {
    path: '/index.html',
    element: <Navigate to="/" replace />,
  },
  ...adminRoutes,
  ...riderRoutes,
  ...vendorRoutes,
  ...consumerRoutes,
  // Catch-all 404 at the very end of all portals
  {
    path: '*',
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);
