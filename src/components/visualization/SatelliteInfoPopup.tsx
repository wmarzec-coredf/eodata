import { X, Satellite, MapPin, Clock, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SatelliteInfo {
  id: string;
  name: string;
  orbitType: "LEO" | "MEO" | "GEO";
  altitude: number;
  inclination: number;
  color: string;
  lat?: number;
  lon?: number;
  speed?: number;
  period?: number;
}

interface SatelliteInfoPopupProps {
  satellite: SatelliteInfo | null;
  onClose: () => void;
  position?: { x: number; y: number };
}

const SatelliteInfoPopup = ({ satellite, onClose, position }: SatelliteInfoPopupProps) => {
  if (!satellite) return null;

  const getOrbitalPeriod = (altitude: number) => {
    const earthRadius = 6371;
    const orbitRadius = earthRadius + altitude;
    const mu = 398600.4418;
    return 2 * Math.PI * Math.sqrt(Math.pow(orbitRadius, 3) / mu);
  };

  const periodMinutes = Math.round(getOrbitalPeriod(satellite.altitude) / 60);
  const orbitalSpeed = (2 * Math.PI * (6371 + satellite.altitude)) / getOrbitalPeriod(satellite.altitude);

  const orbitTypeLabels = {
    LEO: "Low Earth Orbit",
    MEO: "Medium Earth Orbit",
    GEO: "Geostationary Orbit",
  };

  return (
    <div
      className="glass-card p-4 min-w-[280px] animate-scale-in"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: satellite.color }}
          />
          <h3 className="font-semibold text-foreground">{satellite.name}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Satellite className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Type:</span>
          <span className="font-medium">{orbitTypeLabels[satellite.orbitType]}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 rounded bg-secondary/50">
            <p className="text-xs text-muted-foreground">Altitude</p>
            <p className="font-mono font-medium">{satellite.altitude.toLocaleString()} km</p>
          </div>
          <div className="p-2 rounded bg-secondary/50">
            <p className="text-xs text-muted-foreground">Inclination</p>
            <p className="font-mono font-medium">{satellite.inclination.toFixed(1)}°</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 rounded bg-secondary/50">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Orbital Period</p>
            </div>
            <p className="font-mono font-medium">{periodMinutes} min</p>
          </div>
          <div className="p-2 rounded bg-secondary/50">
            <div className="flex items-center gap-1 mb-1">
              <Gauge className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Velocity</p>
            </div>
            <p className="font-mono font-medium">{orbitalSpeed.toFixed(2)} km/s</p>
          </div>
        </div>

        {satellite.lat !== undefined && satellite.lon !== undefined && (
          <div className="flex items-center gap-2 text-sm p-2 rounded bg-primary/10 border border-primary/20">
            <MapPin className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Current Position</p>
              <p className="font-mono text-primary">
                {satellite.lat.toFixed(2)}°{satellite.lat >= 0 ? "N" : "S"},{" "}
                {satellite.lon.toFixed(2)}°{satellite.lon >= 0 ? "E" : "W"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SatelliteInfoPopup;
