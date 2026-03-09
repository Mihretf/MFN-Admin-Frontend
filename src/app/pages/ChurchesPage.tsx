import { useState, useEffect } from 'react';
import { churchAPI, regionAPI } from '../services/api';
import { useAppSelector } from '../store/hooks';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Church as ChurchIcon, Plus, MapPin } from 'lucide-react';

interface Church {
  id: string;
  name: string;
  region_id: string;
  location_link?: string;
}

interface Region {
  id: string;
  name: string;
}

export function ChurchesPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === 'super';

  const [churches, setChurches] = useState<Church[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [viewRegionId, setViewRegionId] = useState('');

  useEffect(() => {
    fetchRegions();
  }, []);

  useEffect(() => {
    if (viewRegionId) {
      fetchChurches();
    }
  }, [viewRegionId]);

 const fetchRegions = async () => {
  try {
    const response = await regionAPI.getRegions();
    // Extract the array from response.data or response.data.regions
    const data = Array.isArray(response.data) 
      ? response.data 
      : (response.data?.regions || []);
      
    setRegions(data);
    
    if (!isSuperAdmin && user?.region_id) {
      setSelectedRegionId(user.region_id);
      setViewRegionId(user.region_id);
    }
  } catch (error: any) {
    console.error('Failed to fetch regions:', error);
    setRegions([]); // Keep it as an array to prevent crashes
  }
};
const fetchChurches = async () => {
  try {
    const response = await churchAPI.getChurches(viewRegionId);
    // Extract the array from response.data or response.data.churches
    const data = Array.isArray(response.data) 
      ? response.data 
      : (response.data?.churches || []);
      
    setChurches(data);
  } catch (error: any) {
    console.error('Failed to fetch churches:', error);
    toast.error('Failed to load churches.');
    setChurches([]);
  }
};

  const handleCreateChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedRegionId) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      await churchAPI.createChurch({
        name,
        region_id: selectedRegionId,
        location_link: locationLink || undefined,
      });
      toast.success('Church added successfully!');
      
      // Reset form
      setName('');
      setLocationLink('');
      
      if (viewRegionId === selectedRegionId) {
        fetchChurches();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add church.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Churches Management</h1>
        <p className="text-muted-foreground">Add and manage churches in regions (Super Admin Only)</p>
      </div>

      <Tabs defaultValue="create">
        <TabsList>
          <TabsTrigger value="create">Add Church</TabsTrigger>
          <TabsTrigger value="view">View Churches</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Church</CardTitle>
              <CardDescription>Add a church to a region</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateChurch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Region *</Label>
                  <Select
                    value={selectedRegionId}
                    onValueChange={setSelectedRegionId}
                    disabled={!isSuperAdmin}
                  >
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

                <div className="space-y-2">
                  <Label htmlFor="name">Church Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter church name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location Link (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="https://maps.google.com/..."
                    value={locationLink}
                    onChange={(e) => setLocationLink(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={loading || regions.length === 0}>
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? 'Adding...' : 'Add Church'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Churches</CardTitle>
              <CardDescription>Browse churches by region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="viewRegion">Select Region</Label>
                  <Select
                    value={viewRegionId}
                    onValueChange={setViewRegionId}
                    disabled={!isSuperAdmin}
                  >
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

                {viewRegionId && (
                  <div className="space-y-4 mt-6">
                    {churches.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <ChurchIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No churches in this region yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {churches.map((church) => (
                          <Card key={church.id}>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <ChurchIcon className="w-5 h-5" style={{ color: '#d4af37' }} />
                                {church.name}
                              </CardTitle>
                            </CardHeader>
                            {church.location_link && (
                              <CardContent>
                                <a
                                  href={church.location_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm hover:underline"
                                  style={{ color: '#d4af37' }}
                                >
                                  <MapPin className="w-4 h-4" />
                                  View Location
                                </a>
                              </CardContent>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
