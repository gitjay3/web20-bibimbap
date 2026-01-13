import { createBrowserRouter, RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import Layout from './Layout';
import Main from './pages/main/Main';
import EventDetail from './pages/event-detail/EventDetail';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Main /> },
      { path: '/events/:id', element: <EventDetail /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
  <Toaster position="top-center" richColors />;
}

export default App;
