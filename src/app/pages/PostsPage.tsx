import { useState, useEffect } from 'react';
import { postAPI, regionAPI, churchAPI, uploadAPI } from '../services/api';
import { useAppSelector } from '../store/hooks';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { FileText, Plus, Image as ImageIcon, Video, Upload, MapPin, Church as ChurchIcon, Calendar } from 'lucide-react';

interface Post {
  id: string;
  region_id: string;
  content: string;
  category: 'special_program' | 'mission' | 'program_sunday';
  title?: string;
  image_url?: string;
  video_url?: string;
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

export function PostsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === 'super_admin';

  const [posts, setPosts] = useState<Post[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'special_program' | 'mission' | 'program_sunday'>('special_program');
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [selectedChurchIds, setSelectedChurchIds] = useState<string[]>([]);
  const [expiresInDays, setExpiresInDays] = useState('');
  const [viewRegionId, setViewRegionId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
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
      fetchPosts();
    }
  }, [viewRegionId, searchTerm, filterCategory, sortOrder]);
const fetchRegions = async () => {
    try {
      const response = await regionAPI.getRegions();
      // Use logical OR to find the array if it's nested
      const data = Array.isArray(response.data) ? response.data : (response.data.regions || []);
      setRegions(data);
      
      if (!isSuperAdmin && user?.region_id) {
        setSelectedRegionId(user.region_id);
        setViewRegionId(user.region_id);
      }
    } catch (error: any) {
      console.error('Failed to fetch regions:', error);
      setRegions([]); // Fallback to empty array on error
    }
  };

  const fetchChurches = async (regionId: string) => {
    try {
      const response = await churchAPI.getChurches(regionId);
      const data = Array.isArray(response.data) ? response.data : (response.data.churches || []);
      setChurches(data);
    } catch (error: any) {
      console.error('Failed to fetch churches:', error);
      setChurches([]);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await postAPI.getPosts({
        region_id: viewRegionId,
        search: searchTerm || undefined,
        category: filterCategory !== 'all' ? filterCategory as any : undefined,
        sort: sortOrder,
        include_expired: false,
      });
      const data = Array.isArray(response.data) ? response.data : (response.data.posts || []);
      setPosts(data);
    } catch (error: any) {
      console.error('Failed to fetch posts:', error);
      setPosts([]);
      toast.error('Failed to load posts.');
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadAPI.uploadVideo(file);
      const uploadedUrl = response.data.asset.secure_url;
      setVideoUrl(uploadedUrl);
      toast.success('Video uploaded successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload video.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedRegionId) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      await postAPI.createPost({
        region_id: selectedRegionId,
        content,
        category,
        title: title || undefined,
        image_url: imageUrl || undefined,
        video_url: videoUrl || undefined,
        location_link: locationLink || undefined,
        church_ids: selectedChurchIds.length > 0 ? selectedChurchIds : undefined,
        expires_in_days: expiresInDays ? parseInt(expiresInDays) : undefined,
      });
      toast.success('Post created successfully!');
      
      // Reset form
      setTitle('');
      setContent('');
      setImageUrl('');
      setVideoUrl('');
      setLocationLink('');
      setSelectedChurchIds([]);
      setExpiresInDays('');
      
      if (viewRegionId === selectedRegionId) {
        fetchPosts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      special_program: 'Special Program',
      mission: 'Mission',
      program_sunday: 'Program Sunday',
    };
    return labels[cat] || cat;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Regional Services / Posts</h1>
        <p className="text-muted-foreground">Create and manage regional posts and programs</p>
      </div>

      <Tabs defaultValue="create">
        <TabsList>
          <TabsTrigger value="create">Create Post</TabsTrigger>
          <TabsTrigger value="view">View Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
              <CardDescription>Share regional programs and services</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost} className="space-y-4">
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
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="special_program">Special Program</SelectItem>
                      <SelectItem value="mission">Mission</SelectItem>
                      <SelectItem value="program_sunday">Program Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    placeholder="Enter post title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter your post content here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="image">Image Upload (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                      {uploading && <Upload className="w-4 h-4 animate-spin" />}
                    </div>
                    {imageUrl && (
                      <p className="text-sm text-green-600">✓ Image uploaded</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video">Video Upload (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="video"
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        disabled={uploading}
                      />
                      {uploading && <Upload className="w-4 h-4 animate-spin" />}
                    </div>
                    {videoUrl && (
                      <p className="text-sm text-green-600">✓ Video uploaded</p>
                    )}
                  </div>
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

                {selectedRegionId && churches.length > 0 && (
                  <div className="space-y-2">
                    <Label>Associated Churches (Optional)</Label>
                    <div className="border rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                      {churches.map((church) => (
                        <label key={church.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedChurchIds.includes(church.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedChurchIds([...selectedChurchIds, church.id]);
                              } else {
                                setSelectedChurchIds(selectedChurchIds.filter(id => id !== church.id));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{church.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

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

                <Button type="submit" disabled={loading || uploading || regions.length === 0}>
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Post'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>View Posts</CardTitle>
              <CardDescription>Browse and filter posts by region</CardDescription>
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
                    <Label htmlFor="category">Category</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="special_program">Special Program</SelectItem>
                        <SelectItem value="mission">Mission</SelectItem>
                        <SelectItem value="program_sunday">Program Sunday</SelectItem>
                      </SelectContent>
                    </Select>
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

                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {viewRegionId && (
                  <div className="space-y-4 mt-6">
                    {posts.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No posts found.</p>
                      </div>
                    ) : (
                      posts.map((post) => (
                        <Card key={post.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                {post.title && <CardTitle>{post.title}</CardTitle>}
                                <CardDescription className="flex items-center gap-2 mt-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs" style={{ backgroundColor: '#f0d082', color: '#1a3c34' }}>
                                    {getCategoryLabel(post.category)}
                                  </span>
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="whitespace-pre-wrap">{post.content}</p>
                            
                            {post.image_url && (
                              <div>
                                <img
                                  src={post.image_url}
                                  alt={post.title || 'Post image'}
                                  className="max-w-full h-auto rounded-lg"
                                />
                              </div>
                            )}
                            
                            {post.video_url && (
                              <div>
                                <video
                                  src={post.video_url}
                                  controls
                                  className="max-w-full h-auto rounded-lg"
                                />
                              </div>
                            )}

                            {post.location_link && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4" style={{ color: '#d4af37' }} />
                                <a 
                                  href={post.location_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                  style={{ color: '#d4af37' }}
                                >
                                  View Location
                                </a>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
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
