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
  createWorldTerrainAsync,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

// Set the Cesium Ion access token - this is a publishable token
Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMDE3ZGZiYy05MjI2LTRlNjAtOGZmMi1iMTZiNzU2NzQxYjUiLCJpZCI6MjY1MTkyLCJpYXQiOjE3MzU1Nzk1OTZ9.VjY1V4H_4vF0xQ_sYv2R3B_X8Z2xT3qW5Y9K7J8L2M0";

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

// Helper to create satellite orbit positions
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
  const orbitalPeriod = 2 * Math.PI * Math.sqrt(Math.pow(orbitRadius, 3) / 398600.4418);
  
  const numSamples = 360;
  const inclinationRad = (inclination * Math.PI) / 180;
  
  for (let i = 0; i <= numSamples; i++) {
    const time = JulianDate.addSeconds(startTime, (i / numSamples) * duration, new JulianDate());
    const angle = startAngle + ((i / numSamples) * duration / orbitalPeriod) * 2 * Math.PI;
    
    const x = orbitRadius * Math.cos(angle);
    const y = orbitRadius * Math.sin(angle) * Math.cos(inclinationRad);
    const z = orbitRadius * Math.sin(angle) * Math.sin(inclinationRad);
    
    const position = Cartesian3.fromDegrees(
      (Math.atan2(y, x) * 180) / Math.PI,
      (Math.asin(z / orbitRadius) * 180) / Math.PI,
      altitude * 1000
    );
    
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
  const earthRadius = 6371;
  const orbitRadius = earthRadius + altitude;
  const inclinationRad = (inclination * Math.PI) / 180;
  const points: Cartesian3[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const x = orbitRadius * Math.cos(angle);
    const y = orbitRadius * Math.sin(angle) * Math.cos(inclinationRad);
    const z = orbitRadius * Math.sin(angle) * Math.sin(inclinationRad);
    
    points.push(
      Cartesian3.fromDegrees(
        (Math.atan2(y, x) * 180) / Math.PI,
        (Math.asin(z / orbitRadius) * 180) / Math.PI,
        altitude * 1000
      )
    );
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
  const entitiesRef = useRef<Map<string, Entity>>(new Map());
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
    { id: "geo1", name: "Meteosat-11", orbitType: "GEO", altitude: 35786, inclination: 0, color: Color.RED, startAngle: 0 },
    { id: "geo2", name: "Meteosat-10", orbitType: "GEO", altitude: 35786, inclination: 0, color: Color.RED, startAngle: Math.PI * 0.66 },
    { id: "geo3", name: "MSG-4", orbitType: "GEO", altitude: 35786, inclination: 0, color: Color.RED, startAngle: Math.PI * 1.33 },
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
          animation: false,
          timeline: false,
          homeButton: false,
          sceneModePicker: false,
          baseLayerPicker: false,
          navigationHelpButton: false,
          geocoder: false,
          fullscreenButton: false,
          vrButton: false,
          selectionIndicator: true,
          infoBox: true,
        });

        // Set terrain
        try {
          viewer.terrainProvider = await createWorldTerrainAsync();
        } catch (e) {
          console.log("Could not load terrain, using default");
        }

        // Set initial camera position
        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(0, 20, 25000000),
        });

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
    const startTime = JulianDate.now();

    // Clear existing entities
    viewer.entities.removeAll();
    entitiesRef.current.clear();

    // Add ground stations
    if (showGroundStations) {
      groundStations.forEach((station) => {
        const entity = viewer.entities.add({
          id: station.id,
          name: station.name,
          position: Cartesian3.fromDegrees(station.lon, station.lat, 0),
          point: {
            pixelSize: 10,
            color: Color.CYAN,
            outlineColor: Color.WHITE,
            outlineWidth: 2,
          },
          cylinder: {
            length: 500000,
            topRadius: 50000,
            bottomRadius: 200000,
            material: Color.CYAN.withAlpha(0.2),
            outline: true,
            outlineColor: Color.CYAN.withAlpha(0.5),
          },
          description: `<div style="padding: 8px;"><h3>${station.name}</h3><p>ESA Ground Station</p></div>`,
        });
        entitiesRef.current.set(station.id, entity);
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
          width: 1,
          material: new PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: sat.color.withAlpha(0.3),
          }),
        },
      });

      // Add satellite
      const position = createOrbitPath(sat.altitude, sat.inclination, sat.startAngle, startTime, 86400);
      const entity = viewer.entities.add({
        id: sat.id,
        name: sat.name,
        position: position,
        point: {
          pixelSize: 8,
          color: sat.color,
          outlineColor: Color.WHITE,
          outlineWidth: 1,
        },
        path: {
          width: 2,
          material: sat.color.withAlpha(0.5),
          leadTime: 1800,
          trailTime: 1800,
        },
        description: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0;">${sat.name}</h3>
            <p style="margin: 4px 0;"><strong>Orbit:</strong> ${sat.orbitType}</p>
            <p style="margin: 4px 0;"><strong>Altitude:</strong> ${sat.altitude.toLocaleString()} km</p>
            <p style="margin: 4px 0;"><strong>Inclination:</strong> ${sat.inclination}°</p>
          </div>
        `,
      });
      entitiesRef.current.set(sat.id, entity);
    });

    // Start the clock
    viewer.clock.shouldAnimate = true;

  }, [isInitialized, showLEO, showMEO, showGEO, showGroundStations]);

  return (
    <div 
      ref={containerRef} 
      style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
    />
  );
};

export default CesiumScene;
