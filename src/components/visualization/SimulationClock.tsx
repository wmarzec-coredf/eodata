import { useMemo } from "react";
import { Clock } from "lucide-react";

interface SimulationClockProps {
  simulationTime: number;
  simulationSpeed: number;
  isPaused: boolean;
}

const SimulationClock = ({ simulationTime, simulationSpeed, isPaused }: SimulationClockProps) => {
  // Convert simulation time to hours, minutes, seconds
  const timeDisplay = useMemo(() => {
    // simulationTime is in arbitrary units, let's treat it as hours of simulation
    const totalSeconds = Math.floor(simulationTime * 3600); // Convert to seconds
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours: hours.toString().padStart(2, "0"),
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
    };
  }, [simulationTime]);

  // Calculate the simulated date (starting from "now" + elapsed time)
  const dateDisplay = useMemo(() => {
    const baseDate = new Date();
    const elapsedMs = simulationTime * 3600 * 1000; // Convert to milliseconds
    const simulatedDate = new Date(baseDate.getTime() + elapsedMs);

    return {
      year: simulatedDate.getUTCFullYear(),
      month: (simulatedDate.getUTCMonth() + 1).toString().padStart(2, "0"),
      day: simulatedDate.getUTCDate().toString().padStart(2, "0"),
      dayOfYear: Math.floor(
        (simulatedDate.getTime() - new Date(simulatedDate.getUTCFullYear(), 0, 0).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    };
  }, [simulationTime]);

  return (
    <div className="glass-card p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>Mission Elapsed Time (UTC)</span>
      </div>

      {/* Main time display */}
      <div className="font-mono text-2xl font-bold tracking-wider text-primary">
        {timeDisplay.hours}:{timeDisplay.minutes}:{timeDisplay.seconds}
      </div>

      {/* Date display */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {dateDisplay.year}-{dateDisplay.month}-{dateDisplay.day}
        </span>
        <span className="text-muted-foreground">
          DOY {dateDisplay.dayOfYear}
        </span>
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-3 pt-1 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              isPaused ? "bg-esa-warning" : "bg-esa-success animate-pulse"
            }`}
          />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {isPaused ? "Paused" : "Running"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Speed: {simulationSpeed}x
          </span>
        </div>
      </div>
    </div>
  );
};

export default SimulationClock;
