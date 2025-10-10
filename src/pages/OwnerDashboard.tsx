import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Edit,
  HelpCircle,
  LogOut,
  Moon,
  Plus,
  Settings,
  Star,
  Sun,
  TrendingUp,
  Trash2,
  User,
  Lock,
  Unlock,
  Download,
  Upload,
  Image as ImageIcon,
  Locate,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { generateMockAnalytics } from '@/data/mockData';
import { HelpSupportModal } from '@/components/HelpSupportModal';
import { NotificationPanel } from '@/components/NotificationPanel';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { ParkingSpaceMapEditor } from '@/components/ParkingSpaceMapEditor';
import { ParkingSpace, ParkingSlot, VehicleType, ParkingType, ParkingCategory } from '@/types';

const COLORS = ['hsl(262 83% 58%)', 'hsl(28 80% 52%)'];

export const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getParkingsByOwner, updateParkingSpace, addParkingSpace, deleteParkingSpace, updateSlot } = useBooking();
  const { theme, toggleTheme } = useTheme();

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAddParkingDialog, setShowAddParkingDialog] = useState(false);
  const [showEditParkingDialog, setShowEditParkingDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [selectedParking, setSelectedParking] = useState<ParkingSpace | null>(null);

  // Form states
  const [parkingName, setParkingName] = useState('');
  const [parkingAddress, setParkingAddress] = useState('');
  const [parkingType, setParkingType] = useState<ParkingType>('paid');
  const [parkingCategory, setParkingCategory] = useState<ParkingCategory>('commercial');
  const [parkingLayout, setParkingLayout] = useState<'grid' | 'linear' | 'angled'>('grid');
  const [parkingImage, setParkingImage] = useState<string>('');
  const [carSlots, setCarSlots] = useState('10');
  const [bikeSlots, setBikeSlots] = useState('5');
  const [carPrice, setCarPrice] = useState('10');
  const [bikePrice, setBikePrice] = useState('5');
  const [description, setDescription] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(['car', 'bike']);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [parkingCoordinates, setParkingCoordinates] = useState<[number, number]>([40.7580, -73.9855]);
  const [polygonCoordinates, setPolygonCoordinates] = useState<[number, number][]>([]);

  const ownedParkings = user ? getParkingsByOwner(user.id) : [];
  const analytics = user ? generateMockAnalytics(user.id) : null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleUseCurrentLocation = () => {
    setLoadingLocation(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Update map coordinates
        setParkingCoordinates([lat, lng]);

        // Reverse geocode using MapBox
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=pk.eyJ1IjoiZ2hvZGVyYW95cyIsImEiOiJjbWMzbWozZmEwNzIzMmxwbHNocjNxdmRqIn0.ysvl-eXJQsuzj4Ky2qBP1A`
          );
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            setParkingAddress(data.features[0].place_name);
            alert('Location detected successfully');
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          alert('Could not fetch address for this location');
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Could not get your location. Please check permissions.');
        setLoadingLocation(false);
      }
    );
  };

  const resetForm = () => {
    setParkingName('');
    setParkingAddress('');
    setParkingType('paid');
    setParkingCategory('commercial');
    setParkingLayout('grid');
    setParkingImage('');
    setCarSlots('10');
    setBikeSlots('5');
    setCarPrice('10');
    setBikePrice('5');
    setDescription('');
    setVehicleTypes(['car', 'bike']);
    setParkingCoordinates([40.7580, -73.9855]);
    setPolygonCoordinates([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setParkingImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const createSlots = (parkingId: string): ParkingSlot[] => {
    const slots: ParkingSlot[] = [];
    let slotNumber = 1;

    // Car slots
    if (vehicleTypes.includes('car')) {
      for (let i = 0; i < parseInt(carSlots); i++) {
        slots.push({
          id: `${parkingId}-slot-${slotNumber}`,
          parkingId,
          slotNumber,
          vehicleType: 'car',
          status: 'available',
          pricePerHour: parseFloat(carPrice),
        });
        slotNumber++;
      }
    }

    // Bike slots
    if (vehicleTypes.includes('bike')) {
      for (let i = 0; i < parseInt(bikeSlots); i++) {
        slots.push({
          id: `${parkingId}-slot-${slotNumber}`,
          parkingId,
          slotNumber,
          vehicleType: 'bike',
          status: 'available',
          pricePerHour: parseFloat(bikePrice),
        });
        slotNumber++;
      }
    }

    return slots;
  };

  const handleAddParking = () => {
    if (!user) return;

    const parkingId = `parking-${Date.now()}`;
    const slots = createSlots(parkingId);
    const totalSlots = slots.length;

    const newParking: Omit<ParkingSpace, 'id'> = {
      ownerId: user.id,
      name: parkingName,
      address: parkingAddress,
      coordinates: parkingCoordinates,
      polygonCoordinates: polygonCoordinates.length > 0 ? polygonCoordinates : undefined,
      type: parkingType,
      category: parkingCategory,
      vehicleTypes,
      totalSlots,
      availableSlots: totalSlots,
      pricePerHour: parseFloat(carPrice),
      rating: 4.0,
      images: ['/placeholder.svg'],
      isOpen: true,
      slots,
      description,
    };

    addParkingSpace(newParking);
    resetForm();
    setShowAddParkingDialog(false);
  };

  const handleEditParking = (parking: ParkingSpace) => {
    setSelectedParking(parking);
    setParkingName(parking.name);
    setParkingAddress(parking.address);
    setParkingType(parking.type);
    setParkingCategory(parking.category);
    setDescription(parking.description || '');
    setVehicleTypes(parking.vehicleTypes);
    setShowEditParkingDialog(true);
  };

  const handleUpdateParking = () => {
    if (!selectedParking) return;

    updateParkingSpace(selectedParking.id, {
      name: parkingName,
      address: parkingAddress,
      type: parkingType,
      category: parkingCategory,
      vehicleTypes,
      description,
    });

    resetForm();
    setShowEditParkingDialog(false);
    setSelectedParking(null);
  };

  const handleDeleteParking = (id: string) => {
    if (confirm('Are you sure you want to delete this parking space? This action cannot be undone.')) {
      deleteParkingSpace(id);
    }
  };

  const handleManageParking = (parking: ParkingSpace) => {
    setSelectedParking(parking);
    setShowManageDialog(true);
  };

  const handleToggleParkingStatus = () => {
    if (!selectedParking) return;
    updateParkingSpace(selectedParking.id, {
      isOpen: !selectedParking.isOpen,
    });
    setSelectedParking({ ...selectedParking, isOpen: !selectedParking.isOpen });
  };

  const handleToggleSlot = (slotId: string) => {
    if (!selectedParking) return;
    const slot = selectedParking.slots.find(s => s.id === slotId);
    if (!slot) return;
    
    updateSlot(selectedParking.id, slotId, {
      status: slot.status === 'available' ? 'closed' : 'available',
    });
    
    setSelectedParking({
      ...selectedParking,
      slots: selectedParking.slots.map(s =>
        s.id === slotId ? { ...s, status: s.status === 'available' ? 'closed' as const : 'available' as const } : s
      ),
    });
  };

  const handleUpdateSlotPrice = (slotId: string, newPrice: string) => {
    if (!selectedParking) return;
    const price = parseFloat(newPrice);
    if (isNaN(price)) return;
    
    updateSlot(selectedParking.id, slotId, {
      pricePerHour: price,
    });
    
    setSelectedParking({
      ...selectedParking,
      slots: selectedParking.slots.map(s =>
        s.id === slotId ? { ...s, pricePerHour: price } : s
      ),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Owner Dashboard</h1>
                  <p className="text-sm text-muted-foreground">{user?.businessName || 'Your Business'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Button>
              <NotificationPanel />
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowHelpModal(true)}>
                <HelpCircle className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowProfileEditModal(true)}>
                <User className="w-4 h-4" />
              </Button>
              <Button onClick={() => setShowSubscriptionDialog(true)}>
                <Star className="w-4 h-4 mr-2" />
                {user?.subscriptionPlan || 'Basic'} Plan
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-muted-foreground">Manage your parking spaces and view analytics</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalBookings || 0}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics?.totalRevenue || 0}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Occupancy</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.averageOccupancy || 0}%</div>
              <p className="text-xs text-muted-foreground">Overall</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parking Spaces</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ownedParkings.length}</div>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="spaces" className="space-y-6">
          <TabsList>
            <TabsTrigger value="spaces">
              <Building2 className="w-4 h-4 mr-2" />
              My Spaces
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="spaces" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">My Parking Spaces</h3>
              <Button onClick={() => setShowAddParkingDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Parking Space
              </Button>
            </div>

            {ownedParkings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No parking spaces listed yet</p>
                  <Button onClick={() => setShowAddParkingDialog(true)}>
                    List Your First Space
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {ownedParkings.map((parking) => (
                  <Card key={parking.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{parking.name}</CardTitle>
                          <CardDescription>{parking.address}</CardDescription>
                        </div>
                        <Badge variant={parking.isOpen ? 'default' : 'secondary'}>
                          {parking.isOpen ? 'Open' : 'Closed'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Slots</p>
                          <p className="text-2xl font-bold">{parking.totalSlots}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Available</p>
                          <p className="text-2xl font-bold text-success">{parking.availableSlots}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Price/Hour</p>
                          <p className="text-2xl font-bold">${parking.pricePerHour}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Rating</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 fill-accent text-accent" />
                            <p className="text-2xl font-bold">{parking.rating}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageParking(parking)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditParking(parking)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteParking(parking.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h3 className="text-xl font-semibold">Analytics & Insights</h3>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Bookings</CardTitle>
                  <CardDescription>Last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics?.dailyData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Bar dataKey="bookings" fill="hsl(262 83% 58%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bookings by Vehicle Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics?.bookingsByVehicleType || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, count }) => `${type}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics?.bookingsByVehicleType.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Top Performing Slots</CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics?.topPerformingSlots.map((slot, idx) => (
                    <div key={slot.slotId} className="flex items-center justify-between p-3 border rounded">
                      <span className="font-medium">#{idx + 1} Slot {slot.slotId}</span>
                      <span className="text-muted-foreground">{slot.bookings} bookings</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Parking Dialog */}
      <Dialog open={showAddParkingDialog} onOpenChange={(open) => {
        setShowAddParkingDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Parking Space</DialogTitle>
            <DialogDescription>Fill in the details of your parking space</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Parking Name *</Label>
              <Input
                id="name"
                value={parkingName}
                onChange={(e) => setParkingName(e.target.value)}
                placeholder="Downtown Parking"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <div className="flex gap-2">
                <Input
                  id="address"
                  value={parkingAddress}
                  onChange={(e) => setParkingAddress(e.target.value)}
                  placeholder="123 Main St, City"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Parking Type</Label>
                <Select 
                  value={parkingType} 
                  onValueChange={(v) => {
                    setParkingType(v as ParkingType);
                    if (v === 'free') {
                      setCarPrice('0');
                      setBikePrice('0');
                      setParkingCategory('free');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="covered">Covered</SelectItem>
                    <SelectItem value="underground">Underground</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={parkingCategory} 
                  onValueChange={(v) => {
                    setParkingCategory(v as ParkingCategory);
                    if (v === 'free') {
                      setCarPrice('0');
                      setBikePrice('0');
                    }
                  }}
                >
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

            <div className="space-y-2">
              <Label>Parking Layout</Label>
              <Select value={parkingLayout} onValueChange={(v) => setParkingLayout(v as 'grid' | 'linear' | 'angled')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid Layout</SelectItem>
                  <SelectItem value="linear">Linear Layout</SelectItem>
                  <SelectItem value="angled">Angled Layout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Parking Image</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="parking-image-upload"
                />
                <label htmlFor="parking-image-upload">
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </span>
                  </Button>
                </label>
                {parkingImage && (
                  <div className="relative w-20 h-20 border rounded overflow-hidden">
                    <img src={parkingImage} alt="Parking preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vehicle Types</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="car"
                    checked={vehicleTypes.includes('car')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setVehicleTypes([...vehicleTypes, 'car']);
                      } else {
                        setVehicleTypes(vehicleTypes.filter(t => t !== 'car'));
                      }
                    }}
                  />
                  <label htmlFor="car">🚗 Car</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bike"
                    checked={vehicleTypes.includes('bike')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setVehicleTypes([...vehicleTypes, 'bike']);
                      } else {
                        setVehicleTypes(vehicleTypes.filter(t => t !== 'bike'));
                      }
                    }}
                  />
                  <label htmlFor="bike">🏍️ Bike</label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Car Slots</Label>
                <Input
                  type="number"
                  value={carSlots}
                  onChange={(e) => setCarSlots(e.target.value)}
                  disabled={!vehicleTypes.includes('car')}
                />
              </div>
              <div className="space-y-2">
                <Label>Car Price/Hour ($)</Label>
                <Input
                  type="number"
                  value={carPrice}
                  onChange={(e) => setCarPrice(e.target.value)}
                  disabled={!vehicleTypes.includes('car') || parkingType === 'free' || parkingCategory === 'free'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bike Slots</Label>
                <Input
                  type="number"
                  value={bikeSlots}
                  onChange={(e) => setBikeSlots(e.target.value)}
                  disabled={!vehicleTypes.includes('bike')}
                />
              </div>
              <div className="space-y-2">
                <Label>Bike Price/Hour ($)</Label>
                <Input
                  type="number"
                  value={bikePrice}
                  onChange={(e) => setBikePrice(e.target.value)}
                  disabled={!vehicleTypes.includes('bike') || parkingType === 'free' || parkingCategory === 'free'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your parking space..."
                rows={3}
              />
            </div>

            <ParkingSpaceMapEditor
              initialCoordinates={parkingCoordinates}
              initialPolygon={polygonCoordinates}
              onLocationChange={setParkingCoordinates}
              onPolygonChange={setPolygonCoordinates}
              pricePerHour={parseFloat(carPrice) || 0}
              availableSlots={parseInt(carSlots) + parseInt(bikeSlots)}
              totalSlots={parseInt(carSlots) + parseInt(bikeSlots)}
            />

            <Button className="w-full" onClick={handleAddParking}>
              Add Parking Space
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Parking Dialog */}
      <Dialog open={showEditParkingDialog} onOpenChange={(open) => {
        setShowEditParkingDialog(open);
        if (!open) {
          resetForm();
          setSelectedParking(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Parking Space</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Parking Name</Label>
              <Input value={parkingName} onChange={(e) => setParkingName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={parkingAddress} onChange={(e) => setParkingAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Parking Type</Label>
                <Select value={parkingType} onValueChange={(v) => setParkingType(v as ParkingType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="covered">Covered</SelectItem>
                    <SelectItem value="underground">Underground</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={parkingCategory} onValueChange={(v) => setParkingCategory(v as ParkingCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button className="w-full" onClick={handleUpdateParking}>
              Update Parking Space
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Parking Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage: {selectedParking?.name}</DialogTitle>
            <DialogDescription>Control slots, pricing, and availability</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded">
              <div>
                <h4 className="font-semibold">Parking Status</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedParking?.isOpen ? 'Open for bookings' : 'Closed for bookings'}
                </p>
              </div>
              <Button onClick={handleToggleParkingStatus}>
                {selectedParking?.isOpen ? (
                  <><Lock className="w-4 h-4 mr-2" />Close</>
                ) : (
                  <><Unlock className="w-4 h-4 mr-2" />Open</>
                )}
              </Button>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Manage Slots</h4>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
                {selectedParking?.slots.map((slot) => (
                  <Card key={slot.id} className={`${slot.status === 'closed' ? 'opacity-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="text-center mb-2">
                        <div className="text-xl font-bold">#{slot.slotNumber}</div>
                        <div className="text-xs text-muted-foreground">
                          {slot.vehicleType === 'car' ? '🚗' : '🏍️'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          value={slot.pricePerHour}
                          onChange={(e) => handleUpdateSlotPrice(slot.id, e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Button
                          size="sm"
                          variant={slot.status === 'available' ? 'outline' : 'default'}
                          className="w-full text-xs"
                          onClick={() => handleToggleSlot(slot.id)}
                        >
                          {slot.status === 'available' ? 'Close' : 'Open'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription>Choose the best plan for your business</DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Basic',
                price: 'Free',
                features: ['Up to 2 parking spaces', 'Basic analytics', 'Email support'],
              },
              {
                name: 'Lite',
                price: '$29/mo',
                features: ['Up to 5 parking spaces', 'Advanced analytics', 'Priority support', 'Custom pricing'],
              },
              {
                name: 'Pro',
                price: '$99/mo',
                features: ['Unlimited spaces', 'Full analytics suite', '24/7 support', 'API access', 'Manager accounts'],
              },
            ].map((plan) => (
              <Card key={plan.name} className={user?.subscriptionPlan === plan.name.toLowerCase() ? 'border-primary' : ''}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">{plan.price}</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={user?.subscriptionPlan === plan.name.toLowerCase() ? 'secondary' : 'default'}
                    disabled={user?.subscriptionPlan === plan.name.toLowerCase()}
                  >
                    {user?.subscriptionPlan === plan.name.toLowerCase() ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <HelpSupportModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
      <ProfileEditModal open={showProfileEditModal} onOpenChange={setShowProfileEditModal} />
    </div>
  );
};
