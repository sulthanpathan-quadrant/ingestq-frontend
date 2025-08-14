import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, Play, Eye, Edit, Trash, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PipelineBuilderDialog from "@/components/jobs/PipelineBuilderDialog";
import PipelineDetailsDialog from "@/components/jobs/PipelineDetailsDialog";
import { cn } from "@/lib/utils";
import type { Job } from "@/components/types/jobs";
import type { Pipeline, Edge } from "@/components/types/pipeline";
import { Node, Position, MarkerType } from "reactflow";

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
    pipelines: [],
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
    pipelines: [],
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
    isConnected: false,
    pipelines: [],
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
    pipelines: [],
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
    isConnected: false,
    pipelines: [],
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
];

export default function Pipelines() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPipelines, setFilteredPipelines] = useState<Pipeline[]>([]);
  const [pipelineBuilderOpen, setPipelineBuilderOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [viewingPipeline, setViewingPipeline] = useState<Pipeline | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState<Pipeline | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      const { jobs: storedJobs, pipelines: storedPipelines } = JSON.parse(storedData);
      setJobs(storedJobs || mockJobs);
      setPipelines(storedPipelines || [
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
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { strokeWidth: 2, stroke: "#6366f1" },
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
      ]);
    } else {
      setJobs(mockJobs);
      setPipelines([
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
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { strokeWidth: 2, stroke: "#6366f1" },
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
      ]);
    }
    filterPipelines();
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ jobs, pipelines }));
    filterPipelines();
  }, [pipelines, searchTerm]);

  const filterPipelines = () => {
    let filtered = pipelines.filter(pipeline =>
      pipeline.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPipelines(filtered);
  };

  const getPipelineStatus = (pipeline: Pipeline) => {
    const pipelineJobs = jobs.filter(j => pipeline.jobs.includes(j.id));
    const statuses = pipelineJobs.map(j => j.status.toLowerCase());
    if (statuses.includes('failed')) return 'Failed';
    if (statuses.includes('running')) return 'Running';
    if (statuses.every(s => s === 'completed')) return 'Completed';
    return 'Pending';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500 text-white dark:bg-green-600 dark:text-white';
      case 'running': return 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white';
      case 'failed': return 'bg-red-500 text-white dark:bg-red-600 dark:text-white';
      default: return 'bg-gray-500 text-white dark:bg-gray-600 dark:text-white';
    }
  };

  const handleOpenPipelineBuilder = () => {
    setEditingPipeline(null);
    setPipelineBuilderOpen(true);
  };

  const handleEditPipeline = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline);
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

  const handleDeletePipeline = (pipeline: Pipeline) => {
    setPipelineToDelete(pipeline);
    setDeleteConfirmOpen(true);
  };

  const confirmDeletePipeline = () => {
    if (!pipelineToDelete) return;

    setPipelines(prev => prev.filter(p => p.id !== pipelineToDelete.id));

    setJobs(prevJobs => prevJobs.map(job => ({
      ...job,
      pipelines: job.pipelines?.filter(p => p.id !== pipelineToDelete.id) || [],
      isConnected: job.pipelines?.filter(p => p.id !== pipelineToDelete.id).length > 0,
    })));

    toast({ title: "Pipeline Deleted", description: `${pipelineToDelete.name} has been removed.` });
    setDeleteConfirmOpen(false);
    setPipelineToDelete(null);
  };

  const handleRunPipeline = (pipeline: Pipeline) => {
    toast({ title: "Pipeline Started", description: `${pipeline.name} is now running.` });
  };

  const handleViewPipeline = (pipeline: Pipeline) => {
    setViewingPipeline(pipeline);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6">
        <div className="mb-6 mt-14 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              All Pipelines ({filteredPipelines.length})
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              View and manage your pipelines
            </p>
          </div>
          <Button onClick={handleOpenPipelineBuilder} className="flex items-center gap-2 bg-primary hover:bg-primary/90">
            <Link className="h-4 w-4" /> Create Pipeline
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            {/* Search Bar */}
            <div className="p-4 border-b bg-muted/30">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pipelines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background dark:bg-gray-800"
                />
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-muted/20 border-b text-sm font-medium text-muted-foreground">
              <div>Pipeline Name</div>
              <div>Jobs</div>
              <div>Created At</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y">
              {filteredPipelines.map((pipeline) => (
                <div
                  key={pipeline.id}
                  className="grid grid-cols-5 gap-4 px-6 py-4 items-center hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-foreground">{pipeline.name}</div>
                  <div>
                    <Badge
                      className="text-xs bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500"
                      onClick={() => handleViewPipeline(pipeline)}
                    >
                      {pipeline.jobs.length}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground text-sm">{pipeline.createdAt}</div>
                  <div>
                    <Badge className={cn(
                      "text-xs px-2 py-1",
                      getStatusColor(getPipelineStatus(pipeline))
                    )}>
                      {getPipelineStatus(pipeline)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRunPipeline(pipeline)}
                      className="w-8 h-8 rounded-full p-0 bg-primary hover:bg-primary/90"
                      title="Run Pipeline"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewPipeline(pipeline)}
                      className="w-8 h-8 rounded-full p-0"
                      title="View Pipeline Jobs"
                    >
                      <Eye className="w-4 h-4" />
                    </Button> */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPipeline(pipeline)}
                      className="w-8 h-8 rounded-full p-0"
                      title="Edit Pipeline"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePipeline(pipeline)}
                      className="w-8 h-8 rounded-full p-0 text-red-500 hover:text-red-600"
                      title="Delete Pipeline"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Jobs Dialog */}
        {viewingPipeline && (
          <Dialog open={!!viewingPipeline} onOpenChange={() => setViewingPipeline(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{viewingPipeline.name} - Jobs</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {viewingPipeline.jobs.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No jobs in this pipeline</p>
                  </div>
                ) : (
                  jobs
                    .filter(job => viewingPipeline.jobs.includes(job.id))
                    .map((job, index) => (
                      <Card key={job.id} className="shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{job.name}</h4>
                              <p className="text-xs text-muted-foreground">{job.category}</p>
                              <p className="text-xs text-muted-foreground">Status: {job.status}</p>
                            </div>
                            <Badge className={cn(
                              "text-xs",
                              getStatusColor(job.status)
                            )}>
                              {job.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmOpen && pipelineToDelete && (
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Delete Pipeline</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the pipeline "{pipelineToDelete.name}"? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeletePipeline}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <PipelineBuilderDialog
          open={pipelineBuilderOpen}
          onOpenChange={setPipelineBuilderOpen}
          jobs={jobs}
          onSave={handleSavePipeline}
          initialJob={null}
          editingPipeline={editingPipeline}
          pipelines={pipelines}
        />
      </div>
    </div>
  );
}