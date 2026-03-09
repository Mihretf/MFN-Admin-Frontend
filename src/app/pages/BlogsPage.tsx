import { useState, useEffect } from 'react';
import { blogAPI, uploadAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { FileText, Plus, Upload, Calendar } from 'lucide-react';

interface Blog {
  id: string;
  text: string;
  image_url?: string;
  created_at?: string;
}

export function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    fetchBlogs();
  }, [searchTerm, sortOrder]);

const fetchBlogs = async () => {
  try {
    const response = await blogAPI.getBlogs({
      search: searchTerm || undefined,
      sort: sortOrder,
      include_expired: false,
    });

    // Check if data is the array itself, or if it's inside a 'blogs' key
    const blogData = Array.isArray(response.data) 
      ? response.data 
      : (response.data?.blogs || []);

    setBlogs(blogData);
  } catch (error: any) {
    console.error('Failed to fetch blogs:', error);
    toast.error('Failed to load blogs.');
    setBlogs([]); // Fallback to empty array to prevent crash
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

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error('Please enter blog content.');
      return;
    }

    setLoading(true);
    try {
      await blogAPI.createBlog({
        text,
        image_url: imageUrl || undefined,
        expires_in_days: expiresInDays ? parseInt(expiresInDays) : undefined,
      });
      toast.success('Blog post created successfully!');
      
      // Reset form
      setText('');
      setImageUrl('');
      setExpiresInDays('');
      
      fetchBlogs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create blog post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Homepage Blogs</h1>
        <p className="text-muted-foreground">Manage public homepage blog posts (Super Admin Only)</p>
      </div>

      <Tabs defaultValue="create">
        <TabsList>
          <TabsTrigger value="create">Create Blog</TabsTrigger>
          <TabsTrigger value="view">View Blogs</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Blog Post</CardTitle>
              <CardDescription>Create a blog post for the homepage</CardDescription>
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
                    <div className="mt-2">
                      <p className="text-sm text-green-600 mb-2">✓ Image uploaded</p>
                      <img src={imageUrl} alt="Preview" className="max-w-xs rounded-lg" />
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
                    Leave empty for blogs that don't expire
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
              <CardDescription>Browse and filter blog posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-4 mt-6">
                  {blogs.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No blog posts found.</p>
                    </div>
                  ) : (
                    blogs.map((blog) => (
                      <Card key={blog.id}>
                        <CardContent className="pt-6 space-y-4">
                          <p className="whitespace-pre-wrap">{blog.text}</p>
                          
                          {blog.image_url && (
                            <div>
                              <img
                                src={blog.image_url}
                                alt="Blog image"
                                className="max-w-full h-auto rounded-lg"
                              />
                            </div>
                          )}

                          {blog.created_at && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {new Date(blog.created_at).toLocaleDateString()}
                            </div>
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
