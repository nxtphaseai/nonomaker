import { useRoutes } from 'react-router-dom';
import routes from 'virtual:generated-pages-react';
import Layout from './components/layout'; // Create a Layout component
import './App.css'
import Eval from './pages/Eval';

function App() {
  // Add the default route explicitly
  const customRoutes = [
    { path: '/', element: <Layout><DefaultPage /></Layout> }, // Default route
    ...routes.map((route) => ({
      ...route,
      element: <Layout>{route.element}</Layout>,
    })),
    { path: '/eval', element: <Eval /> },
  ];

  // Generate routes
  const element = useRoutes(customRoutes);
  return element;
}

// Import the DefaultPage component explicitly
import DefaultPage from './default/default';

export default App;