import { createBrowserRouter } from 'react-router-dom';
import { consumerRoutes } from '@/portals/consumer/routes/consumer.routes';
import { adminRoutes } from '@/portals/admin/routes/admin.routes';
import { riderRoutes } from '@/portals/rider/routes/rider.routes';
import { vendorRoutes } from '@/portals/vendor/routes/vendor.routes';

export const router = createBrowserRouter([
  ...consumerRoutes,
  ...adminRoutes,
  ...riderRoutes,
  ...vendorRoutes,
]);
