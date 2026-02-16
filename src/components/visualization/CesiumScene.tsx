import { useEffect, useRef, useState, useCallback } from "react";
import {
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
  Viewer,
  Ion,
  Cartesian3,
  Color,
  JulianDate,
  SampledPositionProperty,
  PolylineGlowMaterialProperty,
  PolylineDashMaterialProperty,
  ClockRange,
  ClockStep,
  IonImageryProvider,
  Ellipsoid,
  Cartographic,
  CallbackProperty,
  Event as CesiumEvent,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

// Cesium Ion access token
Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlZWViZWY4NS1kY2ViLTRjNmItYjM2OS00NWY4MmRjZDY1YTUiLCJpZCI6Mzc5MDgzLCJpYXQiOjE3Njg0ODA2OTN9.xaHKt0sIqM-7mTqizQGILb0yoRGBYSZ9u9zaEiDCaLM";

interface SatelliteClickInfo {
  id: string;
  name: string;
  orbitType: "LEO" | "MEO" | "GEO";
  altitude: number;
  inclination: number;
  color: string;
  connectedSatellites?: string[];
  connectedStations?: string[];
}

interface CesiumSceneProps {
  showLEO: boolean;
  showMEO: boolean;
  showGEO: boolean;
  showGroundStations: boolean;
  showDataTransfer: boolean;
  showGroundLinks: boolean;
  showOrbits: boolean;
  showTrails: boolean;
  simulationSpeed: number;
  isPaused: boolean;
  onSatelliteClick?: (satellite: SatelliteClickInfo) => void;
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
  const mu = 398600.4418;
  const orbitalPeriod = 2 * Math.PI * Math.sqrt(Math.pow(orbitRadius, 3) / mu);
  const numSamples = 360;
  const inclinationRad = (inclination * Math.PI) / 180;

  for (let i = 0; i <= numSamples; i++) {
    const timeOffset = (i / numSamples) * duration;
    const time = JulianDate.addSeconds(startTime, timeOffset, new JulianDate());
    const angularVelocity = (2 * Math.PI) / orbitalPeriod;
    const angle = startAngle + angularVelocity * timeOffset;
    const x = Math.cos(angle);
    const y = Math.sin(angle) * Math.cos(inclinationRad);
    const z = Math.sin(angle) * Math.sin(inclinationRad);
    const lon = Math.atan2(y, x) * (180 / Math.PI);
    const lat = Math.asin(z) * (180 / Math.PI);
    const position = Cartesian3.fromDegrees(lon, lat, altitude * 1000);
    property.addSample(time, position);
  }
  return property;
};

const generateOrbitPoints = (altitude: number, inclination: number, numPoints: number = 180): Cartesian3[] => {
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
  showDataTransfer,
  showGroundLinks,
  showOrbits,
  showTrails,
  simulationSpeed,
  isPaused,
  onSatelliteClick,
}: CesiumSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const connectionsRef = useRef<{ satLinks: Record<string, string[]>; gsLinks: Record<string, string[]> }>({ satLinks: {}, gsLinks: {} });
  const [isInitialized, setIsInitialized] = useState(false);

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

  const groundStationsList: GroundStationData[] = [
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
          infoBox: false,
          shouldAnimate: true,
        });

        try {
          const imageryProvider = await IonImageryProvider.fromAssetId(2);
          viewer.imageryLayers.addImageryProvider(imageryProvider);
        } catch (e) {
          console.log("Using default imagery");
        }

        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(10, 30, 35000000),
        });

        const startTime = JulianDate.now();
        const stopTime = JulianDate.addSeconds(startTime, 86400, new JulianDate());

        viewer.clock.startTime = startTime.clone();
        viewer.clock.stopTime = stopTime.clone();
        viewer.clock.currentTime = startTime.clone();
        viewer.clock.clockRange = ClockRange.LOOP_STOP;
        viewer.clock.clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
        viewer.clock.multiplier = 60;
        viewer.clock.shouldAnimate = true;

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

  // Handle satellite click
  useEffect(() => {
    if (!viewerRef.current || !isInitialized || !onSatelliteClick) return;
    const viewer = viewerRef.current;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: any) => {
      const pickedObjects = viewer.scene.drillPick(click.position, 10);
      for (const picked of pickedObjects) {
        if (!defined(picked) || !picked.id || !picked.id.id) continue;
        const entityId = picked.id.id as string;
        if (entityId.startsWith("orbit-") || entityId.startsWith("isl-") || entityId.startsWith("gsl-") || entityId.startsWith("link-") || entityId.startsWith("gs")) continue;
        const sat = satellites.find((s) => s.id === entityId);
        if (sat) {
          // Also select in Cesium for the selection indicator
          viewer.selectedEntity = picked.id;
          
          const colorMap: Record<string, string> = { LEO: "#4ade80", MEO: "#facc15", GEO: "#f97316" };
          const conn = connectionsRef.current;
          const connectedSatNames = (conn.satLinks[sat.id] || []).map(
            (id) => satellites.find((s) => s.id === id)?.name || id
          );
          const connectedStationNames = conn.gsLinks[sat.id] || [];
          onSatelliteClick({
            id: sat.id,
            name: sat.name,
            orbitType: sat.orbitType,
            altitude: sat.altitude,
            inclination: sat.inclination,
            color: colorMap[sat.orbitType] || "#4ade80",
            connectedSatellites: connectedSatNames,
            connectedStations: connectedStationNames,
          });
          return;
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    return () => handler.destroy();
  }, [isInitialized, onSatelliteClick]);

  // Update simulation speed and pause state
  useEffect(() => {
    if (!viewerRef.current || !isInitialized) return;
    viewerRef.current.clock.multiplier = simulationSpeed;
    viewerRef.current.clock.shouldAnimate = !isPaused;
  }, [simulationSpeed, isPaused, isInitialized]);

  // Update entities based on visibility toggles
  useEffect(() => {
    if (!viewerRef.current || !isInitialized) return;

    const viewer = viewerRef.current;
    const startTime = viewer.clock.startTime;

    viewer.entities.removeAll();

    // Add ground stations
    if (showGroundStations) {
      groundStationsList.forEach((station) => {
        viewer.entities.add({
          id: station.id,
          name: station.name,
          position: Cartesian3.fromDegrees(station.lon, station.lat, 0),
          point: {
            pixelSize: 12,
            color: Color.CYAN,
            outlineColor: Color.WHITE,
            outlineWidth: 2,
            heightReference: 1,
          },
          label: {
            text: station.name,
            font: "12px sans-serif",
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            style: 2,
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
      // Orbit lines
      if (showOrbits) {
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
      }

      // Satellite entity
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
        path: showTrails
          ? {
              width: 2,
              material: sat.color.withAlpha(0.6),
              leadTime: sat.orbitType === "LEO" ? 900 : sat.orbitType === "MEO" ? 3600 : 7200,
              trailTime: sat.orbitType === "LEO" ? 900 : sat.orbitType === "MEO" ? 3600 : 7200,
            }
          : undefined,
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
  }, [isInitialized, showLEO, showMEO, showGEO, showGroundStations, showOrbits, showTrails]);

  // Dynamic data transfer & ground links - computed each tick
  useEffect(() => {
    if (!viewerRef.current || !isInitialized) return;
    if (!showDataTransfer && !showGroundLinks) return;

    const viewer = viewerRef.current;
    const EARTH_RADIUS = 6371000;
    const MIN_ELEVATION_DEG = 5;
    const MAX_INTER_SAT_DISTANCE_KM = 5000; // Max distance for inter-satellite links
    const linkEntities: any[] = [];

    let lastUpdateTime = 0;
    const UPDATE_INTERVAL_MS = 500;

    const getDistance = (pos1: Cartesian3, pos2: Cartesian3): number => {
      const dx = pos1.x - pos2.x;
      const dy = pos1.y - pos2.y;
      const dz = pos1.z - pos2.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz) / 1000; // km
    };

    const onTick = () => {
      const now = Date.now();
      if (now - lastUpdateTime < UPDATE_INTERVAL_MS) return;
      lastUpdateTime = now;

      // Remove previous link entities
      linkEntities.forEach((e) => {
        if (viewer.entities.contains(e)) viewer.entities.remove(e);
      });
      linkEntities.length = 0;

      // Track connections for popup info
      const satLinks: Record<string, string[]> = {};
      const gsLinks: Record<string, string[]> = {};

      const currentTime = viewer.clock.currentTime;

      // Get visible satellites with positions
      const visibleSatellites = satellites.filter((sat) => {
        if (sat.orbitType === "LEO") return showLEO;
        if (sat.orbitType === "MEO") return showMEO;
        if (sat.orbitType === "GEO") return showGEO;
        return true;
      });

      const satPositions: { sat: SatelliteData; position: Cartesian3 }[] = [];
      visibleSatellites.forEach((sat) => {
        const satEntity = viewer.entities.getById(sat.id);
        if (!satEntity || !satEntity.position) return;
        const pos = satEntity.position.getValue(currentTime);
        if (pos) satPositions.push({ sat, position: pos });
      });

      // Inter-satellite links: connect each satellite to its nearest neighbor within range
      if (showDataTransfer) {
        const connected = new Set<string>();
        satPositions.forEach(({ sat: satA, position: posA }) => {
          let nearestDist = Infinity;
          let nearestIdx = -1;

          satPositions.forEach(({ sat: satB, position: posB }, j) => {
            if (satA.id === satB.id) return;
            const pairKey = [satA.id, satB.id].sort().join("-");
            if (connected.has(pairKey)) return;
            const dist = getDistance(posA, posB);
            if (dist < nearestDist && dist <= MAX_INTER_SAT_DISTANCE_KM) {
              nearestDist = dist;
              nearestIdx = j;
            }
          });

          if (nearestIdx >= 0) {
            const { sat: satB, position: posB } = satPositions[nearestIdx];
            const pairKey = [satA.id, satB.id].sort().join("-");
            connected.add(pairKey);

            // Track connections
            if (!satLinks[satA.id]) satLinks[satA.id] = [];
            if (!satLinks[satB.id]) satLinks[satB.id] = [];
            satLinks[satA.id].push(satB.id);
            satLinks[satB.id].push(satA.id);

            const entity = viewer.entities.add({
              id: `isl-${pairKey}-${now}`,
              polyline: {
                positions: [posA, posB],
                width: 3,
                material: new PolylineDashMaterialProperty({
                  color: Color.fromCssColorString("#ff44ff").withAlpha(0.8),
                  gapColor: Color.TRANSPARENT,
                  dashLength: 24,
                  dashPattern: 255,
                }),
              },
            });
            linkEntities.push(entity);
          }
        });
      }

      // Ground station links: connect each station to the nearest visible satellite
      if (showGroundLinks && showGroundStations) {
        groundStationsList.forEach((gs) => {
          const gsLat = (gs.lat * Math.PI) / 180;
          const gsLon = (gs.lon * Math.PI) / 180;
          const gsPosition = Cartesian3.fromDegrees(gs.lon, gs.lat, 0);

          let bestSat: { sat: SatelliteData; position: Cartesian3; elevation: number } | null = null;

          satPositions.forEach(({ sat, position: satPosition }) => {
            const satCartographic = Cartographic.fromCartesian(satPosition);
            const satLat = satCartographic.latitude;
            const satLon = satCartographic.longitude;
            const satAlt = satCartographic.height;

            const dLon = satLon - gsLon;
            const cosCA = Math.sin(gsLat) * Math.sin(satLat) +
              Math.cos(gsLat) * Math.cos(satLat) * Math.cos(dLon);
            const centralAngle = Math.acos(Math.min(1, Math.max(-1, cosCA)));

            // Proper elevation angle: angle above horizon from ground station
            const R = EARTH_RADIUS;
            const r = R + satAlt;
            const elevationRad = Math.atan2(
              r * Math.cos(centralAngle) - R,
              r * Math.sin(centralAngle)
            );
            const elevationDeg = (elevationRad * 180) / Math.PI;

            if (elevationDeg >= MIN_ELEVATION_DEG) {
              if (!bestSat || elevationDeg > bestSat.elevation) {
                bestSat = { sat, position: satPosition, elevation: elevationDeg };
              }
            }
          });

          if (bestSat) {
            let linkColor = Color.CYAN.withAlpha(0.4);
            if (bestSat.sat.orbitType === "MEO") linkColor = Color.YELLOW.withAlpha(0.35);
            if (bestSat.sat.orbitType === "GEO") linkColor = Color.ORANGERED.withAlpha(0.35);

            // Track ground station connection
            if (!gsLinks[bestSat.sat.id]) gsLinks[bestSat.sat.id] = [];
            gsLinks[bestSat.sat.id].push(gs.name);

            const entity = viewer.entities.add({
              id: `gsl-${gs.id}-${bestSat.sat.id}-${now}`,
              polyline: {
                positions: [gsPosition, bestSat.position],
                width: 1.5,
                material: new PolylineDashMaterialProperty({
                  color: linkColor,
                  gapColor: Color.TRANSPARENT,
                  dashLength: 12,
                  dashPattern: 255,
                }),
              },
            });
            linkEntities.push(entity);
          }
        });
      }

      // Store connections for click handler
      connectionsRef.current = { satLinks, gsLinks };
    };

    viewer.clock.onTick.addEventListener(onTick);

    return () => {
      if (!viewer.isDestroyed()) {
        viewer.clock.onTick.removeEventListener(onTick);
        linkEntities.forEach((e) => {
          if (viewer.entities.contains(e)) viewer.entities.remove(e);
        });
      }
    };
  }, [isInitialized, showDataTransfer, showGroundLinks, showGroundStations, showLEO, showMEO, showGEO]);

  return (
    <div
      ref={containerRef}
      className="cesium-container"
      style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
    />
  );
};

export default CesiumScene;
