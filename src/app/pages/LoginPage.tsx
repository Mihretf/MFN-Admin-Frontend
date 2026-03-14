import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/authSlice';
import { authAPI, API_BASE_URL } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Church, LogIn } from 'lucide-react';
import { useRef } from 'react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  // Prevent accidental double-submit (e.g., rapid double click / enter key).
  if (isSubmittingRef.current) {
    return;
  }

  isSubmittingRef.current = true;
  setLoading(true);

  try {
    console.log('[Login] Request', {
      method: 'POST',
      url: `${API_BASE_URL}/auth/login`,
      email,
    });

    const response = await authAPI.login(email, password);
    const { token, user } = response.data;

    console.log('[Login] Success response', {
      status: response.status,
      data: response.data,
    });

    // Use the user from response.data instead of JWT decode, as it should include region_id
    dispatch(setCredentials({token, user}));
    toast.success('Login successful!');
    
    // dispatch(setCredentials({ token, user }));
    // toast.success('Login successful!');

    // Redirect based on role
    if (user.role === 'super_admin' || user.role === 'super') {
      navigate('/dashboard');
    } else {
      navigate('/dashboard');
    }

  } catch (error: any) {
    console.error('[Login] Error response', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    toast.error(error.response?.data?.message || 'Login failed. Please try again.');
  } finally {
    setLoading(false);
    isSubmittingRef.current = false;
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1a3c34 0%, #2d5a4d 100%)' }}>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#d4af37' }}>
            <Church className="w-10 h-10" style={{ color: '#1a3c34' }} />
          </div>
          <div>
            <CardTitle className="text-3xl">Admin Login</CardTitle>
            <CardDescription>Sign in to your church admin dashboard</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm hover:underline" style={{ color: '#d4af37' }}>
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Have an invitation?{' '}
              <Link to="/register" className="hover:underline" style={{ color: '#d4af37' }}>
                Register here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}