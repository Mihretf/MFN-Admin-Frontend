import { useState, useEffect } from 'react';
import { churchAPI, regionAPI, uploadAPI } from '../services/api';
import { useAppSelector } from '../store/hooks';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { ChurchIcon, MapPin, Plus, Save, Trash2, ChevronDown, Edit, Calendar, Megaphone, Image } from 'lucide-react';

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
  serviceTimes: [{ id: 'service-1', day: '', time: '', type: '' }],
  announcements: [{ id: 'announcement-1', title: '', date: '', content: '', priority: 'normal' }],
  events: [{ id: 'event-1', title: '', date: '', time: '', image: '', description: '' }],
  ministries: [{ id: 'ministry-1', name: '', description: '', icon: '' }],
  gallery: [{ id: 'gallery-1', url: '', caption: '' }],
  blogs: [{ id: 'blog-1', title: '', content: '', image_url: '', video_url: '', expires_in_days: '' }],
  services: [{ id: 'service-item-1', title: '', description: '', date: '', time: '', location_link: '', category: 'program_sunday' }],
};

export function ChurchesPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === 'super' || user?.role === 'super_admin';
  const userRegionId = user?.region_id || (user as any)?.regionId || (user as any)?.region?.id || '';

  const [churches, setChurches] = useState<Church[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [viewRegionId, setViewRegionId] = useState('');
  const [createProfile, setCreateProfile] = useState(emptyChurchProfile);

  // Details states
  const [selectedChurchId, setSelectedChurchId] = useState('');
  const [detailsJson, setDetailsJson] = useState('{}');

  const addCreateProfileItem = (key: 'serviceTimes' | 'announcements' | 'events' | 'ministries' | 'gallery' | 'blogs' | 'services', item: any) => {
    setCreateProfile((prev) => ({
      ...prev,
      [key]: [...((prev[key] as any[]) || []), item],
    }));
  };

  const updateCreateProfileArrayItem = (
    key: 'serviceTimes' | 'announcements' | 'events' | 'ministries' | 'gallery' | 'blogs' | 'services',
    index: number,
    updater: (item: any) => any
  ) => {
    setCreateProfile((prev) => ({
      ...prev,
      [key]: ((prev[key] as any[]) || []).map((item, itemIndex) => (itemIndex === index ? updater(item) : item)),
    }));
  };

  const removeCreateProfileArrayItem = (
    key: 'serviceTimes' | 'announcements' | 'events' | 'ministries' | 'gallery' | 'blogs' | 'services',
    index: number
  ) => {
    setCreateProfile((prev) => ({
      ...prev,
      [key]: ((prev[key] as any[]) || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

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

  const addDetailsArrayItem = (key: string, item: any) => {
    updateDetailsObject((draft) => {
      const current = Array.isArray(draft[key]) ? draft[key] : [];
      draft[key] = [...current, item];
    });
  };

  const updateDetailsArrayItem = (key: string, index: number, updater: (item: any) => any) => {
    updateDetailsObject((draft) => {
      const current = Array.isArray(draft[key]) ? draft[key] : [];
      draft[key] = current.map((item, itemIndex) => (itemIndex === index ? updater(item) : item));
    });
  };

  const removeDetailsArrayItem = (key: string, index: number) => {
    updateDetailsObject((draft) => {
      const current = Array.isArray(draft[key]) ? draft[key] : [];
      draft[key] = current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const detailsObject = getDetailsObject();
  const selectedRegionName = regions.find((r) => r.id === (selectedRegionId || userRegionId))?.name || '';
  const detailsFormDisabled = detailsObject == null;

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
      setRegions([]);
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

    if (!name.trim()) {
      toast.error('Please enter a church name.');
      return;
    }

    if (!regionIdToUse) {
      toast.error(isSuperAdmin ? 'Please select a region.' : 'Your account is not linked to a region.');
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
          mapUrl: createProfile.mapUrl || undefined,
          location: createProfile.location || undefined,
          address: createProfile.address || undefined,
          phone: createProfile.phone || undefined,
          email: createProfile.email || undefined,
          description: createProfile.description || undefined,
          pastor: createProfile.pastor,
          serviceTimes: createProfile.serviceTimes.filter((s: any) => s.day || s.time || s.type),
          announcements: createProfile.announcements.filter((a: any) => a.title || a.date || a.content),
          events: createProfile.events.filter((ev: any) => ev.title || ev.date || ev.time || ev.description),
          ministries: createProfile.ministries.filter((m: any) => m.name || m.description || m.icon),
          gallery: createProfile.gallery.filter((g: any) => g.url || g.caption),
          blogs: (createProfile.blogs || []).filter((b: any) => b.title || b.content || b.image_url || b.video_url),
          services: (createProfile.services || []).filter((s: any) => s.title || s.description || s.date || s.time || s.location_link),
        };

        await churchAPI.updateChurch(createdId, profilePayload);
      }

      toast.success(`Church added successfully!`);
      setName('');
      setLocationLink('');
      setCreateProfile(emptyChurchProfile);
      
      if (viewRegionId === regionIdToUse) {
        fetchChurches();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add church.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChurch = async (churchId: string) => {
    const confirmed = window.confirm('Delete this church? This action cannot be undone.');
    if (!confirmed) return;

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

  const handleOpenEditModal = async (churchId: string) => {
    if (!churchId) return;
    setSelectedChurchId(churchId);
    try {
      const response = await churchAPI.getChurchById(churchId);
      const church = response?.data?.church || response?.data;
      setDetailsJson(JSON.stringify(church, null, 2));
      setShowEditProfileModal(true);
    } catch (error: any) {
      toast.error('Failed to load church details.');
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedChurchId) return;
    try {
      const payload = JSON.parse(detailsJson);
      setSavingDetails(true);
      await churchAPI.updateChurch(selectedChurchId, payload);
      toast.success('Church profile updated successfully.');
      setShowEditProfileModal(false);
      fetchChurches();
    } catch {
      toast.error('Invalid JSON structure.');
    } finally {
      setSavingDetails(false);
    }
  };

  const uploadImageFile = async (file: File) => {
    const regionIdToUse = selectedRegionId || user?.region_id || viewRegionId;
    if (!regionIdToUse) {
      toast.error('Please select a region before uploading.');
      return null;
    }
    const response = await uploadAPI.uploadImage(file, { region_id: regionIdToUse });
    return response?.data?.asset?.secure_url || null;
  };

  const handleCreateImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadImageFile(file);
      if (url) {
        if (target === 'hero') setCreateProfile(p => ({ ...p, heroImage: url }));
        if (target === 'pastor') setCreateProfile(p => ({ ...p, pastor: { ...p.pastor, image: url } }));
        if (target === 'event') {
          setCreateProfile((p) => ({
            ...p,
            events: p.events.length
              ? p.events.map((event, index) => (index === p.events.length - 1 ? { ...event, image: url, id: event.id || `e-${Date.now()}` } : event))
              : [{ id: `e-${Date.now()}`, title: '', date: '', time: '', image: url, description: '' }],
          }));
        }
        if (target === 'gallery') {
          setCreateProfile((p) => ({
            ...p,
            gallery: p.gallery.length
              ? p.gallery.map((item, index) => (index === p.gallery.length - 1 ? { ...item, url, id: item.id || `g-${Date.now()}`, caption: item.caption || 'Uploaded photo' } : item))
              : [{ id: `g-${Date.now()}`, url, caption: 'Uploaded photo' }],
          }));
        }
        toast.success('Image uploaded successfully.');
      }
    } catch {
      toast.error('Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Churches Management</h1>
        <p className="text-muted-foreground">Manage administrative operations, structural assets, and profiles.</p>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="create">Add Church</TabsTrigger>
          <TabsTrigger value="view">View / Edit / Delete</TabsTrigger>
        </TabsList>

        {/* CREATE TAB */}
        <TabsContent value="create" className="space-y-6 mt-4">
          <form onSubmit={handleCreateChurch} className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="border border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Setup core settings and assignments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Region *</Label>
                    {isSuperAdmin ? (
                      <Select value={selectedRegionId} onValueChange={setSelectedRegionId}>
                        <SelectTrigger className="w-full border border-input bg-background px-3 py-2 flex justify-between items-center rounded-md focus:ring-2 focus:ring-primary">
                          <SelectValue placeholder="Select an administrative region" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input readOnly value={selectedRegionName || `Region code: ${userRegionId}`} className="border border-input bg-muted" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Church Name *</Label>
                    <Input id="name" placeholder="Enter full church name" value={name} onChange={(e) => setName(e.target.value)} className="border border-input focus:border-primary" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location Map Link</Label>
                    <Input id="location" placeholder="https://maps.google.com/..." value={locationLink} onChange={(e) => setLocationLink(e.target.value)} className="border border-input" />
                  </div>

                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Textarea placeholder="Summary of the church mission..." rows={3} value={createProfile.description} onChange={(e) => setCreateProfile(p => ({ ...p, description: e.target.value }))} className="border border-input" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Contact Details & Cover</CardTitle>
                  <CardDescription>Configure localization criteria.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Campus/Building</Label>
                      <Input placeholder="Main Hall, East Wing" value={createProfile.location} onChange={(e) => setCreateProfile(p => ({ ...p, location: e.target.value }))} className="border border-input" />
                    </div>
                    <div className="space-y-2">
                      <Label>Street Address</Label>
                      <Input placeholder="123 Main St" value={createProfile.address} onChange={(e) => setCreateProfile(p => ({ ...p, address: e.target.value }))} className="border border-input" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Line</Label>
                      <Input placeholder="+251..." value={createProfile.phone} onChange={(e) => setCreateProfile(p => ({ ...p, phone: e.target.value }))} className="border border-input" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input type="email" placeholder="office@church.org" value={createProfile.email} onChange={(e) => setCreateProfile(p => ({ ...p, email: e.target.value }))} className="border border-input" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label>Hero Banner Image</Label>
                    <Input type="file" accept="image/*" disabled={uploadingImage} onChange={(e) => handleCreateImageUpload(e, 'hero')} className="border border-input cursor-pointer" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* INTEGRATED ADD SECTIONS */}
            <Card className="border border-dashed border-muted-foreground/50 shadow-sm">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-xl flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Initial Profile Attachments</CardTitle>
                <CardDescription>Initialize metadata structural elements alongside the profile definition.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 p-4 border border-border rounded-lg bg-background">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider"><ChurchIcon className="w-4 h-4" /> Pastor Personnel</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Full Name</Label>
                        <Input placeholder="Pastor Name" value={createProfile.pastor.name} onChange={(e) => setCreateProfile(p => ({ ...p, pastor: { ...p.pastor, name: e.target.value } }))} className="border border-input" />
                      </div>
                      <div>
                        <Label className="text-xs">Role Title</Label>
                        <Input placeholder="Lead / Associate Pastor" value={createProfile.pastor.role} onChange={(e) => setCreateProfile(p => ({ ...p, pastor: { ...p.pastor, role: e.target.value } }))} className="border border-input" />
                      </div>
                      <div>
                        <Label className="text-xs">Biography</Label>
                        <Textarea rows={3} placeholder="Short pastor bio" value={createProfile.pastor.bio} onChange={(e) => setCreateProfile(p => ({ ...p, pastor: { ...p.pastor, bio: e.target.value } }))} className="border border-input" />
                      </div>
                      <div>
                        <Label className="text-xs">Personnel Image</Label>
                        <Input type="file" accept="image/*" onChange={(e) => handleCreateImageUpload(e, 'pastor')} className="border border-input text-xs" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border border-border rounded-lg bg-background">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider"><Megaphone className="w-4 h-4" /> Announcements</h3>
                    <div className="space-y-3">
                      {createProfile.announcements.map((announcement, index) => (
                        <div key={announcement.id || index} className="rounded-lg border border-dashed border-border p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Announcement {index + 1}</h4>
                            {createProfile.announcements.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeCreateProfileArrayItem('announcements', index)} className="text-destructive">
                                <Trash2 className="mr-1 h-4 w-4" /> Remove
                              </Button>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs">Bulletin Title</Label>
                            <Input value={announcement.title || ''} onChange={(e) => updateCreateProfileArrayItem('announcements', index, (item) => ({ ...item, title: e.target.value }))} className="border border-input" />
                          </div>
                          <div>
                            <Label className="text-xs">Bulletin Text Content</Label>
                            <Textarea rows={2} value={announcement.content || ''} onChange={(e) => updateCreateProfileArrayItem('announcements', index, (item) => ({ ...item, content: e.target.value }))} className="border border-input" />
                          </div>
                          <div>
                            <Label className="text-xs">Date</Label>
                            <Input type="date" value={announcement.date || ''} onChange={(e) => updateCreateProfileArrayItem('announcements', index, (item) => ({ ...item, date: e.target.value }))} className="border border-input" />
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => addCreateProfileItem('announcements', { id: `a-${Date.now()}`, title: '', date: '', content: '', priority: 'normal' })}>
                        <Plus className="mr-2 h-4 w-4" /> Add another announcement
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border border-border rounded-lg bg-background">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider"><Calendar className="w-4 h-4" /> Service Times</h3>
                    <div className="space-y-3">
                      {createProfile.serviceTimes.map((service, index) => (
                        <div key={service.id || index} className="rounded-lg border border-dashed border-border p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Service Time {index + 1}</h4>
                            {createProfile.serviceTimes.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeCreateProfileArrayItem('serviceTimes', index)} className="text-destructive">
                                <Trash2 className="mr-1 h-4 w-4" /> Remove
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Day</Label>
                              <Input value={service.day || ''} onChange={(e) => updateCreateProfileArrayItem('serviceTimes', index, (item) => ({ ...item, day: e.target.value }))} className="border border-input" />
                            </div>
                            <div>
                              <Label className="text-xs">Time</Label>
                              <Input value={service.time || ''} onChange={(e) => updateCreateProfileArrayItem('serviceTimes', index, (item) => ({ ...item, time: e.target.value }))} className="border border-input" />
                            </div>
                            <div>
                              <Label className="text-xs">Type</Label>
                              <Input value={service.type || ''} onChange={(e) => updateCreateProfileArrayItem('serviceTimes', index, (item) => ({ ...item, type: e.target.value }))} className="border border-input" />
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => addCreateProfileItem('serviceTimes', { id: `service-${Date.now()}`, day: '', time: '', type: '' })}>
                        <Plus className="mr-2 h-4 w-4" /> Add another service time
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border border-border rounded-lg bg-background">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider"><Image className="w-4 h-4" /> Ministries</h3>
                    <div className="space-y-3">
                      {createProfile.ministries.map((ministry, index) => (
                        <div key={ministry.id || index} className="rounded-lg border border-dashed border-border p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Ministry {index + 1}</h4>
                            {createProfile.ministries.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeCreateProfileArrayItem('ministries', index)} className="text-destructive">
                                <Trash2 className="mr-1 h-4 w-4" /> Remove
                              </Button>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs">Ministry Name</Label>
                            <Input value={ministry.name || ''} onChange={(e) => updateCreateProfileArrayItem('ministries', index, (item) => ({ ...item, name: e.target.value }))} className="border border-input" />
                          </div>
                          <div>
                            <Label className="text-xs">Description</Label>
                            <Textarea rows={2} value={ministry.description || ''} onChange={(e) => updateCreateProfileArrayItem('ministries', index, (item) => ({ ...item, description: e.target.value }))} className="border border-input" />
                          </div>
                          <div>
                            <Label className="text-xs">Icon</Label>
                            <Input value={ministry.icon || ''} onChange={(e) => updateCreateProfileArrayItem('ministries', index, (item) => ({ ...item, icon: e.target.value }))} className="border border-input" />
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => addCreateProfileItem('ministries', { id: `ministry-${Date.now()}`, name: '', description: '', icon: '' })}>
                        <Plus className="mr-2 h-4 w-4" /> Add another ministry
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border border-border rounded-lg bg-background">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider"><Calendar className="w-4 h-4" /> Events</h3>
                    <div className="space-y-3">
                      {createProfile.events.map((event, index) => (
                        <div key={event.id || index} className="rounded-lg border border-dashed border-border p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Event {index + 1}</h4>
                            {createProfile.events.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeCreateProfileArrayItem('events', index)} className="text-destructive">
                                <Trash2 className="mr-1 h-4 w-4" /> Remove
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Event Title</Label>
                              <Input value={event.title || ''} onChange={(e) => updateCreateProfileArrayItem('events', index, (item) => ({ ...item, title: e.target.value }))} className="border border-input" />
                            </div>
                            <div>
                              <Label className="text-xs">Date</Label>
                              <Input type="date" value={event.date || ''} onChange={(e) => updateCreateProfileArrayItem('events', index, (item) => ({ ...item, date: e.target.value }))} className="border border-input" />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Time</Label>
                            <Input type="time" value={event.time || ''} onChange={(e) => updateCreateProfileArrayItem('events', index, (item) => ({ ...item, time: e.target.value }))} className="border border-input" />
                          </div>
                          <div>
                            <Label className="text-xs">Description</Label>
                            <Textarea rows={2} value={event.description || ''} onChange={(e) => updateCreateProfileArrayItem('events', index, (item) => ({ ...item, description: e.target.value }))} className="border border-input" />
                          </div>
                          <div>
                            <Label className="text-xs">Image</Label>
                            <Input type="file" accept="image/*" onChange={(e) => handleCreateImageUpload(e, 'event')} className="border border-input text-xs" />
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => addCreateProfileItem('events', { id: `e-${Date.now()}`, title: '', date: '', time: '', image: '', description: '' })}>
                        <Plus className="mr-2 h-4 w-4" /> Add another event
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border border-border rounded-lg bg-background">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider"><Image className="w-4 h-4" /> Gallery</h3>
                    <div className="space-y-3">
                      {createProfile.gallery.map((item, index) => (
                        <div key={item.id || index} className="rounded-lg border border-dashed border-border p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Gallery Item {index + 1}</h4>
                            {createProfile.gallery.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeCreateProfileArrayItem('gallery', index)} className="text-destructive">
                                <Trash2 className="mr-1 h-4 w-4" /> Remove
                              </Button>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs">Media File Upload</Label>
                            <Input type="file" accept="image/*" onChange={(e) => handleCreateImageUpload(e, 'gallery')} className="border border-input text-xs" />
                          </div>
                          <div>
                            <Label className="text-xs">Caption</Label>
                            <Input value={item.caption || ''} onChange={(e) => updateCreateProfileArrayItem('gallery', index, (entry) => ({ ...entry, caption: e.target.value }))} className="border border-input" />
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => addCreateProfileItem('gallery', { id: `g-${Date.now()}`, url: '', caption: '' })}>
                        <Plus className="mr-2 h-4 w-4" /> Add another gallery item
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border border-border rounded-lg bg-background">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider"><ChurchIcon className="w-4 h-4" /> Blog Posts</h3>
                    <div className="space-y-3">
                      {createProfile.blogs.map((blog, index) => (
                        <div key={blog.id || index} className="rounded-lg border border-dashed border-border p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Blog {index + 1}</h4>
                            {createProfile.blogs.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeCreateProfileArrayItem('blogs', index)} className="text-destructive">
                                <Trash2 className="mr-1 h-4 w-4" /> Remove
                              </Button>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs">Title</Label>
                            <Input value={blog.title || ''} onChange={(e) => updateCreateProfileArrayItem('blogs', index, (entry) => ({ ...entry, title: e.target.value }))} className="border border-input" />
                          </div>
                          <div>
                            <Label className="text-xs">Content</Label>
                            <Textarea rows={3} value={blog.content || ''} onChange={(e) => updateCreateProfileArrayItem('blogs', index, (entry) => ({ ...entry, content: e.target.value }))} className="border border-input" />
                          </div>
                          <div>
                            <Label className="text-xs">Image URL</Label>
                            <Input value={blog.image_url || ''} onChange={(e) => updateCreateProfileArrayItem('blogs', index, (entry) => ({ ...entry, image_url: e.target.value }))} className="border border-input" />
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => addCreateProfileItem('blogs', { id: `blog-${Date.now()}`, title: '', content: '', image_url: '', video_url: '', expires_in_days: '' })}>
                        <Plus className="mr-2 h-4 w-4" /> Add another blog post
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border border-border rounded-lg bg-background">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider"><ChurchIcon className="w-4 h-4" /> Services</h3>
                    <div className="space-y-3">
                      {createProfile.services.map((service, index) => (
                        <div key={service.id || index} className="rounded-lg border border-dashed border-border p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Service {index + 1}</h4>
                            {createProfile.services.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeCreateProfileArrayItem('services', index)} className="text-destructive">
                                <Trash2 className="mr-1 h-4 w-4" /> Remove
                              </Button>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs">Title</Label>
                            <Input value={service.title || ''} onChange={(e) => updateCreateProfileArrayItem('services', index, (entry) => ({ ...entry, title: e.target.value }))} className="border border-input" />
                          </div>
                          <div>
                            <Label className="text-xs">Description</Label>
                            <Textarea rows={2} value={service.description || ''} onChange={(e) => updateCreateProfileArrayItem('services', index, (entry) => ({ ...entry, description: e.target.value }))} className="border border-input" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Date</Label>
                              <Input type="date" value={service.date || ''} onChange={(e) => updateCreateProfileArrayItem('services', index, (entry) => ({ ...entry, date: e.target.value }))} className="border border-input" />
                            </div>
                            <div>
                              <Label className="text-xs">Time</Label>
                              <Input type="time" value={service.time || ''} onChange={(e) => updateCreateProfileArrayItem('services', index, (entry) => ({ ...entry, time: e.target.value }))} className="border border-input" />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Location Link</Label>
                            <Input value={service.location_link || ''} onChange={(e) => updateCreateProfileArrayItem('services', index, (entry) => ({ ...entry, location_link: e.target.value }))} className="border border-input" />
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => addCreateProfileItem('services', { id: `service-item-${Date.now()}`, title: '', description: '', date: '', time: '', location_link: '', category: 'program_sunday' })}>
                        <Plus className="mr-2 h-4 w-4" /> Add another service
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="px-8 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
                {loading ? 'Processing...' : <> <Save className="w-4 h-4" /> Register New Church </>}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* VIEW / INTERACTIVE ACTIONS TAB */}
        <TabsContent value="view" className="space-y-4 mt-4">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle>Registered Network Registry</CardTitle>
              <CardDescription>Select a target system domain context to execute operational reviews.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-w-sm">
                <Label>Filter Registry View by Region Context</Label>
                <Select value={viewRegionId} onValueChange={setViewRegionId}>
                  <SelectTrigger className="w-full border border-input bg-background px-3 py-2 flex justify-between items-center rounded-md">
                    <SelectValue placeholder="Choose a region to load assets" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {churches.length === 0 ? (
                <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                  No active church items associated with the current configuration context.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
                  {churches.map((church) => (
                    <div key={church.id} className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="font-bold text-lg text-foreground flex items-center gap-2"><ChurchIcon className="w-5 h-5 text-primary" /> {church.name}</h4>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(church.id)} className="flex-1 flex items-center gap-1 text-xs border border-input hover:bg-accent">
                          <Edit className="w-3.5 h-3.5 text-primary" /> Edit Full Profile
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteChurch(church.id)} className="px-3 bg-destructive hover:bg-destructive/90">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* POPPING SCREEN POPUP MODAL (DIALOG OVERLAY) */}
      <Dialog open={showEditProfileModal} onOpenChange={setShowEditProfileModal}>
        <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0 bg-background border border-border shadow-2xl rounded-xl">
          <div className="p-6 border-b border-border bg-muted/20">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2"><Edit className="w-6 h-6 text-primary" /> Edit Section</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1"></DialogDescription>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6 pr-2">
              <Tabs defaultValue="form" className="w-full">
                <TabsList className="grid w-full grid-cols-1 max-w-xs mb-4">
                  <TabsTrigger value="form"> Editor</TabsTrigger>
                </TabsList>

                <TabsContent value="form" className="space-y-4">
                  {detailsObject !== null ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Location Building Name</Label>
                          <Input value={detailsObject.location || ''} onChange={(e) => updateDetailsObject(d => { d.location = e.target.value; })} className="border border-input" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Street Address Map Line</Label>
                          <Input value={detailsObject.address || ''} onChange={(e) => updateDetailsObject(d => { d.address = e.target.value; })} className="border border-input" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Location Map Link</Label>
                          <Input value={detailsObject.location_link || ''} onChange={(e) => updateDetailsObject(d => { d.location_link = e.target.value; })} className="border border-input" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Hero Image URL</Label>
                          <Input value={detailsObject.heroImage || ''} onChange={(e) => updateDetailsObject(d => { d.heroImage = e.target.value; })} className="border border-input" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Map Embed URL</Label>
                          <Input value={detailsObject.mapUrl || ''} onChange={(e) => updateDetailsObject(d => { d.mapUrl = e.target.value; })} className="border border-input" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Phone Number</Label>
                          <Input value={detailsObject.phone || ''} onChange={(e) => updateDetailsObject(d => { d.phone = e.target.value; })} className="border border-input" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Email Address</Label>
                          <Input value={detailsObject.email || ''} onChange={(e) => updateDetailsObject(d => { d.email = e.target.value; })} className="border border-input" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Church Description Metadata Profile</Label>
                          <Textarea rows={3} value={detailsObject.description || ''} onChange={(e) => updateDetailsObject(d => { d.description = e.target.value; })} className="border border-input" />
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-4">
                        <h4 className="font-bold text-sm text-primary flex items-center gap-2 border-b pb-2"><ChurchIcon className="w-4 h-4" /> Pastor Core Assigned Personnel</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Ecclesiastical Title Name</Label>
                            <Input value={detailsObject.pastor?.name || ''} onChange={(e) => updateDetailsObject(d => { d.pastor = { ...(d.pastor || {}), name: e.target.value }; })} className="border border-input text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs">Assigned Office Role</Label>
                            <Input value={detailsObject.pastor?.role || ''} onChange={(e) => updateDetailsObject(d => { d.pastor = { ...(d.pastor || {}), role: e.target.value }; })} className="border border-input text-sm" />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs">Pastor Image URL</Label>
                            <Input value={detailsObject.pastor?.image || ''} onChange={(e) => updateDetailsObject(d => { d.pastor = { ...(d.pastor || {}), image: e.target.value }; })} className="border border-input text-sm" />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs">Pastor Bio</Label>
                            <Textarea rows={3} value={detailsObject.pastor?.bio || ''} onChange={(e) => updateDetailsObject(d => { d.pastor = { ...(d.pastor || {}), bio: e.target.value }; })} className="border border-input text-sm" />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-4">
                        <h4 className="font-bold text-sm text-primary flex items-center gap-2 border-b pb-2"><Calendar className="w-4 h-4" /> Service Times</h4>
                        <div className="space-y-3">
                          {(detailsObject.serviceTimes || []).map((item: any, index: number) => (
                            <div key={`${item.id || index}-service`} className="rounded-lg border border-dashed border-border p-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-semibold">Service Time {index + 1}</h5>
                                {(detailsObject.serviceTimes || []).length > 1 && (
                                  <Button type="button" variant="ghost" size="sm" onClick={() => removeDetailsArrayItem('serviceTimes', index)} className="text-destructive">
                                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                                  </Button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <Label className="text-xs">Day</Label>
                                  <Input value={item.day || ''} onChange={(e) => updateDetailsArrayItem('serviceTimes', index, (entry) => ({ ...entry, day: e.target.value }))} className="border border-input text-sm" />
                                </div>
                                <div>
                                  <Label className="text-xs">Time</Label>
                                  <Input value={item.time || ''} onChange={(e) => updateDetailsArrayItem('serviceTimes', index, (entry) => ({ ...entry, time: e.target.value }))} className="border border-input text-sm" />
                                </div>
                                <div>
                                  <Label className="text-xs">Type</Label>
                                  <Input value={item.type || ''} onChange={(e) => updateDetailsArrayItem('serviceTimes', index, (entry) => ({ ...entry, type: e.target.value }))} className="border border-input text-sm" />
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => addDetailsArrayItem('serviceTimes', { day: '', time: '', type: '' })}>
                            <Plus className="mr-2 h-4 w-4" /> Add another service time
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-4">
                        <h4 className="font-bold text-sm text-primary flex items-center gap-2 border-b pb-2"><Image className="w-4 h-4" /> Ministries</h4>
                        <div className="space-y-3">
                          {(detailsObject.ministries || []).map((item: any, index: number) => (
                            <div key={`${item.id || index}-ministry`} className="rounded-lg border border-dashed border-border p-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-semibold">Ministry {index + 1}</h5>
                                {(detailsObject.ministries || []).length > 1 && (
                                  <Button type="button" variant="ghost" size="sm" onClick={() => removeDetailsArrayItem('ministries', index)} className="text-destructive">
                                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                                  </Button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <Label className="text-xs">Ministry Name</Label>
                                  <Input value={item.name || ''} onChange={(e) => updateDetailsArrayItem('ministries', index, (entry) => ({ ...entry, name: e.target.value }))} className="border border-input text-sm" />
                                </div>
                                <div>
                                  <Label className="text-xs">Ministry Icon</Label>
                                  <Input value={item.icon || ''} onChange={(e) => updateDetailsArrayItem('ministries', index, (entry) => ({ ...entry, icon: e.target.value }))} className="border border-input text-sm" />
                                </div>
                                <div className="md:col-span-3">
                                  <Label className="text-xs">Ministry Description</Label>
                                  <Textarea rows={3} value={item.description || ''} onChange={(e) => updateDetailsArrayItem('ministries', index, (entry) => ({ ...entry, description: e.target.value }))} className="border border-input text-sm" />
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => addDetailsArrayItem('ministries', { name: '', description: '', icon: '' })}>
                            <Plus className="mr-2 h-4 w-4" /> Add another ministry
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-4">
                        <h4 className="font-bold text-sm text-primary flex items-center gap-2 border-b pb-2"><Megaphone className="w-4 h-4" /> Announcements</h4>
                        <div className="space-y-3">
                          {(detailsObject.announcements || []).map((item: any, index: number) => (
                            <div key={`${item.id || index}-announcement`} className="rounded-lg border border-dashed border-border p-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-semibold">Announcement {index + 1}</h5>
                                {(detailsObject.announcements || []).length > 1 && (
                                  <Button type="button" variant="ghost" size="sm" onClick={() => removeDetailsArrayItem('announcements', index)} className="text-destructive">
                                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                                  </Button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Announcement Title</Label>
                                  <Input value={item.title || ''} onChange={(e) => updateDetailsArrayItem('announcements', index, (entry) => ({ ...entry, title: e.target.value }))} className="border border-input text-sm" />
                                </div>
                                <div>
                                  <Label className="text-xs">Announcement Date</Label>
                                  <Input type="date" value={item.date || ''} onChange={(e) => updateDetailsArrayItem('announcements', index, (entry) => ({ ...entry, date: e.target.value }))} className="border border-input text-sm" />
                                </div>
                                <div className="md:col-span-2">
                                  <Label className="text-xs">Announcement Content</Label>
                                  <Textarea rows={3} value={item.content || ''} onChange={(e) => updateDetailsArrayItem('announcements', index, (entry) => ({ ...entry, content: e.target.value }))} className="border border-input text-sm" />
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => addDetailsArrayItem('announcements', { title: '', date: '', content: '', priority: 'normal' })}>
                            <Plus className="mr-2 h-4 w-4" /> Add another announcement
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-4">
                        <h4 className="font-bold text-sm text-primary flex items-center gap-2 border-b pb-2"><Calendar className="w-4 h-4" /> Events</h4>
                        <div className="space-y-3">
                          {(detailsObject.events || []).map((item: any, index: number) => (
                            <div key={`${item.id || index}-event`} className="rounded-lg border border-dashed border-border p-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-semibold">Event {index + 1}</h5>
                                {(detailsObject.events || []).length > 1 && (
                                  <Button type="button" variant="ghost" size="sm" onClick={() => removeDetailsArrayItem('events', index)} className="text-destructive">
                                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                                  </Button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Event Title</Label>
                                  <Input value={item.title || ''} onChange={(e) => updateDetailsArrayItem('events', index, (entry) => ({ ...entry, title: e.target.value }))} className="border border-input text-sm" />
                                </div>
                                <div>
                                  <Label className="text-xs">Event Date</Label>
                                  <Input type="date" value={item.date || ''} onChange={(e) => updateDetailsArrayItem('events', index, (entry) => ({ ...entry, date: e.target.value }))} className="border border-input text-sm" />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Event Time</Label>
                                <Input type="time" value={item.time || ''} onChange={(e) => updateDetailsArrayItem('events', index, (entry) => ({ ...entry, time: e.target.value }))} className="border border-input text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Event Description</Label>
                                <Textarea rows={3} value={item.description || ''} onChange={(e) => updateDetailsArrayItem('events', index, (entry) => ({ ...entry, description: e.target.value }))} className="border border-input text-sm" />
                              </div>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => addDetailsArrayItem('events', { title: '', date: '', time: '', image: '', description: '' })}>
                            <Plus className="mr-2 h-4 w-4" /> Add another event
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-4">
                        <h4 className="font-bold text-sm text-primary flex items-center gap-2 border-b pb-2"><Image className="w-4 h-4" /> Gallery</h4>
                        <div className="space-y-3">
                          {(detailsObject.gallery || []).map((item: any, index: number) => (
                            <div key={`${item.id || index}-gallery`} className="rounded-lg border border-dashed border-border p-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-semibold">Gallery Item {index + 1}</h5>
                                {(detailsObject.gallery || []).length > 1 && (
                                  <Button type="button" variant="ghost" size="sm" onClick={() => removeDetailsArrayItem('gallery', index)} className="text-destructive">
                                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                                  </Button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Gallery Image URL</Label>
                                  <Input value={item.url || ''} onChange={(e) => updateDetailsArrayItem('gallery', index, (entry) => ({ ...entry, url: e.target.value }))} className="border border-input text-sm" />
                                </div>
                                <div>
                                  <Label className="text-xs">Gallery Caption</Label>
                                  <Input value={item.caption || ''} onChange={(e) => updateDetailsArrayItem('gallery', index, (entry) => ({ ...entry, caption: e.target.value }))} className="border border-input text-sm" />
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => addDetailsArrayItem('gallery', { url: '', caption: '' })}>
                            <Plus className="mr-2 h-4 w-4" /> Add another gallery image
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-4">
                        <h4 className="font-bold text-sm text-primary flex items-center gap-2 border-b pb-2"><ChurchIcon className="w-4 h-4" /> Blog Posts</h4>
                        <div className="space-y-3">
                          {(detailsObject.blogs || []).map((item: any, index: number) => (
                            <div key={`${item.id || index}-blog`} className="rounded-lg border border-dashed border-border p-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-semibold">Blog {index + 1}</h5>
                                {(detailsObject.blogs || []).length > 1 && (
                                  <Button type="button" variant="ghost" size="sm" onClick={() => removeDetailsArrayItem('blogs', index)} className="text-destructive">
                                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                                  </Button>
                                )}
                              </div>
                              <div>
                                <Label className="text-xs">Title</Label>
                                <Input value={item.title || ''} onChange={(e) => updateDetailsArrayItem('blogs', index, (entry) => ({ ...entry, title: e.target.value }))} className="border border-input text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Content</Label>
                                <Textarea rows={3} value={item.content || ''} onChange={(e) => updateDetailsArrayItem('blogs', index, (entry) => ({ ...entry, content: e.target.value }))} className="border border-input text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Image URL</Label>
                                <Input value={item.image_url || ''} onChange={(e) => updateDetailsArrayItem('blogs', index, (entry) => ({ ...entry, image_url: e.target.value }))} className="border border-input text-sm" />
                              </div>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => addDetailsArrayItem('blogs', { title: '', content: '', image_url: '', video_url: '', expires_in_days: '' })}>
                            <Plus className="mr-2 h-4 w-4" /> Add another blog post
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-4">
                        <h4 className="font-bold text-sm text-primary flex items-center gap-2 border-b pb-2"><ChurchIcon className="w-4 h-4" /> Services</h4>
                        <div className="space-y-3">
                          {(detailsObject.services || []).map((item: any, index: number) => (
                            <div key={`${item.id || index}-service-item`} className="rounded-lg border border-dashed border-border p-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-semibold">Service {index + 1}</h5>
                                {(detailsObject.services || []).length > 1 && (
                                  <Button type="button" variant="ghost" size="sm" onClick={() => removeDetailsArrayItem('services', index)} className="text-destructive">
                                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                                  </Button>
                                )}
                              </div>
                              <div>
                                <Label className="text-xs">Title</Label>
                                <Input value={item.title || ''} onChange={(e) => updateDetailsArrayItem('services', index, (entry) => ({ ...entry, title: e.target.value }))} className="border border-input text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Description</Label>
                                <Textarea rows={2} value={item.description || ''} onChange={(e) => updateDetailsArrayItem('services', index, (entry) => ({ ...entry, description: e.target.value }))} className="border border-input text-sm" />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Date</Label>
                                  <Input type="date" value={item.date || ''} onChange={(e) => updateDetailsArrayItem('services', index, (entry) => ({ ...entry, date: e.target.value }))} className="border border-input text-sm" />
                                </div>
                                <div>
                                  <Label className="text-xs">Time</Label>
                                  <Input type="time" value={item.time || ''} onChange={(e) => updateDetailsArrayItem('services', index, (entry) => ({ ...entry, time: e.target.value }))} className="border border-input text-sm" />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Location Link</Label>
                                <Input value={item.location_link || ''} onChange={(e) => updateDetailsArrayItem('services', index, (entry) => ({ ...entry, location_link: e.target.value }))} className="border border-input text-sm" />
                              </div>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => addDetailsArrayItem('services', { title: '', description: '', date: '', time: '', location_link: '', category: 'program_sunday' })}>
                            <Plus className="mr-2 h-4 w-4" /> Add another service
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border border-destructive/50 text-destructive rounded-lg bg-destructive/10 text-sm">
                      Unable to parse structural components. Correct raw compilation errors inside the structured editor.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3 rounded-b-xl">
            <Button variant="outline" onClick={() => setShowEditProfileModal(false)} className="border border-input hover:bg-accent">Exit</Button>
            <Button onClick={handleSaveDetails} disabled={savingDetails} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 flex items-center gap-2">
              {savingDetails ? 'Saving Modifications...' : <> <Save className="w-4 h-4" /> Save </>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}