import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/authSlice';
import { authAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Church, LogIn } from 'lucide-react';
import { jwtDecode } from 'jwt-decode'; // Import this at the top

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await authAPI.login(email, password);
    // --- ADD THIS LINE HERE ---
      console.log("DEBUG: Full Backend Response:", response.data);
      console.log("DEBUG: User Object:", response.data.user);
      console.log("DEBUG: User Role is:", response.data.user?.role);
      // --------------------------
    const { token, user } = response.data;

    const decodedUser: any = jwtDecode(token);
    console.log("Decoded Role:", decodedUser.role);

    dispatch(setCredentials({token, user: decodedUser}));
    toast.success("Login Sucessful!")
    
    // dispatch(setCredentials({ token, user }));
    // toast.success('Login successful!');

    // Redirect based on role
    if (decodedUser.role === 'super_admin' || decodedUser.role === 'super') {
      navigate('/super-admin/dashboard'); // Or whatever your super admin route is named
    } else {
      navigate('/dashboard'); // Keep this for regional admins
    }

  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Login failed. Please try again.');
  } finally {
    setLoading(false);
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