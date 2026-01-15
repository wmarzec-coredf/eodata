import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ExperimentCard from "@/components/dashboard/ExperimentCard";
import StatsCard from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Satellite,
  Database,
  Activity,
  Clock,
  Search,
  Plus,
  Filter,
  Globe,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data - will be replaced with real API calls
const mockExperiments = [
  {
    id: "EXP-001",
    name: "LEO Constellation Data Relay",
    status: "running" as const,
    satellites: 12,
    groundStations: 4,
    duration: "72h 15m",
    lastUpdated: "2 min ago",
  },
  {
    id: "EXP-002",
    name: "Disaster Response Network Test",
    status: "completed" as const,
    satellites: 8,
    groundStations: 6,
    duration: "48h 00m",
    lastUpdated: "1 day ago",
  },
  {
    id: "EXP-003",
    name: "MEO-GEO Hybrid Routing",
    status: "pending" as const,
    satellites: 16,
    groundStations: 8,
    duration: "Scheduled",
    lastUpdated: "3 days ago",
  },
  {
    id: "EXP-004",
    name: "Blockchain Provenance Trial",
    status: "running" as const,
    satellites: 6,
    groundStations: 3,
    duration: "24h 30m",
    lastUpdated: "5 min ago",
  },
];

const roleColors = {
  admin: "bg-destructive/20 text-destructive border-destructive/30",
  researcher: "bg-primary/20 text-primary border-primary/30",
  viewer: "bg-muted text-muted-foreground border-muted-foreground/30",
};

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const handleViewExperiment = (id: string) => {
    toast({
      title: "Opening Experiment",
      description: `Loading visualization for ${id}...`,
    });
  };

  const filteredExperiments = mockExperiments.filter(
    (exp) =>
      exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userEmail={user?.email} onLogout={handleLogout} />

      <main className="container mx-auto px-6 py-8">
        {/* Role Badge */}
        {role && (
          <div className="mb-6 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Your role:</span>
            <Badge variant="outline" className={roleColors[role]}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
          </div>
        )}
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Active Experiments"
            value={2}
            subtitle="Currently running"
            icon={Activity}
            trend={{ value: 12, positive: true }}
          />
          <StatsCard
            title="Total Satellites"
            value={42}
            subtitle="In active experiments"
            icon={Satellite}
          />
          <StatsCard
            title="Data Processed"
            value="2.4 TB"
            subtitle="This month"
            icon={Database}
            trend={{ value: 8, positive: true }}
          />
          <StatsCard
            title="Avg. Response Time"
            value="124 ms"
            subtitle="Network latency"
            icon={Clock}
          />
        </div>

        {/* Experiments Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Experiments</h2>
              <p className="text-muted-foreground text-sm">
                Manage and visualize your EO data experiments
              </p>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Experiment
            </Button>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search experiments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperiments.map((experiment) => (
              <ExperimentCard
                key={experiment.id}
                {...experiment}
                onView={() => handleViewExperiment(experiment.id)}
              />
            ))}
          </div>

          {filteredExperiments.length === 0 && (
            <div className="glass-card p-12 text-center">
              <p className="text-muted-foreground">
                No experiments found matching your search.
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link to="/visualization">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 border-primary/50 hover:bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
                <span className="text-sm">3D Visualization</span>
              </Button>
            </Link>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Satellite className="h-5 w-5" />
              <span className="text-sm">Add Satellite</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Database className="h-5 w-5" />
              <span className="text-sm">Import Data</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Activity className="h-5 w-5" />
              <span className="text-sm">Run Analysis</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Clock className="h-5 w-5" />
              <span className="text-sm">Schedule Task</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
