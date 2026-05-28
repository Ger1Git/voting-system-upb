import { useEffect, useState } from 'react';
import { APIProvider, Map, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';

interface RouteSegment {
  fromLocation: string;
  toLocation: string;
  distanceKM: number;
  durationMinutes: number;
}

interface DirectionsProps {
  segments: RouteSegment[];
}

const Directions = ({ segments }: DirectionsProps) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || segments.length === 0) return;

    const origin = segments[0].fromLocation;
    const destination = segments[segments.length - 1].toLocation;
    const waypoints = segments.slice(0, -1).map((s: RouteSegment) => ({
      location: s.toLocation,
      stopover: true
    }));

    directionsService.route({
      origin: origin,
      destination: destination,
      waypoints: waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
    }).then((response: google.maps.DirectionsResult) => {
      directionsRenderer.setDirections(response);
    }).catch((e) => console.error("Directions request failed", e));

  }, [directionsService, directionsRenderer, segments]);

  return null;
};

export default function RouteMap({ routeSegments }: { routeSegments: RouteSegment[] }) {
  return (
    <div style={{ height: '500px', width: '100%' }}>
      <APIProvider apiKey={'AIzaSyBlIVG1U5v0i8T4E0t0zi9Gaxavj7YWs3s'}>
        <Map
          defaultCenter={{ lat: 44.4268, lng: 26.1025 }}
          defaultZoom={7}
          gestureHandling={'greedy'}
          fullscreenControl={false}
        >
          <Directions segments={routeSegments} />
        </Map>
      </APIProvider>
    </div>
  );
}