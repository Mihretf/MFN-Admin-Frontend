import { useState, useEffect } from 'react';
import { blogAPI, uploadAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { FileText, Plus, Upload, Calendar, Edit, Trash2 } from 'lucide-react';

interface Blog {
  id: string;
  text: string;
  image_url?: string | null;
  video_url?: string | null;
  created_at?: string;
  expires_at?: string | null;
}

const getApiError = (error: any, fallback: string) =>
  error?.response?.data?.error || error?.response?.data?.message || fallback;

export function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  // Form states
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [rawImageFile, setRawImageFile] = useState<File | undefined>(undefined);

  // Edit form states
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editExpiresInDays, setEditExpiresInDays] = useState('');
  const [rawEditImageFile, setRawEditImageFile] = useState<File | undefined>(undefined);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [includeExpired, setIncludeExpired] = useState(true);
  const [fetchingBlogs, setFetchingBlogs] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const fetchBlogs = async () => {
    setFetchingBlogs(true);
    try {
      const response = await blogAPI.getBlogs({
        search: debouncedSearch || undefined,
        sort: sortOrder,
        include_expired: includeExpired,
      });

      const blogData = Array.isArray(response.data)
        ? response.data
        : (response.data?.blogs || []);

      setBlogs(blogData);
    } catch (error: any) {
      console.error('Failed to fetch blogs:', error);
      if (error?.code === 'ECONNABORTED') {
        toast.error('Request timed out. The backend may be waking up — try again in a few seconds.');
      } else {
        toast.error(getApiError(error, 'Failed to load blogs.'));
      }
      setBlogs([]);
    } finally {
      setFetchingBlogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'view') {
      fetchBlogs();
    }
  }, [activeTab, debouncedSearch, sortOrder, includeExpired]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRawImageFile(file);
    setUploading(true);
    try {
      const response = await uploadAPI.uploadImage(file);
      const uploadedUrl = response?.data?.asset?.secure_url || response?.data?.secure_url;
      if (!uploadedUrl) {
        throw new Error('No image URL returned from upload.');
      }
      setImageUrl(uploadedUrl);
      toast.success('Image processed successfully!');
    } catch (error: any) {
      toast.error(getApiError(error, 'Failed to upload image.'));
    } finally {
      setUploading(false);
    }
  };

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      toast.error('Please enter blog content.');
      return;
    }

    if (!imageUrl.trim()) {
      toast.error('Please upload an image first.');
      return;
    }

    setLoading(true);
    try {
      // By sending imageFile: undefined, we prevent Axios from bundling binary multi-part
      // data streams that collide with the string processing blocks on the server.
      await blogAPI.createBlog({
        text,
        image_url: imageUrl,
        expires_in_days: expiresInDays ? parseInt(expiresInDays, 10) : undefined,
        // imageFile: undefined, 
      });
      toast.success('Blog post created successfully!');

      setText('');
      setImageUrl('');
      setExpiresInDays('');
      setRawImageFile(undefined);

      setActiveTab('view');
      await fetchBlogs();
    } catch (error: any) {
      toast.error(getApiError(error, 'Failed to create blog post.'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditBlog = (blog: Blog) => {
    setEditingBlogId(blog.id);
    setEditText(blog.text);
    setEditImageUrl(blog.image_url || '');
    setEditExpiresInDays('');
    setRawEditImageFile(undefined);
  };

  const handleCancelEdit = () => {
    setEditingBlogId(null);
    setEditText('');
    setEditImageUrl('');
    setEditExpiresInDays('');
    setRawEditImageFile(undefined);
  };

  const handleUpdateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlogId || !editText.trim()) {
      toast.error('Please enter blog content.');
      return;
    }

    setLoading(true);
    try {
      await blogAPI.updateBlog(editingBlogId, {
        text: editText,
        image_url: editImageUrl || undefined,
        expires_in_days: editExpiresInDays ? parseInt(editExpiresInDays, 10) : undefined,
        // imageFile: undefined,
      });
      toast.success('Blog post updated successfully!');
      handleCancelEdit();
      await fetchBlogs();
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404 || status === 405) {
        toast.error('Blog editing is not available on the server yet.');
      } else {
        toast.error(getApiError(error, 'Failed to update blog post.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this blog post? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await blogAPI.deleteBlog(blogId);
      toast.success('Blog post deleted successfully!');
      if (editingBlogId === blogId) {
        handleCancelEdit();
      }
      await fetchBlogs();
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404 || status === 405) {
        toast.error('Blog deletion is not available on the server yet.');
      } else {
        toast.error(getApiError(error, 'Failed to delete blog post.'));
      }
    }
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRawEditImageFile(file);
    setUploading(true);
    try {
      const response = await uploadAPI.uploadImage(file);
      const uploadedUrl = response?.data?.asset?.secure_url || response?.data?.secure_url;
      if (!uploadedUrl) {
        throw new Error('No image URL returned from upload.');
      }
      setEditImageUrl(uploadedUrl);
      toast.success('Image updated successfully!');
    } catch (error: any) {
      toast.error(getApiError(error, 'Failed to upload image.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Homepage Blogs</h1>
        <p className="text-muted-foreground">Manage public homepage blog posts (Super Admin Only)</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="create">Create Blog</TabsTrigger>
          <TabsTrigger value="view">View Blogs</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Blog Post</CardTitle>
              <CardDescription>Upload an image and add content. Image is required by the backend.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBlog} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text">Blog Content *</Label>
                  <Textarea
                    id="text"
                    placeholder="Enter your blog content here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    required
                  />
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
                    />
                    {uploading && <Upload className="w-4 h-4 animate-spin" />}
                  </div>
                  {imageUrl && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600 mb-2">✓ Image uploaded to cloud storage</p>
                      <img src={imageUrl} alt="Preview" className="max-w-xs rounded-lg border shadow-sm" />
                    </div>
                  )}
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
                  <p className="text-sm text-muted-foreground">
                    Leave empty for blogs that don&apos;t expire
                  </p>
                </div>

                <Button type="submit" disabled={loading || uploading}>
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Blog Post'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blog Posts</CardTitle>
              <CardDescription>Browse, edit, and delete blog posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search blogs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sort">Sort</Label>
                    <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="includeExpired">Include Expired</Label>
                    <div className="flex h-10 items-center gap-3 rounded-md border px-3">
                      <Switch
                        id="includeExpired"
                        checked={includeExpired}
                        onCheckedChange={setIncludeExpired}
                      />
                      <span className="text-sm text-muted-foreground">
                        {includeExpired ? 'Showing all blogs' : 'Hiding expired blogs'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  {fetchingBlogs ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <Upload className="w-8 h-8 mx-auto mb-4 animate-spin opacity-50" />
                      <p className="text-muted-foreground">Loading blogs...</p>
                    </div>
                  ) : blogs.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No blog posts found.</p>
                    </div>
                  ) : (
                    blogs.map((blog) => (
                      <Card key={blog.id}>
                        <CardContent className="pt-6 space-y-4">
                          {editingBlogId === blog.id ? (
                            <form onSubmit={handleUpdateBlog} className="space-y-4">
                              <div className="space-y-2">
                                <Label>Edit Blog Content *</Label>
                                <Textarea
                                  placeholder="Enter your blog content here..."
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  rows={6}
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Edit Image</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleEditImageUpload}
                                    disabled={uploading}
                                  />
                                  {uploading && <Upload className="w-4 h-4 animate-spin" />}
                                </div>
                                {editImageUrl && (
                                  <div className="mt-2">
                                    <p className="text-sm text-green-600 mb-2">✓ Image updated</p>
                                    <img src={editImageUrl} alt="Preview" className="max-w-xs rounded-lg border" />
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label>Expires In (Days) - Optional</Label>
                                <Input
                                  type="number"
                                  placeholder="e.g., 30"
                                  value={editExpiresInDays}
                                  onChange={(e) => setEditExpiresInDays(e.target.value)}
                                  min="1"
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button type="submit" disabled={loading || uploading}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  {loading ? 'Updating...' : 'Update Blog'}
                                </Button>
                                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <p className="whitespace-pre-wrap">{blog.text}</p>

                              {blog.image_url && (
                                <div>
                                  <img
                                    src={blog.image_url}
                                    alt="Blog Content"
                                    className="max-w-md h-auto rounded-lg shadow-sm border"
                                  />
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                {blog.created_at && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Created {new Date(blog.created_at).toLocaleDateString()}
                                  </div>
                                )}
                                {blog.expires_at && (
                                  <span>Expires {new Date(blog.expires_at).toLocaleDateString()}</span>
                                )}
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditBlog(blog)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteBlog(blog.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}