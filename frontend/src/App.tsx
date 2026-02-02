import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { ErrorBoundary } from 'react-error-boundary';
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
import ManageAdmin from './pages/manage-admin/ManageAdmin';
import { sendErrorToServer } from './utils/logger';

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
                      { path: 'admins', element: <ManageAdmin /> },
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

function ErrorFallback({ error }: { error: unknown }) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-xl font-bold text-gray-900">문제가 발생했습니다</h1>
      <p className="text-gray-500">페이지를 새로고침 해주세요.</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-md bg-brand-500 px-4 py-2 text-white hover:bg-brand-400"
      >
        새로고침
      </button>
      {import.meta.env.DEV && (
        <pre className="mt-4 max-w-xl overflow-auto rounded bg-gray-100 p-4 text-sm text-red-600">
          {errorMessage}
        </pre>
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        const err = error instanceof Error ? error : new Error(String(error));
        sendErrorToServer(err, { componentStack: info.componentStack ?? undefined });
      }}
    >
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </ErrorBoundary>
  );
}

export default App;
