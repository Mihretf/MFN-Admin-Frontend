import { useState, useEffect } from 'react';
import { regionAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { MapPin, Plus } from 'lucide-react';

interface Region {
  id: string;
  name: string;
  created_at?: string;
}

export function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [newRegionName, setNewRegionName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRegions();
  }, []);

const fetchRegions = async () => {
  try {
    const response = await regionAPI.getRegions();
    
    // Safety check: if response.data is the array, use it. 
    // If it's an object with a 'regions' key, use that.
    const data = Array.isArray(response.data) 
      ? response.data 
      : (response.data?.regions || []);
      
    setRegions(data);
  } catch (error: any) {
    console.error('Failed to fetch regions:', error);
    setRegions([]); // Ensure it stays an array even on error
  }
};

  const handleCreateRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegionName.trim()) return;

    setLoading(true);
    try {
      const response = await regionAPI.createRegion(newRegionName);
      toast.success('Region created successfully!');
      setNewRegionName('');
      fetchRegions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create region.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Regions</h1>
        <p className="text-muted-foreground">Create and manage church regions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Region</CardTitle>
          <CardDescription>Add a new geographic region for your church</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateRegion} className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="regionName">Region Name</Label>
              <Input
                id="regionName"
                placeholder="e.g., North Region, South Region"
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="self-end">
              <Plus className="w-4 h-4 mr-2" />
              {loading ? 'Creating...' : 'Create Region'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Regions</CardTitle>
          <CardDescription>View all created regions and their IDs</CardDescription>
        </CardHeader>
        <CardContent>
          {regions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No regions created yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {regions.map((region) => (
                <div
                  key={region.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#d4af37' }}>
                      <MapPin className="w-5 h-5" style={{ color: '#1a3c34' }} />
                    </div>
                    <div>
                      <h4>{region.name}</h4>
                      <p className="text-sm text-muted-foreground font-mono">{region.id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
