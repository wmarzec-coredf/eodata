import { useEffect, useRef, useState } from "react";
import {
  Viewer,
  Ion,
  Cartesian3,
  Color,
  JulianDate,
  SampledPositionProperty,
  Entity,
  PolylineGlowMaterialProperty,
  ClockRange,
  ClockStep,
  IonImageryProvider,
  createWorldTerrainAsync,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

// Use the default Cesium Ion token for basic imagery
Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1YjFhNWQ3Zi0xZTBhLTRiMDktYjRjZS01ZWU2MjgxYjVmYWEiLCJpZCI6MjU5LCJpYXQiOjE3MzU4MzE5ODB9.TlGVJjQ3V_3j9gJz8Z_8B8y6Q_5X7j2M9K8N3L5O7P0";

interface CesiumSceneProps {
  showLEO: boolean;
  showMEO: boolean;
  showGEO: boolean;
  showGroundStations: boolean;
  showDataTransfer: boolean;
}

interface SatelliteData {
  id: string;
  name: string;
  orbitType: "LEO" | "MEO" | "GEO";
  altitude: number;
  inclination: number;
  color: Color;
  startAngle: number;
}

interface GroundStationData {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

// Helper to create satellite orbit positions with proper animation
const createOrbitPath = (
  altitude: number,
  inclination: number,
  startAngle: number,
  startTime: JulianDate,
  duration: number
): SampledPositionProperty => {
  const property = new SampledPositionProperty();
  const earthRadius = 6371;
  const orbitRadius = earthRadius + altitude;
  
  // Orbital period in seconds using Kepler's 3rd law
  const mu = 398600.4418; // Earth's gravitational parameter
  const orbitalPeriod = 2 * Math.PI * Math.sqrt(Math.pow(orbitRadius, 3) / mu);
  
  const numSamples = 360;
  const inclinationRad = (inclination * Math.PI) / 180;
  
  for (let i = 0; i <= numSamples; i++) {
    const timeOffset = (i / numSamples) * duration;
    const time = JulianDate.addSeconds(startTime, timeOffset, new JulianDate());
    
    // Calculate angle based on orbital period
    const angularVelocity = (2 * Math.PI) / orbitalPeriod;
    const angle = startAngle + angularVelocity * timeOffset;
    
    // Calculate position in orbital plane then rotate for inclination
    const x = Math.cos(angle);
    const y = Math.sin(angle) * Math.cos(inclinationRad);
    const z = Math.sin(angle) * Math.sin(inclinationRad);
    
    // Convert to lat/lon/alt
    const lon = Math.atan2(y, x) * (180 / Math.PI);
    const lat = Math.asin(z) * (180 / Math.PI);
    
    const position = Cartesian3.fromDegrees(lon, lat, altitude * 1000);
    property.addSample(time, position);
  }
  
  return property;
};

// Generate orbit line points
const generateOrbitPoints = (
  altitude: number,
  inclination: number,
  numPoints: number = 180
): Cartesian3[] => {
  const inclinationRad = (inclination * Math.PI) / 180;
  const points: Cartesian3[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    
    const x = Math.cos(angle);
    const y = Math.sin(angle) * Math.cos(inclinationRad);
    const z = Math.sin(angle) * Math.sin(inclinationRad);
    
    const lon = Math.atan2(y, x) * (180 / Math.PI);
    const lat = Math.asin(z) * (180 / Math.PI);
    
    points.push(Cartesian3.fromDegrees(lon, lat, altitude * 1000));
  }
  
  return points;
};

const CesiumScene = ({
  showLEO,
  showMEO,
  showGEO,
  showGroundStations,
}: CesiumSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Define satellites
  const satellites: SatelliteData[] = [
    { id: "leo1", name: "Sentinel-1A", orbitType: "LEO", altitude: 693, inclination: 98.18, color: Color.LIME, startAngle: 0 },
    { id: "leo2", name: "Sentinel-2A", orbitType: "LEO", altitude: 786, inclination: 98.62, color: Color.LIME, startAngle: Math.PI / 2 },
    { id: "leo3", name: "Sentinel-3A", orbitType: "LEO", altitude: 814, inclination: 98.65, color: Color.LIME, startAngle: Math.PI },
    { id: "leo4", name: "CryoSat-2", orbitType: "LEO", altitude: 717, inclination: 92, color: Color.LIME, startAngle: Math.PI * 1.5 },
    { id: "leo5", name: "SMOS", orbitType: "LEO", altitude: 758, inclination: 98.44, color: Color.LIME, startAngle: Math.PI * 0.25 },
    { id: "leo6", name: "Aeolus", orbitType: "LEO", altitude: 320, inclination: 97, color: Color.LIME, startAngle: Math.PI * 0.75 },
    { id: "leo7", name: "GOCE", orbitType: "LEO", altitude: 260, inclination: 96.5, color: Color.LIME, startAngle: Math.PI * 1.25 },
    { id: "leo8", name: "Swarm-A", orbitType: "LEO", altitude: 462, inclination: 87.35, color: Color.LIME, startAngle: Math.PI * 1.75 },
    { id: "meo1", name: "Galileo-1", orbitType: "MEO", altitude: 23222, inclination: 56, color: Color.YELLOW, startAngle: 0 },
    { id: "meo2", name: "Galileo-2", orbitType: "MEO", altitude: 23222, inclination: 56, color: Color.YELLOW, startAngle: Math.PI / 2 },
    { id: "meo3", name: "Galileo-3", orbitType: "MEO", altitude: 23222, inclination: 56, color: Color.YELLOW, startAngle: Math.PI },
    { id: "meo4", name: "Galileo-4", orbitType: "MEO", altitude: 23222, inclination: 56, color: Color.YELLOW, startAngle: Math.PI * 1.5 },
    { id: "geo1", name: "Meteosat-11", orbitType: "GEO", altitude: 35786, inclination: 0.1, color: Color.RED, startAngle: 0 },
    { id: "geo2", name: "Meteosat-10", orbitType: "GEO", altitude: 35786, inclination: 0.1, color: Color.RED, startAngle: Math.PI * 0.66 },
    { id: "geo3", name: "MSG-4", orbitType: "GEO", altitude: 35786, inclination: 0.1, color: Color.RED, startAngle: Math.PI * 1.33 },
  ];

  const groundStations: GroundStationData[] = [
    { id: "gs1", name: "Kiruna", lat: 67.857, lon: 20.964 },
    { id: "gs2", name: "Redu", lat: 50.002, lon: 5.146 },
    { id: "gs3", name: "Cebreros", lat: 40.453, lon: -4.368 },
    { id: "gs4", name: "Maspalomas", lat: 27.763, lon: -15.633 },
    { id: "gs5", name: "Kourou", lat: 5.252, lon: -52.786 },
    { id: "gs6", name: "New Norcia", lat: -31.048, lon: 116.192 },
  ];

  // Initialize Cesium viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const initViewer = async () => {
      try {
        const viewer = new Viewer(containerRef.current!, {
          animation: true,
          timeline: true,
          homeButton: true,
          sceneModePicker: true,
          baseLayerPicker: false,
          navigationHelpButton: false,
          geocoder: false,
          fullscreenButton: false,
          vrButton: false,
          selectionIndicator: true,
          infoBox: true,
          shouldAnimate: true,
        });

        // Add Bing Maps imagery (free tier available)
        try {
          const imageryProvider = await IonImageryProvider.fromAssetId(2);
          viewer.imageryLayers.addImageryProvider(imageryProvider);
        } catch (e) {
          console.log("Using default imagery");
        }

        // Set initial camera position to see Earth
        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(10, 30, 35000000),
        });

        // Configure clock for animation
        const startTime = JulianDate.now();
        const stopTime = JulianDate.addSeconds(startTime, 86400, new JulianDate());
        
        viewer.clock.startTime = startTime.clone();
        viewer.clock.stopTime = stopTime.clone();
        viewer.clock.currentTime = startTime.clone();
        viewer.clock.clockRange = ClockRange.LOOP_STOP;
        viewer.clock.clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
        viewer.clock.multiplier = 60; // 60x speed for visible movement
        viewer.clock.shouldAnimate = true;

        // Set timeline bounds
        viewer.timeline.zoomTo(startTime, stopTime);

        viewerRef.current = viewer;
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing Cesium viewer:", error);
      }
    };

    initViewer();

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Update entities based on visibility toggles
  useEffect(() => {
    if (!viewerRef.current || !isInitialized) return;

    const viewer = viewerRef.current;
    const startTime = viewer.clock.startTime;

    // Clear existing entities
    viewer.entities.removeAll();

    // Add ground stations
    if (showGroundStations) {
      groundStations.forEach((station) => {
        viewer.entities.add({
          id: station.id,
          name: station.name,
          position: Cartesian3.fromDegrees(station.lon, station.lat, 0),
          point: {
            pixelSize: 12,
            color: Color.CYAN,
            outlineColor: Color.WHITE,
            outlineWidth: 2,
            heightReference: 1, // CLAMP_TO_GROUND
          },
          label: {
            text: station.name,
            font: "12px sans-serif",
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            style: 2, // FILL_AND_OUTLINE
            pixelOffset: { x: 0, y: -20 } as any,
            heightReference: 1,
          },
          description: `<div style="padding: 8px;"><h3>${station.name}</h3><p>ESA Ground Station</p><p>Lat: ${station.lat.toFixed(3)}°</p><p>Lon: ${station.lon.toFixed(3)}°</p></div>`,
        });
      });
    }

    // Filter and add satellites
    const visibleSatellites = satellites.filter((sat) => {
      if (sat.orbitType === "LEO") return showLEO;
      if (sat.orbitType === "MEO") return showMEO;
      if (sat.orbitType === "GEO") return showGEO;
      return true;
    });

    visibleSatellites.forEach((sat) => {
      // Add orbit path
      const orbitPoints = generateOrbitPoints(sat.altitude, sat.inclination);
      viewer.entities.add({
        id: `orbit-${sat.id}`,
        polyline: {
          positions: orbitPoints,
          width: 1.5,
          material: new PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: sat.color.withAlpha(0.4),
          }),
        },
      });

      // Add satellite with animated position
      const position = createOrbitPath(sat.altitude, sat.inclination, sat.startAngle, startTime, 86400);
      
      viewer.entities.add({
        id: sat.id,
        name: sat.name,
        position: position,
        point: {
          pixelSize: sat.orbitType === "GEO" ? 12 : sat.orbitType === "MEO" ? 10 : 8,
          color: sat.color,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: sat.name,
          font: "11px sans-serif",
          fillColor: sat.color,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: 2,
          pixelOffset: { x: 0, y: -15 } as any,
          showBackground: true,
          backgroundColor: Color.BLACK.withAlpha(0.6),
          scale: 0.8,
        },
        path: {
          width: 2,
          material: sat.color.withAlpha(0.6),
          leadTime: sat.orbitType === "LEO" ? 900 : sat.orbitType === "MEO" ? 3600 : 7200,
          trailTime: sat.orbitType === "LEO" ? 900 : sat.orbitType === "MEO" ? 3600 : 7200,
        },
        description: `
          <div style="padding: 12px; font-family: sans-serif;">
            <h3 style="margin: 0 0 8px 0; color: ${sat.color.toCssColorString()};">${sat.name}</h3>
            <p style="margin: 4px 0;"><strong>Orbit Type:</strong> ${sat.orbitType}</p>
            <p style="margin: 4px 0;"><strong>Altitude:</strong> ${sat.altitude.toLocaleString()} km</p>
            <p style="margin: 4px 0;"><strong>Inclination:</strong> ${sat.inclination}°</p>
            <p style="margin: 4px 0;"><strong>Period:</strong> ${Math.round(2 * Math.PI * Math.sqrt(Math.pow(6371 + sat.altitude, 3) / 398600.4418) / 60)} min</p>
          </div>
        `,
      });
    });

  }, [isInitialized, showLEO, showMEO, showGEO, showGroundStations]);

  return (
    <div 
      ref={containerRef} 
      className="cesium-container"
      style={{ 
        width: "100%", 
        height: "100%", 
        position: "absolute", 
        inset: 0,
      }}
    />
  );
};

export default CesiumScene;
