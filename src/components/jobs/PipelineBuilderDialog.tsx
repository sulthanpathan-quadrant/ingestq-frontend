import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X, Grid3X3, Move, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactFlow, {
  Node,
  Edge as ReactFlowEdge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  Position,
  ReactFlowProvider,
  MarkerType,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import JobNode from "./JobNode";
import JobConfigDialog from "./JobConfigDialog";
import JobStagesDialog from "./JobStagesDialog";
import DraggableJobList from "./DraggableJobList";
import StageCanvasDialog from "./StageCanvasDialog";
import { getJobs, createPipeline, editPipeline, getPipelineJobs } from "@/lib/api";

const nodeTypes: NodeTypes = {
  jobNode: JobNode,
};

const GRID_SIZE = 20;

export default function PipelineBuilderDialog({
  open,
  onOpenChange,
  onSave,
  initialJob = null,
  editingPipeline = null,
  pipelines = [],
}) {
  const { toast } = useToast();
  const [pipelineName, setPipelineName] = useState("");
  const [jobs, setJobs] = useState([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [configJob, setConfigJob] = useState<{ node: Node; job: any } | null>(null);
  const [editingJobStages, setEditingJobStages] = useState<{ node: Node; job: any } | null>(null);
  const [stageCanvasJob, setStageCanvasJob] = useState<{ node: Node; job: any } | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const isInitialMount = useRef(true);
  const [isSaving, setIsSaving] = useState(false);
  // New state for job search
  const [searchTerm, setSearchTerm] = useState("");


  // Memoize filtered jobs list
  const filteredJobs = useMemo(() => {
    if (!searchTerm) return jobs;
    return jobs.filter((job: any) =>
      job.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [jobs, searchTerm]);


  const snapToGridHelper = useCallback(
    (position) => (snapToGrid ? { x: Math.round(position.x / GRID_SIZE) * GRID_SIZE, y: Math.round(position.y / GRID_SIZE) * GRID_SIZE } : position),
    [snapToGrid],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        id: `${params.source}-${params.target}-${Date.now()}`,
        source: params.source!,
        target: params.target!,
        type: "smoothstep",
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: { strokeWidth: 2, stroke: "#6366f1" },
      };
      setEdges((eds) => addEdge(edge as ReactFlowEdge, eds));
      console.log("Edge added:", edge);
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView();
        }
      }, 100);
    },
    [setEdges, reactFlowInstance],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!reactFlowWrapper.current || !reactFlowInstance) {
        console.error("ReactFlow wrapper or instance not available");
        toast({ title: "Error", description: "Canvas not initialized. Please try again.", variant: "destructive" });
        return;
      }
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const jobData = event.dataTransfer.getData("application/reactflow");
      if (!jobData) {
        console.error("No job data found in drag event");
        toast({ title: "Error", description: "No job data provided.", variant: "destructive" });
        return;
      }
      let job;
      try {
        job = JSON.parse(jobData);
      } catch (error) {
        console.error("Failed to parse job data:", error);
        toast({ title: "Error", description: "Invalid job data format.", variant: "destructive" });
        return;
      }
      console.log("Dropped Job:", job);
      if (!job.id || !job.name) {
        console.error("Job data missing id or name:", job);
        toast({ title: "Error", description: "Job data is incomplete.", variant: "destructive" });
        return;
      }
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const snappedPosition = snapToGridHelper(position);
      const newNode = {
        id: `${job.id}-${Date.now()}`,
        type: "jobNode",
        position: snappedPosition,
        data: {
          job: {
            ...job,
            name: job.name,
            parameters: job.parameters || {},
            inputTypes: job.inputTypes || ["data"],
            outputTypes: job.outputTypes || ["data"],
            stages: job.stages || [],
          },
          onEdit: (nodeId) => {
            const node = nodes.find((n) => n.id === nodeId);
            if (node) {
              console.log("Opening config for node:", nodeId);
              setConfigJob({ node, job: node.data.job });
            }
          },
          onEditStages: (nodeId) => {
            const node = nodes.find((n) => n.id === nodeId);
            if (node) {
              console.log("Opening stages for node:", nodeId);
              setStageCanvasJob({ node, job: node.data.job });
            }
          },
          onDelete: (nodeId) => {
            console.log("Deleting node:", nodeId);
            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
            setTimeout(() => {
              if (reactFlowInstance) {
                reactFlowInstance.fitView();
              }
            }, 100);
          },
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
      setNodes((nds) => {
        const updatedNodes = nds.concat(newNode);
        console.log("Updated nodes after drop:", updatedNodes);
        return updatedNodes;
      });
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView();
        }
      }, 100);
    },
    [reactFlowInstance, snapToGridHelper, nodes, setNodes, setEdges, toast],
  );

  const addJobToCanvas = useCallback(
    (job) => {
      if (!job.id || !job.name) {
        console.error("Invalid job data for addJobToCanvas:", job);
        toast({ title: "Error", description: "Invalid job data for adding to canvas.", variant: "destructive" });
        return;
      }
      console.log("Adding job to canvas:", job);
      const existingPositions = nodes.map((n) => n.position);
      let newPosition = { x: 100, y: 100 };
      if (existingPositions.length > 0) {
        newPosition = { x: Math.max(...existingPositions.map((p) => p.x)) + 300, y: 100 };
      }
      const snappedPosition = snapToGridHelper(newPosition);
      const newNode = {
        id: `${job.id}-${Date.now()}`,
        type: "jobNode",
        position: snappedPosition,
        data: {
          job: {
            ...job,
            name: job.name,
            parameters: job.parameters || {},
            inputTypes: job.inputTypes || ["data"],
            outputTypes: job.outputTypes || ["data"],
            stages: job.stages || [],
          },
          onEdit: (nodeId) => {
            const node = nodes.find((n) => n.id === nodeId);
            if (node) {
              console.log("Opening config for node:", nodeId);
              setConfigJob({ node, job: node.data.job });
            }
          },
          onEditStages: (nodeId) => {
            const node = nodes.find((n) => n.id === nodeId);
            if (node) {
              console.log("Opening stages for node:", nodeId);
              setStageCanvasJob({ node, job: node.data.job });
            }
          },
          onDelete: (nodeId) => {
            console.log("Deleting node:", nodeId);
            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
            setTimeout(() => {
              if (reactFlowInstance) {
                reactFlowInstance.fitView();
              }
            }, 100);
          },
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
      setNodes((nds) => {
        const updatedNodes = nds.concat(newNode);
        console.log("Updated nodes after addJobToCanvas:", updatedNodes);
        return updatedNodes;
      });
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView();
        }
      }, 100);
    },
    [nodes, snapToGridHelper, setNodes, setEdges, reactFlowInstance, toast],
  );

  const handleSaveJobConfig = useCallback(
    (updatedJobData) => {
      if (!configJob) {
        console.error("No configJob set for saving configuration");
        return;
      }
      console.log("Saving job config:", updatedJobData);
      setNodes((nds) =>
        nds.map((node) =>
          node.id === configJob.node.id
            ? { ...node, data: { ...node.data, job: { ...node.data.job, ...updatedJobData } } }
            : node,
        ),
      );
      setConfigJob(null);
      toast({ title: "Job Configuration Saved", description: "Job configuration has been updated successfully" });
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView();
        }
      }, 100);
    },
    [configJob, setNodes, toast, reactFlowInstance],
  );

  const handleSaveJobStages = useCallback(
    (updatedStages) => {
      if (!editingJobStages) {
        console.error("No editingJobStages set for saving stages");
        return;
      }
      console.log("Saving job stages:", updatedStages);
      setNodes((nds) =>
        nds.map((node) =>
          node.id === editingJobStages.node.id
            ? { ...node, data: { ...node.data, job: { ...node.data.job, stages: updatedStages } } }
            : node,
        ),
      );
      setEditingJobStages(null);
      toast({ title: "Job Stages Updated", description: "Job stages have been updated successfully" });
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView();
        }
      }, 100);
    },
    [editingJobStages, setNodes, toast, reactFlowInstance],
  );

  const handleSaveStageCanvas = useCallback(
    (updatedStages) => {
      if (!stageCanvasJob) {
        console.error("No stageCanvasJob set for saving stage canvas");
        return;
      }
      console.log("Saving stage canvas:", updatedStages);
      setNodes((nds) =>
        nds.map((node) =>
          node.id === stageCanvasJob.node.id
            ? { ...node, data: { ...node.data, job: { ...node.data.job, stages: updatedStages } } }
            : node,
        ),
      );
      setStageCanvasJob(null);
      toast({ title: "Stage Workflow Updated", description: "Stage workflow has been updated successfully" });
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView();
        }
      }, 100);
    },
    [stageCanvasJob, setNodes, toast, reactFlowInstance],
  );


  const handleSavePipeline = useCallback(async () => {
    if (isSaving) return; // Guard against duplicates
    if (!pipelineName.trim()) {
      toast({ title: "Pipeline Name Required", description: "Please enter a name for your pipeline", variant: "destructive" });
      return;
    }
    if (nodes.length === 0) {
      toast({ title: "No Jobs Added", description: "Please add at least one job to your pipeline", variant: "destructive" });
      return;
    }
    const jobIds = nodes.map((node) => node.data.job.id);
    console.log("Saving pipeline with job IDs:", jobIds, "and name:", pipelineName); // Keep for debugging
    setIsSaving(true);
    try {
      // Calling onSave prop which is implemented in Pipelines.tsx
      onSave({ name: pipelineName, jobs: jobIds, nodes, edges });

      // Toast should be handled by the parent component after successful API call, 
      // but leaving a generic success toast here for immediate feedback before closing.
      toast({ title: editingPipeline ? "Pipeline Updated" : "Pipeline Created", description: `Pipeline "${pipelineName}" data prepared successfully.` });

      onOpenChange(false);
    } catch (error) {
      // Note: The main create/edit error handling is in the parent. This is a fallback/local error.
      toast({ title: "Error", description: "Failed to prepare pipeline data for saving. Check console for details.", variant: "destructive" });
      console.error("Error preparing pipeline data:", error);
    } finally {
      setIsSaving(false);
    }
  }, [pipelineName, nodes, edges, editingPipeline, onSave, onOpenChange, toast, isSaving]);
  const clearCanvas = useCallback(() => {
    console.log("Clearing canvas");
    setNodes([]);
    setEdges([]);
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView();
      }
    }, 100);
  }, [setNodes, setEdges, reactFlowInstance]);

  useEffect(() => {
    let isMounted = true;
    const fetchJobs = async () => {
      try {
        const result = await getJobs();
        console.log("Fetched Jobs Response:", result);
        if (isMounted) {
          const transformedJobs = result.jobs.map((job: any) => ({
            id: job.jobId,
            name: job.jobName || `Job ${job.jobId}`,
            category: job.triggerType || "Unknown",
            lastRun: job.LastRun || "N/A",
            status: job.Status || "Unknown",
            description: job.datasource || "",
            stages: job.steps
              ? Object.entries(job.steps).map(([name, status]) => ({
                id: `${job.jobId}-${name}`,
                name,
                type: "step",
                status,
              }))
              : [],
            isConnected: false,
            parameters: job.parameters || {},
            inputTypes: job.inputTypes || ["data"],
            outputTypes: job.outputTypes || ["data"],
          }));
          console.log("Transformed Jobs:", transformedJobs);
          setJobs(transformedJobs);
        }
      } catch (error) {
        if (isMounted) {
          toast({ title: "Error", description: "Failed to fetch jobs" });
          console.error("Error fetching jobs:", error);
        }
      }
    };

    const fetchPipelineJobs = async () => {
      if (editingPipeline) {
        try {
          const result = await getPipelineJobs(editingPipeline.pipelineId);
          console.log("Fetched Pipeline Jobs Response:", result);
          if (isMounted && result.success) {
            const pipelineJobs = result.jobs.map((job: any) => ({
              id: job.jobId,
              name: job.jobName || `Job ${job.jobId}`,
              category: job.triggerType || "Unknown",
              lastRun: job.LastRun || "N/A",
              status: job.Status || "Unknown",
              description: job.datasource || "",
              stages: job.steps
                ? Object.entries(job.steps).map(([name, status]) => ({
                  id: `${job.jobId}-${name}`,
                  name,
                  type: "step",
                  status,
                }))
                : [],
              isConnected: false,
              parameters: job.parameters || {},
              inputTypes: job.inputTypes || ["data"],
              outputTypes: job.outputTypes || ["data"],
            }));

            const newNodes = pipelineJobs.map((job, index) => {
              const position = editingPipeline.nodes[index]?.position || {
                x: 100 + index * 300,
                y: 100,
              };
              const snappedPosition = snapToGridHelper(position);
              return {
                id: `${job.id}-${Date.now() + index}`,
                type: "jobNode",
                position: snappedPosition,
                data: {
                  job: {
                    ...job,
                    name: job.name,
                    parameters: job.parameters || {},
                    inputTypes: job.inputTypes || ["data"],
                    outputTypes: job.outputTypes || ["data"],
                    stages: job.stages || [],
                  },
                  onEdit: (nodeId) => {
                    const node = nodes.find((n) => n.id === nodeId);
                    if (node) {
                      console.log("Opening config for node:", nodeId);
                      setConfigJob({ node, job: node.data.job });
                    }
                  },
                  onEditStages: (nodeId) => {
                    const node = nodes.find((n) => n.id === nodeId);
                    if (node) {
                      console.log("Opening stages for node:", nodeId);
                      setStageCanvasJob({ node, job: node.data.job });
                    }
                  },
                  onDelete: (nodeId) => {
                    console.log("Deleting node:", nodeId);
                    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
                    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
                    setTimeout(() => {
                      if (reactFlowInstance) {
                        reactFlowInstance.fitView();
                      }
                    }, 100);
                  },
                },
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
              };
            });

            console.log("Setting nodes for editing pipeline:", newNodes);
            setNodes(newNodes);
            setEdges(editingPipeline.edges || []);
            setPipelineName(editingPipeline.pipelineName || "");
          } else if (isMounted) {
            toast({ title: "Error", description: result.message || "Failed to fetch pipeline jobs" });
          }
        } catch (error) {
          if (isMounted) {
            toast({ title: "Error", description: "Failed to fetch pipeline jobs" });
            console.error("Error fetching pipeline jobs:", error);
          }
        }
      }
    };

    if (open && isInitialMount.current) {
      console.log("Dialog opened, fetching jobs...");
      fetchJobs();
      if (editingPipeline) {
        console.log("Editing pipeline, fetching pipeline jobs...");
        fetchPipelineJobs();
      }
      isInitialMount.current = false;
    }

    return () => {
      isMounted = false;
    };
  }, [open, editingPipeline, snapToGridHelper, setNodes, setEdges, toast]);

  useEffect(() => {
    if (open && !editingPipeline && initialJob && isInitialMount.current) {
      console.log("Initializing with initialJob:", initialJob);
      setNodes([]);
      setEdges([]);
      setTimeout(() => addJobToCanvas(initialJob), 100);
    } else if (open && !editingPipeline && isInitialMount.current) {
      console.log("Initializing new pipeline");
      setNodes([]);
      setEdges([]);
    }
  }, [open, editingPipeline, initialJob, addJobToCanvas]);

  useEffect(() => {
    if (!open) {
      isInitialMount.current = true;
      setPipelineName("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col" aria-describedby="pipeline-builder-description">
        <DialogHeader className="p-4 border-b">
          {/* Pipeline Name is now in the header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DialogTitle className="text-xl font-bold whitespace-nowrap">
                {editingPipeline ? "Edit Pipeline" : "New Pipeline"}
              </DialogTitle>
              <div className="w-64">
                <Input
                  id="pipelineName"
                  placeholder="Enter pipeline name"
                  value={pipelineName}
                  onChange={(e) => {
                    setPipelineName(e.target.value);
                  }}
                  autoFocus
                  className="h-9"
                />
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-4">
              {editingPipeline && (
                <div className="text-sm text-muted-foreground hidden sm:block">
                  Created: {editingPipeline.createdAt} • {editingPipeline.num_jobs} jobs
                </div>
              )}
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                <Label htmlFor="snap-to-grid" className="text-sm">Snap to Grid</Label>
                <Switch id="snap-to-grid" checked={snapToGrid} onCheckedChange={setSnapToGrid} />
              </div>
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                Clear Canvas
              </Button>
            </div>
          </div>
          <DialogDescription id="pipeline-builder-description" className="sr-only">
            Dialog for building or editing a pipeline by adding and configuring jobs.
          </DialogDescription>
        </DialogHeader>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-4 overflow-hidden p-4 pt-0">

          {/* Left Sidebar (Jobs) */}
          {/* Left Sidebar (Jobs) */}
          <div className="w-80 flex flex-col h-full min-h-0">

            {/* Single heading with count and search */}
            <div className="space-y-3 mt-4">
              <h4 className="font-semibold text-base">Available Jobs ({filteredJobs.length})</h4>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            {/* Jobs list - scrollable area */}
            <div className="flex-1 overflow-y-auto mt-4" style={{ maxHeight: "calc(95vh - 200px)" }}>
              <DraggableJobList jobs={filteredJobs} onJobClick={addJobToCanvas} />
            </div>
          </div>

          {/* Right Canvas */}
          <div className="flex-1 border-l pl-4 flex flex-col">
            <div className="flex items-center justify-between mb-4 mt-4">
              <h3 className="font-semibold">Pipeline Canvas</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Move className="w-4 h-4" />
                  <span>Drag jobs from sidebar or click to add</span>
                </div>
              </div>
            </div>
            <div className="flex-1 border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden relative">
              <ReactFlowProvider>
                <div className="w-full h-full" ref={reactFlowWrapper}>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={nodeTypes}
                    snapToGrid={snapToGrid}
                    snapGrid={[GRID_SIZE, GRID_SIZE]}
                    defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                    minZoom={0.2}
                    maxZoom={2}
                    attributionPosition="bottom-left"
                  >
                    <Controls showZoom={true} showFitView={true} showInteractive={true} />
                    {showMiniMap && (
                      <div className="relative">
                        <MiniMap
                          nodeStrokeColor="#6366f1"
                          nodeColor="#e0e7ff"
                          nodeBorderRadius={8}
                          maskColor="rgba(0, 0, 0, 0.1)"
                          position="bottom-right"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 w-5 h-5 p-0 bg-white/80 hover:bg-white z-10"
                          onClick={() => setShowMiniMap(false)}
                          title="Hide MiniMap"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    <Background variant={BackgroundVariant.Lines} gap={GRID_SIZE} size={1} color="#e5e7eb" />
                  </ReactFlow>
                </div>
              </ReactFlowProvider>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-4 py-3 border-t">
          <div className="text-sm text-muted-foreground">
            {nodes.length} jobs • {edges.length} connections
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePipeline} disabled={isSaving}>
              {isSaving ? "Saving..." : (editingPipeline ? "Save Pipeline" : "Create Pipeline")}
            </Button>
          </div>
        </div>

        {/* Dialogs remain the same */}
        {configJob && (
          <JobConfigDialog
            job={configJob.job}
            jobData={configJob.node.data.job}
            open={!!configJob}
            onOpenChange={(open) => !open && setConfigJob(null)}
            onSave={handleSaveJobConfig}
          />
        )}
        {editingJobStages && (
          <JobStagesDialog
            job={editingJobStages.job}
            stages={editingJobStages.node.data.job.stages || []}
            open={!!editingJobStages}
            onOpenChange={(open) => !open && setEditingJobStages(null)}
            onSave={handleSaveJobStages}
          />
        )}
        {stageCanvasJob && (
          <StageCanvasDialog
            job={stageCanvasJob.job}
            stages={stageCanvasJob.node.data.job.stages || []}
            open={!!stageCanvasJob}
            onOpenChange={(open) => !open && setStageCanvasJob(null)}
            onSave={handleSaveStageCanvas}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}