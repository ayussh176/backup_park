import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockParkingSpaces, mockUsers } from '@/data/mockData';
import { ParkingSpace, ParkingSlot, ParkingType, ParkingCategory, VehicleType } from '@/types';
import { Shield, LogOut, Plus, Edit, Trash2, MapPin, DollarSign, Grid3x3, Search, Locate } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>(mockParkingSpaces);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showGridDialog, setShowGridDialog] = useState(false);
  const [editingSpace, setEditingSpace] = useState<ParkingSpace | null>(null);
  const [editingGridSpace, setEditingGridSpace] = useState<ParkingSpace | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [parkingType, setParkingType] = useState<ParkingType>('open');
  const [category, setCategory] = useState<ParkingCategory>('commercial');
  const [parkingLayout, setParkingLayout] = useState<'grid' | 'parallel' | 'scattered'>('grid');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [carSlots, setCarSlots] = useState('0');
  const [bikeSlots, setBikeSlots] = useState('0');
  const [carPrice, setCarPrice] = useState('0');
  const [bikePrice, setBikePrice] = useState('0');
  const [description, setDescription] = useState('');
  const [gridRows, setGridRows] = useState('3');
  const [gridCols, setGridCols] = useState('5');
  const [loadingLocation, setLoadingLocation] = useState(false);

  const ownerUsers = mockUsers.filter(u => u.role === 'owner');

  useEffect(() => {
    if (!user || role !== 'admin') {
      navigate('/admin-login');
      toast.error('Access denied. Admin credentials required.');
    }
  }, [user, role, navigate]);

  const filteredSpaces = parkingSpaces.filter(space =>
    space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUseCurrentLocation = () => {
    setLoadingLocation(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setLatitude(lat.toString());
        setLongitude(lng.toString());

        // Reverse geocode using MapBox
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=pk.eyJ1IjoiZ2hvZGVyYW95cyIsImEiOiJjbWMzbWozZmEwNzIzMmxwbHNocjNxdmRqIn0.ysvl-eXJQsuzj4Ky2qBP1A`
          );
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            setAddress(data.features[0].place_name);
            toast.success('Location detected successfully');
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          toast.error('Could not fetch address for this location');
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Could not get your location. Please check permissions.');
        setLoadingLocation(false);
      }
    );
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setParkingType('open');
    setCategory('commercial');
    setParkingLayout('grid');
    setSelectedOwnerId('');
    setCarSlots('0');
    setBikeSlots('0');
    setCarPrice('0');
    setBikePrice('0');
    setDescription('');
    setGridRows('3');
    setGridCols('5');
    setEditingSpace(null);
  };

  const createSlots = (
    parkingId: string,
    carSlotsCount: number,
    bikeSlotsCount: number,
    carPricePerHour: number,
    bikePricePerHour: number
  ): ParkingSlot[] => {
    const slots: ParkingSlot[] = [];
    let slotNumber = 1;

    for (let i = 0; i < carSlotsCount; i++) {
      slots.push({
        id: `${parkingId}-slot-${slotNumber}`,
        parkingId,
        slotNumber,
        vehicleType: 'car',
        status: 'available',
        pricePerHour: carPricePerHour,
      });
      slotNumber++;
    }

    for (let i = 0; i < bikeSlotsCount; i++) {
      slots.push({
        id: `${parkingId}-slot-${slotNumber}`,
        parkingId,
        slotNumber,
        vehicleType: 'bike',
        status: 'available',
        pricePerHour: bikePricePerHour,
      });
      slotNumber++;
    }

    return slots;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const carSlotsNum = parseInt(carSlots) || 0;
    const bikeSlotsNum = parseInt(bikeSlots) || 0;
    const totalSlots = carSlotsNum + bikeSlotsNum;

    if (totalSlots === 0) {
      toast.error('Please add at least one parking slot');
      return;
    }

    const vehicleTypes: VehicleType[] = [];
    if (carSlotsNum > 0) vehicleTypes.push('car');
    if (bikeSlotsNum > 0) vehicleTypes.push('bike');

    if (editingSpace) {
      const slots = createSlots(
        editingSpace.id,
        carSlotsNum,
        bikeSlotsNum,
        parseFloat(carPrice),
        parseFloat(bikePrice)
      );

      const updatedSpace: ParkingSpace = {
        ...editingSpace,
        name,
        address,
        coordinates: [parseFloat(latitude), parseFloat(longitude)],
        type: parkingType,
        category,
        parkingLayout,
        ownerId: selectedOwnerId || editingSpace.ownerId,
        vehicleTypes,
        totalSlots,
        availableSlots: totalSlots,
        pricePerHour: carSlotsNum > 0 ? parseFloat(carPrice) : parseFloat(bikePrice),
        description,
        slots,
      };

      setParkingSpaces(prev =>
        prev.map(space => space.id === editingSpace.id ? updatedSpace : space)
      );
      toast.success('Parking space updated successfully');
    } else {
      const newId = `parking-${Date.now()}`;
      const slots = createSlots(
        newId,
        carSlotsNum,
        bikeSlotsNum,
        parseFloat(carPrice),
        parseFloat(bikePrice)
      );

      const newSpace: ParkingSpace = {
        id: newId,
        ownerId: selectedOwnerId || user?.id || 'admin',
        name,
        address,
        coordinates: [parseFloat(latitude), parseFloat(longitude)],
        type: parkingType,
        category,
        parkingLayout,
        vehicleTypes,
        totalSlots,
        availableSlots: totalSlots,
        pricePerHour: carSlotsNum > 0 ? parseFloat(carPrice) : parseFloat(bikePrice),
        rating: 0,
        images: ['/placeholder.svg'],
        isOpen: true,
        slots,
        description,
      };

      setParkingSpaces(prev => [...prev, newSpace]);
      toast.success('Parking space created successfully');
    }

    setShowDialog(false);
    resetForm();
  };

  const handleEdit = (space: ParkingSpace) => {
    setEditingSpace(space);
    setName(space.name);
    setAddress(space.address);
    setLatitude(space.coordinates[0].toString());
    setLongitude(space.coordinates[1].toString());
    setParkingType(space.type);
    setCategory(space.category);
    setParkingLayout(space.parkingLayout || 'grid');
    setSelectedOwnerId(space.ownerId);
    
    const carSlotsCount = space.slots.filter(s => s.vehicleType === 'car').length;
    const bikeSlotsCount = space.slots.filter(s => s.vehicleType === 'bike').length;
    const carSlot = space.slots.find(s => s.vehicleType === 'car');
    const bikeSlot = space.slots.find(s => s.vehicleType === 'bike');
    
    setCarSlots(carSlotsCount.toString());
    setBikeSlots(bikeSlotsCount.toString());
    setCarPrice(carSlot?.pricePerHour.toString() || '0');
    setBikePrice(bikeSlot?.pricePerHour.toString() || '0');
    setDescription(space.description || '');
    
    // Calculate grid dimensions from existing slots
    const totalSlots = space.slots.length;
    const estimatedCols = Math.ceil(Math.sqrt(totalSlots * 1.5));
    const estimatedRows = Math.ceil(totalSlots / estimatedCols);
    setGridRows(estimatedRows.toString());
    setGridCols(estimatedCols.toString());
    
    setShowDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this parking space?')) {
      setParkingSpaces(prev => prev.filter(space => space.id !== id));
      toast.success('Parking space deleted successfully');
    }
  };

  const handleOpenGridEditor = (space: ParkingSpace) => {
    setEditingGridSpace(space);
    setShowGridDialog(true);
  };

  const handleUpdateSlotStatus = (slotId: string, status: 'available' | 'booked' | 'closed') => {
    if (!editingGridSpace) return;

    const updatedSlots = editingGridSpace.slots.map(slot =>
      slot.id === slotId ? { ...slot, status } : slot
    );

    const updatedSpace = { ...editingGridSpace, slots: updatedSlots };
    setEditingGridSpace(updatedSpace);

    setParkingSpaces(prev =>
      prev.map(space => space.id === editingGridSpace.id ? updatedSpace : space)
    );

    toast.success('Slot status updated');
  };

  const handleAddSlot = (vehicleType: VehicleType) => {
    if (!editingGridSpace) return;

    const newSlotNumber = Math.max(...editingGridSpace.slots.map(s => s.slotNumber), 0) + 1;
    const pricePerHour = vehicleType === 'car' 
      ? editingGridSpace.slots.find(s => s.vehicleType === 'car')?.pricePerHour || 10
      : editingGridSpace.slots.find(s => s.vehicleType === 'bike')?.pricePerHour || 5;

    const newSlot: ParkingSlot = {
      id: `${editingGridSpace.id}-slot-${newSlotNumber}`,
      parkingId: editingGridSpace.id,
      slotNumber: newSlotNumber,
      vehicleType,
      status: 'available',
      pricePerHour,
    };

    const updatedSpace = {
      ...editingGridSpace,
      slots: [...editingGridSpace.slots, newSlot],
      totalSlots: editingGridSpace.totalSlots + 1,
      availableSlots: editingGridSpace.availableSlots + 1,
    };

    setEditingGridSpace(updatedSpace);
    setParkingSpaces(prev =>
      prev.map(space => space.id === editingGridSpace.id ? updatedSpace : space)
    );

    toast.success(`${vehicleType === 'car' ? '🚗' : '🏍️'} slot added`);
  };

  const handleRemoveSlot = (slotId: string) => {
    if (!editingGridSpace || editingGridSpace.slots.length <= 1) {
      toast.error('Cannot remove the last slot');
      return;
    }

    const slotToRemove = editingGridSpace.slots.find(s => s.id === slotId);
    if (!slotToRemove) return;

    const updatedSlots = editingGridSpace.slots.filter(s => s.id !== slotId);
    const wasAvailable = slotToRemove.status === 'available';

    const updatedSpace = {
      ...editingGridSpace,
      slots: updatedSlots,
      totalSlots: editingGridSpace.totalSlots - 1,
      availableSlots: editingGridSpace.availableSlots - (wasAvailable ? 1 : 0),
    };

    setEditingGridSpace(updatedSpace);
    setParkingSpaces(prev =>
      prev.map(space => space.id === editingGridSpace.id ? updatedSpace : space)
    );

    toast.success('Slot removed');
  };

  if (!user || role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage parking spaces</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Spaces</CardDescription>
              <CardTitle className="text-3xl">{parkingSpaces.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Slots</CardDescription>
              <CardTitle className="text-3xl">
                {parkingSpaces.reduce((sum, space) => sum + space.totalSlots, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Available Slots</CardDescription>
              <CardTitle className="text-3xl">
                {parkingSpaces.reduce((sum, space) => sum + space.availableSlots, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search parking spaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Parking Space
          </Button>
        </div>

        {/* Parking Spaces List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSpaces.map((space) => (
            <Card key={space.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{space.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {space.address}
                    </CardDescription>
                  </div>
                  <Badge variant={space.isOpen ? 'default' : 'secondary'}>
                    {space.isOpen ? 'Open' : 'Closed'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{space.type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium capitalize">{space.category}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Slots</p>
                    <p className="font-medium">{space.totalSlots}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Available</p>
                    <p className="font-medium text-green-600">{space.availableSlots}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {space.vehicleTypes.map((type) => (
                    <Badge key={type} variant="outline">
                      {type === 'car' ? '🚗' : '🏍️'} {type}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenGridEditor(space)}
                    className="flex-1"
                  >
                    <Grid3x3 className="w-4 h-4 mr-2" />
                    Manage Grid
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(space)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(space.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSpaces.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No parking spaces found</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSpace ? 'Edit Parking Space' : 'Add New Parking Space'}
            </DialogTitle>
            <DialogDescription>
              Fill in the details for the parking space
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ... keep existing form code */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Times Square Parking"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="123 Main St, NY"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleUseCurrentLocation}
                    disabled={loadingLocation}
                    title="Use Current Location"
                  >
                    <Locate className={`w-4 h-4 ${loadingLocation ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                  placeholder="40.7589"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                  placeholder="-73.9851"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Parking Type *</Label>
                <Select value={parkingType} onValueChange={(v) => setParkingType(v as ParkingType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="covered">Covered</SelectItem>
                    <SelectItem value="underground">Underground</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ParkingCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="layout">Parking Layout *</Label>
                <Select value={parkingLayout} onValueChange={(v) => setParkingLayout(v as 'grid' | 'parallel' | 'scattered')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid Layout</SelectItem>
                    <SelectItem value="parallel">Parallel Layout</SelectItem>
                    <SelectItem value="scattered">Scattered Layout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner">Assign to Owner *</Label>
                <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {ownerUsers.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name} ({owner.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carSlots">🚗 Car Slots</Label>
                <Input
                  id="carSlots"
                  type="number"
                  min="0"
                  value={carSlots}
                  onChange={(e) => setCarSlots(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carPrice">Car Price/Hour ($)</Label>
                <Input
                  id="carPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={carPrice}
                  onChange={(e) => setCarPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bikeSlots">🏍️ Bike Slots</Label>
                <Input
                  id="bikeSlots"
                  type="number"
                  min="0"
                  value={bikeSlots}
                  onChange={(e) => setBikeSlots(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bikePrice">Bike Price/Hour ($)</Label>
                <Input
                  id="bikePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={bikePrice}
                  onChange={(e) => setBikePrice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details..."
              />
            </div>

            <div className="border-t pt-4">
              <Label className="text-base">Grid Layout (for visualization)</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Define how slots will be displayed in the grid view
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gridRows">Rows</Label>
                  <Input
                    id="gridRows"
                    type="number"
                    min="1"
                    max="20"
                    value={gridRows}
                    onChange={(e) => setGridRows(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gridCols">Columns</Label>
                  <Input
                    id="gridCols"
                    type="number"
                    min="1"
                    max="20"
                    value={gridCols}
                    onChange={(e) => setGridCols(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Grid: {gridRows} rows × {gridCols} cols = {parseInt(gridRows) * parseInt(gridCols)} positions
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => {
                setShowDialog(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingSpace ? 'Update' : 'Create'} Parking Space
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Grid Management Dialog */}
      <Dialog open={showGridDialog} onOpenChange={setShowGridDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Parking Grid - {editingGridSpace?.name}</DialogTitle>
            <DialogDescription>
              Click slots to toggle status • Right-click to remove • Use buttons below to add slots
            </DialogDescription>
          </DialogHeader>

          {editingGridSpace && (
            <Tabs defaultValue="car" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="car">
                  🚗 Car Slots ({editingGridSpace.slots.filter(s => s.vehicleType === 'car').length})
                </TabsTrigger>
                <TabsTrigger value="bike">
                  🏍️ Bike Slots ({editingGridSpace.slots.filter(s => s.vehicleType === 'bike').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="car" className="space-y-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm text-muted-foreground">
                    Click to toggle status • Right-click to remove
                  </p>
                  <Button size="sm" onClick={() => handleAddSlot('car')}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Car Slot
                  </Button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {editingGridSpace.slots
                    .filter(slot => slot.vehicleType === 'car')
                    .map((slot) => (
                      <div key={slot.id} className="space-y-1 group relative">
                        <div
                          className={`aspect-square rounded border-2 flex flex-col items-center justify-center text-xs font-medium cursor-pointer transition-colors ${
                            slot.status === 'available'
                              ? 'bg-green-100 border-green-500 hover:bg-green-200 dark:bg-green-900 dark:border-green-600'
                              : slot.status === 'booked'
                              ? 'bg-red-100 border-red-500 hover:bg-red-200 dark:bg-red-900 dark:border-red-600'
                              : 'bg-gray-100 border-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600'
                          }`}
                          onClick={() => {
                            const nextStatus =
                              slot.status === 'available'
                                ? 'closed'
                                : slot.status === 'closed'
                                ? 'available'
                                : 'available';
                            handleUpdateSlotStatus(slot.id, nextStatus);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            handleRemoveSlot(slot.id);
                          }}
                        >
                          <span className="text-lg">🚗</span>
                          <span>#{slot.slotNumber}</span>
                        </div>
                        <p className="text-xs text-center capitalize">{slot.status}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground"
                          onClick={() => handleRemoveSlot(slot.id)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="bike" className="space-y-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm text-muted-foreground">
                    Click to toggle status • Right-click to remove
                  </p>
                  <Button size="sm" onClick={() => handleAddSlot('bike')}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Bike Slot
                  </Button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {editingGridSpace.slots
                    .filter(slot => slot.vehicleType === 'bike')
                    .map((slot) => (
                      <div key={slot.id} className="space-y-1 group relative">
                        <div
                          className={`aspect-square rounded border-2 flex flex-col items-center justify-center text-xs font-medium cursor-pointer transition-colors ${
                            slot.status === 'available'
                              ? 'bg-green-100 border-green-500 hover:bg-green-200 dark:bg-green-900 dark:border-green-600'
                              : slot.status === 'booked'
                              ? 'bg-red-100 border-red-500 hover:bg-red-200 dark:bg-red-900 dark:border-red-600'
                              : 'bg-gray-100 border-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600'
                          }`}
                          onClick={() => {
                            const nextStatus =
                              slot.status === 'available'
                                ? 'closed'
                                : slot.status === 'closed'
                                ? 'available'
                                : 'available';
                            handleUpdateSlotStatus(slot.id, nextStatus);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            handleRemoveSlot(slot.id);
                          }}
                        >
                          <span className="text-lg">🏍️</span>
                          <span>#{slot.slotNumber}</span>
                        </div>
                        <p className="text-xs text-center capitalize">{slot.status}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground"
                          onClick={() => handleRemoveSlot(slot.id)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded" />
                <span>Closed</span>
              </div>
              {editingGridSpace && (
                <div className="ml-auto text-muted-foreground">
                  Total: {editingGridSpace.slots.length} slots 
                  ({editingGridSpace.availableSlots} available)
                </div>
              )}
            </div>
            <Button onClick={() => setShowGridDialog(false)}>Save & Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
