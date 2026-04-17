import { createBrowserRouter } from 'react-router';
import { Home } from './pages/Home';
import { ProgramDetail } from './pages/ProgramDetail';
import { ProgramForm } from './pages/ProgramForm';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Home,
  },
  {
    path: '/program/:id',
    Component: ProgramDetail,
  },
  {
    path: '/program/:id/edit',
    Component: ProgramForm,
  },
  {
    path: '/add',
    Component: ProgramForm,
  },
]);
