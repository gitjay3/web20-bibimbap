import { createBrowserRouter, RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import Layout from './Layout';
import Main from './pages/main/Main';
import EventDetail from './pages/event-detail/EventDetail';
import ManageTemplate from './pages/manage-template/ManageTemplate';
import CamperMyPage from './pages/camper-mypage/CamperMyPage';
import LoginPage from './pages/auth/LoginPage';
import RootProviders from './RootProvider';
import ProtectedRoute from './ProtectedRoute';
import EventCreatePage from './pages/events/create/EventCreatePage';

const router = createBrowserRouter([
  {
    element: <RootProviders />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <Layout />,
            children: [
              { path: '/', element: <Main /> },
              { path: '/events/:id', element: <EventDetail /> },
              { path: '/me', element: <CamperMyPage /> },
              {
                element: <ProtectedRoute allowedRoles={['ADMIN']} />,
                children: [
                  { path: '/templates', element: <ManageTemplate /> },
                  { path: '/events/new', element: <EventCreatePage /> },
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
