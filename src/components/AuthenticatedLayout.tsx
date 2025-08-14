// Modified AuthenticatedLayout.tsx
import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate, Outlet } from "react-router-dom";
import { Database, Brain, Settings, BarChart3, FileText, UserSearch, Code, Workflow, User, LogOut, Upload as UploadIcon, FileCheck, PanelLeft, X, Plus, Minus, Cloud, HardDrive, Server, Folder, FolderOpen, Globe, Check, Briefcase, Zap, Package, Factory } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const navigation = [
  { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
  { name: "Pipelines", href: "/dashboard/pipelines", icon: Workflow },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
];

interface Job {
  id: string;
  name: string;
  category: string;
  lastRun: string;
  status: 'Failed' | 'Passed' | 'Running' | 'Pending';
}

const jobCategories = [
  { 
    id: 'glue', 
    name: 'Glue Jobs', 
    icon: Database
  },
  { 
    id: 'lambda', 
    name: 'Lambda Jobs', 
    icon: Zap
  },
  { 
    id: 'batch', 
    name: 'Batch Jobs', 
    icon: Package
  },
  { 
    id: 'adf', 
    name: 'ADF Jobs', 
    icon: Factory
  },
  { 
    id: 'airflow', 
    name: 'Airflow Jobs', 
    icon: HardDrive
  }
];

export function AuthenticatedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Load sample jobs
    const mockJobs: Job[] = [
      { id: '1', name: "Customer Data ETL", category: 'glue', lastRun: '2024-01-15 10:30:00', status: 'Passed' },
      { id: '2', name: "Sales Analytics", category: 'glue', lastRun: '2024-01-15 09:45:00', status: 'Failed' },
      { id: '3', name: "Data Validation", category: 'lambda', lastRun: '2024-01-15 11:15:00', status: 'Passed' },
      { id: '4', name: "Report Generation", category: 'batch', lastRun: '2024-01-15 08:20:00', status: 'Running' },
      { id: '5', name: "Data Migration", category: 'adf', lastRun: '2024-01-15 12:00:00', status: 'Passed' },
      { id: '6', name: "Medical Trascription", category: 'airflow', lastRun: '2024-01-13 12:00:00', status: 'Passed' },
    ];
    setJobs(mockJobs);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authenticated");
    localStorage.removeItem("user");
    toast({
      title: "Logged out successfully",
      description: "See you next time!",
    });
    
    window.location.href = "/";
  };

  const handleJobClick = (jobName: string) => {
    localStorage.setItem("selectedJob", jobName);
    navigate("/dashboard/reports");
    toast({
      title: "Job selected",
      description: `Now viewing details for ${jobName}`,
    });
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
  };

  // Group jobs by category
  const groupedJobs = jobs.reduce((acc, job) => {
    if (!acc[job.category]) {
      acc[job.category] = [];
    }
    acc[job.category].push(job);
    return acc;
  }, {} as Record<string, Job[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Top Navigation */}
      <nav className="bg-card border-b border-border fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <NavLink to="/dashboard" className="flex items-center space-x-3 pl-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg relative">
                  <Brain className="w-5 h-5 text-primary-foreground absolute top-1 left-1" />
                  <Database className="w-5 h-5 text-primary-foreground absolute bottom-1 right-1" />
                </div>
                <h1 className="text-xl font-bold text-foreground">IngestIQ</h1>
              </NavLink>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex space-x-4">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "inline-flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200",
                        isActive
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-border"
                      )}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </div>
              <ThemeToggle />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-10 h-10">
                    <User className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-2 bg-muted rounded-lg">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate">{user?.name || "Demo User"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email || "demo@ingestiq.com"}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate("/dashboard/settings")}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full justify-start" 
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 bg-card border-r border-border transform transition-all duration-300 ease-in-out pt-16 ${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-16 translate-x-0'
        }`}>
          <div className="h-full flex flex-col">
            {sidebarOpen ? (
              <>
                <div className="sticky top-16 bg-card z-10 border-b border-border flex items-center p-4 space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="bg-card border border-border shadow-sm h-10 w-10 flex-shrink-0"
                  >
                    <PanelLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-lg font-semibold text-foreground flex items-center flex-1">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Job Categories
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto pt-2">
                  <div className="p-2 space-y-2">
                    {jobCategories.map((category) => (
                      <div key={category.id}>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-3 h-auto"
                          onClick={() => toggleCategory(category.id)}
                        >
                          <div className="flex items-center">
                            <category.icon className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          {expandedCategory === category.id ? (
                            <Minus className="w-4 h-4" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                        
                        {expandedCategory === category.id && groupedJobs[category.id] && (
                          <div className="ml-4 mt-2 space-y-2">
                            {groupedJobs[category.id].map((job) => (
                              <Card 
                                key={job.id} 
                                className="cursor-pointer hover:shadow-sm transition-shadow w-full"
                                onClick={() => handleJobClick(job.name)}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-foreground truncate">
                                        {job.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Status: {job.status}
                                      </p>
                                    </div>
                                    <div className={cn(
                                      "w-2 h-2 rounded-full ml-2",
                                      job.status === 'Passed' && "bg-green-500",
                                      job.status === 'Failed' && "bg-red-500",
                                      job.status === 'Running' && "bg-blue-500",
                                      job.status === 'Pending' && "bg-yellow-500"
                                    )} />
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center pt-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="bg-card border border-border shadow-sm h-10 w-10"
                >
                  <PanelLeft className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}