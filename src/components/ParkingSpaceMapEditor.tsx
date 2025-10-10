import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Trash2, Navigation } from 'lucide-react';

mapboxgl.accessToken = 'pk.eyJ1IjoiZ2hvZGVyYW95cyIsImEiOiJjbWMzbWozZmEwNzIzMmxwbHNocjNxdmRqIn0.ysvl-eXJQsuzj4Ky2qBP1A';

interface ParkingSpaceMapEditorProps {
  initialCoordinates?: [number, number]; // [lat, lng]
  initialPolygon?: [number, number][]; // Array of [lng, lat]
  onLocationChange?: (coordinates: [number, number]) => void;
  onPolygonChange?: (coordinates: [number, number][]) => void;
  pricePerHour?: number;
  availableSlots?: number;
  totalSlots?: number;
}

export const ParkingSpaceMapEditor: React.FC<ParkingSpaceMapEditorProps> = ({
  initialCoordinates = [40.7580, -73.9855],
  initialPolygon,
  onLocationChange,
  onPolygonChange,
  pricePerHour = 0,
  availableSlots = 0,
  totalSlots = 0,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [hasPolygon, setHasPolygon] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialCoordinates[1], initialCoordinates[0]],
      zoom: 16,
    });

    // Add navigation control
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Initialize MapboxDraw
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: 'simple_select',
    });

    map.current.addControl(draw.current, 'top-left');

    // Add marker for parking location
    const markerEl = document.createElement('div');
    markerEl.className = 'w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg cursor-move';
    markerEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    `;

    marker.current = new mapboxgl.Marker({
      element: markerEl,
      draggable: true,
    })
      .setLngLat([initialCoordinates[1], initialCoordinates[0]])
      .addTo(map.current);

    // Handle marker drag
    marker.current.on('dragend', () => {
      const lngLat = marker.current!.getLngLat();
      onLocationChange?.([lngLat.lat, lngLat.lng]);
    });

    // Load initial polygon if provided
    if (initialPolygon && initialPolygon.length > 0) {
      map.current.on('load', () => {
        const polygonFeature = {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[...initialPolygon, initialPolygon[0]]], // Close the polygon
          },
        };
        draw.current?.add(polygonFeature);
        setHasPolygon(true);
      });
    }

    // Handle polygon creation/update/delete
    const updatePolygon = () => {
      const data = draw.current?.getAll();
      if (data && data.features.length > 0) {
        const feature = data.features[0];
        if (feature.geometry.type === 'Polygon') {
          const coords = feature.geometry.coordinates[0].slice(0, -1); // Remove the closing coordinate
          onPolygonChange?.(coords as [number, number][]);
          setHasPolygon(true);
        }
      } else {
        onPolygonChange?.([]);
        setHasPolygon(false);
      }
    };

    map.current.on('draw.create', updatePolygon);
    map.current.on('draw.update', updatePolygon);
    map.current.on('draw.delete', updatePolygon);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update polygon color based on availability
  useEffect(() => {
    if (!map.current || !hasPolygon) return;

    const mapInstance = map.current;
    const occupancyRate = totalSlots > 0 ? (totalSlots - availableSlots) / totalSlots : 0;
    const color = occupancyRate >= 1 ? '#ef4444' : '#22c55e'; // Red if full, green if available

    // Wait for map to load
    const updatePolygonStyle = () => {
      const data = draw.current?.getAll();
      if (data && data.features.length > 0) {
        // Update the polygon style by re-adding it
        const feature = data.features[0];
        if (feature.id) {
          draw.current?.setFeatureProperty(feature.id as string, 'color', color);
        }
      }
    };

    if (mapInstance.isStyleLoaded()) {
      updatePolygonStyle();
    } else {
      mapInstance.on('load', updatePolygonStyle);
    }
  }, [availableSlots, totalSlots, hasPolygon]);

  const clearPolygon = () => {
    draw.current?.deleteAll();
    setHasPolygon(false);
    onPolygonChange?.([]);
  };

  const handleCurrentLocation = () => {
    setLoadingLocation(true);

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Update marker position
        marker.current?.setLngLat([lng, lat]);
        
        // Center map on location
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 16,
        });
        
        // Notify parent component
        onLocationChange?.([lat, lng]);
        
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Parking Area</label>
        {hasPolygon && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearPolygon}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear Polygon
          </Button>
        )}
      </div>
      <Card className="p-2">
        <div className="relative">
          <div ref={mapContainer} className="w-full h-[400px] rounded-lg" />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 shadow-lg"
            onClick={handleCurrentLocation}
            disabled={loadingLocation}
            title="Use Current Location"
          >
            <Navigation className={`w-4 h-4 ${loadingLocation ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
          <p className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="font-medium">Instructions:</span>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Drag the marker to set parking location</li>
            <li>Click the polygon tool to draw the parking area boundary</li>
            <li>Click points to create the polygon shape</li>
            <li>Double-click to complete the polygon</li>
            <li>Polygon will be <span className="text-green-600 font-medium">green</span> when slots available, <span className="text-red-600 font-medium">red</span> when full</li>
          </ul>
          {pricePerHour > 0 && (
            <p className="text-muted-foreground pt-2">
              Rate: <span className="font-medium">${pricePerHour}/hr</span> · 
              Available: <span className="font-medium">{availableSlots}/{totalSlots}</span>
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
