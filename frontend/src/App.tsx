import { createBrowserRouter, RouterProvider } from 'react-router';
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
}

export default App;
