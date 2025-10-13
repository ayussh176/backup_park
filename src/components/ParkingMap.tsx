import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { ParkingSpace } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navigation, Star, X, Locate } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoiZ2hvZGVyYW95cyIsImEiOiJjbWMzbWozZmEwNzIzMmxwbHNocjNxdmRqIn0.ysvl-eXJQsuzj4Ky2qBP1A';

interface ParkingMapProps {
  parkingSpaces: ParkingSpace[];
  userLocation?: [number, number];
  onParkingSelect?: (parking: ParkingSpace) => void;
  selectedParking?: ParkingSpace | null;
  showRoute?: boolean;
}

export const ParkingMap: React.FC<ParkingMapProps> = ({
  parkingSpaces,
  userLocation = [40.7580, -73.9855], // Default to Times Square
  onParkingSelect,
  selectedParking,
  showRoute = false,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const polygonLayersRef = useRef<string[]>([]);
  const [routeVisible, setRouteVisible] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [userLocation[1], userLocation[0]], // MapBox uses [lng, lat]
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    // Add user location marker
    const userMarker = document.createElement('div');
    userMarker.className = 'w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg';
    
    userMarkerRef.current = new mapboxgl.Marker(userMarker)
      .setLngLat([userLocation[1], userLocation[0]])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          '<div class="text-center font-medium p-1">Your Location</div>'
        )
      )
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update parking markers and polygons
  useEffect(() => {
    if (!map.current) return;

    const mapInstance = map.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clear existing polygon layers
    polygonLayersRef.current.forEach(layerId => {
      if (mapInstance.getLayer(layerId)) {
        mapInstance.removeLayer(layerId);
      }
      if (mapInstance.getLayer(`${layerId}-outline`)) {
        mapInstance.removeLayer(`${layerId}-outline`);
      }
      if (mapInstance.getSource(layerId)) {
        mapInstance.removeSource(layerId);
      }
    });
    polygonLayersRef.current = [];

    // Add polygons and markers
    parkingSpaces.forEach((parking) => {
      // Add polygon if coordinates exist
      if (parking.polygonCoordinates && parking.polygonCoordinates.length > 0) {
        const layerId = `polygon-${parking.id}`;
        polygonLayersRef.current.push(layerId);

        // Determine color based on availability
        const occupancyRate = parking.totalSlots > 0 
          ? (parking.totalSlots - parking.availableSlots) / parking.totalSlots 
          : 0;
        const fillColor = occupancyRate >= 1 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'; // Red if full, green if available
        const lineColor = occupancyRate >= 1 ? '#ef4444' : '#22c55e';

        const addPolygon = () => {
          // Add polygon source and layer
          mapInstance.addSource(layerId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {
                parkingId: parking.id,
                name: parking.name,
                pricePerHour: parking.pricePerHour,
                availableSlots: parking.availableSlots,
                totalSlots: parking.totalSlots,
              },
              geometry: {
                type: 'Polygon',
                coordinates: [[...parking.polygonCoordinates!, parking.polygonCoordinates![0]]], // Close the polygon
              },
            },
          });

          // Add fill layer
          mapInstance.addLayer({
            id: layerId,
            type: 'fill',
            source: layerId,
            paint: {
              'fill-color': fillColor,
              'fill-opacity': 0.6,
            },
          });

          // Add outline layer
          mapInstance.addLayer({
            id: `${layerId}-outline`,
            type: 'line',
            source: layerId,
            paint: {
              'line-color': lineColor,
              'line-width': 2,
            },
          });

          // Add click handler for polygon
          mapInstance.on('click', layerId, () => {
            onParkingSelect?.(parking);
          });

          // Add hover cursor
          mapInstance.on('mouseenter', layerId, () => {
            mapInstance.getCanvas().style.cursor = 'pointer';
          });

          mapInstance.on('mouseleave', layerId, () => {
            mapInstance.getCanvas().style.cursor = '';
          });
        };

        if (mapInstance.isStyleLoaded()) {
          addPolygon();
        } else {
          mapInstance.on('load', addPolygon);
        }
      }

      // ----- CHANGES START HERE -----
      // Add parking marker
      // Green if availableSlots > 0, Red if not
      const markerColor = parking.availableSlots > 0 ? '#22c55e' : '#ef4444'; // green or red

      const el = document.createElement('div');
      el.className = 'parking-marker';
      el.innerHTML = `
        <div style="
          background:${markerColor}; 
          color:#fff; 
          border-radius:100%; 
          width:40px; height:40px; 
          display:flex; 
          align-items:center; 
          justify-content:center; 
          box-shadow:0 2px 8px rgba(0,0,0,0.12); 
          cursor:pointer;
          transition:transform 0.15s;
        " 
        class="hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;
      // ----- CHANGES END HERE -----

      const popupContent = `
        <div class="p-3 min-w-[200px]">
          <h3 class="font-bold text-sm mb-1">${parking.name}</h3>
          <p class="text-xs text-muted-foreground mb-2">${parking.address}</p>
          <div class="flex items-center gap-2 mb-2">
            <div class="flex items-center gap-1">
              <svg class="w-3 h-3 fill-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span class="text-xs font-medium">${parking.rating}</span>
            </div>
            <span class="text-xs text-muted-foreground">
              ${parking.distance ? `${parking.distance} mi` : 'N/A'}
            </span>
          </div>
          <div class="text-xs mb-2">
            <span class="font-semibold">$${parking.pricePerHour}/hr</span>
            <span> · </span>
            <span class="${parking.availableSlots > 0 ? 'text-green-600' : 'text-red-600'}">${parking.availableSlots}/${parking.totalSlots} slots</span>
          </div>
          <div class="flex gap-2">
            ${onParkingSelect ? `<button class="book-btn flex-1 px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-medium hover:opacity-90" data-parking-id="${parking.id}">Book Now</button>` : ''}
            <button class="nav-btn px-3 py-1 border rounded text-xs hover:bg-accent" data-parking-id="${parking.id}">
              <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
            </button>
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([parking.coordinates[1], parking.coordinates[0]])
        .setPopup(popup)
        .addTo(map.current!);

      // Show popup on hover
      marker.getElement().addEventListener('mouseenter', () => {
        marker.togglePopup();
      });
      marker.getElement().addEventListener('mouseleave', () => {
        marker.togglePopup();
      });

      // Add event listeners for buttons in popup
      popup.on('open', () => {
        const bookBtn = document.querySelector(`button.book-btn[data-parking-id="${parking.id}"]`);
        const navBtn = document.querySelector(`button.nav-btn[data-parking-id="${parking.id}"]`);
        
        if (bookBtn && onParkingSelect) {
          bookBtn.addEventListener('click', () => onParkingSelect(parking));
        }
        if (navBtn) {
          navBtn.addEventListener('click', () => handleNavigate(parking));
        }
      });

      markersRef.current.push(marker);
    });
  }, [parkingSpaces, onParkingSelect]);

  // Handle route display
  useEffect(() => {
    if (!map.current) return;

    const mapInstance = map.current;

    if (selectedParking && showRoute) {
      setRouteVisible(true);

      // Wait for map to load before adding route
      const addRoute = () => {
        if (mapInstance.getSource('route')) {
          mapInstance.removeLayer('route');
          mapInstance.removeSource('route');
        }

        mapInstance.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [userLocation[1], userLocation[0]],
                [selectedParking.coordinates[1], selectedParking.coordinates[0]]
              ]
            }
          }
        });

        mapInstance.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': 'hsl(262 83% 58%)',
            'line-width': 3
          }
        });
      };

      if (mapInstance.isStyleLoaded()) {
        addRoute();
      } else {
        mapInstance.on('load', addRoute);
      }
    } else {
      setRouteVisible(false);
      if (mapInstance.getSource('route')) {
        mapInstance.removeLayer('route');
        mapInstance.removeSource('route');
      }
    }
  }, [selectedParking, showRoute, userLocation]);

  const handleNavigate = (parking: ParkingSpace) => {
    if (!map.current) return;

    const mapInstance = map.current;

    // Add route
    if (mapInstance.getSource('route')) {
      mapInstance.removeLayer('route');
      mapInstance.removeSource('route');
    }

    mapInstance.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [userLocation[1], userLocation[0]],
            [parking.coordinates[1], parking.coordinates[0]]
          ]
        }
      }
    });

    mapInstance.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': 'hsl(262 83% 58%)',
        'line-width': 3
      }
    });

    setRouteVisible(true);
  };

  const clearRoute = () => {
    if (!map.current) return;
    
    const mapInstance = map.current;
    if (mapInstance.getSource('route')) {
      mapInstance.removeLayer('route');
      mapInstance.removeSource('route');
    }
    setRouteVisible(false);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];

        // Update map center
        map.current?.flyTo({
          center: [newLocation[1], newLocation[0]],
          zoom: 15,
          duration: 1500
        });

        // Update user marker position
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([newLocation[1], newLocation[0]]);
        }

        setLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Could not get your location. Please check permissions.');
        setLoadingLocation(false);
      }
    );
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-card">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Current Location Button */}
      <div className="absolute top-4 right-4">
        <Button
          size="icon"
          variant="secondary"
          onClick={handleCurrentLocation}
          disabled={loadingLocation}
          className="shadow-lg bg-card hover:bg-accent"
          title="Show my current location"
        >
          <Locate className={`w-5 h-5 ${loadingLocation ? 'animate-pulse' : ''}`} />
        </Button>
      </div>

      {selectedParking && routeVisible && (
        <div className="absolute bottom-4 left-4 right-4 bg-card p-3 rounded-lg shadow-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Route to {selectedParking.name}</p>
              <p className="text-xs text-muted-foreground">
                Distance: {selectedParking.distance} mi · ETA: {Math.ceil((selectedParking.distance || 0) * 3)} min
              </p>
            </div>
            <Button size="sm" onClick={clearRoute}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
