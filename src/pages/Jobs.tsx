import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Search, Play, Eye, Plus, Edit, FileText, CalendarIcon, X, Network, Link } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import EnhancedEditJobDialog from "@/components/jobs/EnhancedEditJobDialog"
import ViewJobDialog from "@/components/jobs/ViewJobDialog"
import PipelineBuilderDialog from "@/components/jobs/PipelineBuilderDialog"
import PipelineDetailsDialog from "@/components/jobs/PipelineDetailsDialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
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
    filterJobs(); // Initial filter
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ jobs, pipelines }));
    filterJobs();
  }, [jobs, pipelines, searchTerm, startDate, endDate]);

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

    setFilteredJobs(filtered);
  };

  const clearDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
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

    // Update jobs with the new/updated pipeline associations
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

    // Update jobs to remove the deleted pipeline
    setJobs(prevJobs => prevJobs.map(job => ({
      ...job,
      pipelines: job.pipelines?.filter(p => p.id !== pipelineId) || [],
      isConnected: job.pipelines?.filter(p => p.id !== pipelineId).length > 0,
    })));

    toast({ title: "Pipeline Deleted", description: "Pipeline has been removed." });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 mt-14 space-y-4 p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
          <div className="flex gap-2">
            <Button onClick={handleCreateJob} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create Job
            </Button>
            <Button onClick={handleOpenPipelineBuilder} className="flex items-center gap-2">
              <Link className="w-4 h-4"  /> Create Pipeline
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-[280px] justify-between",
                        (!startDate || !endDate) && "text-muted-foreground"
                      )}
                    >
                      {startDate && endDate
                        ? `${format(startDate, "PPP")} - ${format(endDate, "PPP")}`
                        : "Filter by last run date"}
                      <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </div>
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
            </div>

            <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-muted/20 border-b text-sm font-medium text-muted-foreground">
              <div>Job Name</div>
              <div>Category</div>
              <div>Pipeline</div>
              <div>Last Run</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

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
                  <div className="text-muted-foreground">{job.category}</div>
                  <div className="text-muted-foreground">
                    {job.pipelines && job.pipelines.length > 0 ? (
                      <Badge
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-secondary/80"
                        onClick={() => setSelectedJobForPipelines(job)}
                      >
                        {job.pipelines.length}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">0</span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm">{job.lastRun}</div>
                  <div>
                    <Badge className={`${getStatusColor(job.status)} text-white text-xs px-2 py-1`}>{job.status}</Badge>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewJob(job)}
                      className="w-8 h-8 rounded-full p-0"
                      title="View Details"
                    >
                      <FileText className="w-4" />
                    </Button>
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
