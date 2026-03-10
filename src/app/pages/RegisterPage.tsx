import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/authSlice';
import { authAPI, inviteAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Church, UserPlus } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    const requirements = [
      { test: password.length >= 8, text: 'At least 8 characters' },
      { test: /[A-Z]/.test(password), text: 'One uppercase letter' },
      { test: /[a-z]/.test(password), text: 'One lowercase letter' },
      { test: /\d/.test(password), text: 'One number' },
      { test: /[!@#$%^&*]/.test(password), text: 'One special character (!@#$%^&*)' },
    ];
    return requirements;
  };

  const passwordRequirements = getPasswordStrength(password);

  useEffect(() => {
    // Get token from URL query params
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      validateToken(urlToken);
    }
  }, [searchParams]);

  const validateToken = async (tokenToValidate: string) => {
    setValidating(true);
    try {
      await inviteAPI.validateToken(tokenToValidate);
      setTokenValid(true);
    } catch (error: any) {
      setTokenValid(false);
      toast.error(error.response?.data?.message || 'Invalid or expired invitation token.');
    } finally {
      setValidating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.acceptInvite(token, email, password);
      const { token: jwtToken, user } = response.data;

      // Use the user from response.data instead of JWT decode, as it should include region_id
      dispatch(setCredentials({ token: jwtToken, user }));
      
      toast.success('Registration successful! Redirecting to dashboard...');

      // Redirect based on role
      if (user.role === 'super' || user.role === 'super_admin') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Please check your invitation token.');
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
            <CardTitle className="text-3xl">Regional Admin Registration</CardTitle>
            <CardDescription>Create your account using your invitation token</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
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
              {password && (
                <div className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${req.test ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={req.test ? 'text-green-600' : 'text-gray-500'}>{req.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Invitation Token</Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter your invitation token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="hover:underline" style={{ color: '#d4af37' }}>
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}