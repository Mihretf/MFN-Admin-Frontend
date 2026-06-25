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
  const selectedRegionName = regions.find((r) => r.id === (selectedRegionId || userRegionId))?.name || '';

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
          pastor: createProfile.pastor,
          serviceTimes: createProfile.serviceTimes.filter((s) => s.day || s.time || s.type),
          announcements: createProfile.announcements.filter((a) => a.title || a.date || a.content),
          events: createProfile.events.filter((ev) => ev.title || ev.date || ev.time || ev.description),
          ministries: createProfile.ministries.filter((m) => m.name || m.description || m.icon),
          gallery: createProfile.gallery.filter((g) => g.url || g.caption),
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
        if (target === 'event') setCreateProfile(p => ({ ...p, events: [{ ...(p.events[0] || {}), image: url, id: `e-${Date.now()}` }] }));
        if (target === 'gallery') setCreateProfile(p => ({ ...p, gallery: [{ ...(p.gallery[0] || {}), url, id: `g-${Date.now()}`, caption: 'Uploaded photo' }] }));
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
                          <ChevronDown className="w-4 h-4 opacity-60" />
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
                  {/* Pastor Details */}
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
                        <Label className="text-xs">Personnel Image</Label>
                        <Input type="file" accept="image/*" onChange={(e) => handleCreateImageUpload(e, 'pastor')} className="border border-input text-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Announcements */}
                  <div className="space-y-4 p-4 border border-border rounded-lg bg-background">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider"><Megaphone className="w-4 h-4" /> Primary Announcement</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Bulletin Title</Label>
                        <Input placeholder="Notice header" value={createProfile.announcements[0]?.title || ''} onChange={(e) => setCreateProfile(p => ({ ...p, announcements: [{ ...(p.announcements[0] || {}), title: e.target.value, id: `a-${Date.now()}` }] }))} className="border border-input" />
                      </div>
                      <div>
                        <Label className="text-xs">Bulletin Text Content</Label>
                        <Textarea placeholder="Provide notice breakdown details..." rows={2} value={createProfile.announcements[0]?.content || ''} onChange={(e) => setCreateProfile(p => ({ ...p, announcements: [{ ...(p.announcements[0] || {}), content: e.target.value }] }))} className="border border-input" />
                      </div>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="space-y-4 p-4 border border-border rounded-lg bg-background">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider"><Calendar className="w-4 h-4" /> Key Event</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Event Title</Label>
                          <Input placeholder="Conference name" value={createProfile.events[0]?.title || ''} onChange={(e) => setCreateProfile(p => ({ ...p, events: [{ ...(p.events[0] || {}), title: e.target.value, id: `e-${Date.now()}` }] }))} className="border border-input" />
                        </div>
                        <div>
                          <Label className="text-xs">Date Scheduling</Label>
                          <Input type="date" value={createProfile.events[0]?.date || ''} onChange={(e) => setCreateProfile(p => ({ ...p, events: [{ ...(p.events[0] || {}), date: e.target.value }] }))} className="border border-input" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Event Poster Image</Label>
                        <Input type="file" accept="image/*" onChange={(e) => handleCreateImageUpload(e, 'event')} className="border border-input text-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Gallery */}
                  <div className="space-y-4 p-4 border border-border rounded-lg bg-background">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider"><Image className="w-4 h-4" /> Gallery Exhibition</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Media File Upload</Label>
                        <Input type="file" accept="image/*" onChange={(e) => handleCreateImageUpload(e, 'gallery')} className="border border-input text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">Media Description Caption</Label>
                        <Input placeholder="Altar view, community baptism photos..." value={createProfile.gallery[0]?.caption || ''} onChange={(e) => setCreateProfile(p => ({ ...p, gallery: [{ ...(p.gallery[0] || {}), caption: e.target.value }] }))} className="border border-input" />
                      </div>
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
                    <ChevronDown className="w-4 h-4 opacity-60" />
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
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> System ID Reference: {church.id}</p>
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
            <DialogTitle className="text-2xl font-bold flex items-center gap-2"><Edit className="w-6 h-6 text-primary" /> Core Profile Entity Modeler</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">Directly update parameters using structured configurations or direct payload manipulation maps.</DialogDescription>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 pr-2">
              <Tabs defaultValue="form" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-xs mb-4">
                  <TabsTrigger value="form">Structured Editor</TabsTrigger>
                  <TabsTrigger value="json">Raw JSON Payload</TabsTrigger>
                </TabsList>

                <TabsContent value="form" className="space-y-4">
                  {detailsObject && !detailsFormDisabled ? (
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

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Church Description Metadata Profile</Label>
                        <Textarea rows={3} value={detailsObject.description || ''} onChange={(e) => updateDetailsObject(d => { d.description = e.target.value; })} className="border border-input" />
                      </div>

                      {/* Structural Subsection Hooks */}
                      <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-4">
                        <h4 className="font-bold text-sm text-primary flex items-center gap-2 border-b pb-2"><ChurchIcon className="w-4 h-4" /> Pastor Core Assigned Personnel</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Ecclesiastical Title Name</Label>
                            <Input value={detailsObject.pastor?.name || ''} onChange={(e) => updateDetailsObject(d => { d.pastor = { ...(d.pastor || {}), name: e.target.value }; })} className="border border-input text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs">Assigned Office Role</Label>
                            <Input value={detailsObject.pastor?.role || ''} onChange={(e) => updateDetailsObject(d => { d.pastor = { ...(d.pastor || {}), role: e.target.value }; })} className="border border-input text-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border border-destructive/50 text-destructive rounded-lg bg-destructive/10 text-sm">
                      Unable to parse structural components. Correct raw compilation errors inside the Raw JSON configuration map template viewport.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="json" className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Raw Data Tree Configuration Grid</Label>
                  <Textarea value={detailsJson} onChange={(e) => setDetailsJson(e.target.value)} rows={15} className="font-mono text-xs border border-input p-4 bg-muted/40 focus-visible:ring-1 focus-visible:ring-primary rounded-md" />
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3 rounded-b-xl">
            <Button variant="outline" onClick={() => setShowEditProfileModal(false)} className="border border-input hover:bg-accent">Dismiss Window</Button>
            <Button onClick={handleSaveDetails} disabled={savingDetails} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 flex items-center gap-2">
              {savingDetails ? 'Saving Modifications...' : <> <Save className="w-4 h-4" /> Commit System Mutations </>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}