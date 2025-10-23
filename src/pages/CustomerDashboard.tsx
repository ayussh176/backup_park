import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Calendar,
  Car,
  Clock,
  CreditCard,
  Edit,
  HelpCircle,
  LogOut,
  MapPin,
  Moon,
  Plus,
  Settings,
  Sun,
  Trash2,
  User,
  Wallet,
} from 'lucide-react';
import { HelpSupportModal } from '@/components/HelpSupportModal';
import { NotificationPanel } from '@/components/NotificationPanel';
import { ProfileEditModal } from '@/components/ProfileEditModal';

export const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, vehicles, logout, addVehicle, updateVehicle, deleteVehicle } = useAuth();
  const { bookings, getBookingsByUser, parkingSpaces, simulateBookingEnd } = useBooking();
  const { theme, toggleTheme } = useTheme();

  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showVehicleDialog, setShowVehicleDialog] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<'car' | 'bike'>('car');
  const [vehicleModel, setVehicleModel] = useState('');

  const userBookings = user ? getBookingsByUser(user.id) : [];
  const upcomingBookings = userBookings.filter(b => b.status === 'upcoming' || b.status === 'active');
  const pastBookings = userBookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  // 🚨 AUTOFINISH BOOKING: This effect automatically checks each minute if booking should end
  useEffect(() => {
    const timer = setInterval(() => {
      upcomingBookings.forEach((booking) => {
        // booking.startTime should be ISO string, booking.duration in hours
        const bookingEnd = new Date(booking.startTime);
        bookingEnd.setHours(bookingEnd.getHours() + booking.duration);
        if (
          booking.status === 'active' &&
          new Date() > bookingEnd
        ) {
          simulateBookingEnd(booking.id);
        }
      });
    }, 60 * 1000); // every minute

    return () => clearInterval(timer);
  }, [upcomingBookings, simulateBookingEnd]);
  // 🔺 END OF AUTOFINISH BOOKING

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAddVehicle = () => {
    if (!vehicleNumber) return;
    addVehicle({
      type: vehicleType,
      number: vehicleNumber,
      model: vehicleModel || undefined,
    });
    setVehicleNumber('');
    setVehicleModel('');
    setShowVehicleDialog(false);
  };

  const handleUpdateVehicle = () => {
    if (!editingVehicle || !vehicleNumber) return;
    updateVehicle(editingVehicle.id, {
      number: vehicleNumber,
      type: vehicleType,
      model: vehicleModel || undefined,
    });
    setEditingVehicle(null);
    setVehicleNumber('');
    setVehicleModel('');
    setShowVehicleDialog(false);
  };

  const handleEditVehicle = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setVehicleNumber(vehicle.number);
    setVehicleType(vehicle.type);
    setVehicleModel(vehicle.model || '');
    setShowVehicleDialog(true);
  };

  const handleDeleteVehicle = (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      deleteVehicle(id);
    }
  };

  const getParkingName = (parkingId: string) => {
    return parkingSpaces.find(p => p.id === parkingId)?.name || 'Unknown';
  };

  const getParkingAddress = (parkingId: string) => {
    return parkingSpaces.find(p => p.id === parkingId)?.address || '';
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
                <Car className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-bold">Customer Dashboard</h1>
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
                <User className="w-5 h-5" />
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
          <p className="text-muted-foreground">Manage your bookings and vehicles</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingBookings.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vehicles.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹250.00</div>
              <p className="text-xs text-muted-foreground">Mock balance</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bookings">
              <Calendar className="w-4 h-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="vehicles">
              <Car className="w-4 h-4 mr-2" />
              Vehicles
            </TabsTrigger>
            <TabsTrigger value="wallet">
              <Wallet className="w-4 h-4 mr-2" />
              Wallet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            {/* Upcoming Bookings */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Upcoming Bookings</h3>
              {upcomingBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No upcoming bookings</p>
                    <Button onClick={() => navigate('/')}>Find Parking</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {upcomingBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{getParkingName(booking.parkingId)}</CardTitle>
                            <CardDescription>
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {getParkingAddress(booking.parkingId)}
                            </CardDescription>
                          </div>
                          <Badge variant={booking.status === 'active' ? 'default' : 'secondary'}>
                            {booking.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Vehicle:</span>
                            <p className="font-medium">{booking.vehicleNumber}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <p className="font-medium">
                              {new Date(booking.startTime).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Time:</span>
                            <p className="font-medium">
                              {new Date(booking.startTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <p className="font-medium">{booking.duration} hours</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Amount:</span>
                            <p className="font-bold text-primary">₹{booking.totalPrice}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Payment:</span>
                            <p className="font-medium capitalize">{booking.paymentMethod}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => simulateBookingEnd(booking.id)}
                          >
                            Simulate End
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Past Bookings */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Past Bookings</h3>
              {pastBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No past bookings
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pastBookings.slice(0, 5).map((booking) => (
                    <Card key={booking.id} className="opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{getParkingName(booking.parkingId)}</CardTitle>
                            <CardDescription className="text-xs">
                              {new Date(booking.startTime).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <Badge variant={booking.status === 'completed' ? 'secondary' : 'destructive'}>
                            {booking.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {booking.vehicleNumber} · {booking.duration}h
                          </span>
                          <span className="font-medium">₹{booking.totalPrice}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">My Vehicles</h3>
              <Button onClick={() => setShowVehicleDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Vehicle
              </Button>
            </div>

            {vehicles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No vehicles added yet</p>
                  <Button onClick={() => setShowVehicleDialog(true)}>Add Your First Vehicle</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {vehicles.map((vehicle) => (
                  <Card key={vehicle.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{vehicle.number}</CardTitle>
                          <CardDescription>
                            {vehicle.type === 'car' ? '🚗 Car' : '🏍️ Bike'}
                            {vehicle.model && ` · ${vehicle.model}`}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditVehicle(vehicle)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Balance</CardTitle>
                <CardDescription>Mock wallet for demonstration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-4">₹250.00</div>
                <Button>Add Funds</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Parking Payment</p>
                      <p className="text-sm text-muted-foreground">Times Square Parking</p>
                    </div>
                    <span className="font-medium text-destructive">-₹48.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Wallet Topup</p>
                      <p className="text-sm text-muted-foreground">UPI Payment</p>
                    </div>
                    <span className="font-medium text-success">+₹100.00</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>Your account information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <p className="text-sm font-medium mt-1">{user?.name}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="text-sm font-medium mt-1">{user?.email}</p>
            </div>
            <div>
              <Label>Phone</Label>
              <p className="text-sm font-medium mt-1">{user?.phone}</p>
            </div>
            <div>
              <Label>Address</Label>
              <p className="text-sm font-medium mt-1">{user?.address}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vehicle Dialog */}
      <Dialog open={showVehicleDialog} onOpenChange={() => {
        setShowVehicleDialog(false);
        setEditingVehicle(null);
        setVehicleNumber('');
        setVehicleModel('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={vehicleType === 'car' ? 'default' : 'outline'}
                  onClick={() => setVehicleType('car')}
                >
                  🚗 Car
                </Button>
                <Button
                  type="button"
                  variant={vehicleType === 'bike' ? 'default' : 'outline'}
                  onClick={() => setVehicleType('bike')}
                >
                  🏍️ Bike
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-number">Vehicle Number *</Label>
              <Input
                id="vehicle-number"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="NY-1234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-model">Model (Optional)</Label>
              <Input
                id="vehicle-model"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Honda Civic"
              />
            </div>
            <Button
              className="w-full"
              onClick={editingVehicle ? handleUpdateVehicle : handleAddVehicle}
            >
              {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <HelpSupportModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
      <ProfileEditModal open={showProfileEditModal} onOpenChange={setShowProfileEditModal} />
    </div>
  );
};
