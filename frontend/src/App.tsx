import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import Layout from './Layout';
import Main from './pages/main/Main';
import EventDetail from './pages/event-detail/EventDetail';
import ManageTemplate from './pages/manage-template/ManageTemplate';
import CamperMyPage from './pages/camper-mypage/CamperMyPage';
import LoginPage from './pages/auth/LoginPage';
import RootProviders from './RootProvider';
import ProtectedRoute from './ProtectedRoute';
import SelectOrgPage from './pages/auth/select-org/SelectOrgPage';
import OrgLayout from './OrgLayout';
import EventCreatePage from './pages/events/create/EventCreatePage';

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
                  { path: 'events/new', element: <EventCreatePage /> },
                  { path: 'me', element: <CamperMyPage /> },
                  {
                    element: <ProtectedRoute allowedRoles={['ADMIN']} />,
                    children: [{ path: 'templates', element: <ManageTemplate /> }],
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
