import React, { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import Layout from '@/portals/consumer/components/layout/Layout';
import ProtectedRoute from '@/router/ProtectedRoute';
import PageLoader from '@/components/ui/PageLoader';

const HomePage          = lazy(() => import('@/portals/consumer/pages/HomePage'));
const ProductListPage   = lazy(() => import('@/portals/consumer/pages/ProductListPage'));
const VariantDetailPage = lazy(() => import('@/portals/consumer/pages/VariantDetailPage'));
const CartPage          = lazy(() => import('@/portals/consumer/pages/CartPage'));
const WishlistPage      = lazy(() => import('@/portals/consumer/pages/WishlistPage'));
const CheckoutPage      = lazy(() => import('@/portals/consumer/pages/CheckoutPage'));
const OrderSuccessPage  = lazy(() => import('@/portals/consumer/pages/OrderSuccessPage'));
const OrdersPage        = lazy(() => import('@/portals/consumer/pages/OrdersPage'));
const OrderDetailPage   = lazy(() => import('@/portals/consumer/pages/OrderDetailPage'));
const OrderTrackingPage = lazy(() => import('@/portals/consumer/pages/OrderTrackingPage'));
const ProfilePage       = lazy(() => import('@/portals/consumer/pages/ProfilePage'));
const AddressesPage     = lazy(() => import('@/portals/consumer/pages/AddressesPage'));
const LoginPage         = lazy(() => import('@/portals/consumer/pages/LoginPage'));
const RegisterPage      = lazy(() => import('@/portals/consumer/pages/RegisterPage'));
const NotFoundPage      = lazy(() => import('@/portals/consumer/pages/NotFoundPage'));

const wrap = (el: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{el}</Suspense>
);

export const consumerRoutes: RouteObject[] = [
  // Auth routes (no layout)
  { path: '/login',    element: wrap(<LoginPage />) },
  { path: '/register', element: wrap(<RegisterPage />) },

  // Public Consumer routes
  {
    element: <Layout />,
    children: [
      { path: '/',             element: wrap(<HomePage />) },
      { path: '/products',     element: wrap(<ProductListPage />) },
      { path: '/variants/:id', element: wrap(<VariantDetailPage />) },
      { path: '/wishlist',     element: wrap(<WishlistPage />) },
    ],
  },

  // Protected Consumer routes
  {
    element: <Layout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/cart',                        element: wrap(<CartPage />) },
          { path: '/checkout',                    element: wrap(<CheckoutPage />) },
          { path: '/order-success/:orderId',      element: wrap(<OrderSuccessPage />) },
          { path: '/account/orders',              element: wrap(<OrdersPage />) },
          { path: '/account/orders/:id',          element: wrap(<OrderDetailPage />) },
          { path: '/account/orders/:id/tracking', element: wrap(<OrderTrackingPage />) },
          { path: '/account/profile',             element: wrap(<ProfilePage />) },
          { path: '/account/addresses',           element: wrap(<AddressesPage />) },
        ],
      },
    ],
  },

  // Fallback 404
  { path: '*', element: wrap(<NotFoundPage />) },
];
