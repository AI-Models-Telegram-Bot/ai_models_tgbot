import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ToastContainer from './Toast';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6 overflow-x-hidden">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
}
