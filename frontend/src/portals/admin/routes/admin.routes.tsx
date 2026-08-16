import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { AdminGuard } from '../components/AdminGuard';
import { DashboardOverview } from '../pages/DashboardOverview';
import { OrderFulfillmentPage } from '../pages/OrderFulfillmentPage';
import { CatalogDiscountPage } from '../pages/CatalogDiscountPage';
import { MasterCreationHubPage } from '../pages/MasterCreationHubPage';
import { CmsBannerPage } from '../pages/CmsBannerPage';
import { RbacManagementPage } from '../pages/RbacManagementPage';
import { ModelExplorerPage } from '../pages/ModelExplorerPage';
import { InventoryManagementPage } from '../pages/InventoryManagementPage';
import { VendorSettlementPage } from '../pages/VendorSettlementPage';
import { VendorVerificationPage } from '../pages/VendorVerificationPage';
import { RiderVerificationPage } from '../pages/RiderVerificationPage';
import { LogisticsFleetPage } from '../pages/LogisticsFleetPage';
import { AdminSectionPlaceholder } from '../pages/AdminSectionPlaceholder';
import {
  FileCheck2,
  Percent,
  History,
} from 'lucide-react';

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: <AdminGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <DashboardOverview />,
          },
          {
            path: 'orders',
            element: <OrderFulfillmentPage />,
          },
          {
            path: 'prescriptions',
            element: (
              <AdminSectionPlaceholder
                title="Prescription Rx Verification Queue"
                sectionNumber="SECTION 08"
                badgeText="Pharmacist Review Queue"
                description="High-resolution Rx image pan/zoom tool, customer order item split verification, and digital prescription sign-off."
                icon={FileCheck2}
              />
            ),
          },
          {
            path: 'creation',
            element: <MasterCreationHubPage />,
          },
          {
            path: 'catalog',
            element: <CatalogDiscountPage />,
          },
          {
            path: 'inventory',
            element: <InventoryManagementPage />,
          },
          {
            path: 'cms',
            element: <CmsBannerPage />,
          },
          {
            path: 'promotions',
            element: (
              <AdminSectionPlaceholder
                title="Marketing, Flash Sales & Promo Coupons"
                sectionNumber="SECTION 12"
                badgeText="Marketing Engine"
                description="Create percentage or flat discount coupons, configure minimum order rules, usage limits, and homepage flash sale timers."
                icon={Percent}
              />
            ),
          },
          {
            path: 'vendor-verification',
            element: <VendorVerificationPage />,
          },
          {
            path: 'rider-verification',
            element: <RiderVerificationPage />,
          },
          {
            path: 'vendors',
            element: <VendorSettlementPage />,
          },
          {
            path: 'logistics',
            element: <LogisticsFleetPage />,
          },
          {
            path: 'rbac',
            element: <RbacManagementPage />,
          },
          {
            path: 'explorer',
            element: <ModelExplorerPage />,
          },
          {
            path: 'audit-logs',
            element: (
              <AdminSectionPlaceholder
                title="System Audit & Security Logs"
                sectionNumber="SECTION 08"
                badgeText="Security Audit History"
                description="Timestamped log tracking for every administrative action, stock override, user deletion, and status change."
                icon={History}
              />
            ),
          },
        ],
      },
    ],
  },
];
