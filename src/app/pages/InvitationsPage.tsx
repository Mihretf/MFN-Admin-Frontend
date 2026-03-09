import { useState, useEffect } from 'react';
import { inviteAPI, regionAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Mail } from 'lucide-react';

interface Region {
  id: string;
  name: string;
}

export function InvitationsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [email, setEmail] = useState('');
  const [regionId, setRegionId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRegions();
  }, []);

const fetchRegions = async () => {
  try {
    const response = await regionAPI.getRegions();
    
    // Check if the data is already an array, or if it's inside a 'regions' key
    const regionData = Array.isArray(response.data) 
      ? response.data 
      : (response.data?.regions || []);
      
    setRegions(regionData);
  } catch (error: any) {
    console.error('Failed to fetch regions:', error);
    // Set to empty array on error to prevent the .map crash
    setRegions([]); 
  }
};

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !regionId) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await inviteAPI.sendInvitation(email, 'regional_admin', regionId);
      toast.success('Invitation sent successfully!');
      setEmail('');
      setRegionId('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Invite Regional Admins</h1>
        <p className="text-muted-foreground">Send invitations to new regional administrators</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Invitation</CardTitle>
          <CardDescription>Invite a new admin and assign them to a region</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select value={regionId} onValueChange={setRegionId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading || regions.length === 0}>
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {regions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-muted-foreground text-center mb-2">No regions available</p>
            <p className="text-sm text-muted-foreground text-center">
              Please create regions first before sending invitations.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How Invitations Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#d4af37' }}>
              <span style={{ color: '#1a3c34' }}>1</span>
            </div>
            <div>
              <p className="text-sm">The invited user will receive an email with a unique invitation token.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#d4af37' }}>
              <span style={{ color: '#1a3c34' }}>2</span>
            </div>
            <div>
              <p className="text-sm">They can use the token to register on the registration page.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#d4af37' }}>
              <span style={{ color: '#1a3c34' }}>3</span>
            </div>
            <div>
              <p className="text-sm">After registration, they will be assigned as a regional admin for the selected region.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}