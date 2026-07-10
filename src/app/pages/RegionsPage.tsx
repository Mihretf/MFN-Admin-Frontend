import { useEffect, useState, type FormEvent } from 'react';
import { regionAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';


import {Card,  CardContent, CardDescription, CardHeader, CardTitle} from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Edit, MapPin, Plus, Trash2 } from 'lucide-react';

interface Region {
  id: string;
  name: string;
  created_at?: string;
}

export function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [newRegionName, setNewRegionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [editRegionName, setEditRegionName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [savingRegion, setSavingRegion] = useState(false);
  const [deletingRegionId, setDeletingRegionId] = useState<string | null>(null);

  useEffect(() => {
    void fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const response = await regionAPI.getRegions();
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data?.regions || []);

      setRegions(data);
    } catch (error: any) {
      console.error('Failed to fetch regions:', error);
      setRegions([]);
    }
  };

  const handleCreateRegion = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRegionName.trim()) return;

    setLoading(true);
    try {
      await regionAPI.createRegion(newRegionName.trim());
      toast.success('Region created successfully!');
      setNewRegionName('');
      await fetchRegions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create region.');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (region: Region) => {
    setEditingRegion(region);
    setEditRegionName(region.name);
    setIsEditDialogOpen(true);
  };

  const handleUpdateRegion = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingRegion || !editRegionName.trim()) return;

    setSavingRegion(true);
    try {
      await regionAPI.updateRegion(editingRegion.id, editRegionName.trim());
      toast.success('Region updated successfully.');
      setRegions((prev) =>
        prev.map((region) => (region.id === editingRegion.id ? { ...region, name: editRegionName.trim() } : region))
      );
      setIsEditDialogOpen(false);
      setEditingRegion(null);
      setEditRegionName('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update region.');
    } finally {
      setSavingRegion(false);
    }
  };

  const handleDeleteRegion = async (regionId: string) => {
    const confirmed = window.confirm('Delete this region? This action cannot be undone.');
    if (!confirmed) return;

    setDeletingRegionId(regionId);
    try {
      await regionAPI.deleteRegion(regionId);
      toast.success('Region deleted successfully.');
      setRegions((prev) => prev.filter((region) => region.id !== regionId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete region.');
    } finally {
      setDeletingRegionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Regions</h1>
        <p className="text-muted-foreground">Create and manage church regions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Region</CardTitle>
          <CardDescription>Add a new geographic region for your church</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateRegion} className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor="regionName">Region Name</Label>
              <Input
                id="regionName"
                placeholder="e.g., North Region, South Region"
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="self-end">
              <Plus className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create Region'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Regions</CardTitle>
          <CardDescription>View all created regions and manage them here</CardDescription>
        </CardHeader>
        <CardContent>
          {regions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <MapPin className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No regions created yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {regions.map((region) => (
                <div
                  key={region.id}
                  className="flex flex-col gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: '#d4af37' }}>
                      <MapPin className="h-5 w-5" style={{ color: '#1a3c34' }} />
                    </div>
                    <div>
                      <h4 className="font-medium">{region.name}</h4>
                      <p className="font-mono text-sm text-muted-foreground">{region.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(region)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleDeleteRegion(region.id)}
                      disabled={deletingRegionId === region.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deletingRegionId === region.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Region</DialogTitle>
            <DialogDescription>Update the region name below.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateRegion} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editRegionName">Region Name</Label>
              <Input
                id="editRegionName"
                value={editRegionName}
                onChange={(e) => setEditRegionName(e.target.value)}
                placeholder="Enter region name"
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingRegion}>
                {savingRegion ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
