import { Link } from 'react-router';
import { useAppSelector } from '@/app/store/hooks';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Building, FileText, Image, MapPin, Plus, Users } from 'lucide-react';

export function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'super';

  return (
    <div className="space-y-6">
      <div>
        <h1>Welcome back!</h1>
        <p className="text-muted-foreground">
          {isSuperAdmin ? 'Manage your church regions and administrators' : 'Manage posts for your region'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Open the tools you use most</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isSuperAdmin && (
            <>
              <QuickAction to="/dashboard/regions" icon={<MapPin />} label="Manage Regions" />
              <QuickAction to="/dashboard/invitations" icon={<Users />} label="Invite Admin" />
            </>
          )}
          <QuickAction to="/dashboard/churches" icon={<Building />} label="Manage Churches" />
          <QuickAction to="/dashboard/gallery" icon={<Image />} label="Manage Gallery" />
          <QuickAction to="/dashboard/posts" icon={<FileText />} label="Manage Posts" />
        </CardContent>
      </Card>

      <Card style={{ backgroundColor: '#1a3c34', borderColor: 'rgba(212, 175, 55, 0.35)' }}>
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 style={{ color: '#f5f5f5' }}>Keep your church community connected.</h2>
            <p style={{ color: '#f0d082' }}>Add a new update, photo, or church record whenever you are ready.</p>
          </div>
          <Button asChild style={{ backgroundColor: '#d4af37', color: '#1a3c34' }}>
            <Link to="/dashboard/posts"><Plus className="mr-2 h-4 w-4" />Add Update</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Button asChild variant="outline" className="h-14 justify-start gap-3" style={{ borderColor: '#d4af37', color: '#1a3c34' }}>
      <Link to={to}>{icon}<span>{label}</span></Link>
    </Button>
  );
}