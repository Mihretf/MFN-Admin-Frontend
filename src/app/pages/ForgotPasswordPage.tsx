import { useState } from 'react';
import { Link } from 'react-router';
import { authAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Church, Mail } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Reset token sent! Check your email.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset token.');
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
            <CardTitle className="text-3xl">Forgot Password</CardTitle>
            <CardDescription>
              {sent ? 'Check your email for the reset token' : 'Enter your email to receive a reset token'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button type="submit" className="w-full" disabled={loading}>
                <Mail className="w-4 h-4 mr-2" />
                {loading ? 'Sending...' : 'Send Reset Token'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                A reset token has been sent to your email. Use it to reset your password.
              </p>
              <Button asChild className="w-full">
                <Link to="/reset-password">Reset Password</Link>
              </Button>
            </div>
          )}
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