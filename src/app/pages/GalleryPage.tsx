import { useState, useEffect } from 'react';
import { galleryAPI, regionAPI, churchAPI, uploadAPI } from '../services/api';
import { useAppSelector } from '../store/hooks';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Image as ImageIcon, Plus, Upload, MapPin, Calendar } from 'lucide-react';

interface GalleryItem {
  id: string;
  region_id: string;
  image_url: string;
  caption?: string;
  location_link?: string;
  created_at?: string;
}

interface Region {
  id: string;
  name: string;
}

interface Church {
  id: string;
  name: string;
  region_id: string;
}

export function GalleryPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === 'super';

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [selectedChurchId, setSelectedChurchId] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  
  // Filter states
  const [viewRegionId, setViewRegionId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    fetchRegions();
  }, []);

  useEffect(() => {
    if (selectedRegionId) {
      fetchChurches(selectedRegionId);
    }
  }, [selectedRegionId]);

  useEffect(() => {
    if (viewRegionId) {
      fetchGallery();
    }
  }, [viewRegionId, searchTerm, sortOrder]);

  const fetchRegions = async () => {
    try {
      const response = await regionAPI.getRegions();
setRegions(Array.isArray(response.data) ? response.data : response.data.regions || []);
      
      // Auto-select region for regional admins
      if (!isSuperAdmin && user?.region_id) {
        setSelectedRegionId(user.region_id);
        setViewRegionId(user.region_id);
      }
    } catch (error: any) {
      console.error('Failed to fetch regions:', error);
    }
  };

  const fetchChurches = async (regionId: string) => {
    try {
      const response = await churchAPI.getChurches(regionId);
      setChurches(response.data);
    } catch (error: any) {
      console.error('Failed to fetch churches:', error);
    }
  };

  const fetchGallery = async () => {
    try {
      const response = await galleryAPI.getGalleryItems({
        region_id: viewRegionId,
        search: searchTerm || undefined,
        sort: sortOrder,
        include_expired: false,
      });
      setGalleryItems(response.data);
    } catch (error: any) {
      console.error('Failed to fetch gallery:', error);
      toast.error('Failed to load gallery.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadAPI.uploadImage(file);
      const uploadedUrl = response.data.asset.secure_url;
      setImageUrl(uploadedUrl);
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl || !selectedRegionId) {
      toast.error('Please upload an image and select a region.');
      return;
    }

    setLoading(true);
    try {
      await galleryAPI.createGalleryItem({
        region_id: selectedRegionId,
        image_url: imageUrl,
        caption: caption || undefined,
        church_id: selectedChurchId || undefined,
        location_link: locationLink || undefined,
        expires_in_days: expiresInDays ? parseInt(expiresInDays) : undefined,
      });
      toast.success('Gallery item added successfully!');
      
      // Reset form
      setImageUrl('');
      setCaption('');
      setLocationLink('');
      setSelectedChurchId('');
      setExpiresInDays('');
      
      if (viewRegionId === selectedRegionId) {
        fetchGallery();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add gallery item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Regional Gallery</h1>
        <p className="text-muted-foreground">Manage photo galleries for regions</p>
      </div>

      <Tabs defaultValue="create">
        <TabsList>
          <TabsTrigger value="create">Add Photo</TabsTrigger>
          <TabsTrigger value="view">View Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Gallery Photo</CardTitle>
              <CardDescription>Upload a photo to the regional gallery</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGalleryItem} className="space-y-4">
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
                  <Label htmlFor="image">Image Upload *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      required={!imageUrl}
                    />
                    {uploading && <Upload className="w-4 h-4 animate-spin" />}
                  </div>
                  {imageUrl && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600 mb-2">✓ Image uploaded</p>
                      <img src={imageUrl} alt="Preview" className="max-w-sm rounded-lg" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caption">Caption (Optional)</Label>
                  <Textarea
                    id="caption"
                    placeholder="Add a caption for this photo..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                  />
                </div>

                {selectedRegionId && churches.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="church">Associated Church (Optional)</Label>
                    <Select value={selectedChurchId} onValueChange={setSelectedChurchId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a church" />
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
                )}

                <div className="space-y-2">
                  <Label htmlFor="location">Location Link (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="https://maps.google.com/..."
                    value={locationLink}
                    onChange={(e) => setLocationLink(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires">Expires In (Days) - Optional</Label>
                  <Input
                    id="expires"
                    type="number"
                    placeholder="e.g., 30"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    min="1"
                  />
                </div>

                <Button type="submit" disabled={loading || uploading || !imageUrl || regions.length === 0}>
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? 'Adding...' : 'Add to Gallery'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gallery</CardTitle>
              <CardDescription>Browse regional photo gallery</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="viewRegion">Region</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search captions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sort">Sort</Label>
                    <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {viewRegionId && (
                  <div className="mt-6">
                    {galleryItems.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No photos in gallery yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {galleryItems.map((item) => (
                          <Card key={item.id}>
                            <CardContent className="p-0">
                              <img
                                src={item.image_url}
                                alt={item.caption || 'Gallery image'}
                                className="w-full h-64 object-cover rounded-t-lg"
                              />
                              {(item.caption || item.location_link || item.created_at) && (
                                <div className="p-4 space-y-2">
                                  {item.caption && (
                                    <p className="text-sm">{item.caption}</p>
                                  )}
                                  {item.location_link && (
                                    <a
                                      href={item.location_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm hover:underline"
                                      style={{ color: '#d4af37' }}
                                    >
                                      <MapPin className="w-4 h-4" />
                                      View Location
                                    </a>
                                  )}
                                  {item.created_at && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(item.created_at).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              )}
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
      </Tabs>
    </div>
  );
}
