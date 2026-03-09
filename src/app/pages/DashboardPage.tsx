import { useAppSelector } from '../store/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Church, MapPin, Users, FileText, BookOpen, Image, Building } from 'lucide-react';

export function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === 'super_admin';

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
                <div className="text-2xl">Manage</div>
                <p className="text-xs text-muted-foreground">Create and view regions</p>
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
          </>
        )}
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