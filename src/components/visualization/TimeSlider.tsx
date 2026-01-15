import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface TimeSliderProps {
  time: number;
  onTimeChange: (time: number) => void;
  onReset: () => void;
  maxTime?: number;
}

const TimeSlider = ({ time, onTimeChange, onReset, maxTime = 86400 }: TimeSliderProps) => {
  const formatTime = (seconds: number) => {
    const date = new Date(Date.now() + seconds * 1000);
    return date.toUTCString().slice(0, -4) + " UTC";
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `+${hours}h ${minutes}m`;
    }
    return `+${minutes}m`;
  };

  return (
    <div className="glass-card px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Timeline</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-primary">{formatDuration(time)}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onReset}
            title="Reset to now"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <Slider
        value={[time]}
        onValueChange={([value]) => onTimeChange(value)}
        min={0}
        max={maxTime}
        step={60}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Now</span>
        <span>{formatTime(time)}</span>
        <span>+24h</span>
      </div>
    </div>
  );
};

export default TimeSlider;
