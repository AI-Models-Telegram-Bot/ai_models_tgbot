import { Navigate } from 'react-router-dom';

// Registration is now handled by Telegram QR auth (auto-creates accounts)
const RegisterPage = () => <Navigate to="/auth/login" replace />;

export default RegisterPage;
