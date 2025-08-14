import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Search, Play, Eye, Plus, Edit, FileText, Calendar as CalendarIcon, X, Link } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import EnhancedEditJobDialog from "@/components/jobs/EnhancedEditJobDialog"
import ViewJobDialog from "@/components/jobs/ViewJobDialog"
import PipelineBuilderDialog from "@/components/jobs/PipelineBuilderDialog"
import PipelineDetailsDialog from "@/components/jobs/PipelineDetailsDialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import type { Job } from "@/components/types/jobs"
import type { Pipeline, Edge } from "@/components/types/pipeline"
import { Node, MarkerType, Position } from "reactflow"

interface JobStage {
  id: string
  name: string
  type: string
  status: string
  description?: string
}

const LOCAL_STORAGE_KEY = 'app_data';

// Category color mapping with dark mode support
const categoryColors: Record<string, string> = {
  'Glue Jobs': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  'Lambda Jobs': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  'Batch Jobs': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  'ADF Jobs': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
};

// Status filter options
const statusFilters = ['All', 'Completed', 'Running', 'Failed'];

const mockJobs: Job[] = [
  {
    id: "1",
    name: "Customer Data ETL",
    category: "Glue Jobs",
    lastRun: "2024-01-15 10:30:00",
    status: "Completed",
    description: "Process customer data from various sources",
    isConnected: true,
    pipelines: [
      {
        id: "pipeline-1",
        name: "Customer Analytics Pipeline",
        jobs: ["1", "2"],
        createdAt: "2024-01-15",
        nodes: [
          {
            id: "1-1631234567890",
            type: "jobNode",
            position: { x: 100, y: 100 },
            data: {
              job: {
                id: "1",
                name: "Customer Data ETL",
                category: "Glue Jobs",
                lastRun: "2024-01-15 10:30:00",
                status: "Completed",
                description: "Process customer data from various sources",
                stages: [
                  {
                    id: "s1",
                    name: "Extract Data",
                    type: "extraction",
                    status: "completed",
                    description: "Extract data from source systems",
                  },
                  {
                    id: "s2",
                    name: "Transform Data",
                    type: "transformation",
                    status: "completed",
                    description: "Apply business rules and transformations",
                  },
                  {
                    id: "s3",
                    name: "Load Data",
                    type: "loading",
                    status: "completed",
                    description: "Load processed data into target system",
                  },
                ],
              },
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          },
          {
            id: "2-1631234567891",
            type: "jobNode",
            position: { x: 400, y: 100 },
            data: {
              job: {
                id: "2",
                name: "Sales Analytics",
                category: "Glue Jobs",
                lastRun: "2024-01-15 09:45:00",
                status: "Failed",
                description: "Generate sales reports and analytics",
                stages: [
                  {
                    id: "s4",
                    name: "Data Validation",
                    type: "validation",
                    status: "completed",
                    description: "Validate incoming data quality",
                  },
                  {
                    id: "s5",
                    name: "Analytics Processing",
                    type: "processing",
                    status: "failed",
                    description: "Process analytics calculations",
                  },
                ],
              },
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          },
        ],
        edges: [
          {
            id: "e1-2",
            source: "1-1631234567890",
            target: "2-1631234567891",
            type: "smoothstep",
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
            style: {
              strokeWidth: 2,
              stroke: "#6366f1",
            },
          },
        ],
      },
    ],
    stages: [
      {
        id: "s1",
        name: "Extract Data",
        type: "extraction",
        status: "completed",
        description: "Extract data from source systems",
      },
      {
        id: "s2",
        name: "Transform Data",
        type: "transformation",
        status: "completed",
        description: "Apply business rules and transformations",
      },
      {
        id: "s3",
        name: "Load Data",
        type: "loading",
        status: "completed",
        description: "Load processed data into target system",
      },
    ],
  },
  {
    id: "2",
    name: "Sales Analytics",
    category: "Glue Jobs",
    lastRun: "2024-01-15 09:45:00",
    status: "Failed",
    description: "Generate sales reports and analytics",
    isConnected: true,
    pipelines: [
      {
        id: "pipeline-1",
        name: "Customer Analytics Pipeline",
        jobs: ["1", "2"],
        createdAt: "2024-01-15",
        nodes: [
          {
            id: "1-1631234567890",
            type: "jobNode",
            position: { x: 100, y: 100 },
            data: {
              job: {
                id: "1",
                name: "Customer Data ETL",
                category: "Glue Jobs",
                lastRun: "2024-01-15 10:30:00",
                status: "Completed",
                description: "Process customer data from various sources",
              },
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          },
          {
            id: "2-1631234567891",
            type: "jobNode",
            position: { x: 400, y: 100 },
            data: {
              job: {
                id: "2",
                name: "Sales Analytics",
                category: "Glue Jobs",
                lastRun: "2024-01-15 09:45:00",
                status: "Failed",
                description: "Generate sales reports and analytics",
              },
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          },
        ],
        edges: [
          {
            id: "e1-2",
            source: "1-1631234567890",
            target: "2-1631234567891",
            type: "smoothstep",
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
            style: {
              strokeWidth: 2,
              stroke: "#6366f1",
            },
          },
        ],
      },
    ],
    stages: [
      {
        id: "s4",
        name: "Data Validation",
        type: "validation",
        status: "completed",
        description: "Validate incoming data quality",
      },
      {
        id: "s5",
        name: "Analytics Processing",
        type: "processing",
        status: "failed",
        description: "Process analytics calculations",
      },
    ],
  },
  {
    id: "3",
    name: "Data Validation",
    category: "Lambda Jobs",
    lastRun: "2024-01-15 11:15:00",
    status: "Completed",
    description: "Validate data quality and consistency",
    stages: [
      {
        id: "s6",
        name: "Schema Validation",
        type: "validation",
        status: "completed",
        description: "Validate data schema compliance",
      },
    ],
  },
  {
    id: "4",
    name: "Report Generation",
    category: "Batch Jobs",
    lastRun: "2024-01-15 08:20:00",
    status: "Running",
    description: "Generate monthly business reports",
    isConnected: true,
    pipelines: [
      {
        id: "pipeline-2",
        name: "Reporting Pipeline",
        jobs: ["4"],
        createdAt: "2024-01-14",
        nodes: [
          {
            id: "4-1631234567892",
            type: "jobNode",
            position: { x: 100, y: 100 },
            data: {
              job: {
                id: "4",
                name: "Report Generation",
                category: "Batch Jobs",
                lastRun: "2024-01-15 08:20:00",
                status: "Running",
                description: "Generate monthly business reports",
              },
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          },
        ],
        edges: [],
      },
    ],
    stages: [
      {
        id: "s7",
        name: "Data Collection",
        type: "collection",
        status: "completed",
        description: "Collect data from various sources",
      },
      {
        id: "s8",
        name: "Report Building",
        type: "processing",
        status: "running",
        description: "Generate formatted reports",
      },
    ],
  },
  {
    id: "5",
    name: "Data Migration",
    category: "ADF Jobs",
    lastRun: "2024-01-15 12:00:00",
    status: "Completed",
    description: "Migrate data between systems",
    stages: [
      {
        id: "s9",
        name: "Source Connection",
        type: "connection",
        status: "completed",
        description: "Connect to source database",
      },
      {
        id: "s10",
        name: "Data Transfer",
        type: "transfer",
        status: "completed",
        description: "Transfer data to target system",
      },
      {
        id: "s11",
        name: "Target Validation",
        type: "validation",
        status: "completed",
        description: "Validate transferred data",
      },
    ],
  },
]

export default function Jobs() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [jobs, setJobs] = useState<Job[]>(mockJobs)
  const [pipelines, setPipelines] = useState<Pipeline[]>([
    {
      id: "pipeline-1",
      name: "Customer Analytics Pipeline",
      jobs: ["1", "2"],
      createdAt: "2024-01-15",
      nodes: [
        {
          id: "1-1631234567890",
          type: "jobNode",
          position: { x: 100, y: 100 },
          data: { job: mockJobs[0] },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        },
        {
          id: "2-1631234567891",
          type: "jobNode",
          position: { x: 400, y: 100 },
          data: { job: mockJobs[1] },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        },
      ],
      edges: [
        {
          id: "e1-2",
          source: "1-1631234567890",
          target: "2-1631234567891",
          type: "smoothstep",
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: {
            strokeWidth: 2,
            stroke: "#6366f1",
          },
        },
      ],
    },
    {
      id: "pipeline-2",
      name: "Reporting Pipeline",
      jobs: ["4"],
      createdAt: "2024-01-14",
      nodes: [
        {
          id: "4-1631234567892",
          type: "jobNode",
          position: { x: 100, y: 100 },
          data: { job: mockJobs[3] },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        },
      ],
      edges: [],
    },
  ])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [viewingJob, setViewingJob] = useState<Job | null>(null)
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(mockJobs)
  const [pipelineBuilderOpen, setPipelineBuilderOpen] = useState(false)
  const [selectedJobForPipeline, setSelectedJobForPipeline] = useState<Job | null>(null)
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)
  const [selectedJobForPipelines, setSelectedJobForPipelines] = useState<Job | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('All')

  // Load from localStorage on mount
  useEffect(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      const { jobs: storedJobs, pipelines: storedPipelines } = JSON.parse(storedData);
      setJobs(storedJobs || mockJobs);
      setPipelines(storedPipelines || []);
    } else {
      setJobs(mockJobs);
    }
    filterJobs();
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ jobs, pipelines }));
    filterJobs();
  }, [jobs, pipelines, searchTerm, startDate, endDate, statusFilter]);

  const filterJobs = () => {
    let filtered = jobs.filter(job =>
      job.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (startDate) {
      filtered = filtered.filter(job => new Date(job.lastRun) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(job => new Date(job.lastRun) <= endDate);
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    setFilteredJobs(filtered);
  };

  const clearDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500 text-white dark:bg-green-600 dark:text-white';
      case 'running': return 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white';
      case 'failed': return 'bg-red-500 text-white dark:bg-red-600 dark:text-white';
      default: return 'bg-gray-500 text-white dark:bg-gray-600 dark:text-white';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy - h:mm a");
  };

  const handleRunJob = (job: Job) => {
    toast({ title: "Job Started", description: `${job.name} is now running.` });
  };

  const handleViewJob = (job: Job) => {
    setViewingJob(job);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
  };

  const handleCreateJob = () => {
    navigate("/dashboard/upload");
  };

  const handleSaveJobStages = (jobId: string, stages: JobStage[]) => {
    setJobs(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, stages } : j));
    toast({ title: "Stages Saved", description: "Job stages have been updated." });
    setEditingJob(null);
  };

  const handleOpenPipelineBuilder = () => {
    setSelectedJobForPipeline(null);
    setEditingPipeline(null);
    setPipelineBuilderOpen(true);
  };

  const handleCreatePipelineWithJob = (job: Job) => {
    setSelectedJobForPipeline(job);
    setEditingPipeline(null);
    setPipelineBuilderOpen(true);
  };

  const handleEditPipeline = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline);
    setSelectedJobForPipeline(null);
    setPipelineBuilderOpen(true);
  };

  const handleSavePipeline = (pipelineData: { name: string; jobs: string[]; nodes: Node[]; edges: Edge[] }) => {
    let newPipelines;
    if (editingPipeline) {
      const updatedPipeline = {
        ...editingPipeline,
        name: pipelineData.name,
        jobs: pipelineData.jobs,
        nodes: pipelineData.nodes,
        edges: pipelineData.edges,
      };
      newPipelines = pipelines.map(p => p.id === editingPipeline.id ? updatedPipeline : p);
    } else {
      const newPipeline = {
        id: `pipeline-${Date.now()}`,
        name: pipelineData.name,
        jobs: pipelineData.jobs,
        createdAt: new Date().toISOString().split('T')[0],
        nodes: pipelineData.nodes,
        edges: pipelineData.edges,
      };
      newPipelines = [...pipelines, newPipeline];
    }

    setPipelines(newPipelines);

    setJobs(prevJobs => prevJobs.map(job => ({
      ...job,
      pipelines: newPipelines.filter(p => p.jobs.includes(job.id)),
      isConnected: newPipelines.some(p => p.jobs.includes(job.id)),
    })));

    setPipelineBuilderOpen(false);
    toast({ title: "Pipeline Saved", description: "Pipeline has been created/updated." });
  };

  const handleDeletePipeline = (pipelineId: string) => {
    setPipelines(prev => prev.filter(p => p.id !== pipelineId));

    setJobs(prevJobs => prevJobs.map(job => ({
      ...job,
      pipelines: job.pipelines?.filter(p => p.id !== pipelineId) || [],
      isConnected: job.pipelines?.filter(p => p.id !== pipelineId).length > 0,
    })));

    toast({ title: "Pipeline Deleted", description: "Pipeline has been removed." });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6">
        <div className="mb-6 mt-14 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              All Jobs ({filteredJobs.length})
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              View and manage your jobs and pipelines
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateJob} className="flex items-center gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Create Job
            </Button>
            {/* <Button onClick={handleOpenPipelineBuilder} className="flex items-center gap-2 bg-primary hover:bg-primary/90">
              <Link className="w-4 h-4" /> Create Pipeline
            </Button> */}
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            {/* Search and Filter Bar */}
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-background dark:bg-gray-800"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "MMM dd, yyyy") : "Select a Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                                          </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  {(startDate || endDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearDateFilter}
                      className="h-10 px-3"
                      title="Clear date filter"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {statusFilters.map(status => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        "text-sm rounded-full",
                        statusFilter === status
                          ? "bg-primary text-white dark:bg-blue-500 dark:text-white"
                          : "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                      )}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-muted/20 border-b text-sm font-medium text-muted-foreground">
              <div>Job Name</div>
              <div>Category</div>
              <div>Pipeline</div>
              <div>Last Run</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{job.name}</span>
                    {job.isConnected && (
                      <span title={`Part of ${job.pipelines?.map((p) => p.name).join(", ")}`}>
                        <Link className="w-4 h-4 text-blue-500" />
                      </span>
                    )}
                  </div>
                  <div>
                    <Badge className={cn(
                      "text-xs",
                      categoryColors[job.category] || 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-white'
                    )}>
                      {job.category}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">
                    {job.pipelines && job.pipelines.length > 0 ? (
                      <Badge
                        variant="secondary"
                        className="text-xs cursor-pointer bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500"
                        onClick={() => setSelectedJobForPipelines(job)}
                      >
                        {job.pipelines.length}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">0</span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm">{formatDate(job.lastRun)}</div>
                  <div>
                    <Badge className={cn(
                      "text-xs px-2 py-1",
                      getStatusColor(job.status)
                    )}>
                      {job.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRunJob(job)}
                      className="w-8 h-8 rounded-full p-0 bg-primary hover:bg-primary/90"
                      title="Run Job"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewJob(job)}
                      className="w-8 h-8 rounded-full p-0"
                      title={job.isConnected ? "View Pipeline" : "View Reports"}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditJob(job)}
                      className="w-8 h-8 rounded-full p-0"
                      title="Edit Job Stages"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCreatePipelineWithJob(job)}
                      className="w-8 h-8 rounded-full p-0"
                      title="Create Pipeline with this Job"
                    >
                      <Link className="w-4 h-4" />
                    </Button>
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewJob(job)}
                      className="w-8 h-8 rounded-full p-0"
                      title="View Details"
                    >
                      <FileText className="w-4 h-4" />
                    </Button> */}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <EnhancedEditJobDialog
          job={editingJob}
          open={!!editingJob}
          onOpenChange={(open) => !open && setEditingJob(null)}
          onSave={handleSaveJobStages}
        />
        <ViewJobDialog job={viewingJob} open={!!viewingJob} onOpenChange={(open) => !open && setViewingJob(null)} />
        <PipelineBuilderDialog
          open={pipelineBuilderOpen}
          onOpenChange={setPipelineBuilderOpen}
          jobs={jobs}
          onSave={handleSavePipeline}
          initialJob={selectedJobForPipeline}
          editingPipeline={editingPipeline}
          pipelines={pipelines}
        />
        {selectedJobForPipelines && (
          <PipelineDetailsDialog
            job={selectedJobForPipelines}
            pipelines={pipelines.filter(p => p.jobs.includes(selectedJobForPipelines.id))}
            open={!!selectedJobForPipelines}
            onOpenChange={() => setSelectedJobForPipelines(null)}
            onEditPipeline={handleEditPipeline}
            onDeletePipeline={handleDeletePipeline}
          />
        )}
      </div>
    </div>
  )
}