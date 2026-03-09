import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { store } from './store';
import { router } from './routes';

export default function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </Provider>
  );
}
