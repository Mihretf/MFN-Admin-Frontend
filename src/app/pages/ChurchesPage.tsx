import { useState, useEffect } from 'react';
import { churchAPI, regionAPI, uploadAPI } from '../services/api';
import { useAppSelector } from '../store/hooks';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Church as ChurchIcon, Plus, MapPin, Save, Trash2 } from 'lucide-react';

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
  const [savingDetails, setSavingDetails] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [viewRegionId, setViewRegionId] = useState('');

  // Details states
  const [selectedChurchId, setSelectedChurchId] = useState('');
  const [manualChurchId, setManualChurchId] = useState('');
  const [detailsJson, setDetailsJson] = useState('{}');

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
      const response = await churchAPI.createChurch({
        name,
        region_id: selectedRegionId,
        location_link: locationLink || undefined,
      });
      const createdId = response?.data?.id;
      toast.success(`Church added successfully${createdId ? ` (ID: ${createdId})` : '!'}`);
      console.log('[Church] Create response', response.data);
      
      // Reset form
      setName('');
      setLocationLink('');
      
      if (viewRegionId === selectedRegionId) {
        fetchChurches();
      }

      if (createdId) {
        setSelectedChurchId(createdId);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add church.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBasicChurch = async (church: Church) => {
    try {
      await churchAPI.updateChurch(church.id, {
        name: church.name,
        location_link: church.location_link || null,
      });
      toast.success('Church updated successfully.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update church.');
    }
  };

  const handleDeleteChurch = async (churchId: string) => {
    const confirmed = window.confirm('Delete this church? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      await churchAPI.deleteChurch(churchId);
      toast.success('Church deleted successfully.');
      setChurches((prev) => prev.filter((c) => c.id !== churchId));
      if (selectedChurchId === churchId) {
        setSelectedChurchId('');
        setDetailsJson('{}');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete church.');
    }
  };

  const handleLoadChurchDetails = async (churchId: string) => {
    if (!churchId) {
      return;
    }

    try {
      const response = await churchAPI.getChurchById(churchId);
      const church = response?.data?.church || response?.data;
      setDetailsJson(JSON.stringify(church, null, 2));
      console.log('[Church] Details response', response.data);
      toast.success('Church details loaded.');
    } catch (error: any) {
      console.error('[Church] Details error', error?.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to load church details.');
    }
  };

  const parseDetailsJson = (): Record<string, unknown> | null => {
    try {
      return JSON.parse(detailsJson);
    } catch {
      toast.error('Invalid JSON in details editor.');
      return null;
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedChurchId) {
      toast.error('Select a church first.');
      return;
    }

    const payload = parseDetailsJson();
    if (!payload) {
      return;
    }

    setSavingDetails(true);
    try {
      const response = await churchAPI.updateChurch(selectedChurchId, payload);
      console.log('[Church] Update details response', response.data);
      toast.success('Church details updated successfully.');
      if (viewRegionId) {
        fetchChurches();
      }
    } catch (error: any) {
      console.error('[Church] Update details error', error?.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to update church details.');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const payload = parseDetailsJson();
    if (!payload) {
      return;
    }

    setUploadingHero(true);
    try {
      const regionId = (payload.region_id as string | undefined) || viewRegionId || selectedRegionId || user?.region_id;
      const response = await uploadAPI.uploadImage(file, { region_id: regionId });
      const secureUrl = response?.data?.asset?.secure_url;
      if (!secureUrl) {
        throw new Error('No uploaded image URL returned by backend.');
      }

      const nextPayload = { ...payload, hero_image: secureUrl };
      setDetailsJson(JSON.stringify(nextPayload, null, 2));
      toast.success('Hero image uploaded and added to details JSON.');
      console.log('[Church] Hero image upload response', response.data);
    } catch (error: any) {
      console.error('[Church] Hero image upload error', error?.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to upload hero image.');
    } finally {
      setUploadingHero(false);
      e.target.value = '';
    }
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const payload = parseDetailsJson();
    if (!payload) {
      return;
    }

    setUploadingGallery(true);
    try {
      const regionId = (payload.region_id as string | undefined) || viewRegionId || selectedRegionId || user?.region_id;
      const response = await uploadAPI.uploadImage(file, { region_id: regionId });
      const secureUrl = response?.data?.asset?.secure_url;
      if (!secureUrl) {
        throw new Error('No uploaded image URL returned by backend.');
      }

      const existingGallery = Array.isArray(payload.gallery) ? payload.gallery : [];
      const nextGallery = [
        ...existingGallery,
        {
          id: `g-${Date.now()}`,
          url: secureUrl,
          caption: 'New photo',
        },
      ];

      const nextPayload = { ...payload, gallery: nextGallery };
      setDetailsJson(JSON.stringify(nextPayload, null, 2));
      toast.success('Gallery photo uploaded and added to details JSON.');
      console.log('[Church] Gallery image upload response', response.data);
    } catch (error: any) {
      console.error('[Church] Gallery image upload error', error?.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to upload gallery image.');
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Churches Management</h1>
        <p className="text-muted-foreground">Regional and super admins can create, edit, delete, and update church details.</p>
      </div>

      <Tabs defaultValue="create">
        <TabsList>
          <TabsTrigger value="create">Add Church</TabsTrigger>
          <TabsTrigger value="view">View / Edit / Delete</TabsTrigger>
          <TabsTrigger value="details">Church Details + Photos</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Church</CardTitle>
              <CardDescription>Create church and get `church_id` for details updates.</CardDescription>
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
              <CardDescription>Update basic info or delete a church.</CardDescription>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {churches.map((church) => (
                          <Card key={church.id}>
                            <CardContent className="pt-6 space-y-3">
                              <div className="space-y-2">
                                <Label>Church Name</Label>
                                <Input
                                  value={church.name}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setChurches((prev) => prev.map((c) => (c.id === church.id ? { ...c, name: value } : c)));
                                  }}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Location Link</Label>
                                <Input
                                  value={church.location_link || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setChurches((prev) => prev.map((c) => (c.id === church.id ? { ...c, location_link: value } : c)));
                                  }}
                                />
                              </div>

                              <div className="text-xs text-muted-foreground">Church ID: {church.id}</div>

                              {church.location_link && (
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
                              )}

                              <div className="flex gap-2">
                                <Button type="button" onClick={() => handleUpdateBasicChurch(church)}>
                                  <Save className="w-4 h-4 mr-2" />
                                  Save
                                </Button>
                                <Button type="button" variant="destructive" onClick={() => handleDeleteChurch(church.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedChurchId(church.id);
                                    handleLoadChurchDetails(church.id);
                                  }}
                                >
                                  Load Details
                                </Button>
                              </div>
                            </CardContent>
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

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Church Details + Photos</CardTitle>
              <CardDescription>Select `church_id`, load details, edit JSON, upload photo, then save.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Church</Label>
                <Select
                  value={selectedChurchId}
                  onValueChange={(churchId) => {
                    setSelectedChurchId(churchId);
                    handleLoadChurchDetails(churchId);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose church" />
                  </SelectTrigger>
                  <SelectContent>
                    {churches.map((church) => (
                      <SelectItem key={church.id} value={church.id}>
                        {church.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manualChurchId">Or Enter Church ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="manualChurchId"
                    value={manualChurchId}
                    onChange={(e) => setManualChurchId(e.target.value)}
                    placeholder="4a1791c6-3f7d-4760-89f9-14e82ec71764"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const id = manualChurchId.trim();
                      if (!id) {
                        toast.error('Enter a church ID first.');
                        return;
                      }
                      setSelectedChurchId(id);
                      handleLoadChurchDetails(id);
                    }}
                  >
                    Load
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hero-upload">Upload Hero Image</Label>
                  <Input
                    id="hero-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageUpload}
                    disabled={uploadingHero}
                  />
                  {uploadingHero && <p className="text-sm text-muted-foreground">Uploading hero image...</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gallery-upload">Upload Gallery Image</Label>
                  <Input
                    id="gallery-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryImageUpload}
                    disabled={uploadingGallery}
                  />
                  {uploadingGallery && <p className="text-sm text-muted-foreground">Uploading gallery image...</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details-json">Church Details JSON</Label>
                <Textarea
                  id="details-json"
                  value={detailsJson}
                  onChange={(e) => setDetailsJson(e.target.value)}
                  rows={18}
                  placeholder='{"name":"North Campus","description":"..."}'
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" onClick={handleSaveDetails} disabled={savingDetails || !selectedChurchId}>
                  <Save className="w-4 h-4 mr-2" />
                  {savingDetails ? 'Saving...' : 'Save Details'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => selectedChurchId && handleLoadChurchDetails(selectedChurchId)}
                  disabled={!selectedChurchId}
                >
                  Reload Details
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Endpoint flow: `POST /api/churches` to create, then `GET /api/churches/:id` and `PUT /api/churches/:id` for details updates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
