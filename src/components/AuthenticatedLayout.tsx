import { Job, JobStage } from '@/components/types/jobs'; // Adjust path as needed
import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate, Outlet } from "react-router-dom";
import { Database, Brain, Settings, BarChart3, PanelLeft, FileText, UserSearch, Code, Workflow, User, LogOut, Upload as UploadIcon, FileCheck, X, Plus, Minus, Cloud, HardDrive, Server, Folder, FolderOpen, Globe, Check, Briefcase, Zap, Package, Factory, CloudCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { logoutUser, getResourceGroups, getADFJobs, getADFPipelines, getGlueJobs, getOneLakeWorkspaces, getFabricJobs } from "@/lib/api";import EnhancedEditJobDialog from "@/components/jobs/EnhancedEditJobDialog";


// Extended Job interface for ADF hierarchy (from teammate's work)
interface ADFJob extends Job {
  resourceGroup?: string;
  dataFactory?: string;
  pipeline?: string;
  workspace?: string;      // ADD THIS
  fabricJobId?: string;     // ADD THIS
  isResourceGroup?: boolean;
  isDataFactory?: boolean;
  isPipeline?: boolean;
  isWorkspace?: boolean;    // ADD THIS
  isFabricJob?: boolean;    // ADD THIS
  parentId?: string;
}
const navigation = [
  { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
  { name: "Pipelines", href: "/dashboard/pipelines", icon: Workflow },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
];

const jobCategories = [
  { id: 'glue', name: 'Glue Jobs', icon: Database },
  { id: 'lambda', name: 'Lambda Jobs', icon: Zap },
  { id: 'batch', name: 'Batch Jobs', icon: Package },
  { id: 'adf', name: 'ADF Jobs', icon: Factory },
  { id: 'fabric', name: 'Fabric Jobs', icon: CloudCog },
  { id: 'airflow', name: 'Airflow Jobs', icon: HardDrive },

];

export function AuthenticatedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedResourceGroups, setExpandedResourceGroups] = useState<Set<string>>(new Set()); // From teammate's work
  const [expandedDataFactories, setExpandedDataFactories] = useState<Set<string>>(new Set()); // From teammate's work
  const [jobs, setJobs] = useState<ADFJob[]>([]); // Use extended type
  const [isHovered, setIsHovered] = useState(false);
  const [editJobDialogOpen, setEditJobDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());

  const validateLocalStorage = () => {
    const bucket = localStorage.getItem('selectedBucket');
    const key = localStorage.getItem('selectedFile');
    if (!bucket || !key) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing bucket name or key. Please upload the file again.",
      });
      navigate('/dashboard/upload');
      return false;
    }
    return { bucket, key };
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const fetchJobs = async () => {
      try {
        // Fetch Glue Jobs (your work)
        const glueJobs = await getGlueJobs();
        const glueJobItems: ADFJob[] = glueJobs.map((name: string, index: number) => ({
          id: `glue-${index}`,
          name,
          category: 'glue',
          lastRun: '2024-01-15 10:30:00',
          status: 'Completed',
          stages: [],
        }));

        // Fetch Resource Groups for ADF (teammate's work)
        const resourceGroups = await getResourceGroups();
        const resourceGroupItems: ADFJob[] = resourceGroups.map((name: string, index: number) => ({
          id: `rg-${index}`,
          name,
          category: 'adf',
          lastRun: 'N/A',
          status: 'Pending',
          stages: [],
          isResourceGroup: true,
          resourceGroup: name,
        }));
        const workspaces = await getOneLakeWorkspaces();
        const workspaceItems: ADFJob[] = workspaces.map((name: string, index: number) => ({
          id: `workspace-${index}`,
          name,
          category: 'fabric',
          lastRun: 'N/A',
          status: 'Pending',
          stages: [],
          isWorkspace: true,
          workspace: name,
        }));
        // Mock data for other categories (unified)
        const mockJobs: ADFJob[] = [
          {
            id: 'lambda-1',
            name: "Data Validation",
            category: 'lambda',
            lastRun: '2024-01-15 11:15:00',
            status: 'Completed',
            stages: [],
          },
          {
            id: 'batch-1',
            name: "Report Generation",
            category: 'batch',
            lastRun: '2024-01-15 08:20:00',
            status: 'Running',
            stages: [],
          },
          {
            id: 'airflow-1',
            name: "Medical Transcription",
            category: 'airflow',
            lastRun: '2024-01-13 12:00:00',
            status: 'Completed',
            stages: [],
          },
        ];

        setJobs([...glueJobItems, ...resourceGroupItems, ...workspaceItems, ...mockJobs]);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch jobs",
        });
      }
    };

    fetchJobs();
  }, [toast, navigate]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        await logoutUser();
      }

      // Clear all relevant localStorage items (unified)
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("authenticated");
      localStorage.removeItem("freshLogin");
      localStorage.removeItem("selectedBucket");
      localStorage.removeItem("selectedFile");

      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  // Merged handleResourceGroupClick and handleDataFactoryClick (teammate's work)
  const handleResourceGroupClick = async (resourceGroup: ADFJob) => {
    const rgId = resourceGroup.id;
    const isExpanded = expandedResourceGroups.has(rgId);

    if (isExpanded) {
      setExpandedResourceGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(rgId);
        return newSet;
      });
      setJobs(prev => prev.filter(job => job.parentId !== rgId));
    } else {
      try {
        setExpandedResourceGroups(prev => new Set(prev).add(rgId));
        const adfJobs = await getADFJobs(resourceGroup.name);

        const dataFactoryItems: ADFJob[] = adfJobs.map((name: string, index: number) => ({
          id: `df-${rgId}-${index}`,
          name,
          category: 'adf',
          lastRun: '2024-01-15 12:00:00',
          status: 'Completed',
          stages: [],
          isDataFactory: true,
          resourceGroup: resourceGroup.name,
          dataFactory: name,
          parentId: rgId,
        }));

        setJobs(prev => [...prev, ...dataFactoryItems]);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch data factories",
        });
      }
    }
  };

  const handleDataFactoryClick = async (dataFactory: ADFJob) => {
    const dfId = dataFactory.id;
    const isExpanded = expandedDataFactories.has(dfId);

    if (isExpanded) {
      setExpandedDataFactories(prev => {
        const newSet = new Set(prev);
        newSet.delete(dfId);
        return newSet;
      });
      setJobs(prev => prev.filter(job => job.parentId !== dfId));
    } else {
      try {
        setExpandedDataFactories(prev => new Set(prev).add(dfId));
        const pipelines = await getADFPipelines(dataFactory.resourceGroup!, dataFactory.dataFactory!);

        const pipelineItems: ADFJob[] = pipelines.map((name: string, index: number) => ({
          id: `pipeline-${dfId}-${index}`,
          name,
          category: 'adf',
          lastRun: '2024-01-15 12:00:00',
          status: 'Running',
          stages: [],
          isPipeline: true,
          resourceGroup: dataFactory.resourceGroup,
          dataFactory: dataFactory.dataFactory,
          pipeline: name,
          parentId: dfId,
        }));

        setJobs(prev => [...prev, ...pipelineItems]);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch pipelines",
        });
      }
    }
  };

  const handleWorkspaceClick = async (workspace: ADFJob) => {
    const wsId = workspace.id;
    const isExpanded = expandedWorkspaces.has(wsId);

    if (isExpanded) {
      setExpandedWorkspaces(prev => {
        const newSet = new Set(prev);
        newSet.delete(wsId);
        return newSet;
      });
      setJobs(prev => prev.filter(job => job.parentId !== wsId));
    } else {
      try {
        setExpandedWorkspaces(prev => new Set(prev).add(wsId));
        const fabricJobs = await getFabricJobs(workspace.name);

        const fabricJobItems: ADFJob[] = fabricJobs.map((job: any, index: number) => ({
          id: `fabric-${wsId}-${index}`,
          name: job.displayName,
          category: 'fabric',
          lastRun: '2024-01-15 12:00:00',
          status: 'Completed',
          stages: [],
          isFabricJob: true,
          workspace: workspace.name,
          fabricJobId: job.id,
          parentId: wsId,
        }));

        setJobs(prev => [...prev, ...fabricJobItems]);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch Fabric jobs",
        });
      }
    }
  };

  // Merged handleJobClick (your Glue logic + teammate's ADF hierarchy + other categories)
  const handleJobClick = (job: ADFJob) => {
    if (job.isResourceGroup) {
      handleResourceGroupClick(job);
    } else if (job.isWorkspace) {  // ADD THIS BLOCK
      handleWorkspaceClick(job);
    } else if (job.isDataFactory) {
      handleDataFactoryClick(job);
    } else if (job.isPipeline) {
      // ADF Pipeline (teammate's work)
      localStorage.setItem("selectedJob", job.name);
      localStorage.setItem("jobType", "adf");
      localStorage.setItem("jobCategory", job.category);
      localStorage.setItem("resourceGroup", job.resourceGroup!);
      localStorage.setItem("dataFactory", job.dataFactory!);
      localStorage.setItem("pipeline", job.pipeline!);

      setSelectedJob({
        ...job,
        stages: job.stages || [],
      });
      setEditJobDialogOpen(true);
      toast({
        title: "Pipeline selected",
        description: `Editing stages for ${job.name}`,
      });
    } else if (job.isFabricJob) {  // ADD THIS BLOCK
      // Fabric job (new)
      localStorage.setItem("selectedJob", job.name);
      localStorage.setItem("jobType", "fabric");
      localStorage.setItem("jobCategory", job.category);
      localStorage.setItem("workspace", job.workspace!);
      localStorage.setItem("fabricJobId", job.fabricJobId!);

      setSelectedJob({
        ...job,
        stages: job.stages || [],
      });
      setEditJobDialogOpen(true);
      toast({
        title: "Fabric Job selected",
        description: `Editing stages for ${job.name}`,
      });
    } else if (job.category === 'glue') {
      // Glue job (your work)
      localStorage.setItem("selectedJob", job.name);
      localStorage.setItem("jobType", "glue");
      localStorage.setItem("jobCategory", job.category);
      localStorage.setItem("glueName", job.name);
      localStorage.setItem("gname", job.name);

      setSelectedJob({
        ...job,
        stages: job.stages || [],
      });
      setEditJobDialogOpen(true);
      toast({
        title: "Glue Job selected",
        description: `Editing stages for ${job.name}`,
      });
    } else {
      // Lambda, Batch, Airflow (unified)
      localStorage.setItem("selectedJob", job.name);
      localStorage.setItem("jobType", job.category);
      localStorage.setItem("jobCategory", job.category);

      setSelectedJob({
        ...job,
        stages: job.stages || [],
      });
      setEditJobDialogOpen(true);
      toast({
        title: `${job.category.toUpperCase()} Job selected`,
        description: `Editing stages for ${job.name}`,
      });
    }
  };

  const handleSaveJobStages = (jobId: string, stages: JobStage[]) => {
    setJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, stages } : job
      )
    );
    setEditJobDialogOpen(false);
    setSelectedJob(null);
    toast({
      title: "Stages Saved",
      description: `Updated stages for job ${selectedJob?.name}`,
    });
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
    // Clear all expansions when collapsing category
    if (expandedCategory === categoryId) {
      setExpandedResourceGroups(new Set());
      setExpandedDataFactories(new Set());
      setExpandedWorkspaces(new Set());  // ADD THIS LINE
      // Remove all child items from jobs
      setJobs(prev => prev.filter(job => !job.parentId));
    }
  };

  const groupedJobs = jobs.reduce((acc, job) => {
    if (!acc[job.category]) {
      acc[job.category] = [];
    }
    acc[job.category].push(job);
    return acc;
  }, {} as Record<string, ADFJob[]>);

  // renderJobCard from teammate's work (unified for all categories)
  const renderJobCard = (job: ADFJob, indentLevel: number = 0) => {
    const getJobIcon = () => {
      if (job.isResourceGroup) return <Folder className="w-4 h-4" />;
      if (job.isDataFactory) return <Factory className="w-4 h-4" />;
      if (job.isPipeline) return <Workflow className="w-4 h-4" />;
      if (job.isWorkspace) return <Cloud className="w-4 h-4" />;     // ADD THIS
      if (job.isFabricJob) return <Zap className="w-4 h-4" />;
      return <Database className="w-4 h-4" />;
    };

    return (
      <Card
        key={job.id}
        className={`cursor-pointer hover:shadow-sm transition-shadow w-full ${indentLevel > 0 ? `ml-${indentLevel * 4}` : ''}`}
        onClick={() => handleJobClick(job)}
        style={{ marginLeft: indentLevel * 16 }}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getJobIcon()}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {job.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: {job.status}
                </p>
                {job.isPipeline && (
                  <p className="text-xs text-muted-foreground">
                    RG: {job.resourceGroup} | DF: {job.dataFactory}
                  </p>
                )}
                {job.isFabricJob && (  // ADD THIS BLOCK
                  <p className="text-xs text-muted-foreground">
                    Workspace: {job.workspace}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(job.isResourceGroup || job.isDataFactory || job.isWorkspace) && (  // ADD || job.isWorkspace
                <div className="text-muted-foreground">
                  {((job.isResourceGroup && expandedResourceGroups.has(job.id)) ||
                    (job.isDataFactory && expandedDataFactories.has(job.id)) ||
                    (job.isWorkspace && expandedWorkspaces.has(job.id))) ? (  // ADD THIS LINE
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </div>
              )}
              <div className={cn(
                "w-2 h-2 rounded-full ml-2",
                job.status === 'Completed' && "bg-green-500",
                job.status === 'Failed' && "bg-red-500",
                job.status === 'Running' && "bg-blue-500",
                job.status === 'Pending' && "bg-yellow-500"
              )} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <nav className="bg-card border-b border-border fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <NavLink to="/dashboard" className="flex items-center space-x-3 pl-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg relative">
                  <Brain className="w-5 h-5 text-primary-foreground absolute top-1 left-1" />
                  <Database className="w-5 h-5 text-primary-foreground absolute bottom-1 right-1" />
                </div>
                <div className="flex flex-col leading-tight">
                  <h1 className="text-xl font-bold text-foreground">Veritas</h1>
                  {user?.full_name && (
                    <span className="text-xs font-semibold text-gray-600">
                      Welcome, <span className="text-primary">{user.full_name}</span>
                    </span>
                  )}
                </div>
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
                        <p className="text-sm font-medium truncate">{user?.username || "Demo User"}</p>
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
        <div
          className={`fixed inset-y-0 left-0 z-40 bg-card border-r border-border transform transition-all duration-300 ease-in-out pt-16 ${sidebarOpen ? 'w-64 translate-x-0' : 'w-16 translate-x-0'
            }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="h-full flex flex-col">
            {sidebarOpen ? (
              <>
                <div className="sticky top-16 bg-card z-10 border-b border-border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="bg-card border border-border shadow-sm h-10 w-10 flex-shrink-0"
                    >
                      <PanelLeft className="w-5 h-5" />
                    </Button>
                  </div>
                  <h2 className="text-lg font-semibold text-foreground flex items-center">
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
                            {groupedJobs[category.id]
                              .filter(job => !job.parentId)
                              .map((job) => (
                                <div key={job.id}>
                                  {renderJobCard(job, 0)}

                                  {job.isResourceGroup && expandedResourceGroups.has(job.id) && (
                                    <div className="space-y-2">
                                      {groupedJobs[category.id]
                                        .filter(df => df.parentId === job.id && df.isDataFactory)
                                        .map((dataFactory) => (
                                          <div key={dataFactory.id}>
                                            {renderJobCard(dataFactory, 1)}

                                            {expandedDataFactories.has(dataFactory.id) && (
                                              <div className="space-y-2">
                                                {groupedJobs[category.id]
                                                  .filter(pipeline => pipeline.parentId === dataFactory.id && pipeline.isPipeline)
                                                  .map((pipeline) => renderJobCard(pipeline, 2))
                                                }
                                              </div>
                                            )}
                                          </div>
                                        ))
                                      }
                                    </div>
                                  )}
                                  {job.isWorkspace && expandedWorkspaces.has(job.id) && (
                                    <div className="space-y-2">
                                      {groupedJobs[category.id]
                                        .filter(fj => fj.parentId === job.id && fj.isFabricJob)
                                        .map((fabricJob) => renderJobCard(fabricJob, 1))
                                      }
                                    </div>
                                  )}
                                </div>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center pt-4">
                <div className="relative flex items-center justify-center h-10 w-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="bg-card border border-border shadow-sm h-10 w-10"
                  >
                    <PanelLeft className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <Outlet />
          {selectedJob && (
            <EnhancedEditJobDialog
              job={selectedJob}
              open={editJobDialogOpen}
              onOpenChange={setEditJobDialogOpen}
              onSave={handleSaveJobStages}
            />
          )}
        </div>
      </div>
    </div>
  );
}