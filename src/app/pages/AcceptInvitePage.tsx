import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/authSlice';
import { authAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Church, LogIn } from 'lucide-react';

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleAcceptInvite(token);
    } else {
      toast.error('No invitation token found in URL.');
      navigate('/login');
    }
  }, [searchParams]);

  const handleAcceptInvite = async (token: string) => {
    setLoading(true);
    try {
      const response = await authAPI.acceptInviteAuto(token);
      const { token: jwtToken, user } = response.data;

      dispatch(setCredentials({ token: jwtToken, user }));
      toast.success('Invitation accepted! Logging you in...');

      // Redirect based on role
      if (user.role === 'super_admin' || user.role === 'super') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept invitation. Please try again.');
      navigate('/login');
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
            <CardTitle className="text-3xl">Accepting Invitation</CardTitle>
            <CardDescription>Please wait while we process your invitation...</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          {loading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p>Processing your invitation...</p>
            </div>
          ) : (
            <Button onClick={() => navigate('/login')} className="w-full">
              <LogIn className="w-4 h-4 mr-2" />
              Go to Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}