import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { blogAPI, churchAPI, galleryAPI, postAPI, regionAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { MapPin, Users, FileText, Image, Building, BookOpen, Loader2 } from 'lucide-react';

interface Region {
  id: string;
  name: string;
}

export function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'super';

  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    regions: 0,
    churches: 0,
    posts: 0,
    gallery: 0,
    blogs: 0,
  });

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSuperMetrics();
    }
  }, [isSuperAdmin]);

  const getArray = <T,>(payload: any, keys: string[] = []): T[] => {
    if (Array.isArray(payload)) {
      return payload as T[];
    }
    for (const key of keys) {
      if (Array.isArray(payload?.[key])) {
        return payload[key] as T[];
      }
    }
    return [];
  };

  const fetchSuperMetrics = async () => {
    setMetricsLoading(true);
    try {
      const regionsRes = await regionAPI.getRegions();
      const regions = getArray<Region>(regionsRes.data, ['regions']);

      const [churchesRes, blogsRes] = await Promise.all([
        churchAPI.getChurches(),
        blogAPI.getBlogs(),
      ]);

      const churches = getArray(churchesRes.data, ['churches']);
      const blogs = getArray(blogsRes.data, ['blogs']);

      const perRegionReqs = regions.map((region) =>
        Promise.all([
          postAPI.getPosts({ region_id: region.id, include_expired: false }),
          galleryAPI.getGalleryItems({ region_id: region.id, include_expired: false }),
        ])
      );

      const perRegionData = await Promise.all(perRegionReqs);
      const postsCount = perRegionData.reduce((sum, [postsRes]) => {
        const posts = getArray(postsRes.data, ['posts']);
        return sum + posts.length;
      }, 0);

      const galleryCount = perRegionData.reduce((sum, [, galleryRes]) => {
        const gallery = getArray(galleryRes.data, ['galleries', 'galleryItems']);
        return sum + gallery.length;
      }, 0);

      setMetrics({
        regions: regions.length,
        churches: churches.length,
        posts: postsCount,
        gallery: galleryCount,
        blogs: blogs.length,
      });
    } catch (error) {
      console.error('[Dashboard] Failed to fetch metrics', error);
    } finally {
      setMetricsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Welcome back!</h1>
        <p className="text-muted-foreground">
          {isSuperAdmin ? 'Manage your church regions and administrators' : 'Manage posts for your region'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isSuperAdmin && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Regions</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{metricsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : metrics.regions}</div>
                <p className="text-xs text-muted-foreground">Total regions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Invitations</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">Invite</div>
                <p className="text-xs text-muted-foreground">Invite regional admins</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Churches</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{metricsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : metrics.churches}</div>
                <p className="text-xs text-muted-foreground">Total churches</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Gallery Photos</CardTitle>
                <Image className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{metricsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : metrics.gallery}</div>
                <p className="text-xs text-muted-foreground">Total gallery uploads</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Posts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{metricsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : metrics.posts}</div>
                <p className="text-xs text-muted-foreground">Total regional posts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Homepage Blogs</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{metricsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : metrics.blogs}</div>
                <p className="text-xs text-muted-foreground">Total blog posts</p>
              </CardContent>
            </Card>
          </>
        )}
        {!isSuperAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">Manage</div>
              <p className="text-xs text-muted-foreground">Create and view posts</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>Get started with your church administration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSuperAdmin ? (
            <>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#d4af37' }}>
                  <span style={{ color: '#1a3c34' }}>1</span>
                </div>
                <div>
                  <h4>Create Regions</h4>
                  <p className="text-sm text-muted-foreground">Set up geographic regions for your church</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#d4af37' }}>
                  <span style={{ color: '#1a3c34' }}>2</span>
                </div>
                <div>
                  <h4>Invite Regional Admins</h4>
                  <p className="text-sm text-muted-foreground">Send invitations to regional administrators</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#d4af37' }}>
                  <span style={{ color: '#1a3c34' }}>3</span>
                </div>
                <div>
                  <h4>Create Posts</h4>
                  <p className="text-sm text-muted-foreground">Share updates across all regions</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#d4af37' }}>
                  <span style={{ color: '#1a3c34' }}>1</span>
                </div>
                <div>
                  <h4>Create Posts</h4>
                  <p className="text-sm text-muted-foreground">Share updates with your region</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#d4af37' }}>
                  <span style={{ color: '#1a3c34' }}>2</span>
                </div>
                <div>
                  <h4>View Posts</h4>
                  <p className="text-sm text-muted-foreground">See all posts in your region</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}