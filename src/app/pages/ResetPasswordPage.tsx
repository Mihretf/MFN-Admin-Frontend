import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { authAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Church, KeyRound } from 'lucide-react';

export function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(token, password);
      toast.success('Password reset successful! Please login.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password.');
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
            <CardTitle className="text-3xl">Reset Password</CardTitle>
            <CardDescription>Enter your reset token and new password</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Reset Token</Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter reset token from email"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <KeyRound className="w-4 h-4 mr-2" />
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm hover:underline" style={{ color: '#d4af37' }}>
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
