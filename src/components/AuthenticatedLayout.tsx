import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate, Outlet } from "react-router-dom";
import { Database, Brain, Settings, BarChart3, FileText, UserSearch, Code, Workflow, User, LogOut, Upload as UploadIcon, FileCheck, PanelLeft, X, Plus, Minus, Cloud, HardDrive, Server, Folder, FolderOpen, Globe, Check, Briefcase, Zap, Package, Factory } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

const navigation = [
  { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
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
  const [showProfile, setShowProfile] = useState(false);
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
              <div className="flex items-center space-x-3 pl-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg relative">
                  <Brain className="w-5 h-5 text-primary-foreground absolute top-1 left-1" />
                  <Database className="w-5 h-5 text-primary-foreground absolute bottom-1 right-1" />
                </div>
                <h1 className="text-xl font-bold text-foreground">IngestIQ</h1>
              </div>
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
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Toggle */}
      <div className="fixed top-20 left-4 z-50 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-card border border-border shadow-sm h-10 w-10"
        >
          <PanelLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 bg-card border-r border-border transform transition-all duration-300 ease-in-out pt-16 ${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-16 translate-x-0'
        }`}>
          <div className="h-full flex flex-col">
            {sidebarOpen && (
              <div className="flex-1 overflow-y-auto mt-12">
                <div className="p-4 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Job Categories
                  </h2>
                </div>
                
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
                        <div className="ml-4 space-y-1">
                          {groupedJobs[category.id].map((job) => (
                            <Card 
                              key={job.id} 
                              className="cursor-pointer hover:shadow-sm transition-shadow"
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
            )}

            {/* User Profile Section at Bottom */}
            <div className="border-t border-border mt-auto">
              {sidebarOpen ? (
                <div className="p-4 space-y-3">
                  <div className="flex items-center space-x-3 p-2 bg-muted rounded-lg">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user?.name || "Demo User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email || "demo@ingestiq.com"}</p>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full justify-start" onClick={() => setShowProfile(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                  
                  <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="p-2 space-y-2 mt-16">
                  <Button variant="ghost" size="icon" className="w-10 h-10">
                    <User className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-10 h-10" onClick={() => setShowProfile(true)}>
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-10 h-10" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}>
          <Outlet />
        </div>
      </div>

      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
            <DialogDescription>
              Manage your account settings and preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium">{user?.name || "Demo User"}</p>
                <p className="text-sm text-muted-foreground">{user?.email || "demo@ingestiq.com"}</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1">
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </Button>
              <Button variant="destructive" onClick={handleLogout} className="flex-1">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}