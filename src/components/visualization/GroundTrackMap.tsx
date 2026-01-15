import { useRef, useEffect, useState } from "react";

interface SatelliteTrack {
  id: string;
  name: string;
  orbitType: "LEO" | "MEO" | "GEO";
  altitude: number;
  inclination: number;
  color: string;
  startAngle: number;
}

interface GroundStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface GroundTrackMapProps {
  showLEO: boolean;
  showMEO: boolean;
  showGEO: boolean;
  showGroundStations: boolean;
  simulationSpeed: number;
}

const GroundTrackMap = ({
  showLEO,
  showMEO,
  showGEO,
  showGroundStations,
  simulationSpeed,
}: GroundTrackMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [time, setTime] = useState(0);
  const [earthImage, setEarthImage] = useState<HTMLImageElement | null>(null);

  // Load Earth texture
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setEarthImage(img);
    img.src = "https://unpkg.com/three-globe@2.24.13/example/img/earth-blue-marble.jpg";
  }, []);

  const satellites: SatelliteTrack[] = [
    { id: "leo1", name: "Sentinel-1A", orbitType: "LEO", altitude: 693, inclination: 98.18, color: "#22c55e", startAngle: 0 },
    { id: "leo2", name: "Sentinel-2A", orbitType: "LEO", altitude: 786, inclination: 98.62, color: "#22c55e", startAngle: Math.PI / 2 },
    { id: "leo3", name: "Sentinel-3A", orbitType: "LEO", altitude: 814, inclination: 98.65, color: "#22c55e", startAngle: Math.PI },
    { id: "leo4", name: "ISS", orbitType: "LEO", altitude: 420, inclination: 51.6, color: "#f97316", startAngle: Math.PI * 0.3 },
    { id: "leo5", name: "Hubble", orbitType: "LEO", altitude: 540, inclination: 28.5, color: "#f97316", startAngle: Math.PI * 0.8 },
    { id: "meo1", name: "Galileo-1", orbitType: "MEO", altitude: 23222, inclination: 56, color: "#eab308", startAngle: 0 },
    { id: "meo2", name: "Galileo-2", orbitType: "MEO", altitude: 23222, inclination: 56, color: "#eab308", startAngle: Math.PI / 2 },
    { id: "geo1", name: "Meteosat-11", orbitType: "GEO", altitude: 35786, inclination: 0.1, color: "#ef4444", startAngle: 0 },
    { id: "geo2", name: "Meteosat-10", orbitType: "GEO", altitude: 35786, inclination: 0.1, color: "#ef4444", startAngle: Math.PI * 0.66 },
  ];

  const groundStations: GroundStation[] = [
    { id: "gs1", name: "Kiruna", lat: 67.857, lon: 20.964 },
    { id: "gs2", name: "Redu", lat: 50.002, lon: 5.146 },
    { id: "gs3", name: "Cebreros", lat: 40.453, lon: -4.368 },
    { id: "gs4", name: "Maspalomas", lat: 27.763, lon: -15.633 },
    { id: "gs5", name: "Kourou", lat: 5.252, lon: -52.786 },
    { id: "gs6", name: "New Norcia", lat: -31.048, lon: 116.192 },
  ];

  // Calculate orbital period in seconds
  const getOrbitalPeriod = (altitude: number) => {
    const earthRadius = 6371;
    const orbitRadius = earthRadius + altitude;
    const mu = 398600.4418;
    return 2 * Math.PI * Math.sqrt(Math.pow(orbitRadius, 3) / mu);
  };

  // Calculate ground track position at given time
  const getGroundTrackPosition = (
    satellite: SatelliteTrack,
    timeSeconds: number
  ): { lat: number; lon: number } => {
    const period = getOrbitalPeriod(satellite.altitude);
    const angularVelocity = (2 * Math.PI) / period;
    const angle = satellite.startAngle + angularVelocity * timeSeconds;
    
    // Earth rotation rate (360 degrees per 86400 seconds)
    const earthRotationRate = (2 * Math.PI) / 86400;
    const earthRotation = earthRotationRate * timeSeconds;
    
    const inclinationRad = (satellite.inclination * Math.PI) / 180;
    
    // Calculate lat/lon
    const lat = Math.asin(Math.sin(angle) * Math.sin(inclinationRad)) * (180 / Math.PI);
    let lon = Math.atan2(
      Math.sin(angle) * Math.cos(inclinationRad),
      Math.cos(angle)
    ) * (180 / Math.PI);
    
    // Subtract Earth rotation
    lon = lon - earthRotation * (180 / Math.PI);
    
    // Normalize longitude to -180 to 180
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;
    
    return { lat, lon };
  };

  // Convert lat/lon to canvas coordinates
  const latLonToCanvas = (
    lat: number,
    lon: number,
    width: number,
    height: number
  ): { x: number; y: number } => {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.fillStyle = "#0a0f1a";
      ctx.fillRect(0, 0, width, height);

      // Draw Earth map
      if (earthImage) {
        ctx.drawImage(earthImage, 0, 0, width, height);
        // Add slight darkening overlay for better visibility
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(0, 0, width, height);
      } else {
        // Fallback dark background while loading
        ctx.fillStyle = "#1a3a5c";
        ctx.fillRect(0, 0, width, height);
      }

      // Draw grid lines
      drawGrid(ctx, width, height);

      // Filter visible satellites
      const visibleSatellites = satellites.filter((sat) => {
        if (sat.orbitType === "LEO") return showLEO;
        if (sat.orbitType === "MEO") return showMEO;
        if (sat.orbitType === "GEO") return showGEO;
        return true;
      });

      // Draw ground tracks (past and future orbits)
      visibleSatellites.forEach((satellite) => {
        drawGroundTrack(ctx, satellite, time, width, height);
      });

      // Draw ground stations
      if (showGroundStations) {
        groundStations.forEach((station) => {
          const pos = latLonToCanvas(station.lat, station.lon, width, height);
          
          // Station marker
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = "#ef4444";
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Station label
          ctx.font = "10px Inter, sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.fillText(station.name, pos.x, pos.y - 10);
        });
      }

      // Draw current satellite positions
      visibleSatellites.forEach((satellite) => {
        const pos = getGroundTrackPosition(satellite, time);
        const canvasPos = latLonToCanvas(pos.lat, pos.lon, width, height);
        
        // Satellite marker
        ctx.beginPath();
        ctx.arc(canvasPos.x, canvasPos.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = satellite.color;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Satellite label
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillStyle = satellite.color;
        ctx.textAlign = "center";
        ctx.fillText(satellite.name, canvasPos.x, canvasPos.y - 12);
      });
    };

    const drawGrid = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      ctx.strokeStyle = "#1e3a5f";
      ctx.lineWidth = 0.5;

      // Longitude lines
      for (let lon = -180; lon <= 180; lon += 30) {
        const x = ((lon + 180) / 360) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Latitude lines
      for (let lat = -90; lat <= 90; lat += 30) {
        const y = ((90 - lat) / 180) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Equator
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1;
      const equatorY = height / 2;
      ctx.beginPath();
      ctx.moveTo(0, equatorY);
      ctx.lineTo(width, equatorY);
      ctx.stroke();
    };

    const drawGroundTrack = (
      ctx: CanvasRenderingContext2D,
      satellite: SatelliteTrack,
      currentTime: number,
      width: number,
      height: number
    ) => {
      const period = getOrbitalPeriod(satellite.altitude);
      const numOrbits = satellite.orbitType === "LEO" ? 2 : 1;
      const duration = period * numOrbits;
      const steps = 500;

      ctx.strokeStyle = satellite.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.7;

      let prevPos: { x: number; y: number } | null = null;

      for (let i = 0; i <= steps; i++) {
        const t = currentTime - duration / 2 + (i / steps) * duration;
        const pos = getGroundTrackPosition(satellite, t);
        const canvasPos = latLonToCanvas(pos.lat, pos.lon, width, height);

        if (prevPos) {
          // Check for wrap-around (crossing date line)
          const dx = Math.abs(canvasPos.x - prevPos.x);
          if (dx < width / 2) {
            ctx.beginPath();
            ctx.moveTo(prevPos.x, prevPos.y);
            ctx.lineTo(canvasPos.x, canvasPos.y);
            ctx.stroke();
          }
        }
        prevPos = canvasPos;
      }

      ctx.globalAlpha = 1;
    };

    draw();
  }, [time, showLEO, showMEO, showGEO, showGroundStations, earthImage]);

  // Animation loop
  useEffect(() => {
    let lastTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      
      setTime((t) => t + delta * simulationSpeed);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [simulationSpeed]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const container = canvas.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="w-full h-full relative bg-[#0a0f1a]">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-card p-3 text-xs space-y-1">
        <div className="font-semibold text-foreground mb-2">Ground Track View</div>
        {showLEO && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500 rounded" />
            <span className="text-muted-foreground">LEO Orbits</span>
          </div>
        )}
        {showMEO && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-yellow-500 rounded" />
            <span className="text-muted-foreground">MEO Orbits</span>
          </div>
        )}
        {showGEO && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-500 rounded" />
            <span className="text-muted-foreground">GEO Orbits</span>
          </div>
        )}
      </div>
      
      {/* Time indicator */}
      <div className="absolute top-4 left-4 glass-card px-3 py-2 text-xs">
        <span className="text-muted-foreground">Simulation Time: </span>
        <span className="font-mono text-primary">
          {new Date(Date.now() + time * 1000).toUTCString().slice(0, -4)} UTC
        </span>
      </div>
    </div>
  );
};

export default GroundTrackMap;
