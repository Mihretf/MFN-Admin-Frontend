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

const emptyChurchProfile = {
  location: '',
  address: '',
  phone: '',
  email: '',
  description: '',
  heroImage: '',
  mapUrl: '',
  location_link: '',
  pastor: {
    name: '',
    role: '',
    image: '',
    bio: '',
  },
  serviceTimes: [{ day: '', time: '', type: '' }],
  announcements: [{ id: '', title: '', date: '', content: '', priority: 'normal' }],
  events: [{ id: '', title: '', date: '', time: '', image: '', description: '' }],
  ministries: [{ id: '', name: '', description: '', icon: '' }],
  gallery: [{ id: '', url: '', caption: '' }],
};

export function ChurchesPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === 'super' || user?.role === 'super_admin';
  const userRegionId = user?.region_id || (user as any)?.regionId || (user as any)?.region?.id || '';

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
  const [createProfile, setCreateProfile] = useState(emptyChurchProfile);

  // Details states
  const [selectedChurchId, setSelectedChurchId] = useState('');
  const [manualChurchId, setManualChurchId] = useState('');
  const [detailsJson, setDetailsJson] = useState('{}');

  const getDetailsObject = (): Record<string, any> | null => {
    try {
      const parsed = JSON.parse(detailsJson);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {};
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const updateDetailsObject = (updater: (draft: Record<string, any>) => void) => {
    const current = getDetailsObject();
    if (!current) {
      toast.error('Fix invalid JSON first to use the structured form.');
      return;
    }

    const draft = { ...current };
    updater(draft);
    setDetailsJson(JSON.stringify(draft, null, 2));
  };

  const detailsObject = getDetailsObject();
  const detailsFormDisabled = !detailsObject;
  const selectedRegionName = regions.find((r) => r.id === (selectedRegionId || userRegionId))?.name || '';
  const themedActionButtonClass = 'border-[#d4af37] text-[#1a3c34] hover:bg-[#d4af37]/20';

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
    
    if (!isSuperAdmin && userRegionId) {
      setSelectedRegionId(userRegionId);
      setViewRegionId(userRegionId);
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
    const regionIdToUse = selectedRegionId || (!isSuperAdmin ? userRegionId : '');

    if (!name.trim() || !regionIdToUse) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await churchAPI.createChurch({
        name,
        region_id: regionIdToUse,
        location_link: locationLink || undefined,
      });
      const createdId = response?.data?.id;

      if (createdId) {
        const profilePayload = {
          ...createProfile,
          name,
          region_id: regionIdToUse,
          location_link: locationLink || createProfile.location_link || undefined,
          hero_image: createProfile.heroImage || undefined,
          pastor: createProfile.pastor,
          serviceTimes: createProfile.serviceTimes.filter((s) => s.day || s.time || s.type),
          announcements: createProfile.announcements.filter((a) => a.title || a.date || a.content),
          events: createProfile.events.filter((ev) => ev.title || ev.date || ev.time || ev.description),
          ministries: createProfile.ministries.filter((m) => m.name || m.description || m.icon),
          gallery: createProfile.gallery.filter((g) => g.url || g.caption),
        };

        await churchAPI.updateChurch(createdId, profilePayload);
      }

      toast.success(`Church added successfully${createdId ? ` (ID: ${createdId})` : '!'}`);
      console.log('[Church] Create response', response.data);
      
      // Reset form
      setName('');
      setLocationLink('');
      setCreateProfile(emptyChurchProfile);
      
      if (viewRegionId === regionIdToUse) {
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
      if (church?.region_id) {
        setSelectedRegionId(church.region_id);
        if (!viewRegionId) {
          setViewRegionId(church.region_id);
        }
      }
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

    const regionIdToUse = selectedRegionId || user?.region_id;
    if (!regionIdToUse) {
      toast.error('Please select or load a church with a region before uploading images.');
      return;
    }

    setUploadingHero(true);
    try {
      const regionId = (payload.region_id as string | undefined) || viewRegionId || regionIdToUse;
      const response = await uploadAPI.uploadImage(file, { region_id: regionId });
      const secureUrl = response?.data?.asset?.secure_url;
      if (!secureUrl) {
        throw new Error('No uploaded image URL returned by backend.');
      }

      const nextPayload = { ...payload, hero_image: secureUrl };
      const nextPayloadCompat = { ...nextPayload, heroImage: secureUrl };
      setDetailsJson(JSON.stringify(nextPayloadCompat, null, 2));
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

    const regionIdToUse = selectedRegionId || user?.region_id;
    if (!regionIdToUse) {
      toast.error('Please select or load a church with a region before uploading images.');
      return;
    }

    setUploadingGallery(true);
    try {
      const regionId = (payload.region_id as string | undefined) || viewRegionId || regionIdToUse;
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
                  {isSuperAdmin ? (
                    <Select
                      value={selectedRegionId}
                      onValueChange={setSelectedRegionId}
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
                  ) : (
                    <Input
                      readOnly
                      value={selectedRegionName || `Assigned region (${userRegionId})`}
                    />
                  )}
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

                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle>Church Profile During Creation</CardTitle>
                    <CardDescription>Fill the full profile now so the church is complete immediately after creation.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value={createProfile.location} onChange={(e) => setCreateProfile((p) => ({ ...p, location: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input value={createProfile.address} onChange={(e) => setCreateProfile((p) => ({ ...p, address: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={createProfile.phone} onChange={(e) => setCreateProfile((p) => ({ ...p, phone: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={createProfile.email} onChange={(e) => setCreateProfile((p) => ({ ...p, email: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Hero Image URL</Label>
                        <Input value={createProfile.heroImage} onChange={(e) => setCreateProfile((p) => ({ ...p, heroImage: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Map URL</Label>
                        <Input value={createProfile.mapUrl} onChange={(e) => setCreateProfile((p) => ({ ...p, mapUrl: e.target.value }))} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Description</Label>
                        <Textarea rows={3} value={createProfile.description} onChange={(e) => setCreateProfile((p) => ({ ...p, description: e.target.value }))} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Pastor Name</Label>
                        <Input value={createProfile.pastor.name} onChange={(e) => setCreateProfile((p) => ({ ...p, pastor: { ...p.pastor, name: e.target.value } }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Pastor Role</Label>
                        <Input value={createProfile.pastor.role} onChange={(e) => setCreateProfile((p) => ({ ...p, pastor: { ...p.pastor, role: e.target.value } }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Pastor Image</Label>
                        <Input value={createProfile.pastor.image} onChange={(e) => setCreateProfile((p) => ({ ...p, pastor: { ...p.pastor, image: e.target.value } }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Pastor Bio</Label>
                        <Textarea rows={2} value={createProfile.pastor.bio} onChange={(e) => setCreateProfile((p) => ({ ...p, pastor: { ...p.pastor, bio: e.target.value } }))} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>First Service Time</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input placeholder="Day" value={createProfile.serviceTimes[0]?.day || ''} onChange={(e) => setCreateProfile((p) => ({ ...p, serviceTimes: [{ ...(p.serviceTimes[0] || {}), day: e.target.value, time: p.serviceTimes[0]?.time || '', type: p.serviceTimes[0]?.type || '' }] }))} />
                        <Input type="time" placeholder="Time" value={createProfile.serviceTimes[0]?.time || ''} onChange={(e) => setCreateProfile((p) => ({ ...p, serviceTimes: [{ ...(p.serviceTimes[0] || {}), time: e.target.value, day: p.serviceTimes[0]?.day || '', type: p.serviceTimes[0]?.type || '' }] }))} />
                        <Input placeholder="Type" value={createProfile.serviceTimes[0]?.type || ''} onChange={(e) => setCreateProfile((p) => ({ ...p, serviceTimes: [{ ...(p.serviceTimes[0] || {}), type: e.target.value, day: p.serviceTimes[0]?.day || '', time: p.serviceTimes[0]?.time || '' }] }))} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>First Announcement</Label>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <Input placeholder="Title" value={createProfile.announcements[0]?.title || ''} onChange={(e) => setCreateProfile((p) => ({ ...p, announcements: [{ ...(p.announcements[0] || {}), title: e.target.value, date: p.announcements[0]?.date || '', content: p.announcements[0]?.content || '', priority: p.announcements[0]?.priority || 'normal', id: p.announcements[0]?.id || `a-${Date.now()}` }] }))} />
                        <Input type="date" placeholder="Date" value={createProfile.announcements[0]?.date || ''} onChange={(e) => setCreateProfile((p) => ({ ...p, announcements: [{ ...(p.announcements[0] || {}), date: e.target.value, title: p.announcements[0]?.title || '', content: p.announcements[0]?.content || '', priority: p.announcements[0]?.priority || 'normal', id: p.announcements[0]?.id || `a-${Date.now()}` }] }))} />
                        <Input placeholder="Content" value={createProfile.announcements[0]?.content || ''} onChange={(e) => setCreateProfile((p) => ({ ...p, announcements: [{ ...(p.announcements[0] || {}), content: e.target.value, title: p.announcements[0]?.title || '', date: p.announcements[0]?.date || '', priority: p.announcements[0]?.priority || 'normal', id: p.announcements[0]?.id || `a-${Date.now()}` }] }))} />
                        <Input placeholder="Priority" value={createProfile.announcements[0]?.priority || 'normal'} onChange={(e) => setCreateProfile((p) => ({ ...p, announcements: [{ ...(p.announcements[0] || {}), priority: e.target.value, title: p.announcements[0]?.title || '', date: p.announcements[0]?.date || '', content: p.announcements[0]?.content || '', id: p.announcements[0]?.id || `a-${Date.now()}` }] }))} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>First Event</Label>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                        <Input placeholder="Title" value={createProfile.events[0]?.title || ''} onChange={(e) => setCreateProfile((p) => ({ ...p, events: [{ ...(p.events[0] || {}), title: e.target.value, date: p.events[0]?.date || '', time: p.events[0]?.time || '', image: p.events[0]?.image || '', description: p.events[0]?.description || '', id: p.events[0]?.id || `e-${Date.now()}` }] }))} />
                        <Input type="date" placeholder="Date" value={createProfile.events[0]?.date || ''} onChange={(e) => setCreateProfile((p) => ({ ...p, events: [{ ...(p.events[0] || {}), date: e.target.value, title: p.events[0]?.title || '', time: p.events[0]?.time || '', image: p.events[0]?.image || '', description: p.events[0]?.description || '', id: p.events[0]?.id || `e-${Date.now()}` }] }))} />
                        <Input type="time" placeholder="Time" value={createProfile.events[0]?.time || ''} onChange={(e) => setCreateProfile((p) => ({ ...p, events: [{ ...(p.events[0] || {}), time: e.target.value, title: p.events[0]?.title || '', date: p.events[0]?.date || '', image: p.events[0]?.image || '', description: p.events[0]?.description || '', id: p.events[0]?.id || `e-${Date.now()}` }] }))} />
                        <Input placeholder="Image URL" value={createProfile.events[0]?.image || ''} onChange={(e) => setCreateProfile((p) => ({ ...p, events: [{ ...(p.events[0] || {}), image: e.target.value, title: p.events[0]?.title || '', date: p.events[0]?.date || '', time: p.events[0]?.time || '', description: p.events[0]?.description || '', id: p.events[0]?.id || `e-${Date.now()}` }] }))} />
                        <Input placeholder="Description" value={createProfile.events[0]?.description || ''} onChange={(e) => setCreateProfile((p) => ({ ...p, events: [{ ...(p.events[0] || {}), description: e.target.value, title: p.events[0]?.title || '', date: p.events[0]?.date || '', time: p.events[0]?.time || '', image: p.events[0]?.image || '', id: p.events[0]?.id || `e-${Date.now()}` }] }))} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Ministry</Label>
                        <Input placeholder="Name" value={createProfile.ministries[0]?.name || ''} onChange={(e) => setCreateProfile((p) => ({ ...p, ministries: [{ ...(p.ministries[0] || {}), name: e.target.value, description: p.ministries[0]?.description || '', icon: p.ministries[0]?.icon || '', id: p.ministries[0]?.id || `m-${Date.now()}` }] }))} />
                        <Input placeholder="Description" value={createProfile.ministries[0]?.description || ''} onChange={(e) => setCreateProfile((p) => ({ ...p, ministries: [{ ...(p.ministries[0] || {}), description: e.target.value, name: p.ministries[0]?.name || '', icon: p.ministries[0]?.icon || '', id: p.ministries[0]?.id || `m-${Date.now()}` }] }))} />
                        <Input placeholder="Icon" value={createProfile.ministries[0]?.icon || ''} onChange={(e) => setCreateProfile((p) => ({ ...p, ministries: [{ ...(p.ministries[0] || {}), icon: e.target.value, name: p.ministries[0]?.name || '', description: p.ministries[0]?.description || '', id: p.ministries[0]?.id || `m-${Date.now()}` }] }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>First Gallery Item</Label>
                        <Input placeholder="Image URL" value={createProfile.gallery[0]?.url || ''} onChange={(e) => setCreateProfile((p) => ({ ...p, gallery: [{ ...(p.gallery[0] || {}), url: e.target.value, caption: p.gallery[0]?.caption || '', id: p.gallery[0]?.id || `g-${Date.now()}` }] }))} />
                        <Input placeholder="Caption" value={createProfile.gallery[0]?.caption || ''} onChange={(e) => setCreateProfile((p) => ({ ...p, gallery: [{ ...(p.gallery[0] || {}), caption: e.target.value, url: p.gallery[0]?.url || '', id: p.gallery[0]?.id || `g-${Date.now()}` }] }))} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  disabled={loading}
                >
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
                                  Save Changes
                                </Button>
                                <Button
                                  type="button"
                                  variant={isSuperAdmin ? 'destructive' : 'outline'}
                                  className={!isSuperAdmin ? themedActionButtonClass : undefined}
                                  onClick={() => handleDeleteChurch(church.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Church
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedChurchId(church.id);
                                    handleLoadChurchDetails(church.id);
                                  }}
                                >
                                  Edit Full Profile
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {selectedChurchId && (
                      <Card className="border-dashed">
                        <CardHeader>
                          <CardTitle>Edit Full Church Profile</CardTitle>
                          <CardDescription>Edit all church details here, then save.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Card className="border-dashed">
                            <CardHeader>
                              <CardTitle>Church Profile Form</CardTitle>
                              <CardDescription>Update full profile data for the selected church.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {detailsFormDisabled && (
                                <p className="text-sm text-red-600">Unable to load church profile data. Click Edit Full Profile again.</p>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Church ID</Label>
                                  <Input
                                    value={detailsObject?.id || ''}
                                    onChange={(e) => updateDetailsObject((draft) => { draft.id = e.target.value; })}
                                    placeholder="north"
                                    disabled={detailsFormDisabled}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Church Name</Label>
                                  <Input
                                    value={detailsObject?.name || ''}
                                    onChange={(e) => updateDetailsObject((draft) => { draft.name = e.target.value; })}
                                    placeholder="North Campus"
                                    disabled={detailsFormDisabled}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Location</Label>
                                  <Input
                                    value={detailsObject?.location || ''}
                                    onChange={(e) => updateDetailsObject((draft) => { draft.location = e.target.value; })}
                                    placeholder="Highland Park"
                                    disabled={detailsFormDisabled}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Address</Label>
                                  <Input
                                    value={detailsObject?.address || ''}
                                    onChange={(e) => updateDetailsObject((draft) => { draft.address = e.target.value; })}
                                    placeholder="123 Highland Avenue"
                                    disabled={detailsFormDisabled}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Phone</Label>
                                  <Input
                                    value={detailsObject?.phone || ''}
                                    onChange={(e) => updateDetailsObject((draft) => { draft.phone = e.target.value; })}
                                    placeholder="(555) 123-4567"
                                    disabled={detailsFormDisabled}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Email</Label>
                                  <Input
                                    value={detailsObject?.email || ''}
                                    onChange={(e) => updateDetailsObject((draft) => { draft.email = e.target.value; })}
                                    placeholder="north@missionfornation.org"
                                    disabled={detailsFormDisabled}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Hero Image URL</Label>
                                  <Input
                                    value={detailsObject?.heroImage || ''}
                                    onChange={(e) => updateDetailsObject((draft) => { draft.heroImage = e.target.value; })}
                                    placeholder="https://..."
                                    disabled={detailsFormDisabled}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Map URL (Embed)</Label>
                                  <Input
                                    value={detailsObject?.mapUrl || ''}
                                    onChange={(e) => updateDetailsObject((draft) => { draft.mapUrl = e.target.value; })}
                                    placeholder="https://www.google.com/maps/embed?..."
                                    disabled={detailsFormDisabled}
                                  />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Location Link</Label>
                                  <Input
                                    value={detailsObject?.location_link || ''}
                                    onChange={(e) => updateDetailsObject((draft) => { draft.location_link = e.target.value; })}
                                    placeholder="https://maps.google.com/?q=..."
                                    disabled={detailsFormDisabled}
                                  />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Description</Label>
                                  <Textarea
                                    value={detailsObject?.description || ''}
                                    onChange={(e) => updateDetailsObject((draft) => { draft.description = e.target.value; })}
                                    placeholder="Church description"
                                    rows={3}
                                    disabled={detailsFormDisabled}
                                  />
                                </div>
                              </div>

                              <Card>
                                <CardHeader>
                                  <CardTitle>Pastor</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Pastor Name</Label>
                                    <Input
                                      value={detailsObject?.pastor?.name || ''}
                                      onChange={(e) => updateDetailsObject((draft) => {
                                        draft.pastor = draft.pastor || {};
                                        draft.pastor.name = e.target.value;
                                      })}
                                      disabled={detailsFormDisabled}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Pastor Role</Label>
                                    <Input
                                      value={detailsObject?.pastor?.role || ''}
                                      onChange={(e) => updateDetailsObject((draft) => {
                                        draft.pastor = draft.pastor || {};
                                        draft.pastor.role = e.target.value;
                                      })}
                                      disabled={detailsFormDisabled}
                                    />
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>Pastor Image URL</Label>
                                    <Input
                                      value={detailsObject?.pastor?.image || ''}
                                      onChange={(e) => updateDetailsObject((draft) => {
                                        draft.pastor = draft.pastor || {};
                                        draft.pastor.image = e.target.value;
                                      })}
                                      disabled={detailsFormDisabled}
                                    />
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>Pastor Bio</Label>
                                    <Textarea
                                      value={detailsObject?.pastor?.bio || ''}
                                      onChange={(e) => updateDetailsObject((draft) => {
                                        draft.pastor = draft.pastor || {};
                                        draft.pastor.bio = e.target.value;
                                      })}
                                      rows={3}
                                      disabled={detailsFormDisabled}
                                    />
                                  </div>
                                </CardContent>
                              </Card>

                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4>Service Times</h4>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={detailsFormDisabled}
                                    onClick={() => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.serviceTimes) ? draft.serviceTimes : [];
                                      arr.push({ day: '', time: '', type: '' });
                                      draft.serviceTimes = arr;
                                    })}
                                  >
                                    Add Service Time
                                  </Button>
                                </div>
                                {(Array.isArray(detailsObject?.serviceTimes) ? detailsObject?.serviceTimes : []).map((item: any, index: number) => (
                                  <div key={`st-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                    <Input
                                      value={item?.day || ''}
                                      placeholder="Day"
                                      disabled={detailsFormDisabled}
                                      onChange={(e) => updateDetailsObject((draft) => {
                                        const arr = Array.isArray(draft.serviceTimes) ? draft.serviceTimes : [];
                                        arr[index] = { ...(arr[index] || {}), day: e.target.value };
                                        draft.serviceTimes = arr;
                                      })}
                                    />
                                    <Input
                                      type="time"
                                      value={item?.time || ''}
                                      placeholder="Time"
                                      disabled={detailsFormDisabled}
                                      onChange={(e) => updateDetailsObject((draft) => {
                                        const arr = Array.isArray(draft.serviceTimes) ? draft.serviceTimes : [];
                                        arr[index] = { ...(arr[index] || {}), time: e.target.value };
                                        draft.serviceTimes = arr;
                                      })}
                                    />
                                    <Input
                                      value={item?.type || ''}
                                      placeholder="Type"
                                      disabled={detailsFormDisabled}
                                      onChange={(e) => updateDetailsObject((draft) => {
                                        const arr = Array.isArray(draft.serviceTimes) ? draft.serviceTimes : [];
                                        arr[index] = { ...(arr[index] || {}), type: e.target.value };
                                        draft.serviceTimes = arr;
                                      })}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className={themedActionButtonClass}
                                      disabled={detailsFormDisabled}
                                      onClick={() => updateDetailsObject((draft) => {
                                        const arr = Array.isArray(draft.serviceTimes) ? draft.serviceTimes : [];
                                        draft.serviceTimes = arr.filter((_: unknown, i: number) => i !== index);
                                      })}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4>Announcements</h4>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={detailsFormDisabled}
                                    onClick={() => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.announcements) ? draft.announcements : [];
                                      arr.push({ id: `a-${Date.now()}`, title: '', date: '', content: '', priority: 'normal' });
                                      draft.announcements = arr;
                                    })}
                                  >
                                    Add Announcement
                                  </Button>
                                </div>
                                {(Array.isArray(detailsObject?.announcements) ? detailsObject?.announcements : []).map((item: any, index: number) => (
                                  <div key={`a-${index}`} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                    <Input value={item?.title || ''} placeholder="Title" disabled={detailsFormDisabled} onChange={(e) => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.announcements) ? draft.announcements : [];
                                      arr[index] = { ...(arr[index] || {}), title: e.target.value };
                                      draft.announcements = arr;
                                    })} />
                                    <Input type="date" value={item?.date || ''} placeholder="Date" disabled={detailsFormDisabled} onChange={(e) => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.announcements) ? draft.announcements : [];
                                      arr[index] = { ...(arr[index] || {}), date: e.target.value };
                                      draft.announcements = arr;
                                    })} />
                                    <Input value={item?.priority || ''} placeholder="Priority" disabled={detailsFormDisabled} onChange={(e) => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.announcements) ? draft.announcements : [];
                                      arr[index] = { ...(arr[index] || {}), priority: e.target.value };
                                      draft.announcements = arr;
                                    })} />
                                    <Input value={item?.content || ''} placeholder="Content" disabled={detailsFormDisabled} onChange={(e) => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.announcements) ? draft.announcements : [];
                                      arr[index] = { ...(arr[index] || {}), content: e.target.value };
                                      draft.announcements = arr;
                                    })} />
                                    <Button type="button" variant="outline" className={themedActionButtonClass} disabled={detailsFormDisabled} onClick={() => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.announcements) ? draft.announcements : [];
                                      draft.announcements = arr.filter((_: unknown, i: number) => i !== index);
                                    })}>Remove</Button>
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4>Events</h4>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={detailsFormDisabled}
                                    onClick={() => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.events) ? draft.events : [];
                                      arr.push({ id: `e-${Date.now()}`, title: '', date: '', time: '', image: '', description: '' });
                                      draft.events = arr;
                                    })}
                                  >
                                    Add Event
                                  </Button>
                                </div>
                                {(Array.isArray(detailsObject?.events) ? detailsObject?.events : []).map((item: any, index: number) => (
                                  <div key={`e-${index}`} className="grid grid-cols-1 md:grid-cols-6 gap-2">
                                    <Input value={item?.title || ''} placeholder="Title" disabled={detailsFormDisabled} onChange={(e) => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.events) ? draft.events : [];
                                      arr[index] = { ...(arr[index] || {}), title: e.target.value };
                                      draft.events = arr;
                                    })} />
                                    <Input type="date" value={item?.date || ''} placeholder="Date" disabled={detailsFormDisabled} onChange={(e) => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.events) ? draft.events : [];
                                      arr[index] = { ...(arr[index] || {}), date: e.target.value };
                                      draft.events = arr;
                                    })} />
                                    <Input type="time" value={item?.time || ''} placeholder="Time" disabled={detailsFormDisabled} onChange={(e) => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.events) ? draft.events : [];
                                      arr[index] = { ...(arr[index] || {}), time: e.target.value };
                                      draft.events = arr;
                                    })} />
                                    <Input value={item?.image || ''} placeholder="Image URL" disabled={detailsFormDisabled} onChange={(e) => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.events) ? draft.events : [];
                                      arr[index] = { ...(arr[index] || {}), image: e.target.value };
                                      draft.events = arr;
                                    })} />
                                    <Input value={item?.description || ''} placeholder="Description" disabled={detailsFormDisabled} onChange={(e) => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.events) ? draft.events : [];
                                      arr[index] = { ...(arr[index] || {}), description: e.target.value };
                                      draft.events = arr;
                                    })} />
                                    <Button type="button" variant="outline" className={themedActionButtonClass} disabled={detailsFormDisabled} onClick={() => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.events) ? draft.events : [];
                                      draft.events = arr.filter((_: unknown, i: number) => i !== index);
                                    })}>Remove</Button>
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4>Ministries</h4>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={detailsFormDisabled}
                                    onClick={() => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.ministries) ? draft.ministries : [];
                                      arr.push({ id: `m-${Date.now()}`, name: '', description: '', icon: '' });
                                      draft.ministries = arr;
                                    })}
                                  >
                                    Add Ministry
                                  </Button>
                                </div>
                                {(Array.isArray(detailsObject?.ministries) ? detailsObject?.ministries : []).map((item: any, index: number) => (
                                  <div key={`m-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                    <Input value={item?.name || ''} placeholder="Name" disabled={detailsFormDisabled} onChange={(e) => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.ministries) ? draft.ministries : [];
                                      arr[index] = { ...(arr[index] || {}), name: e.target.value };
                                      draft.ministries = arr;
                                    })} />
                                    <Input value={item?.description || ''} placeholder="Description" disabled={detailsFormDisabled} onChange={(e) => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.ministries) ? draft.ministries : [];
                                      arr[index] = { ...(arr[index] || {}), description: e.target.value };
                                      draft.ministries = arr;
                                    })} />
                                    <Input value={item?.icon || ''} placeholder="Icon" disabled={detailsFormDisabled} onChange={(e) => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.ministries) ? draft.ministries : [];
                                      arr[index] = { ...(arr[index] || {}), icon: e.target.value };
                                      draft.ministries = arr;
                                    })} />
                                    <Button type="button" variant="outline" className={themedActionButtonClass} disabled={detailsFormDisabled} onClick={() => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.ministries) ? draft.ministries : [];
                                      draft.ministries = arr.filter((_: unknown, i: number) => i !== index);
                                    })}>Remove</Button>
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4>Gallery</h4>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={detailsFormDisabled}
                                    onClick={() => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.gallery) ? draft.gallery : [];
                                      arr.push({ id: `g-${Date.now()}`, url: '', caption: '' });
                                      draft.gallery = arr;
                                    })}
                                  >
                                    Add Gallery Image
                                  </Button>
                                </div>
                                {(Array.isArray(detailsObject?.gallery) ? detailsObject?.gallery : []).map((item: any, index: number) => (
                                  <div key={`g-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                    <Input value={item?.url || ''} placeholder="Image URL" disabled={detailsFormDisabled} onChange={(e) => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.gallery) ? draft.gallery : [];
                                      arr[index] = { ...(arr[index] || {}), url: e.target.value };
                                      draft.gallery = arr;
                                    })} />
                                    <Input value={item?.caption || ''} placeholder="Caption" disabled={detailsFormDisabled} onChange={(e) => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.gallery) ? draft.gallery : [];
                                      arr[index] = { ...(arr[index] || {}), caption: e.target.value };
                                      draft.gallery = arr;
                                    })} />
                                    <Input value={item?.id || ''} placeholder="ID" disabled={detailsFormDisabled} onChange={(e) => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.gallery) ? draft.gallery : [];
                                      arr[index] = { ...(arr[index] || {}), id: e.target.value };
                                      draft.gallery = arr;
                                    })} />
                                    <Button type="button" variant="outline" className={themedActionButtonClass} disabled={detailsFormDisabled} onClick={() => updateDetailsObject((draft) => {
                                      const arr = Array.isArray(draft.gallery) ? draft.gallery : [];
                                      draft.gallery = arr.filter((_: unknown, i: number) => i !== index);
                                    })}>Remove</Button>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>

                          <div className="flex gap-2">
                            <Button type="button" onClick={handleSaveDetails} disabled={savingDetails || !selectedChurchId}>
                              <Save className="w-4 h-4 mr-2" />
                              {savingDetails ? 'Saving...' : 'Save Full Profile'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => selectedChurchId && handleLoadChurchDetails(selectedChurchId)}
                              disabled={!selectedChurchId}
                            >
                              Reload Profile
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
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
