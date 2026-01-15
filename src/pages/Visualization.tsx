import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Satellite,
  Globe,
  Radio,
  Activity,
  Map,
  Globe2,
  Gauge,
  Play,
  Pause,
} from "lucide-react";
import Scene from "@/components/visualization/Scene";
import GroundTrackMap from "@/components/visualization/GroundTrackMap";
import TimeSlider from "@/components/visualization/TimeSlider";
import SatelliteInfoPopup, { SatelliteInfo } from "@/components/visualization/SatelliteInfoPopup";
import esaLogo from "@/assets/esa-logo.svg";

const SPEED_OPTIONS = [
  { label: "1x", value: 1 },
  { label: "10x", value: 10 },
  { label: "60x", value: 60 },
  { label: "100x", value: 100 },
];

const Visualization = () => {
  const [showLEO, setShowLEO] = useState(true);
  const [showMEO, setShowMEO] = useState(true);
  const [showGEO, setShowGEO] = useState(true);
  const [showGroundStations, setShowGroundStations] = useState(true);
  const [showDataTransfer, setShowDataTransfer] = useState(true);
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");
  const [simulationSpeed, setSimulationSpeed] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  const [simulationTime, setSimulationTime] = useState(0);
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteInfo | null>(null);

  const handleTimeChange = useCallback((time: number) => {
    setSimulationTime(time);
    setIsPaused(true); // Pause when scrubbing
  }, []);

  const handleTimeReset = useCallback(() => {
    setSimulationTime(0);
  }, []);

  const handleTimeUpdate = useCallback((delta: number) => {
    setSimulationTime((t) => t + delta);
  }, []);

  const handleSatelliteClick = useCallback((satellite: SatelliteInfo) => {
    setSelectedSatellite(satellite);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedSatellite(null);
  }, []);

  const orbitStats = [
    { name: "LEO", color: "#22c55e", altitude: "200-2,000 km", satellites: 8, active: showLEO },
    { name: "MEO", color: "#eab308", altitude: "2,000-35,786 km", satellites: 4, active: showMEO },
    { name: "GEO", color: "#ef4444", altitude: "35,786 km", satellites: 3, active: showGEO },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <img src={esaLogo} alt="ESA" className="h-6 w-auto" />
            <span className="text-sm font-medium hidden md:block">
              Satellite Constellation Viewer
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-secondary rounded-lg p-1">
              <Button
                variant={viewMode === "3d" ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 h-7 px-3"
                onClick={() => setViewMode("3d")}
              >
                <Globe2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">3D Globe</span>
              </Button>
              <Button
                variant={viewMode === "2d" ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 h-7 px-3"
                onClick={() => setViewMode("2d")}
              >
                <Map className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">2D Map</span>
              </Button>
            </div>
            
            <Link to="/visualization-cesium">
              <Button variant="outline" size="sm">
                Cesium View
              </Button>
            </Link>
            <Badge variant="outline" className="gap-1.5 bg-esa-success/20 text-esa-success border-esa-success/30">
              <Activity className="h-3 w-3" />
              Live
            </Badge>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Sidebar controls */}
        <aside className="w-72 border-r border-border bg-card/50 p-4 flex flex-col gap-6 hidden lg:flex">
          {/* View mode info */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs font-medium text-primary">
              {viewMode === "3d" ? "3D Globe View" : "2D Ground Track View"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {viewMode === "3d" 
                ? "Interactive 3D visualization of satellite orbits"
                : "NASA-style ground track projection showing orbital paths"
              }
            </p>
          </div>

          {/* Orbit toggles */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Satellite className="h-4 w-4 text-primary" />
              Orbital Layers
            </h3>

            <div className="space-y-3">
              {orbitStats.map((orbit) => (
                <div
                  key={orbit.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: orbit.color }}
                    />
                    <div>
                      <p className="text-sm font-medium">{orbit.name}</p>
                      <p className="text-xs text-muted-foreground">{orbit.altitude}</p>
                    </div>
                  </div>
                  <Switch
                    checked={
                      orbit.name === "LEO"
                        ? showLEO
                        : orbit.name === "MEO"
                        ? showMEO
                        : showGEO
                    }
                    onCheckedChange={(checked) => {
                      if (orbit.name === "LEO") setShowLEO(checked);
                      else if (orbit.name === "MEO") setShowMEO(checked);
                      else setShowGEO(checked);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Ground stations toggle */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Ground Infrastructure
            </h3>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <Radio className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-sm font-medium">Ground Stations</p>
                  <p className="text-xs text-muted-foreground">6 ESA stations</p>
                </div>
              </div>
              <Switch checked={showGroundStations} onCheckedChange={setShowGroundStations} />
            </div>

            {viewMode === "3d" && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-sm font-medium">Data Transfer</p>
                    <p className="text-xs text-muted-foreground">Inter-satellite links</p>
                  </div>
                </div>
                <Switch checked={showDataTransfer} onCheckedChange={setShowDataTransfer} />
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Network Statistics</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-secondary/50 text-center">
                <p className="text-2xl font-bold text-primary">15</p>
                <p className="text-xs text-muted-foreground">Total Satellites</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 text-center">
                <p className="text-2xl font-bold text-accent">6</p>
                <p className="text-xs text-muted-foreground">Ground Stations</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 text-center">
                <p className="text-2xl font-bold text-esa-success">98.7%</p>
                <p className="text-xs text-muted-foreground">Uptime</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 text-center">
                <p className="text-2xl font-bold text-esa-warning">124ms</p>
                <p className="text-xs text-muted-foreground">Avg Latency</p>
              </div>
            </div>
          </div>

          {/* Simulation Speed */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              Simulation Speed
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
              </Button>
              <div className="flex flex-wrap gap-1 flex-1">
                {SPEED_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={simulationSpeed === option.value ? "default" : "outline"}
                    size="sm"
                    className="flex-1 min-w-[40px] h-9"
                    onClick={() => setSimulationSpeed(option.value)}
                    disabled={isPaused}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            {isPaused && (
              <p className="text-xs text-esa-warning">Simulation paused</p>
            )}
          </div>

          {/* Legend */}
          <div className="mt-auto space-y-2">
            <h3 className="text-sm font-semibold">Controls</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              {viewMode === "3d" ? (
                <>
                  <p>• Click + drag to rotate view</p>
                  <p>• Scroll to zoom in/out</p>
                  <p>• Click satellite for info</p>
                </>
              ) : (
                <>
                  <p>• Click satellite for details</p>
                  <p>• Use slider to scrub time</p>
                  <p>• Speed: {simulationSpeed}x realtime</p>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Viewer */}
        <main className="flex-1 relative">
          <div className="absolute inset-0">
            {viewMode === "3d" ? (
              <Scene
                showLEO={showLEO}
                showMEO={showMEO}
                showGEO={showGEO}
                showGroundStations={showGroundStations}
                showDataTransfer={showDataTransfer}
                simulationSpeed={simulationSpeed}
                isPaused={isPaused}
                simulationTime={simulationTime}
                onTimeUpdate={handleTimeUpdate}
                onSatelliteClick={handleSatelliteClick}
              />
            ) : (
              <GroundTrackMap
                showLEO={showLEO}
                showMEO={showMEO}
                showGEO={showGEO}
                showGroundStations={showGroundStations}
                simulationSpeed={simulationSpeed}
                isPaused={isPaused}
                simulationTime={simulationTime}
                onTimeUpdate={handleTimeUpdate}
                onSatelliteClick={handleSatelliteClick}
              />
            )}
          </div>

          {/* Time slider */}
          <div className="absolute bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 z-10">
            <TimeSlider
              time={simulationTime}
              onTimeChange={handleTimeChange}
              onReset={handleTimeReset}
            />
          </div>

          {/* Satellite info popup */}
          <SatelliteInfoPopup
            satellite={selectedSatellite}
            onClose={handleClosePopup}
          />

          {/* Mobile controls overlay */}
          <div className="absolute bottom-4 left-4 right-4 lg:hidden">
            <div className="glass-card p-3 flex flex-col gap-3">
              {/* View mode toggle for mobile */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant={viewMode === "3d" ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setViewMode("3d")}
                >
                  <Globe2 className="h-3.5 w-3.5" />
                  3D
                </Button>
                <Button
                  variant={viewMode === "2d" ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setViewMode("2d")}
                >
                  <Map className="h-3.5 w-3.5" />
                  2D
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="leo-mobile" className="text-xs">LEO</Label>
                  <Switch id="leo-mobile" checked={showLEO} onCheckedChange={setShowLEO} />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="meo-mobile" className="text-xs">MEO</Label>
                  <Switch id="meo-mobile" checked={showMEO} onCheckedChange={setShowMEO} />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="geo-mobile" className="text-xs">GEO</Label>
                  <Switch id="geo-mobile" checked={showGEO} onCheckedChange={setShowGEO} />
                </div>
              </div>
            </div>
          </div>

          {/* Orbit legend overlay */}
          <div className="absolute top-4 right-4 glass-card p-3 space-y-2">
            {orbitStats.map((orbit) => (
              <div
                key={orbit.name}
                className={`flex items-center gap-2 text-xs ${
                  !orbit.active ? "opacity-40" : ""
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: orbit.color }}
                />
                <span>{orbit.name}</span>
                <span className="text-muted-foreground">({orbit.satellites})</span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Visualization;
