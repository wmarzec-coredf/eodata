import { useState } from "react";
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
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import Scene from "@/components/visualization/Scene";
import esaLogo from "@/assets/esa-logo.svg";

const Visualization = () => {
  const [showLEO, setShowLEO] = useState(true);
  const [showMEO, setShowMEO] = useState(true);
  const [showGEO, setShowGEO] = useState(true);
  const [showGroundStations, setShowGroundStations] = useState(true);
  const [showDataTransfer, setShowDataTransfer] = useState(true);

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

          {/* Legend */}
          <div className="mt-auto space-y-2">
            <h3 className="text-sm font-semibold">Controls</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Click + drag to rotate view</p>
              <p>• Scroll to zoom in/out</p>
              <p>• Right-click + drag to pan</p>
            </div>
          </div>
        </aside>

        {/* 3D Viewer */}
        <main className="flex-1 relative">
          <div className="absolute inset-0">
            <Scene
              showLEO={showLEO}
              showMEO={showMEO}
              showGEO={showGEO}
              showGroundStations={showGroundStations}
              showDataTransfer={showDataTransfer}
            />
          </div>

          {/* Mobile controls overlay */}
          <div className="absolute bottom-4 left-4 right-4 lg:hidden">
            <div className="glass-card p-3 flex items-center justify-center gap-4">
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
