import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { X, Grid3X3, Move, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
  MarkerType,
  Position,
  ReactFlowProvider,
} from "reactflow"
import "reactflow/dist/style.css"
import JobNode from "./JobNode"
import JobConfigDialog from "./JobConfigDialog"
import JobStagesDialog from "./JobStagesDialog"
import DraggableJobList from "./DraggableJobList"
import StageCanvasDialog from "./StageCanvasDialog"
import type { Job } from "@/components/types/jobs"
import type { Pipeline, Edge } from "@/components/types/pipeline"

interface JobStage {
  id: string
  name: string
  type: string
  status: string
  description?: string
}

interface PipelineJob {
  id: string
  jobId: string
  name: string
  category: string
  stages: JobStage[]
  parameters?: Record<string, any>
  inputTypes?: string[]
  outputTypes?: string[]
}

interface PipelineBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobs: Job[]
  onSave: (pipelineData: { name: string; jobs: string[]; nodes: Node[]; edges: Edge[] }) => void
  initialJob?: Job | null
  editingPipeline?: Pipeline | null
  pipelines?: Pipeline[]
}

const nodeTypes: NodeTypes = {
  jobNode: JobNode,
}

const GRID_SIZE = 20

export default function PipelineBuilderDialog({
  open,
  onOpenChange,
  jobs,
  onSave,
  initialJob = null,
  editingPipeline = null,
  pipelines = [],
}: PipelineBuilderDialogProps) {
  const { toast } = useToast()
  const [pipelineName, setPipelineName] = useState("")
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [configJob, setConfigJob] = useState<{ node: Node; job: Job } | null>(null)
  const [editingJobStages, setEditingJobStages] = useState<{ node: Node; job: Job } | null>(null)
  const [stageCanvasJob, setStageCanvasJob] = useState<{ node: Node; job: Job } | null>(null)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  const snapToGridHelper = useCallback(
    (position: { x: number; y: number }) => {
      if (!snapToGrid) return position
      return {
        x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(position.y / GRID_SIZE) * GRID_SIZE,
      }
    },
    [snapToGrid],
  )

  const onConnect = useCallback(
    (params: Connection) => {
      const edge: Edge = {
        id: `${params.source}-${params.target}-${Date.now()}`,
        source: params.source!,
        target: params.target!,
        type: "smoothstep",
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: {
          strokeWidth: 2,
          stroke: "#6366f1",
        },
      }
      setEdges((eds) => addEdge(edge, eds))
    },
    [setEdges],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!reactFlowWrapper.current || !reactFlowInstance) return

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const jobData = event.dataTransfer.getData("application/reactflow")

      if (!jobData) return

      const job: Job = JSON.parse(jobData)
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const snappedPosition = snapToGridHelper(position)
      const newNode: Node = {
        id: `${job.id}-${Date.now()}`,
        type: "jobNode",
        position: snappedPosition,
        data: {
          job: {
            ...job,
            name: job.name,
            parameters: {},
            inputTypes: ["data"],
            outputTypes: ["data"],
            stages: [...(job.stages || [])],
          },
          onEdit: (nodeId: string) => {
            const node = nodes.find((n) => n.id === nodeId)
            if (node) {
              setConfigJob({ node, job })
            }
          },
          onEditStages: (nodeId: string) => {
            const node = nodes.find((n) => n.id === nodeId)
            if (node) {
              setStageCanvasJob({ node, job })
            }
          },
          onDelete: (nodeId: string) => {
            setNodes((nds) => nds.filter((n) => n.id !== nodeId))
            setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
          },
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      }

      setNodes((nds) => nds.concat(newNode))

      // Open config dialog for new job
      setTimeout(() => {
        setConfigJob({ node: newNode, job })
      }, 100)
    },
    [reactFlowInstance, snapToGridHelper, nodes, setNodes, setEdges],
  )

  const addJobToCanvas = useCallback(
    (job: Job) => {
      // Find next available position
      const existingPositions = nodes.map((n) => n.position)
      let newPosition = { x: 100, y: 100 }

      // Simple positioning logic - place to the right of existing nodes
      if (existingPositions.length > 0) {
        const maxX = Math.max(...existingPositions.map((p) => p.x))
        newPosition = { x: maxX + 300, y: 100 }
      }

      const snappedPosition = snapToGridHelper(newPosition)
      const newNode: Node = {
        id: `${job.id}-${Date.now()}`,
        type: "jobNode",
        position: snappedPosition,
        data: {
          job: {
            ...job,
            name: job.name,
            parameters: {},
            inputTypes: ["data"],
            outputTypes: ["data"],
            stages: [...(job.stages || [])],
          },
          onEdit: (nodeId: string) => {
            const node = nodes.find((n) => n.id === nodeId)
            if (node) {
              setConfigJob({ node, job })
            }
          },
          onEditStages: (nodeId: string) => {
            const node = nodes.find((n) => n.id === nodeId)
            if (node) {
              setStageCanvasJob({ node, job })
            }
          },
          onDelete: (nodeId: string) => {
            setNodes((nds) => nds.filter((n) => n.id !== nodeId))
            setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
          },
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      }

      setNodes((nds) => nds.concat(newNode))

      // Open config dialog for new job
      setTimeout(() => {
        setConfigJob({ node: newNode, job })
      }, 100)
    },
    [nodes, snapToGridHelper, setNodes, setEdges],
  )

  const handleSaveJobConfig = useCallback(
    (updatedJobData: any) => {
      if (!configJob) return

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === configJob.node.id) {
            return {
              ...node,
              data: {
                ...node.data,
                job: {
                  ...node.data.job,
                  ...updatedJobData,
                },
              },
            }
          }
          return node
        }),
      )

      setConfigJob(null)
      toast({
        title: "Job Configuration Saved",
        description: "Job configuration has been updated successfully",
      })
    },
    [configJob, setNodes, toast],
  )

  const handleSaveJobStages = useCallback(
    (updatedStages: JobStage[]) => {
      if (!editingJobStages) return

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === editingJobStages.node.id) {
            return {
              ...node,
              data: {
                ...node.data,
                job: {
                  ...node.data.job,
                  stages: updatedStages,
                },
              },
            }
          }
          return node
        }),
      )

      setEditingJobStages(null)
      toast({
        title: "Job Stages Updated",
        description: "Job stages have been updated successfully",
      })
    },
    [editingJobStages, setNodes, toast],
  )

  const handleSaveStageCanvas = useCallback(
    (updatedStages: JobStage[]) => {
      if (!stageCanvasJob) return

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === stageCanvasJob.node.id) {
            return {
              ...node,
              data: {
                ...node.data,
                job: {
                  ...node.data.job,
                  stages: updatedStages,
                },
              },
            }
          }
          return node
        }),
      )

      setStageCanvasJob(null)
      toast({
        title: "Stage Workflow Updated",
        description: "Stage workflow has been updated successfully",
      })
    },
    [stageCanvasJob, setNodes, toast],
  )

  const handleSavePipeline = () => {
    if (!pipelineName.trim()) {
      toast({
        title: "Pipeline Name Required",
        description: "Please enter a name for your pipeline",
        variant: "destructive",
      })
      return
    }

    if (nodes.length === 0) {
      toast({
        title: "No Jobs Added",
        description: "Please add at least one job to your pipeline",
        variant: "destructive",
      })
      return
    }

    // Extract job IDs from nodes
    const jobIds = nodes.map((node) => node.data.job.jobId || node.data.job.id)

    onSave({
      name: pipelineName,
      jobs: jobIds,
      nodes,
      edges,
    })

    toast({
      title: editingPipeline ? "Pipeline Updated" : "Pipeline Created",
      description: `Pipeline "${pipelineName}" has been ${editingPipeline ? "updated" : "created"} with ${jobIds.length} jobs and ${edges.length} connections`,
    })
  }

  const clearCanvas = () => {
    setNodes([])
    setEdges([])
  }

  useEffect(() => {
    if (open) {
      if (editingPipeline) {
        // Load existing pipeline for editing
        setPipelineName(editingPipeline.name)

        // Load nodes and edges from editingPipeline
        const initialNodes: Node[] = editingPipeline.nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            job: {
              ...node.data.job,
              // Ensure job data is updated from the jobs prop
              ...jobs.find((j) => j.id === (node.data.job.jobId || node.data.job.id)),
              stages: [...(node.data.job.stages || [])],
            },
            onEdit: (nodeId: string) => {
              const node = nodes.find((n) => n.id === nodeId)
              if (node) {
                setConfigJob({ node, job: node.data.job })
              }
            },
            onEditStages: (nodeId: string) => {
              const node = nodes.find((n) => n.id === nodeId)
              if (node) {
                setStageCanvasJob({ node, job: node.data.job })
              }
            },
            onDelete: (nodeId: string) => {
              setNodes((nds) => nds.filter((n) => n.id !== nodeId))
              setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
            },
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        }))

        setNodes(initialNodes)
        setEdges(editingPipeline.edges || [])
      } else if (initialJob) {
        // Add initial job to canvas
        setPipelineName("")
        setNodes([])
        setEdges([])

        // Add the initial job after a short delay to ensure canvas is ready
        setTimeout(() => {
          addJobToCanvas(initialJob)
        }, 100)
      } else {
        setPipelineName("")
        setNodes([])
        setEdges([])
      }
    }
  }, [open, initialJob, editingPipeline, jobs, setNodes, setEdges])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{editingPipeline ? `Edit Pipeline: ${editingPipeline.name}` : "Pipeline Builder"}</DialogTitle>
            <div className="flex items-center gap-4">
              {editingPipeline && (
                <div className="text-sm text-muted-foreground">
                  Created: {editingPipeline.createdAt} • {editingPipeline.jobs.length} jobs
                </div>
              )}
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                <Label htmlFor="snap-to-grid" className="text-sm">
                  Snap to Grid
                </Label>
                <Switch id="snap-to-grid" checked={snapToGrid} onCheckedChange={setSnapToGrid} />
              </div>
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                Clear Canvas
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Left Panel - Available Jobs */}
          <div className="w-80 flex flex-col">
            <div className="space-y-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="pipelineName">Pipeline Name</Label>
                <Input
                  id="pipelineName"
                  placeholder="Enter pipeline name"
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                />
              </div>
            </div>

            <DraggableJobList jobs={jobs} onJobClick={addJobToCanvas} />
          </div>

          {/* Right Panel - Pipeline Canvas */}
          <div className="flex-1 border-l pl-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Pipeline Canvas</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                </div>
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
                    <Background variant={"dots" as any} gap={GRID_SIZE} size={1} color="#e5e7eb" />
                  </ReactFlow>
                </div>
              </ReactFlowProvider>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {nodes.length} jobs • {edges.length} connections
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePipeline}>{editingPipeline ? "Save Pipeline" : "Create Pipeline"}</Button>
          </div>
        </div>

        {/* Job Configuration Dialog */}
        {configJob && (
          <JobConfigDialog
            job={configJob.job}
            jobData={configJob.node.data.job}
            open={!!configJob}
            onOpenChange={(open) => !open && setConfigJob(null)}
            onSave={handleSaveJobConfig}
          />
        )}

        {/* Job Stages Dialog */}
        {editingJobStages && (
          <JobStagesDialog
            job={editingJobStages.job}
            stages={editingJobStages.node.data.job.stages || []}
            open={!!editingJobStages}
            onOpenChange={(open) => !open && setEditingJobStages(null)}
            onSave={handleSaveJobStages}
          />
        )}

        {/* Stage Canvas Dialog */}
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
  )
}