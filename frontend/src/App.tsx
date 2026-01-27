import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import Layout from './Layout';
import Main from './pages/main/Main';
import EventDetail from './pages/event-detail/EventDetail';
import ManageTemplate from './pages/manage-template/ManageTemplate';
import ManageReservationPage from './pages/manage-reservation/ManageReservationPage';
import LoginPage from './pages/auth/LoginPage';
import RootProviders from './RootProvider';
import ProtectedRoute from './ProtectedRoute';
import SelectOrgPage from './pages/auth/select-org/SelectOrgPage';
import OrgLayout from './OrgLayout';
import EventCreatePage from './pages/events/create/EventCreatePage';
import ManageCamper from './pages/manage-camper/ManageCamper';
import ManageOrganization from './pages/manage-organization/ManageOrganization';
import CamperMyPage from './pages/mypage/CamperMyPage';

const router = createBrowserRouter([
  {
    element: <RootProviders />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/', element: <Navigate to="/select-org" replace /> },
          { path: '/select-org', element: <SelectOrgPage /> },
          {
            path: '/orgs/:orgId',
            element: <OrgLayout />,
            children: [
              {
                element: <Layout />,
                children: [
                  { path: '', element: <Main /> },
                  { path: 'events/:id', element: <EventDetail /> },
                  { path: 'events/:eventId/edit', element: <EventCreatePage /> },
                  { path: 'events/new', element: <EventCreatePage /> },
                  { path: 'reservations', element: <ManageReservationPage /> },
                  { path: 'me', element: <CamperMyPage /> },
                  {
                    element: <ProtectedRoute allowedRoles={['ADMIN']} />,
                    children: [
                      { path: 'templates', element: <ManageTemplate /> },
                      { path: 'campers', element: <ManageCamper /> },
                      { path: 'organizations', element: <ManageOrganization /> },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </>
  );
}

export default App;
