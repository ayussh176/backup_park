import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ParkingMap } from './ParkingMap';
import { AuthModal } from './AuthModal';
import { BookingModal } from './BookingModal';
import { HelpSupportModal } from './HelpSupportModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Search,
  MapPin,
  Star,
  Car,
  Moon,
  Sun,
  User,
  HelpCircle,
  Building2,
  Navigation,
  Shield,
} from 'lucide-react';
import { ParkingSpace } from '@/types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { parkingSpaces } = useBooking();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSpaces, setFilteredSpaces] = useState<ParkingSpace[]>(parkingSpaces);
  const [selectedParking, setSelectedParking] = useState<ParkingSpace | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number]>([40.7580, -73.9855]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [pendingAction, setPendingAction] = useState<'booking' | 'list' | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSpaces(parkingSpaces);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = parkingSpaces.filter(
        (space) =>
          space.name.toLowerCase().includes(query) ||
          space.address.toLowerCase().includes(query) ||
          space.category.toLowerCase().includes(query)
      );
      setFilteredSpaces(filtered);
    }
  }, [searchQuery, parkingSpaces]);

  const handleParkingSelect = (parking: ParkingSpace) => {
    setSelectedParking(parking);
    if (!isAuthenticated) {
      setPendingAction('booking');
      setAuthMode('signin');
      setShowAuthModal(true);
    } else {
      setShowBookingModal(true);
    }
  };

  const handleListSpace = () => {
    if (!isAuthenticated) {
      setPendingAction('list');
      setAuthMode('signup');
      setShowAuthModal(true);
    } else if (user?.role === 'owner') {
      navigate('/owner-dashboard');
    } else {
      alert('Please sign up as an owner to list parking spaces');
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (pendingAction === 'booking' && selectedParking) {
      setShowBookingModal(true);
    } else if (pendingAction === 'list') {
      navigate('/owner-dashboard');
    }
    setPendingAction(null);
  };

  const handleUserIconClick = () => {
    if (isAuthenticated) {
      if (user?.role === 'customer') {
        navigate('/customer-dashboard');
      } else if (user?.role === 'owner') {
        navigate('/owner-dashboard');
      }
    } else {
      setAuthMode('signin');
      setShowAuthModal(true);
    }
  };

  // Haversine formula for kilometers
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return +(R * c).toFixed(2);
  };

  // SINGLE "Nearest Space" BUTTON logic
  const handleNearestClick = () => {
    setLoadingLocation(true);
    if (!navigator.geolocation || parkingSpaces.length === 0) {
      setLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc: [number, number] = [position.coords.latitude, position.coords.longitude];
        // Find closest parking in KM
        const calcDist = (p: ParkingSpace) =>
          calculateDistanceKm(userLoc[0], userLoc[1], p.coordinates[0], p.coordinates[1]);
        const nearest = parkingSpaces.reduce((min, curr) =>
          calcDist(curr) < calcDist(min) ? curr : min
        );
        setUserLocation(userLoc);
        setSelectedParking(nearest);
        setLoadingLocation(false);
        document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' });
      },
      (error) => {
        alert('Location permission denied or unavailable.');
        setLoadingLocation(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">
                ParkBy
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowHelpModal(true)}>
                <HelpCircle className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleUserIconClick}>
                <User className="w-5 h-5" />
              </Button>
              {(!isAuthenticated || user?.role === 'admin') && (
                <Button variant="outline" size="sm" onClick={() => navigate('/admin-login')}>
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button onClick={handleListSpace} className="gradient-accent">
                <Building2 className="w-4 h-4 mr-2" />
                List Space
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="py-12 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Find Your Perfect Parking Spot
            </h2>
            <p className="text-lg text-white/90">
              Search by location, compare prices, and book instantly
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by pincode, city, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-background/95 backdrop-blur"
                />
              </div>
              {/* SINGLE BUTTON for Nearest Space */}
              <Button size="lg" variant="secondary" onClick={handleNearestClick} disabled={loadingLocation} className="h-12">
                <MapPin className={`w-5 h-5 mr-2 ${loadingLocation ? 'animate-spin' : ''}`} />
                Nearest Space
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section id="map-section" className="py-8">
        <div className="container mx-auto px-4">
          <div className="h-[350px] rounded-lg overflow-hidden shadow-glow">
            <ErrorBoundary name="MapSection" fallback={<div className="h-[500px] flex items-center justify-center text-muted-foreground border rounded-lg">Map failed to load. Please refresh.</div>}>
              <ParkingMap
                parkingSpaces={filteredSpaces}
                userLocation={userLocation}
                onParkingSelect={handleParkingSelect}
                selectedParking={selectedParking}
                showRoute={!!selectedParking}
              />
            </ErrorBoundary>
          </div>
        </div>
      </section>

      {/* Available Parking Spaces */}
      <section id="available-spaces" className="py-12">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold mb-6">Available Parking Spaces</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpaces.map((parking) => (
              <Card
                key={parking.id}
                className="hover:shadow-glow transition-smooth cursor-pointer"
                onClick={() => handleParkingSelect(parking)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{parking.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {parking.address}
                      </CardDescription>
                    </div>
                    <Badge variant={parking.category === 'free' ? 'secondary' : 'default'}>
                      {parking.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="font-medium">{parking.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {parking.distance !== undefined
                          ? `${parking.distance} km`
                          : 'Nearby'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        ${parking.pricePerHour}
                        <span className="text-sm text-muted-foreground">/hr</span>
                      </span>
                      <span className="text-sm font-medium text-success">
                        {parking.availableSlots} slots
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {parking.vehicleTypes.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type === 'car' ? '🚗 Car' : '🏍️ Bike'}
                        </Badge>
                      ))}
                    </div>
                    <Button className="w-full" onClick={() => handleParkingSelect(parking)}>
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSpaces.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No parking spaces found matching your search.</p>
            </div>
          )}
        </div>
      </section>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />

      {selectedParking && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedParking(null);
          }}
          parking={selectedParking}
        />
      )}

      <HelpSupportModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
};
