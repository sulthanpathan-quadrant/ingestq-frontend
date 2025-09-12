// import { useState, useEffect } from "react"
// import { useNavigate } from "react-router-dom"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Calendar } from "@/components/ui/calendar"
// import { Search, Play, Eye, Plus, Edit, FileText, Calendar as CalendarIcon, X, Link } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"
// import EnhancedEditJobDialog from "@/components/jobs/EnhancedEditJobDialog"
// import ViewJobDialog from "@/components/jobs/ViewJobDialog"
// import PipelineBuilderDialog from "@/components/jobs/PipelineBuilderDialog"
// import PipelineDetailsDialog from "@/components/jobs/PipelineDetailsDialog"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { format, formatDistanceToNow } from "date-fns"
// import { cn } from "@/lib/utils"
// import type { Job } from "@/components/types/jobs"
// import type { Pipeline, Edge } from "@/components/types/pipeline"
// import { Node, MarkerType, Position } from "reactflow"

// interface JobStage {
//   id: string
//   name: string
//   type: string
//   status: string
//   description?: string
// }

// const LOCAL_STORAGE_KEY = 'app_data';

// // Category color mapping with dark mode support
// const categoryColors: Record<string, string> = {
//   'Glue Jobs': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
//   'Lambda Jobs': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
//   'Batch Jobs': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
//   'ADF Jobs': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
// };

// // Status filter options
// const statusFilters = ['All', 'Completed', 'Running', 'Failed'];

// const mockJobs: Job[] = [
//   {
//     id: "1",
//     name: "Customer Data ETL",
//     category: "Glue Jobs",
//     lastRun: "2024-01-15 10:30:00",
//     status: "Completed",
//     description: "Process customer data from various sources",
//     isConnected: true,
//     pipelines: [
//       {
//         id: "pipeline-1",
//         name: "Customer Analytics Pipeline",
//         jobs: ["1", "2"],
//         createdAt: "2024-01-15",
//         nodes: [
//           {
//             id: "1-1631234567890",
//             type: "jobNode",
//             position: { x: 100, y: 100 },
//             data: {
//               job: {
//                 id: "1",
//                 name: "Customer Data ETL",
//                 category: "Glue Jobs",
//                 lastRun: "2024-01-15 10:30:00",
//                 status: "Completed",
//                 description: "Process customer data from various sources",
//                 stages: [
//                   {
//                     id: "s1",
//                     name: "Extract Data",
//                     type: "extraction",
//                     status: "completed",
//                     description: "Extract data from source systems",
//                   },
//                   {
//                     id: "s2",
//                     name: "Transform Data",
//                     type: "transformation",
//                     status: "completed",
//                     description: "Apply business rules and transformations",
//                   },
//                   {
//                     id: "s3",
//                     name: "Load Data",
//                     type: "loading",
//                     status: "completed",
//                     description: "Load processed data into target system",
//                   },
//                 ],
//               },
//             },
//             sourcePosition: Position.Right,
//             targetPosition: Position.Left,
//           },
//           {
//             id: "2-1631234567891",
//             type: "jobNode",
//             position: { x: 400, y: 100 },
//             data: {
//               job: {
//                 id: "2",
//                 name: "Sales Analytics",
//                 category: "Glue Jobs",
//                 lastRun: "2024-01-15 09:45:00",
//                 status: "Failed",
//                 description: "Generate sales reports and analytics",
//                 stages: [
//                   {
//                     id: "s4",
//                     name: "Data Validation",
//                     type: "validation",
//                     status: "completed",
//                     description: "Validate incoming data quality",
//                   },
//                   {
//                     id: "s5",
//                     name: "Analytics Processing",
//                     type: "processing",
//                     status: "failed",
//                     description: "Process analytics calculations",
//                   },
//                 ],
//               },
//             },
//             sourcePosition: Position.Right,
//             targetPosition: Position.Left,
//           },
//         ],
//         edges: [
//           {
//             id: "e1-2",
//             source: "1-1631234567890",
//             target: "2-1631234567891",
//             type: "smoothstep",
//             markerEnd: {
//               type: MarkerType.ArrowClosed,
//             },
//             style: {
//               strokeWidth: 2,
//               stroke: "#6366f1",
//             },
//           },
//         ],
//       },
//     ],
//     stages: [
//       {
//         id: "s1",
//         name: "Extract Data",
//         type: "extraction",
//         status: "completed",
//         description: "Extract data from source systems",
//       },
//       {
//         id: "s2",
//         name: "Transform Data",
//         type: "transformation",
//         status: "completed",
//         description: "Apply business rules and transformations",
//       },
//       {
//         id: "s3",
//         name: "Load Data",
//         type: "loading",
//         status: "completed",
//         description: "Load processed data into target system",
//       },
//     ],
//   },
//   {
//     id: "2",
//     name: "Sales Analytics",
//     category: "Glue Jobs",
//     lastRun: "2024-01-15 09:45:00",
//     status: "Failed",
//     description: "Generate sales reports and analytics",
//     isConnected: true,
//     pipelines: [
//       {
//         id: "pipeline-1",
//         name: "Customer Analytics Pipeline",
//         jobs: ["1", "2"],
//         createdAt: "2024-01-15",
//         nodes: [
//           {
//             id: "1-1631234567890",
//             type: "jobNode",
//             position: { x: 100, y: 100 },
//             data: {
//               job: {
//                 id: "1",
//                 name: "Customer Data ETL",
//                 category: "Glue Jobs",
//                 lastRun: "2024-01-15 10:30:00",
//                 status: "Completed",
//                 description: "Process customer data from various sources",
//               },
//             },
//             sourcePosition: Position.Right,
//             targetPosition: Position.Left,
//           },
//           {
//             id: "2-1631234567891",
//             type: "jobNode",
//             position: { x: 400, y: 100 },
//             data: {
//               job: {
//                 id: "2",
//                 name: "Sales Analytics",
//                 category: "Glue Jobs",
//                 lastRun: "2024-01-15 09:45:00",
//                 status: "Failed",
//                 description: "Generate sales reports and analytics",
//               },
//             },
//             sourcePosition: Position.Right,
//             targetPosition: Position.Left,
//           },
//         ],
//         edges: [
//           {
//             id: "e1-2",
//             source: "1-1631234567890",
//             target: "2-1631234567891",
//             type: "smoothstep",
//             markerEnd: {
//               type: MarkerType.ArrowClosed,
//             },
//             style: {
//               strokeWidth: 2,
//               stroke: "#6366f1",
//             },
//           },
//         ],
//       },
//     ],
//     stages: [
//       {
//         id: "s4",
//         name: "Data Validation",
//         type: "validation",
//         status: "completed",
//         description: "Validate incoming data quality",
//       },
//       {
//         id: "s5",
//         name: "Analytics Processing",
//         type: "processing",
//         status: "failed",
//         description: "Process analytics calculations",
//       },
//     ],
//   },
//   {
//     id: "3",
//     name: "Data Validation",
//     category: "Lambda Jobs",
//     lastRun: "2024-01-15 11:15:00",
//     status: "Completed",
//     description: "Validate data quality and consistency",
//     stages: [
//       {
//         id: "s6",
//         name: "Schema Validation",
//         type: "validation",
//         status: "completed",
//         description: "Validate data schema compliance",
//       },
//     ],
//   },
//   {
//     id: "4",
//     name: "Report Generation",
//     category: "Batch Jobs",
//     lastRun: "2024-01-15 08:20:00",
//     status: "Running",
//     description: "Generate monthly business reports",
//     isConnected: true,
//     pipelines: [
//       {
//         id: "pipeline-2",
//         name: "Reporting Pipeline",
//         jobs: ["4"],
//         createdAt: "2024-01-14",
//         nodes: [
//           {
//             id: "4-1631234567892",
//             type: "jobNode",
//             position: { x: 100, y: 100 },
//             data: {
//               job: {
//                 id: "4",
//                 name: "Report Generation",
//                 category: "Batch Jobs",
//                 lastRun: "2024-01-15 08:20:00",
//                 status: "Running",
//                 description: "Generate monthly business reports",
//               },
//             },
//             sourcePosition: Position.Right,
//             targetPosition: Position.Left,
//           },
//         ],
//         edges: [],
//       },
//     ],
//     stages: [
//       {
//         id: "s7",
//         name: "Data Collection",
//         type: "collection",
//         status: "completed",
//         description: "Collect data from various sources",
//       },
//       {
//         id: "s8",
//         name: "Report Building",
//         type: "processing",
//         status: "running",
//         description: "Generate formatted reports",
//       },
//     ],
//   },
//   {
//     id: "5",
//     name: "Data Migration",
//     category: "ADF Jobs",
//     lastRun: "2024-01-15 12:00:00",
//     status: "Completed",
//     description: "Migrate data between systems",
//     stages: [
//       {
//         id: "s9",
//         name: "Source Connection",
//         type: "connection",
//         status: "completed",
//         description: "Connect to source database",
//       },
//       {
//         id: "s10",
//         name: "Data Transfer",
//         type: "transfer",
//         status: "completed",
//         description: "Transfer data to target system",
//       },
//       {
//         id: "s11",
//         name: "Target Validation",
//         type: "validation",
//         status: "completed",
//         description: "Validate transferred data",
//       },
//     ],
//   },
// ]

// export default function Jobs() {
//   const navigate = useNavigate()
//   const { toast } = useToast()
//   const [jobs, setJobs] = useState<Job[]>(mockJobs)
//   const [pipelines, setPipelines] = useState<Pipeline[]>([
//     {
//       id: "pipeline-1",
//       name: "Customer Analytics Pipeline",
//       jobs: ["1", "2"],
//       createdAt: "2024-01-15",
//       nodes: [
//         {
//           id: "1-1631234567890",
//           type: "jobNode",
//           position: { x: 100, y: 100 },
//           data: { job: mockJobs[0] },
//           sourcePosition: Position.Right,
//           targetPosition: Position.Left,
//         },
//         {
//           id: "2-1631234567891",
//           type: "jobNode",
//           position: { x: 400, y: 100 },
//           data: { job: mockJobs[1] },
//           sourcePosition: Position.Right,
//           targetPosition: Position.Left,
//         },
//       ],
//       edges: [
//         {
//           id: "e1-2",
//           source: "1-1631234567890",
//           target: "2-1631234567891",
//           type: "smoothstep",
//           markerEnd: {
//             type: MarkerType.ArrowClosed,
//           },
//           style: {
//             strokeWidth: 2,
//             stroke: "#6366f1",
//           },
//         },
//       ],
//     },
//     {
//       id: "pipeline-2",
//       name: "Reporting Pipeline",
//       jobs: ["4"],
//       createdAt: "2024-01-14",
//       nodes: [
//         {
//           id: "4-1631234567892",
//           type: "jobNode",
//           position: { x: 100, y: 100 },
//           data: { job: mockJobs[3] },
//           sourcePosition: Position.Right,
//           targetPosition: Position.Left,
//         },
//       ],
//       edges: [],
//     },
//   ])
//   const [searchTerm, setSearchTerm] = useState("")
//   const [editingJob, setEditingJob] = useState<Job | null>(null)
//   const [viewingJob, setViewingJob] = useState<Job | null>(null)
//   const [startDate, setStartDate] = useState<Date | undefined>()
//   const [endDate, setEndDate] = useState<Date | undefined>()
//   const [filteredJobs, setFilteredJobs] = useState<Job[]>(mockJobs)
//   const [pipelineBuilderOpen, setPipelineBuilderOpen] = useState(false)
//   const [selectedJobForPipeline, setSelectedJobForPipeline] = useState<Job | null>(null)
//   const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)
//   const [selectedJobForPipelines, setSelectedJobForPipelines] = useState<Job | null>(null)
//   const [statusFilter, setStatusFilter] = useState<string>('All')

//   // Load from localStorage on mount
//   useEffect(() => {
//     const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
//     if (storedData) {
//       const { jobs: storedJobs, pipelines: storedPipelines } = JSON.parse(storedData);
//       setJobs(storedJobs || mockJobs);
//       setPipelines(storedPipelines || []);
//     } else {
//       setJobs(mockJobs);
//     }
//     filterJobs();
//   }, []);

//   // Save to localStorage on changes
//   useEffect(() => {
//     localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ jobs, pipelines }));
//     filterJobs();
//   }, [jobs, pipelines, searchTerm, startDate, endDate, statusFilter]);

//   const filterJobs = () => {
//     let filtered = jobs.filter(job =>
//       job.name.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     if (startDate) {
//       filtered = filtered.filter(job => new Date(job.lastRun) >= startDate);
//     }
//     if (endDate) {
//       filtered = filtered.filter(job => new Date(job.lastRun) <= endDate);
//     }

//     if (statusFilter !== 'All') {
//       filtered = filtered.filter(job => job.status === statusFilter);
//     }

//     setFilteredJobs(filtered);
//   };

//   const clearDateFilter = () => {
//     setStartDate(undefined);
//     setEndDate(undefined);
//   };

//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'completed': return 'bg-green-500 text-white dark:bg-green-600 dark:text-white';
//       case 'running': return 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white';
//       case 'failed': return 'bg-red-500 text-white dark:bg-red-600 dark:text-white';
//       default: return 'bg-gray-500 text-white dark:bg-gray-600 dark:text-white';
//     }
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return format(date, "MMM d, yyyy - h:mm a");
//   };

//   const handleRunJob = (job: Job) => {
//     toast({ title: "Job Started", description: `${job.name} is now running.` });
//   };

//   const handleViewJob = (job: Job) => {
//     setViewingJob(job);
//   };

//   const handleEditJob = (job: Job) => {
//     setEditingJob(job);
//   };

//   const handleCreateJob = () => {
//     navigate("/dashboard/upload");
//   };

//   const handleSaveJobStages = (jobId: string, stages: JobStage[]) => {
//     setJobs(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, stages } : j));
//     toast({ title: "Stages Saved", description: "Job stages have been updated." });
//     setEditingJob(null);
//   };

//   const handleOpenPipelineBuilder = () => {
//     setSelectedJobForPipeline(null);
//     setEditingPipeline(null);
//     setPipelineBuilderOpen(true);
//   };

//   const handleCreatePipelineWithJob = (job: Job) => {
//     setSelectedJobForPipeline(job);
//     setEditingPipeline(null);
//     setPipelineBuilderOpen(true);
//   };

//   const handleEditPipeline = (pipeline: Pipeline) => {
//     setEditingPipeline(pipeline);
//     setSelectedJobForPipeline(null);
//     setPipelineBuilderOpen(true);
//   };

//   const handleSavePipeline = (pipelineData: { name: string; jobs: string[]; nodes: Node[]; edges: Edge[] }) => {
//     let newPipelines;
//     if (editingPipeline) {
//       const updatedPipeline = {
//         ...editingPipeline,
//         name: pipelineData.name,
//         jobs: pipelineData.jobs,
//         nodes: pipelineData.nodes,
//         edges: pipelineData.edges,
//       };
//       newPipelines = pipelines.map(p => p.id === editingPipeline.id ? updatedPipeline : p);
//     } else {
//       const newPipeline = {
//         id: `pipeline-${Date.now()}`,
//         name: pipelineData.name,
//         jobs: pipelineData.jobs,
//         createdAt: new Date().toISOString().split('T')[0],
//         nodes: pipelineData.nodes,
//         edges: pipelineData.edges,
//       };
//       newPipelines = [...pipelines, newPipeline];
//     }

//     setPipelines(newPipelines);

//     setJobs(prevJobs => prevJobs.map(job => ({
//       ...job,
//       pipelines: newPipelines.filter(p => p.jobs.includes(job.id)),
//       isConnected: newPipelines.some(p => p.jobs.includes(job.id)),
//     })));

//     setPipelineBuilderOpen(false);
//     toast({ title: "Pipeline Saved", description: "Pipeline has been created/updated." });
//   };

//   const handleDeletePipeline = (pipelineId: string) => {
//     setPipelines(prev => prev.filter(p => p.id !== pipelineId));

//     setJobs(prevJobs => prevJobs.map(job => ({
//       ...job,
//       pipelines: job.pipelines?.filter(p => p.id !== pipelineId) || [],
//       isConnected: job.pipelines?.filter(p => p.id !== pipelineId).length > 0,
//     })));

//     toast({ title: "Pipeline Deleted", description: "Pipeline has been removed." });
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
//       <div className="container mx-auto p-6">
//         <div className="mb-6 mt-14 flex items-start justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-foreground">
//               All Jobs ({filteredJobs.length})
//             </h1>
//             <p className="text-muted-foreground text-sm mt-1">
//               View and manage your jobs and pipelines
//             </p>
//           </div>
//           <div className="flex gap-2">
//             <Button onClick={handleCreateJob} className="flex items-center gap-2 bg-primary hover:bg-primary/90">
//               <Plus className="h-4 w-4" /> Create Job
//             </Button>
//             {/* <Button onClick={handleOpenPipelineBuilder} className="flex items-center gap-2 bg-primary hover:bg-primary/90">
//               <Link className="w-4 h-4" /> Create Pipeline
//             </Button> */}
//           </div>
//         </div>

//         <Card className="shadow-sm">
//           <CardContent className="p-0">
//             {/* Search and Filter Bar */}
//             <div className="p-4 border-b bg-muted/30">
//               <div className="flex items-center gap-4 flex-wrap">
//                 <div className="relative w-64">
//                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     placeholder="Search jobs..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-9 bg-background dark:bg-gray-800"
//                   />
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className={cn(
//                           "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
//                           !startDate && "text-muted-foreground"
//                         )}
//                       >
//                         <CalendarIcon className="mr-2 h-4 w-4" />
//                         {startDate ? format(startDate, "MMM dd, yyyy") : "Select a Date"}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
//                       <Calendar
//                         mode="single"
//                         selected={startDate}
//                         onSelect={setStartDate}
//                         className="pointer-events-auto"
//                       />
//                     </PopoverContent>
//                   </Popover>

//                   <Popover>
//                     <PopoverTrigger asChild>
//                                           </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
//                       <Calendar
//                         mode="single"
//                         selected={endDate}
//                         onSelect={setEndDate}
//                         className="pointer-events-auto"
//                       />
//                     </PopoverContent>
//                   </Popover>

//                   {(startDate || endDate) && (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={clearDateFilter}
//                       className="h-10 px-3"
//                       title="Clear date filter"
//                     >
//                       <X className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//                 <div className="flex gap-2">
//                   {statusFilters.map(status => (
//                     <Button
//                       key={status}
//                       variant={statusFilter === status ? "default" : "outline"}
//                       size="sm"
//                       onClick={() => setStatusFilter(status)}
//                       className={cn(
//                         "text-sm rounded-full",
//                         statusFilter === status
//                           ? "bg-primary text-white dark:bg-blue-500 dark:text-white"
//                           : "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
//                       )}
//                     >
//                       {status}
//                     </Button>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Table Header */}
//             <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-muted/20 border-b text-sm font-medium text-muted-foreground">
//               <div>Job Name</div>
//               <div>Category</div>
//               <div>Pipeline</div>
//               <div>Last Run</div>
//               <div>Status</div>
//               <div>Actions</div>
//             </div>

//             {/* Table Rows */}
//             <div className="divide-y">
//               {filteredJobs.map((job) => (
//                 <div
//                   key={job.id}
//                   className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-muted/50 transition-colors"
//                 >
//                   <div className="flex items-center gap-2">
//                     <span className="font-medium text-foreground">{job.name}</span>
//                     {job.isConnected && (
//                       <span title={`Part of ${job.pipelines?.map((p) => p.name).join(", ")}`}>
//                         <Link className="w-4 h-4 text-blue-500" />
//                       </span>
//                     )}
//                   </div>
//                   <div>
//                     <Badge className={cn(
//                       "text-xs",
//                       categoryColors[job.category] || 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-white'
//                     )}>
//                       {job.category}
//                     </Badge>
//                   </div>
//                   <div className="text-muted-foreground">
//                     {job.pipelines && job.pipelines.length > 0 ? (
//                       <Badge
//                         variant="secondary"
//                         className="text-xs cursor-pointer bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500"
//                         onClick={() => setSelectedJobForPipelines(job)}
//                       >
//                         {job.pipelines.length}
//                       </Badge>
//                     ) : (
//                       <span className="text-xs text-muted-foreground">0</span>
//                     )}
//                   </div>
//                   <div className="text-muted-foreground text-sm">{formatDate(job.lastRun)}</div>
//                   <div>
//                     <Badge className={cn(
//                       "text-xs px-2 py-1",
//                       getStatusColor(job.status)
//                     )}>
//                       {job.status}
//                     </Badge>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Button
//                       size="sm"
//                       onClick={() => handleRunJob(job)}
//                       className="w-8 h-8 rounded-full p-0 bg-primary hover:bg-primary/90"
//                       title="Run Job"
//                     >
//                       <Play className="w-3 h-3" />
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => handleViewJob(job)}
//                       className="w-8 h-8 rounded-full p-0"
//                       title={job.isConnected ? "View Pipeline" : "View Reports"}
//                     >
//                       <Eye className="w-4 h-4" />
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => handleEditJob(job)}
//                       className="w-8 h-8 rounded-full p-0"
//                       title="Edit Job Stages"
//                     >
//                       <Edit className="w-4 h-4" />
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => handleCreatePipelineWithJob(job)}
//                       className="w-8 h-8 rounded-full p-0"
//                       title="Create Pipeline with this Job"
//                     >
//                       <Link className="w-4 h-4" />
//                     </Button>
//                     {/* <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => handleViewJob(job)}
//                       className="w-8 h-8 rounded-full p-0"
//                       title="View Details"
//                     >
//                       <FileText className="w-4 h-4" />
//                     </Button> */}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>

//         <EnhancedEditJobDialog
//           job={editingJob}
//           open={!!editingJob}
//           onOpenChange={(open) => !open && setEditingJob(null)}
//           onSave={handleSaveJobStages}
//         />
//         <ViewJobDialog job={viewingJob} open={!!viewingJob} onOpenChange={(open) => !open && setViewingJob(null)} />
//         <PipelineBuilderDialog
//           open={pipelineBuilderOpen}
//           onOpenChange={setPipelineBuilderOpen}
//           jobs={jobs}
//           onSave={handleSavePipeline}
//           initialJob={selectedJobForPipeline}
//           editingPipeline={editingPipeline}
//           pipelines={pipelines}
//         />
//         {selectedJobForPipelines && (
//           <PipelineDetailsDialog
//             job={selectedJobForPipelines}
//             pipelines={pipelines.filter(p => p.jobs.includes(selectedJobForPipelines.id))}
//             open={!!selectedJobForPipelines}
//             onOpenChange={() => setSelectedJobForPipelines(null)}
//             onEditPipeline={handleEditPipeline}
//             onDeletePipeline={handleDeletePipeline}
//           />
//         )}
//       </div>
//     </div>
//   )
// }

//-------------------------------------------------------------------------------------------------

// import { useState, useEffect } from "react"
// import { useNavigate } from "react-router-dom"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Calendar } from "@/components/ui/calendar"
// import { Search, Play, Eye, Plus, Edit, Calendar as CalendarIcon, X } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"
// import EnhancedEditJobDialog from "@/components/jobs/EnhancedEditJobDialog"
// import ViewJobDialog from "@/components/jobs/ViewJobDialog"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { format } from "date-fns"
// import { cn } from "@/lib/utils"
// import { getJobs, Job as ApiJob } from "@/lib/api"

// // Define JobStage interface
// interface JobStage {
//   id: string
//   name: string
//   type: string
//   status: string
//   description?: string
// }

// // Define LocalJob interface to match ViewJobDialog expectations
// interface LocalJob {
//   id: string
//   name: string
//   category?: string
//   lastRun: string
//   status: string
//   createdAt: string
//   stages: JobStage[]
//   FolderName: string
//   datadestination: string
//   jobId: string
//   triggerType: "SCHEDULE" | "File"
//   etag: string
//   email: string
//   FileName: string
//   scheduleDetails: object
//   jobName: string
//   user_id: string
//   steps: object
//   BucketName: string
//   datasource: string
// }

// const LOCAL_STORAGE_KEY = 'app_data'

// // Status filter options
// const statusFilters = ['All', 'Completed', 'Running', 'Failed']

// export default function Jobs() {
//   const navigate = useNavigate()
//   const { toast } = useToast()
//   const [jobs, setJobs] = useState<LocalJob[]>([])
//   const [searchTerm, setSearchTerm] = useState("")
//   const [editingJob, setEditingJob] = useState<LocalJob | null>(null)
//   const [viewingJob, setViewingJob] = useState<LocalJob | null>(null)
//   const [startDate, setStartDate] = useState<Date | undefined>()
//   const [endDate, setEndDate] = useState<Date | undefined>()
//   const [filteredJobs, setFilteredJobs] = useState<LocalJob[]>([])
//   const [statusFilter, setStatusFilter] = useState<string>('All')
//   const [isLoading, setIsLoading] = useState(false)

//   // Validate localStorage for bucket and key
//   const validateLocalStorage = () => {
//     const bucket = localStorage.getItem('selectedBucket')
//     const key = localStorage.getItem('selectedFile')
//     if (!bucket || !key) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Missing bucket name or key. Please upload the file again.",
//       })
//       navigate('/dashboard/upload')
//       return false
//     }
//     return { bucket, key }
//   }

//   // Fetch jobs from API and load from localStorage
//   useEffect(() => {
//     // Validate localStorage before fetching
//     if (!validateLocalStorage()) return

//     const fetchJobs = async () => {
//       setIsLoading(true)
//       try {
//         const response = await getJobs()
//         if (response.success) {
//           // Map API jobs to LocalJob interface
//           const mappedJobs: LocalJob[] = response.jobs.map((job: ApiJob) => ({
//             id: job.jobId,
//             name: job.jobName,
//             category: "Uncategorized",
//             lastRun: job.LastRun || new Date().toISOString(), // Fallback for invalid dates
//             status: job.Status,
//             createdAt: job.createdAt || new Date().toISOString(), // Fallback for invalid dates
//             stages: [],
//             FolderName: job.FolderName,
//             datadestination: job.datadestination,
//             jobId: job.jobId,
//             triggerType: job.triggerType,
//             etag: job.etag,
//             email: job.email,
//             FileName: job.FileName,
//             scheduleDetails: job.scheduleDetails,
//             jobName: job.jobName,
//             user_id: job.user_id,
//             steps: job.steps,
//             BucketName: job.BucketName,
//             datasource: job.datasource
//           }))
//           setJobs(mappedJobs)
//           localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ jobs: mappedJobs }))
//         }
//       } catch (error) {
//         toast({
//           title: "Error",
//           description: "Failed to fetch jobs from API. Loading from local storage.",
//           variant: "destructive"
//         })
//         // Fallback to localStorage
//         const storedData = localStorage.getItem(LOCAL_STORAGE_KEY)
//         if (storedData) {
//           const { jobs: storedJobs } = JSON.parse(storedData)
//           setJobs(storedJobs || [])
//         }
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchJobs()
//   }, [])

//   // Filter jobs when dependencies change
//   useEffect(() => {
//     filterJobs()
//   }, [jobs, searchTerm, startDate, endDate, statusFilter])

//   const filterJobs = () => {
//     let filtered = jobs.filter(job =>
//       job.name.toLowerCase().includes(searchTerm.toLowerCase())
//     )

//     if (startDate) {
//       filtered = filtered.filter(job => {
//         const lastRunDate = new Date(job.lastRun)
//         return !isNaN(lastRunDate.getTime()) && lastRunDate >= startDate
//       })
//     }
//     if (endDate) {
//       filtered = filtered.filter(job => {
//         const lastRunDate = new Date(job.lastRun)
//         return !isNaN(lastRunDate.getTime()) && lastRunDate <= endDate
//       })
//     }

//     if (statusFilter !== 'All') {
//       filtered = filtered.filter(job => job.status === statusFilter)
//     }

//     setFilteredJobs(filtered)
//   }

//   const clearDateFilter = () => {
//     setStartDate(undefined)
//     setEndDate(undefined)
//   }

//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'completed': return 'bg-green-500 text-white dark:bg-green-600 dark:text-white'
//       case 'running': return 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white'
//       case 'failed': return 'bg-red-500 text-white dark:bg-red-600 dark:text-white'
//       default: return 'bg-gray-500 text-white dark:bg-gray-600 dark:text-white'
//     }
//   }

//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString)
//       if (isNaN(date.getTime())) {
//         return "Invalid Date"
//       }
//       return format(date, "MMM d, yyyy - h:mm a")
//     } catch {
//       return "Invalid Date"
//     }
//   }

//   const handleRunJob = (job: LocalJob) => {
//     // Validate localStorage before running job
//     if (!validateLocalStorage()) return
//     toast({ title: "Job Started", description: `${job.name} is now running.` })
//   }

//   const handleViewJob = (job: LocalJob) => {
//     // Validate localStorage before viewing job
//     if (!validateLocalStorage()) return
//     setViewingJob(job)
//   }

//   const handleEditJob = (job: LocalJob) => {
//     // Validate localStorage before editing job
//     if (!validateLocalStorage()) return
//     setEditingJob(job)
//   }

//   const handleCreateJob = () => {
//     // Validate localStorage before creating job
//     if (!validateLocalStorage()) return
//     navigate("/dashboard/upload")
//   }

//   const handleSaveJobStages = (jobId: string, stages: JobStage[]) => {
//     setJobs(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, stages } : j))
//     toast({ title: "Stages Saved", description: "Job stages have been updated." })
//     setEditingJob(null)
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
//       <div className="container mx-auto p-6">
//         <div className="mb-6 mt-14 flex items-start justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-foreground">
//               All Jobs ({filteredJobs.length})
//             </h1>
//             <p className="text-muted-foreground text-sm mt-1">
//               View and manage your jobs
//             </p>
//           </div>
//           <div className="flex gap-2">
//             <Button onClick={handleCreateJob} className="flex items-center gap-2 bg-primary hover:bg-primary/90">
//               <Plus className="h-4 w-4" /> Create Job
//             </Button>
//           </div>
//         </div>

//         <Card className="shadow-sm">
//           <CardContent className="p-0">
//             {/* Search and Filter Bar */}
            // <div className="p-4 border-b bg-muted/30">
            //   <div className="flex items-center gap-4 flex-wrap">
            //     <div className="relative w-64">
            //       <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            //       <Input
            //         placeholder="Search jobs..."
            //         value={searchTerm}
            //         onChange={(e) => setSearchTerm(e.target.value)}
            //         className="pl-9 bg-background dark:bg-gray-800"
            //       />
            //     </div>
            //     <div className="flex items-center gap-2">
            //       <Popover>
            //         <PopoverTrigger asChild>
            //           <Button
            //             variant="outline"
            //             className={cn(
            //               "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
            //               !startDate && "text-muted-foreground"
            //             )}
            //           >
            //             <CalendarIcon className="mr-2 h-4 w-4" />
            //             {startDate ? format(startDate, "MMM dd, yyyy") : "Select a Date"}
            //           </Button>
            //         </PopoverTrigger>
            //         <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
            //           <Calendar
            //             mode="single"
            //             selected={startDate}
            //             onSelect={setStartDate}
            //             className="pointer-events-auto"
            //           />
            //         </PopoverContent>
            //       </Popover>

            //       <Popover>
            //         <PopoverTrigger asChild>
            //           <Button
            //             variant="outline"
            //             className={cn(
            //               "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
            //               !endDate && "text-muted-foreground"
            //             )}
            //           >
            //             <CalendarIcon className="mr-2 h-4 w-4" />
            //             {endDate ? format(endDate, "MMM dd, yyyy") : "Select a Date"}
            //           </Button>
            //         </PopoverTrigger>
            //         <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
            //           <Calendar
            //             mode="single"
            //             selected={endDate}
            //             onSelect={setEndDate}
            //             className="pointer-events-auto"
            //           />
            //         </PopoverContent>
            //       </Popover>

            //       {(startDate || endDate) && (
            //         <Button
            //           variant="ghost"
            //           size="sm"
            //           onClick={clearDateFilter}
            //           className="h-10 px-3"
            //           title="Clear date filter"
            //         >
            //           <X className="h-4 w-4" />
            //         </Button>
            //       )}
            //     </div>
            //     <div className="flex gap-2">
            //       {statusFilters.map(status => (
            //         <Button
            //           key={status}
            //           variant={statusFilter === status ? "default" : "outline"}
            //           size="sm"
            //           onClick={() => setStatusFilter(status)}
            //           className={cn(
            //             "text-sm rounded-full",
            //             statusFilter === status
            //               ? "bg-primary text-white dark:bg-blue-500 dark:text-white"
            //               : "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            //           )}
            //         >
            //           {status}
            //         </Button>
            //       ))}
            //     </div>
            //   </div>
            // </div>

            // {/* Table Header */}
            // <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-muted/20 border-b text-sm font-medium text-muted-foreground">
            //   <div>Job Name</div>
            //   <div>Created At</div>
            //   <div>Last Run</div>
            //   <div>Status</div>
            //   <div>Actions</div>
            // </div>

//             {/* Table Rows */}
//             <div className="divide-y">
//               {isLoading ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   Loading jobs...
//                 </div>
//               ) : filteredJobs.length === 0 ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   No jobs found.
//                 </div>
//               ) : (
//                 filteredJobs.map((job) => (
//                   <div
//                     key={job.jobId}
//                     className="grid grid-cols-5 gap-4 px-6 py-4 items-center hover:bg-muted/50 transition-colors"
//                   >
//                     <div className="font-medium text-foreground">{job.name}</div>
//                     <div className="text-muted-foreground text-sm">{formatDate(job.createdAt)}</div>
//                     <div className="text-muted-foreground text-sm">{formatDate(job.lastRun)}</div>
//                     <div>
//                       <Badge className={cn(
//                         "text-xs px-2 py-1",
//                         getStatusColor(job.status)
//                       )}>
//                         {job.status}
//                       </Badge>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <Button
//                         size="sm"
//                         onClick={() => handleRunJob(job)}
//                         className="w-8 h-8 rounded-full p-0 bg-primary hover:bg-primary/90"
//                         title="Run Job"
//                       >
//                         <Play className="w-3 h-3" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleViewJob(job)}
//                         className="w-8 h-8 rounded-full p-0"
//                         title="View Reports"
//                       >
//                         <Eye className="w-4 h-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleEditJob(job)}
//                         className="w-8 h-8 rounded-full p-0"
//                         title="Edit Job Stages"
//                       >
//                         <Edit className="w-4 h-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </CardContent>
//         </Card>

//         {/* <EnhancedEditJobDialog
//           job={editingJob}
//           open={!!editingJob}
//           onOpenChange={(open) => !open && setEditingJob(null)}
//           onSave={handleSaveJobStages}
//         />
//         <ViewJobDialog job={viewingJob} open={!!viewingJob} onOpenChange={(open) => !open && setViewingJob(null)} /> */}
//       </div>
//     </div>
//   )
// }

//--------------------------------------------------------------------------------------------------


// import { useState, useEffect } from "react"
// import { useNavigate } from "react-router-dom"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Calendar } from "@/components/ui/calendar"
// import { Search, Play, Eye, Plus, Edit, Calendar as CalendarIcon, X } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"
// import EnhancedEditJobDialog from "@/components/jobs/EnhancedEditJobDialog"
// import ViewJobDialog from "@/components/jobs/ViewJobDialog"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { format } from "date-fns"
// import { cn } from "@/lib/utils"
// import { getJobs, Job as ApiJob } from "@/lib/api"
// import { runStepFunction } from "@/lib/api"  // ✅ Import the API

// // Define JobStage interface
// interface JobStage {
//   id: string
//   name: string
//   type: string
//   status: string
//   description?: string
// }

// // Define LocalJob interface to match ViewJobDialog expectations
// interface LocalJob {
//   id: string
//   name: string
//   category?: string
//   lastRun: string
//   status: string
//   createdAt: string
//   stages: JobStage[]
//   FolderName: string
//   datadestination: string
//   jobId: string
//   triggerType: "SCHEDULE" | "File"
//   etag: string
//   email: string
//   FileName: string
//   scheduleDetails: object
//   jobName: string
//   user_id: string
//   steps: object
//   BucketName: string
//   datasource: string
// }

// const LOCAL_STORAGE_KEY = "app_data"

// // Status filter options
// const statusFilters = ["All", "Completed", "Running", "Failed"]

// export default function Jobs() {
//   const navigate = useNavigate()
//   const { toast } = useToast()
//   const [jobs, setJobs] = useState<LocalJob[]>([])
//   const [searchTerm, setSearchTerm] = useState("")
//   const [editingJob, setEditingJob] = useState<LocalJob | null>(null)
//   const [viewingJob, setViewingJob] = useState<LocalJob | null>(null)
//   const [startDate, setStartDate] = useState<Date | undefined>()
//   const [endDate, setEndDate] = useState<Date | undefined>()
//   const [filteredJobs, setFilteredJobs] = useState<LocalJob[]>([])
//   const [statusFilter, setStatusFilter] = useState<string>("All")
//   const [isLoading, setIsLoading] = useState(false)

//   // Validate localStorage for bucket and key
//   const validateLocalStorage = () => {
//     const bucket = localStorage.getItem("selectedBucket")
//     const key = localStorage.getItem("selectedFile")
//     if (!bucket || !key) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Missing bucket name or key. Please upload the file again.",
//       })
//       navigate("/dashboard/upload")
//       return false
//     }
//     return { bucket, key }
//   }

//   // Fetch jobs from API and load from localStorage
//   useEffect(() => {
//     if (!validateLocalStorage()) return

//     const fetchJobs = async () => {
//       setIsLoading(true)
//       try {
//         const response = await getJobs()
//         if (response.success) {
//           const mappedJobs: LocalJob[] = response.jobs.map((job: ApiJob) => ({
//             id: job.jobId,
//             name: job.jobName,
//             category: "Uncategorized",
//             lastRun: job.LastRun || new Date().toISOString(),
//             status: job.Status,
//             createdAt: job.createdAt || new Date().toISOString(),
//             stages: [],
//             FolderName: job.FolderName,
//             datadestination: job.datadestination,
//             jobId: job.jobId,
//             triggerType: job.triggerType,
//             etag: job.etag,
//             email: job.email,
//             FileName: job.FileName,
//             scheduleDetails: job.scheduleDetails,
//             jobName: job.jobName,
//             user_id: job.user_id,
//             steps: job.steps,
//             BucketName: job.BucketName,
//             datasource: job.datasource,
//           }))
//           setJobs(mappedJobs)
//           localStorage.setItem(
//             LOCAL_STORAGE_KEY,
//             JSON.stringify({ jobs: mappedJobs })
//           )
//         }
//       } catch (error) {
//         toast({
//           title: "Error",
//           description: "Failed to fetch jobs from API. Loading from local storage.",
//           variant: "destructive",
//         })
//         const storedData = localStorage.getItem(LOCAL_STORAGE_KEY)
//         if (storedData) {
//           const { jobs: storedJobs } = JSON.parse(storedData)
//           setJobs(storedJobs || [])
//         }
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchJobs()
//   }, [])

//   // Filter jobs when dependencies change
//   useEffect(() => {
//     filterJobs()
//   }, [jobs, searchTerm, startDate, endDate, statusFilter])

//   const filterJobs = () => {
//     let filtered = jobs.filter((job) =>
//       job.name.toLowerCase().includes(searchTerm.toLowerCase())
//     )

//     if (startDate) {
//       filtered = filtered.filter((job) => {
//         const lastRunDate = new Date(job.lastRun)
//         return !isNaN(lastRunDate.getTime()) && lastRunDate >= startDate
//       })
//     }
//     if (endDate) {
//       filtered = filtered.filter((job) => {
//         const lastRunDate = new Date(job.lastRun)
//         return !isNaN(lastRunDate.getTime()) && lastRunDate <= endDate
//       })
//     }

//     if (statusFilter !== "All") {
//       filtered = filtered.filter((job) => job.status === statusFilter)
//     }

//     setFilteredJobs(filtered)
//   }

//   const clearDateFilter = () => {
//     setStartDate(undefined)
//     setEndDate(undefined)
//   }

//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case "completed":
//         return "bg-green-500 text-white dark:bg-green-600 dark:text-white"
//       case "running":
//         return "bg-blue-500 text-white dark:bg-blue-600 dark:text-white"
//       case "failed":
//         return "bg-red-500 text-white dark:bg-red-600 dark:text-white"
//       default:
//         return "bg-gray-500 text-white dark:bg-gray-600 dark:text-white"
//     }
//   }

//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString)
//       if (isNaN(date.getTime())) {
//         return "Invalid Date"
//       }
//       return format(date, "MMM d, yyyy - h:mm a")
//     } catch {
//       return "Invalid Date"
//     }
//   }

//   // ✅ Updated Run Job
//   const handleRunJob = async (job: LocalJob) => {
//     if (!validateLocalStorage()) return

//     try {
//       const token = localStorage.getItem("authToken") // ✅ get token from localStorage
//       if (!token) {
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: "Missing auth token. Please login again.",
//         })
//         return
//       }

//       const response = await runStepFunction({
//         job_id: job.jobId,
//         token: token,
//       })

//       toast({
//         title: "Job Started",
//         description: `Execution started: ${response.executionArn}`,
//       })
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Run Failed",
//         description: error.message || "Failed to start job",
//       })
//     }
//   }

//   const 
//   handleViewJob = (job: LocalJob) => {
//     if (!validateLocalStorage()) return
//     setViewingJob(job)
//   }

//   const handleEditJob = (job: LocalJob) => {
//     if (!validateLocalStorage()) return
//     setEditingJob(job)
//   }

//   const handleCreateJob = () => {
//     if (!validateLocalStorage()) return
//     navigate("/dashboard/upload")
//   }

//   const handleSaveJobStages = (jobId: string, stages: JobStage[]) => {
//     setJobs((prevJobs) =>
//       prevJobs.map((j) => (j.id === jobId ? { ...j, stages } : j))
//     )
//     toast({ title: "Stages Saved", description: "Job stages have been updated." })
//     setEditingJob(null)
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
//       <div className="container mx-auto p-6">
//         <div className="mb-6 mt-14 flex items-start justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-foreground">
//               All Jobs ({filteredJobs.length})
//             </h1>
//             <p className="text-muted-foreground text-sm mt-1">
//               View and manage your jobs
//             </p>
//           </div>
//           <div className="flex gap-2">
//             <Button
//               onClick={handleCreateJob}
//               className="flex items-center gap-2 bg-primary hover:bg-primary/90"
//             >
//               <Plus className="h-4 w-4" /> Create Job
//             </Button>
//           </div>
//         </div>

//         <Card className="shadow-sm">
//           <CardContent className="p-0">
//             {/* Filters and Search */}
//             {/* ... existing filter UI code ... */}
//             <div className="p-4 border-b bg-muted/30">
//               <div className="flex items-center gap-4 flex-wrap">
//                 <div className="relative w-64">
//                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     placeholder="Search jobs..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-9 bg-background dark:bg-gray-800"
//                   />
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className={cn(
//                           "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
//                           !startDate && "text-muted-foreground"
//                         )}
//                       >
//                         <CalendarIcon className="mr-2 h-4 w-4" />
//                         {startDate ? format(startDate, "MMM dd, yyyy") : "Select a Date"}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
//                       <Calendar
//                         mode="single"
//                         selected={startDate}
//                         onSelect={setStartDate}
//                         className="pointer-events-auto"
//                       />
//                     </PopoverContent>
//                   </Popover>

//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className={cn(
//                           "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
//                           !endDate && "text-muted-foreground"
//                         )}
//                       >
//                         <CalendarIcon className="mr-2 h-4 w-4" />
//                         {endDate ? format(endDate, "MMM dd, yyyy") : "Select a Date"}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
//                       <Calendar
//                         mode="single"
//                         selected={endDate}
//                         onSelect={setEndDate}
//                         className="pointer-events-auto"
//                       />
//                     </PopoverContent>
//                   </Popover>

//                   {(startDate || endDate) && (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={clearDateFilter}
//                       className="h-10 px-3"
//                       title="Clear date filter"
//                     >
//                       <X className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//                 <div className="flex gap-2">
//                   {statusFilters.map(status => (
//                     <Button
//                       key={status}
//                       variant={statusFilter === status ? "default" : "outline"}
//                       size="sm"
//                       onClick={() => setStatusFilter(status)}
//                       className={cn(
//                         "text-sm rounded-full",
//                         statusFilter === status
//                           ? "bg-primary text-white dark:bg-blue-500 dark:text-white"
//                           : "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
//                       )}
//                     >
//                       {status}
//                     </Button>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Table Header */}
//             <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-muted/20 border-b text-sm font-medium text-muted-foreground">
//               <div>Job Name</div>
//               <div>Created At</div>
//               <div>Last Run</div>
//               <div>Status</div>
//               <div>Actions</div>
//             </div>

//             {/* Table Rows */}
//             <div className="divide-y">
//               {isLoading ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   Loading jobs...
//                 </div>
//               ) : filteredJobs.length === 0 ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   No jobs found.
//                 </div>
//               ) : (
//                 filteredJobs.map((job) => (
//                   <div
//                     key={job.jobId}
//                     className="grid grid-cols-5 gap-4 px-6 py-4 items-center hover:bg-muted/50 transition-colors"
//                   >
//                     <div className="font-medium text-foreground">{job.name}</div>
//                     <div className="text-muted-foreground text-sm">
//                       {formatDate(job.createdAt)}
//                     </div>
//                     <div className="text-muted-foreground text-sm">
//                       {formatDate(job.lastRun)}
//                     </div>
//                     <div>
//                       <Badge
//                         className={cn("text-xs px-2 py-1", getStatusColor(job.status))}
//                       >
//                         {job.status}
//                       </Badge>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <Button
//                         size="sm"
//                         onClick={() => handleRunJob(job)}
//                         className="w-8 h-8 rounded-full p-0 bg-primary hover:bg-primary/90"
//                         title="Run Job"
//                       >
//                         <Play className="w-3 h-3" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleViewJob(job)}
//                         className="w-8 h-8 rounded-full p-0"
//                         title="View job"
//                       >
//                         <Eye className="w-4 h-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleEditJob(job)}
//                         className="w-8 h-8 rounded-full p-0"
//                         title="Edit Job Stages"
//                       >
//                         <Edit className="w-4 h-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }

//------------------------------------------------------------------------------------------------

// import { useState, useEffect } from "react"
// import { useNavigate } from "react-router-dom"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Calendar } from "@/components/ui/calendar"
// import { Search, Play, Eye, Plus, Edit, Calendar as CalendarIcon, X } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"
// import EnhancedEditJobDialog from "@/components/jobs/EnhancedEditJobDialog"
// import ViewJobDialog from "@/components/jobs/ViewJobDialog"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { format } from "date-fns"
// import { cn } from "@/lib/utils"
// import { getJobs, Job as ApiJob } from "@/lib/api"
// import { runStepFunction } from "@/lib/api"

// // Define JobStage interface
// interface JobStage {
//   id: string
//   name: string
//   type: string
//   status: string
//   description?: string
// }

// // Define LocalJob interface to match ViewJobDialog expectations
// interface LocalJob {
//   id: string
//   name: string
//   category?: string
//   lastRun: string
//   status: string
//   createdAt: string
//   stages: JobStage[]
//   FolderName: string
//   datadestination: string
//   jobId: string
//   triggerType: "SCHEDULE" | "File"
//   etag: string
//   email: string
//   FileName: string
//   scheduleDetails: object
//   jobName: string
//   user_id: string
//   steps: object
//   BucketName: string
//   datasource: string
// }

// const LOCAL_STORAGE_KEY = "app_data"

// // Status filter options
// const statusFilters = ["All", "Completed", "Running", "Failed"]

// export default function Jobs() {
//   const navigate = useNavigate()
//   const { toast } = useToast()
//   const [jobs, setJobs] = useState<LocalJob[]>([])
//   const [searchTerm, setSearchTerm] = useState("")
//   const [editingJob, setEditingJob] = useState<LocalJob | null>(null)
//   const [viewingJob, setViewingJob] = useState<LocalJob | null>(null)
//   const [startDate, setStartDate] = useState<Date | undefined>()
//   const [endDate, setEndDate] = useState<Date | undefined>()
//   const [filteredJobs, setFilteredJobs] = useState<LocalJob[]>([])
//   const [statusFilter, setStatusFilter] = useState<string>("All")
//   const [isLoading, setIsLoading] = useState(false)

//   // Validate localStorage for bucket and key
//   const validateLocalStorage = () => {
//     const bucket = localStorage.getItem("selectedBucket")
//     const key = localStorage.getItem("selectedFile")
//     if (!bucket || !key) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Missing bucket name or key. Please upload the file again.",
//       })
//       navigate("/dashboard/upload")
//       return false
//     }
//     return { bucket, key }
//   }

//   // Fetch jobs from API and load from localStorage
//   useEffect(() => {
//     if (!validateLocalStorage()) return

//     const fetchJobs = async () => {
//       setIsLoading(true)
//       try {
//         const response = await getJobs()
//         if (response.success) {
//           const mappedJobs: LocalJob[] = response.jobs.map((job: ApiJob) => ({
//             id: job.jobId,
//             name: job.jobName,
//             category: "Uncategorized",
//             lastRun: job.LastRun || new Date().toISOString(),
//             status: job.Status,
//             createdAt: job.createdAt || new Date().toISOString(),
//             stages: [],
//             FolderName: job.FolderName,
//             datadestination: job.datadestination,
//             jobId: job.jobId,
//             triggerType: job.triggerType,
//             etag: job.etag,
//             email: job.email,
//             FileName: job.FileName,
//             scheduleDetails: job.scheduleDetails,
//             jobName: job.jobName,
//             user_id: job.user_id,
//             steps: job.steps,
//             BucketName: job.BucketName,
//             datasource: job.datasource,
//           }))
//           setJobs(mappedJobs)
//           localStorage.setItem(
//             LOCAL_STORAGE_KEY,
//             JSON.stringify({ jobs: mappedJobs })
//           )
//         }
//       } catch (error) {
//         toast({
//           title: "Error",
//           description: "Failed to fetch jobs from API. Loading from local storage.",
//           variant: "destructive",
//         })
//         const storedData = localStorage.getItem(LOCAL_STORAGE_KEY)
//         if (storedData) {
//           const { jobs: storedJobs } = JSON.parse(storedData)
//           setJobs(storedJobs || [])
//         }
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchJobs()
//   }, [])

//   // Filter jobs when dependencies change
//   useEffect(() => {
//     filterJobs()
//   }, [jobs, searchTerm, startDate, endDate, statusFilter])

//   const filterJobs = () => {
//     let filtered = jobs.filter((job) =>
//       job.name.toLowerCase().includes(searchTerm.toLowerCase())
//     )

//     if (startDate) {
//       filtered = filtered.filter((job) => {
//         const lastRunDate = new Date(job.lastRun)
//         return !isNaN(lastRunDate.getTime()) && lastRunDate >= startDate
//       })
//     }
//     if (endDate) {
//       filtered = filtered.filter((job) => {
//         const lastRunDate = new Date(job.lastRun)
//         return !isNaN(lastRunDate.getTime()) && lastRunDate <= endDate
//       })
//     }

//     if (statusFilter !== "All") {
//       filtered = filtered.filter((job) => job.status === statusFilter)
//     }

//     setFilteredJobs(filtered)
//   }

//   const clearDateFilter = () => {
//     setStartDate(undefined)
//     setEndDate(undefined)
//   }

//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case "completed":
//         return "bg-green-500 text-white dark:bg-green-600 dark:text-white"
//       case "running":
//         return "bg-blue-500 text-white dark:bg-blue-600 dark:text-white"
//       case "failed":
//         return "bg-red-500 text-white dark:bg-red-600 dark:text-white"
//       default:
//         return "bg-gray-500 text-white dark:bg-gray-600 dark:text-white"
//     }
//   }

//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString)
//       if (isNaN(date.getTime())) {
//         return "Invalid Date"
//       }
//       return format(date, "MMM d, yyyy - h:mm a")
//     } catch {
//       return "Invalid Date"
//     }
//   }

//   // Run Job
//   const handleRunJob = async (job: LocalJob) => {
//     if (!validateLocalStorage()) return

//     try {
//       const token = localStorage.getItem("authToken")
//       if (!token) {
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: "Missing auth token. Please login again.",
//         })
//         return
//       }

//       const response = await runStepFunction({
//         job_id: job.jobId,
//         token: token,
//       })

//       toast({
//         title: "Job Started",
//         description: `Execution started: ${response.executionArn}`,
//       })
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Run Failed",
//         description: error.message || "Failed to start job",
//       })
//     }
//   }

//   const handleViewJob = (job: LocalJob) => {
//     if (!validateLocalStorage()) return
//     setViewingJob(job)
//   }

//   const handleEditJob = (job: LocalJob) => {
//     if (!validateLocalStorage()) return
//     setEditingJob(job)
//   }

//   const handleCreateJob = () => {
//     if (!validateLocalStorage()) return
//     navigate("/dashboard/upload")
//   }

//   const handleSaveJobStages = (jobId: string, stages: JobStage[]) => {
//     setJobs((prevJobs) =>
//       prevJobs.map((j) => (j.id === jobId ? { ...j, stages } : j))
//     )
//     toast({ title: "Stages Saved", description: "Job stages have been updated." })
//     setEditingJob(null)
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
//       <div className="container mx-auto p-6">
//         <div className="mb-6 mt-14 flex items-start justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-foreground">
//               All Jobs ({filteredJobs.length})
//             </h1>
//             <p className="text-muted-foreground text-sm mt-1">
//               View and manage your jobs
//             </p>
//           </div>
//           <div className="flex gap-2">
//             <Button
//               onClick={handleCreateJob}
//               className="flex items-center gap-2 bg-primary hover:bg-primary/90"
//             >
//               <Plus className="h-4 w-4" /> Create Job
//             </Button>
//           </div>
//         </div>

//         <Card className="shadow-sm">
//           <CardContent className="p-0">
//             <div className="p-4 border-b bg-muted/30">
//               <div className="flex items-center gap-4 flex-wrap">
//                 <div className="relative w-64">
//                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     placeholder="Search jobs..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-9 bg-background dark:bg-gray-800"
//                   />
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className={cn(
//                           "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
//                           !startDate && "text-muted-foreground"
//                         )}
//                       >
//                         <CalendarIcon className="mr-2 h-4 w-4" />
//                         {startDate ? format(startDate, "MMM dd, yyyy") : "Select a Date"}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
//                       <Calendar
//                         mode="single"
//                         selected={startDate}
//                         onSelect={setStartDate}
//                         className="pointer-events-auto"
//                       />
//                     </PopoverContent>
//                   </Popover>

//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className={cn(
//                           "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
//                           !endDate && "text-muted-foreground"
//                         )}
//                       >
//                         <CalendarIcon className="mr-2 h-4 w-4" />
//                         {endDate ? format(endDate, "MMM dd, yyyy") : "Select a Date"}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
//                       <Calendar
//                         mode="single"
//                         selected={endDate}
//                         onSelect={setEndDate}
//                         className="pointer-events-auto"
//                       />
//                     </PopoverContent>
//                   </Popover>

//                   {(startDate || endDate) && (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={clearDateFilter}
//                       className="h-10 px-3"
//                       title="Clear date filter"
//                     >
//                       <X className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//                 <div className="flex gap-2">
//                   {statusFilters.map(status => (
//                     <Button
//                       key={status}
//                       variant={statusFilter === status ? "default" : "outline"}
//                       size="sm"
//                       onClick={() => setStatusFilter(status)}
//                       className={cn(
//                         "text-sm rounded-full",
//                         statusFilter === status
//                           ? "bg-primary text-white dark:bg-blue-500 dark:text-white"
//                           : "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
//                       )}
//                     >
//                       {status}
//                     </Button>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Table Header */}
//             <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-muted/20 border-b text-sm font-medium text-muted-foreground">
//               <div>Job Name</div>
//               <div>Pipelines</div>
//               <div>Created At</div>
//               <div>Last Run</div>
//               <div>Status</div>
//               <div>Actions</div>
//             </div>

//             {/* Table Rows */}
//             <div className="divide-y">
//               {isLoading ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   Loading jobs...
//                 </div>
//               ) : filteredJobs.length === 0 ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   No jobs found.
//                 </div>
//               ) : (
//                 filteredJobs.map((job) => (
//                   <div
//                     key={job.jobId}
//                     className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-muted/50 transition-colors"
//                   >
//                     <div className="font-medium text-foreground">{job.name}</div>
//                     <div className="text-muted-foreground text-sm">
//                       {job.stages.length > 0 ? job.stages.length : "N/A"}
//                     </div>
//                     <div className="text-muted-foreground text-sm">
//                       {formatDate(job.createdAt)}
//                     </div>
//                     <div className="text-muted-foreground text-sm">
//                       {formatDate(job.lastRun)}
//                     </div>
//                     <div>
//                       <Badge
//                         className={cn("text-xs px-2 py-1", getStatusColor(job.status))}
//                       >
//                         {job.status}
//                       </Badge>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <Button
//                         size="sm"
//                         onClick={() => handleRunJob(job)}
//                         className="w-8 h-8 rounded-full p-0 bg-primary hover:bg-primary/90"
//                         title="Run Job"
//                       >
//                         <Play className="w-3 h-3" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleViewJob(job)}
//                         className="w-8 h-8 rounded-full p-0"
//                         title="View job"
//                       >
//                         <Eye className="w-4 h-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleEditJob(job)}
//                         className="w-8 h-8 rounded-full p-0"
//                         title="Edit Job Stages"
//                       >
//                         <Edit className="w-4 h-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }


// import { useState, useEffect } from "react"
// import { useNavigate } from "react-router-dom"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Calendar } from "@/components/ui/calendar"
// import { Search, Play, Eye, Plus, Edit, Calendar as CalendarIcon, X } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"
// import EnhancedEditJobDialog from "@/components/jobs/EnhancedEditJobDialog"
// import ViewJobDialog from "@/components/jobs/ViewJobDialog"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { format } from "date-fns"
// import { cn } from "@/lib/utils"
// import { getJobs, Job as ApiJob, getJobDetails, GetJobDetailsResponse } from "@/lib/api"
// import { runStepFunction } from "@/lib/api"

// // Define JobStage interface
// interface JobStage {
//   id: string
//   name: string
//   type: string
//   status: string
//   description?: string
// }

// // Define LocalJob interface to match ViewJobDialog expectations
// interface LocalJob {
//   id: string
//   name: string
//   category?: string
//   lastRun: string
//   status: string
//   createdAt: string
//   stages: JobStage[]
//   FolderName: string
//   datadestination: string
//   jobId: string
//   triggerType: "SCHEDULE" | "File"
//   etag: string
//   email: string
//   FileName: string
//   scheduleDetails: object
//   jobName: string
//   user_id: string
//   steps: object
//   BucketName: string
//   datasource: string
//   description?: string
//   isConnected?: boolean
// }

// const LOCAL_STORAGE_KEY = "app_data"

// // Status filter options
// const statusFilters = ["All", "Completed", "Running", "Failed"]

// export default function Jobs() {
//   const navigate = useNavigate()
//   const { toast } = useToast()
//   const [jobs, setJobs] = useState<LocalJob[]>([])
//   const [searchTerm, setSearchTerm] = useState("")
//   const [editingJob, setEditingJob] = useState<LocalJob | null>(null)
//   const [viewingJob, setViewingJob] = useState<LocalJob | null>(null)
//   const [startDate, setStartDate] = useState<Date | undefined>()
//   const [endDate, setEndDate] = useState<Date | undefined>()
//   const [filteredJobs, setFilteredJobs] = useState<LocalJob[]>([])
//   const [statusFilter, setStatusFilter] = useState<string>("All")
//   const [isLoading, setIsLoading] = useState(false)

//   // Validate localStorage for bucket and key
//   const validateLocalStorage = () => {
//     const bucket = localStorage.getItem("selectedBucket")
//     const key = localStorage.getItem("selectedFile")
//     if (!bucket || !key) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Missing bucket name or key. Please upload the file again.",
//       })
//       navigate("/dashboard/upload")
//       return false
//     }
//     return { bucket, key }
//   }

//   // Fetch jobs from API and load from localStorage
//   useEffect(() => {
//     if (!validateLocalStorage()) return

//     const fetchJobs = async () => {
//       setIsLoading(true)
//       try {
//         const response = await getJobs()
//         if (response.success) {
//           const mappedJobs: LocalJob[] = response.jobs.map((job: ApiJob) => ({
//             id: job.jobId,
//             name: job.jobName,
//             category: "Uncategorized",
//             lastRun: job.LastRun || new Date().toISOString(),
//             status: job.Status,
//             createdAt: job.createdAt || new Date().toISOString(),
//             stages: [],
//             FolderName: job.FolderName,
//             datadestination: job.datadestination,
//             jobId: job.jobId,
//             triggerType: job.triggerType,
//             etag: job.etag,
//             email: job.email,
//             FileName: job.FileName,
//             scheduleDetails: job.scheduleDetails,
//             jobName: job.jobName,
//             user_id: job.user_id,
//             steps: job.steps,
//             BucketName: job.BucketName,
//             datasource: job.datasource,
//             description: job.description || "No description available",
//             isConnected: job.isConnected || false,
//           }))
//           setJobs(mappedJobs)
//           localStorage.setItem(
//             LOCAL_STORAGE_KEY,
//             JSON.stringify({ jobs: mappedJobs })
//           )
//         }
//       } catch (error) {
//         toast({
//           title: "Error",
//           description: "Failed to fetch jobs from API. Loading from local storage.",
//           variant: "destructive",
//         })
//         const storedData = localStorage.getItem(LOCAL_STORAGE_KEY)
//         if (storedData) {
//           const { jobs: storedJobs } = JSON.parse(storedData)
//           setJobs(storedJobs || [])
//         }
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchJobs()
//   }, [])

//   // Filter jobs when dependencies change
//   useEffect(() => {
//     filterJobs()
//   }, [jobs, searchTerm, startDate, endDate, statusFilter])

//   const filterJobs = () => {
//     let filtered = jobs.filter((job) =>
//       job.name.toLowerCase().includes(searchTerm.toLowerCase())
//     )

//     if (startDate) {
//       filtered = filtered.filter((job) => {
//         const lastRunDate = new Date(job.lastRun)
//         return !isNaN(lastRunDate.getTime()) && lastRunDate >= startDate
//       })
//     }
//     if (endDate) {
//       filtered = filtered.filter((job) => {
//         const lastRunDate = new Date(job.lastRun)
//         return !isNaN(lastRunDate.getTime()) && lastRunDate <= endDate
//       })
//     }

//     if (statusFilter !== "All") {
//       filtered = filtered.filter((job) => job.status === statusFilter)
//     }

//     setFilteredJobs(filtered)
//   }

//   const clearDateFilter = () => {
//     setStartDate(undefined)
//     setEndDate(undefined)
//   }

//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case "completed":
//         return "bg-green-500 text-white dark:bg-green-600 dark:text-white"
//       case "running":
//         return "bg-blue-500 text-white dark:bg-blue-600 dark:text-white"
//       case "failed":
//         return "bg-red-500 text-white dark:bg-red-600 dark:text-white"
//       default:
//         return "bg-gray-500 text-white dark:bg-gray-600 dark:text-white"
//     }
//   }

//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString)
//       if (isNaN(date.getTime())) {
//         return "Invalid Date"
//       }
//       return format(date, "MMM d, yyyy - h:mm a")
//     } catch {
//       return "Invalid Date"
//     }
//   }

//   // Run Job
//   const handleRunJob = async (job: LocalJob) => {
//     if (!validateLocalStorage()) return

//     try {
//       const token = localStorage.getItem("authToken")
//       if (!token) {
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: "Missing auth token. Please login again.",
//         })
//         return
//       }

//       const response = await runStepFunction({
//         job_id: job.jobId,
//         token: token,
//       })

//       toast({
//         title: "Job Started",
//         description: `Execution started: ${response.executionArn}`,
//       })
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Run Failed",
//         description: error.message || "Failed to start job",
//       })
//     }
//   }

//   const handleViewJob = async (job: LocalJob) => {
//     if (!validateLocalStorage()) return

//     try {
//       const response: GetJobDetailsResponse = await getJobDetails(job.jobId)
//       if (response.success && response.job) {
//         const detailedJob: LocalJob = {
//           ...job,
//           name: response.job.name || job.name,
//           lastRun: response.job.LastRun || job.lastRun,
//           status: response.job.Status || job.status,
//           stages: response.job.stages || job.stages || [],
//           description: response.job.description || job.description || "No description available",
//           isConnected: response.job.isConnected !== undefined ? response.job.isConnected : (job.isConnected || false),
//         }
//         setViewingJob(detailedJob)
//       } else {
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: response.message || "Failed to fetch job details.",
//         })
//         setViewingJob(job) // Fallback to the original job data
//       }
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: error.message || "Failed to fetch job details.",
//       })
//       setViewingJob(job) // Fallback to the original job data
//     }
//   }

//   const handleEditJob = (job: LocalJob) => {
//     if (!validateLocalStorage()) return
//     setEditingJob(job)
//   }

//   const handleCreateJob = () => {
//     if (!validateLocalStorage()) return
//     navigate("/dashboard/upload")
//   }

//   const handleSaveJobStages = (jobId: string, stages: JobStage[]) => {
//     setJobs((prevJobs) =>
//       prevJobs.map((j) => (j.id === jobId ? { ...j, stages } : j))
//     )
//     toast({ title: "Stages Saved", description: "Job stages have been updated." })
//     setEditingJob(null)
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
//       <div className="container mx-auto p-6">
//         <div className="mb-6 mt-14 flex items-start justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-foreground">
//               All Jobs ({filteredJobs.length})
//             </h1>
//             <p className="text-muted-foreground text-sm mt-1">
//               View and manage your jobs
//             </p>
//           </div>
//           <div className="flex gap-2">
//             <Button
//               onClick={handleCreateJob}
//               className="flex items-center gap-2 bg-primary hover:bg-primary/90"
//             >
//               <Plus className="h-4 w-4" /> Create Job
//             </Button>
//           </div>
//         </div>

//         <Card className="shadow-sm">
//           <CardContent className="p-0">
//             <div className="p-4 border-b bg-muted/30">
//               <div className="flex items-center gap-4 flex-wrap">
//                 <div className="relative w-64">
//                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     placeholder="Search jobs..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-9 bg-background dark:bg-gray-800"
//                   />
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className={cn(
//                           "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
//                           !startDate && "text-muted-foreground"
//                         )}
//                       >
//                         <CalendarIcon className="mr-2 h-4 w-4" />
//                         {startDate ? format(startDate, "MMM dd, yyyy") : "Select a Date"}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
//                       <Calendar
//                         mode="single"
//                         selected={startDate}
//                         onSelect={setStartDate}
//                         className="pointer-events-auto"
//                       />
//                     </PopoverContent>
//                   </Popover>

//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className={cn(
//                           "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
//                           !endDate && "text-muted-foreground"
//                         )}
//                       >
//                         <CalendarIcon className="mr-2 h-4 w-4" />
//                         {endDate ? format(endDate, "MMM dd, yyyy") : "Select a Date"}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
//                       <Calendar
//                         mode="single"
//                         selected={endDate}
//                         onSelect={setEndDate}
//                         className="pointer-events-auto"
//                       />
//                     </PopoverContent>
//                   </Popover>

//                   {(startDate || endDate) && (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={clearDateFilter}
//                       className="h-10 px-3"
//                       title="Clear date filter"
//                     >
//                       <X className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//                 <div className="flex gap-2">
//                   {statusFilters.map(status => (
//                     <Button
//                       key={status}
//                       variant={statusFilter === status ? "default" : "outline"}
//                       size="sm"
//                       onClick={() => setStatusFilter(status)}
//                       className={cn(
//                         "text-sm rounded-full",
//                         statusFilter === status
//                           ? "bg-primary text-white dark:bg-blue-500 dark:text-white"
//                           : "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
//                       )}
//                     >
//                       {status}
//                     </Button>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Table Header */}
//             <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-muted/20 border-b text-sm font-medium text-muted-foreground">
//               <div>Job Name</div>
//               <div>Pipelines</div>
//               <div>Created At</div>
//               <div>Last Run</div>
//               <div>Status</div>
//               <div>Actions</div>
//             </div>

//             {/* Table Rows */}
//             <div className="divide-y">
//               {isLoading ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   Loading jobs...
//                 </div>
//               ) : filteredJobs.length === 0 ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   No jobs found.
//                 </div>
//               ) : (
//                 filteredJobs.map((job) => (
//                   <div
//                     key={job.jobId}
//                     className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-muted/50 transition-colors"
//                   >
//                     <div className="font-medium text-foreground">{job.name}</div>
//                     <div className="text-muted-foreground text-sm">
//                       {job.stages.length > 0 ? job.stages.length : "N/A"}
//                     </div>
//                     <div className="text-muted-foreground text-sm">
//                       {formatDate(job.createdAt)}
//                     </div>
//                     <div className="text-muted-foreground text-sm">
//                       {formatDate(job.lastRun)}
//                     </div>
//                     <div>
//                       <Badge
//                         className={cn("text-xs px-2 py-1", getStatusColor(job.status))}
//                       >
//                         {job.status}
//                       </Badge>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <Button
//                         size="sm"
//                         onClick={() => handleRunJob(job)}
//                         className="w-8 h-8 rounded-full p-0 bg-primary hover:bg-primary/90"
//                         title="Run Job"
//                       >
//                         <Play className="w-3 h-3" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleViewJob(job)}
//                         className="w-8 h-8 rounded-full p-0"
//                         title="View job"
//                       >
//                         <Eye className="w-4 h-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleEditJob(job)}
//                         className="w-8 h-8 rounded-full p-0"
//                         title="Edit Job Stages"
//                       >
//                         <Edit className="w-4 h-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </CardContent>
//         </Card>

//         {viewingJob && (
//           <ViewJobDialog
//             job={viewingJob}
//             open={!!viewingJob}
//             onOpenChange={(open) => {
//               if (!open) setViewingJob(null)
//             }}
//           />
//         )}

//         {editingJob && (
//           <EnhancedEditJobDialog
//             job={editingJob}
//             open={!!editingJob}
//             onOpenChange={(open) => {
//               if (!open) setEditingJob(null)
//             }}
//             onSave={handleSaveJobStages}
//           />
//         )}
//       </div>
//     </div>
//   )
// }



// import { useState, useEffect } from "react"
// import { useNavigate } from "react-router-dom"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Calendar } from "@/components/ui/calendar"
// import { Search, Play, Eye, Plus, Edit, Calendar as CalendarIcon, X } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"
// import EnhancedEditJobDialog01 from "@/components/jobs/EnhancedEditJobDialog01"
// import ViewJobDialog from "@/components/jobs/ViewJobDialog"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { format } from "date-fns"
// import { cn } from "@/lib/utils"
// import { getJobs, Job as ApiJob, getJobDetails, GetJobDetailsResponse } from "@/lib/api"
// import { runStepFunction } from "@/lib/api"

// // Define JobStage interface
// interface JobStage {
//   id: string
//   name: string
//   type: string
//   status: string
//   description?: string
// }

// // Define LocalJob interface to match ViewJobDialog expectations
// interface LocalJob {
//   id: string
//   name: string
//   category: string // Changed to mandatory to match Job interface
//   lastRun: string
//   status: string
//   createdAt: string
//   stages: JobStage[]
//   FolderName: string
//   datadestination: string
//   jobId: string
//   triggerType: "SCHEDULE" | "File"
//   etag: string
//   email: string
//   FileName: string
//   scheduleDetails: object
//   jobName: string
//   user_id: string
//   steps: object
//   BucketName: string
//   datasource: string
//   description?: string
//   isConnected?: boolean
// }

// const LOCAL_STORAGE_KEY = "app_data"

// // Status filter options
// const statusFilters = ["All", "Completed", "Running", "Failed"]

// export default function Jobs() {
//   const navigate = useNavigate()
//   const { toast } = useToast()
//   const [jobs, setJobs] = useState<LocalJob[]>([])
//   const [searchTerm, setSearchTerm] = useState("")
//   const [editingJob, setEditingJob] = useState<LocalJob | null>(null)
//   const [viewingJob, setViewingJob] = useState<LocalJob | null>(null)
//   const [startDate, setStartDate] = useState<Date | undefined>()
//   const [endDate, setEndDate] = useState<Date | undefined>()
//   const [filteredJobs, setFilteredJobs] = useState<LocalJob[]>([])
//   const [statusFilter, setStatusFilter] = useState<string>("All")
//   const [isLoading, setIsLoading] = useState(false)

//   // Validate localStorage for bucket and key
//   const validateLocalStorage = () => {
//     const bucket = localStorage.getItem("selectedBucket")
//     const key = localStorage.getItem("selectedFile")
//     if (!bucket || !key) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Missing bucket name or key. Please upload the file again.",
//       })
//       navigate("/dashboard/upload")
//       return false
//     }
//     return { bucket, key }
//   }

//   // Fetch jobs from API and load from localStorage
//   useEffect(() => {
//     if (!validateLocalStorage()) return

//     const fetchJobs = async () => {
//       setIsLoading(true)
//       try {
//         const response = await getJobs()
//         if (response.success) {
//           const mappedJobs: LocalJob[] = response.jobs.map((job: ApiJob) => ({
//             id: job.jobId,
//             name: job.jobName,
//             category: job.category || "Uncategorized", // Ensure category is always provided
//             lastRun: job.LastRun || new Date().toISOString(),
//             status: job.Status,
//             createdAt: job.createdAt || new Date().toISOString(),
//             stages: [],
//             FolderName: job.FolderName,
//             datadestination: job.datadestination,
//             jobId: job.jobId,
//             triggerType: job.triggerType,
//             etag: job.etag,
//             email: job.email,
//             FileName: job.FileName,
//             scheduleDetails: job.scheduleDetails,
//             jobName: job.jobName,
//             user_id: job.user_id,
//             steps: job.steps,
//             BucketName: job.BucketName,
//             datasource: job.datasource,
//             description: job.description || "No description available",
//             isConnected: job.isConnected || false,
//           }))
//           setJobs(mappedJobs)
//           localStorage.setItem(
//             LOCAL_STORAGE_KEY,
//             JSON.stringify({ jobs: mappedJobs })
//           )
//         }
//       } catch (error) {
//         toast({
//           title: "Error",
//           description: "Failed to fetch jobs from API. Loading from local storage.",
//           variant: "destructive",
//         })
//         const storedData = localStorage.getItem(LOCAL_STORAGE_KEY)
//         if (storedData) {
//           const { jobs: storedJobs } = JSON.parse(storedData)
//           setJobs(storedJobs || [])
//         }
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchJobs()
//   }, [])

//   // Filter jobs when dependencies change
//   useEffect(() => {
//     filterJobs()
//   }, [jobs, searchTerm, startDate, endDate, statusFilter])

//   const filterJobs = () => {
//     let filtered = jobs.filter((job) =>
//       job.name.toLowerCase().includes(searchTerm.toLowerCase())
//     )

//     if (startDate) {
//       filtered = filtered.filter((job) => {
//         const lastRunDate = new Date(job.lastRun)
//         return !isNaN(lastRunDate.getTime()) && lastRunDate >= startDate
//       })
//     }
//     if (endDate) {
//       filtered = filtered.filter((job) => {
//         const lastRunDate = new Date(job.lastRun)
//         return !isNaN(lastRunDate.getTime()) && lastRunDate <= endDate
//       })
//     }

//     if (statusFilter !== "All") {
//       filtered = filtered.filter((job) => job.status === statusFilter)
//     }

//     setFilteredJobs(filtered)
//   }

//   const clearDateFilter = () => {
//     setStartDate(undefined)
//     setEndDate(undefined)
//   }

//   const getStatusColor = (status?: string) => {
//   if (!status) {
//     return 'text-gray-500'; // Default color for undefined/null status
//   }
//   switch (status.toLowerCase()) {
//     case 'active':
//       return 'text-green-500';
//     case 'inactive':
//       return 'text-red-500';
//     default:
//       return 'text-gray-500';
//   }
// };

//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString)
//       if (isNaN(date.getTime())) {
//         return "Invalid Date"
//       }
//       return format(date, "MMM d, yyyy - h:mm a")
//     } catch {
//       return "Invalid Date"
//     }
//   }

//   // Run Job
//   const handleRunJob = async (job: LocalJob) => {
//     if (!validateLocalStorage()) return

//     try {
//       const token = localStorage.getItem("authToken")
//       if (!token) {
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: "Missing auth token. Please login again.",
//         })
//         return
//       }

//       const response = await runStepFunction({
//         job_id: job.jobId,
//         token: token,
//       })

//       toast({
//         title: "Job Started",
//         description: `Execution started: ${response.executionArn}`,
//       })
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Run Failed",
//         description: error.message || "Failed to start job",
//       })
//     }
//   }

//   const handleViewJob = async (job: LocalJob) => {
//     if (!validateLocalStorage()) return

//     try {
//       const response: GetJobDetailsResponse = await getJobDetails(job.jobId)
//       if (response.success && response.job) {
//         const detailedJob: LocalJob = {
//           ...job,
//           name: response.job.name || job.name,
//           category: response.job.category || job.category || "Uncategorized",
//           lastRun: response.job.LastRun || job.lastRun,
//           status: response.job.Status || job.status,
//           stages: response.job.stages || job.stages || [],
//           description: response.job.description || job.description || "No description available",
//           isConnected: response.job.isConnected !== undefined ? response.job.isConnected : (job.isConnected || false),
//           FileName: response.job.FileName || job.FileName,
//           BucketName: response.job.BucketName || job.BucketName,
//         }
//         setViewingJob(detailedJob)
//       } else {
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: response.message || "Failed to fetch job details.",
//         })
//         setViewingJob(job) // Fallback to the original job data
//       }
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: error.message || "Failed to fetch job details.",
//       })
//       setViewingJob(job) // Fallback to the original job data
//     }
//   }

//   const handleEditJob = (job: LocalJob) => {
//     if (!validateLocalStorage()) return
//     setEditingJob(job)
//   }

//   const handleCreateJob = () => {
//     if (!validateLocalStorage()) return
//     navigate("/dashboard/upload")
//   }

//   const handleSaveJobStages = (jobId: string, stages: JobStage[]) => {
//     setJobs((prevJobs) =>
//       prevJobs.map((j) => (j.id === jobId ? { ...j, stages } : j))
//     )
//     toast({ title: "Stages Saved", description: "Job stages have been updated." })
//     setEditingJob(null)
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
//       <div className="container mx-auto p-6">
//         <div className="mb-6 mt-14 flex items-start justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-foreground">
//               All Jobs ({filteredJobs.length})
//             </h1>
//             <p className="text-muted-foreground text-sm mt-1">
//               View and manage your jobs
//             </p>
//           </div>
//           <div className="flex gap-2">
//             <Button
//               onClick={handleCreateJob}
//               className="flex items-center gap-2 bg-primary hover:bg-primary/90"
//             >
//               <Plus className="h-4 w-4" /> Create Job
//             </Button>
//           </div>
//         </div>

//         <Card className="shadow-sm">
//           <CardContent className="p-0">
//             <div className="p-4 border-b bg-muted/30">
//               <div className="flex items-center gap-4 flex-wrap">
//                 <div className="relative w-64">
//                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     placeholder="Search jobs..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-9 bg-background dark:bg-gray-800"
//                   />
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className={cn(
//                           "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
//                           !startDate && "text-muted-foreground"
//                         )}
//                       >
//                         <CalendarIcon className="mr-2 h-4 w-4" />
//                         {startDate ? format(startDate, "MMM dd, yyyy") : "Select a Date"}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
//                       <Calendar
//                         mode="single"
//                         selected={startDate}
//                         onSelect={setStartDate}
//                         className="pointer-events-auto"
//                       />
//                     </PopoverContent>
//                   </Popover>

//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className={cn(
//                           "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
//                           !endDate && "text-muted-foreground"
//                         )}
//                       >
//                         <CalendarIcon className="mr-2 h-4 w-4" />
//                         {endDate ? format(endDate, "MMM dd, yyyy") : "Select a Date"}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
//                       <Calendar
//                         mode="single"
//                         selected={endDate}
//                         onSelect={setEndDate}
//                         className="pointer-events-auto"
//                       />
//                     </PopoverContent>
//                   </Popover>

//                   {(startDate || endDate) && (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={clearDateFilter}
//                       className="h-10 px-3"
//                       title="Clear date filter"
//                     >
//                       <X className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//                 <div className="flex gap-2">
//                   {statusFilters.map(status => (
//                     <Button
//                       key={status}
//                       variant={statusFilter === status ? "default" : "outline"}
//                       size="sm"
//                       onClick={() => setStatusFilter(status)}
//                       className={cn(
//                         "text-sm rounded-full",
//                         statusFilter === status
//                           ? "bg-primary text-white dark:bg-blue-500 dark:text-white"
//                           : "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
//                       )}
//                     >
//                       {status}
//                     </Button>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Table Header */}
//             <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-muted/20 border-b text-sm font-medium text-muted-foreground">
//               <div>Job Name</div>
//               <div>Pipelines</div>
//               <div>Created At</div>
//               <div>Last Run</div>
//               <div>Status</div>
//               <div>Actions</div>
//             </div>

//             {/* Table Rows */}
//             <div className="divide-y">
//               {isLoading ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   Loading jobs...
//                 </div>
//               ) : filteredJobs.length === 0 ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   No jobs found.
//                 </div>
//               ) : (
//                 filteredJobs.map((job) => (
//                   <div
//                     key={job.jobId}
//                     className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-muted/50 transition-colors"
//                   >
//                     <div className="font-medium text-foreground">{job.name}</div>
//                     <div className="text-muted-foreground text-sm">
//                       {job.stages.length > 0 ? job.stages.length : "N/A"}
//                     </div>
//                     <div className="text-muted-foreground text-sm">
//                       {formatDate(job.createdAt)}
//                     </div>
//                     <div className="text-muted-foreground text-sm">
//                       {formatDate(job.lastRun)}
//                     </div>
//                     <div>
//                       <Badge
//                         className={cn("text-xs px-2 py-1", getStatusColor(job.status))}
//                       >
//                         {job.status}
//                       </Badge>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <Button
//                         size="sm"
//                         onClick={() => handleRunJob(job)}
//                         className="w-8 h-8 rounded-full p-0 bg-primary hover:bg-primary/90"
//                         title="Run Job"
//                       >
//                         <Play className="w-3 h-3" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleViewJob(job)}
//                         className="w-8 h-8 rounded-full p-0"
//                         title="View job"
//                       >
//                         <Eye className="w-4 h-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleEditJob(job)}
//                         className="w-8 h-8 rounded-full p-0"
//                         title="Edit Job Stages"
//                       >
//                         <Edit className="w-4 h-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </CardContent>
//         </Card>

//         {viewingJob && (
//           <ViewJobDialog
//             job={viewingJob}
//             open={!!viewingJob}
//             onOpenChange={(open) => {
//               if (!open) setViewingJob(null)
//             }}
//           />
//         )}

//         {editingJob && (
//           <EnhancedEditJobDialog01
//             job={editingJob}
//             open={!!editingJob}
//             onOpenChange={(open) => {
//               if (!open) setEditingJob(null)
//             }}
//             onSave={handleSaveJobStages}
//           />
//         )}
//       </div>
//     </div>
//   )
// }



// import { useState, useEffect } from "react"
// import { useNavigate } from "react-router-dom"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Calendar } from "@/components/ui/calendar"
// import { Search, Play, Eye, Plus, Edit, Calendar as CalendarIcon, X } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"
// import EnhancedEditJobDialog01 from "@/components/jobs/EnhancedEditJobDialog01"
// import ViewJobDialog from "@/components/jobs/ViewJobDialog"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { format } from "date-fns"
// import { cn } from "@/lib/utils"
// import { getJobs, Job as ApiJob, getJobDetails, GetJobDetailsResponse, editJob, EditJobResponse, JobStepConfig, EditJobRequest } from "@/lib/api"
// import { runStepFunction } from "@/lib/api"

// // Define JobStage interface
// interface JobStage {
//   id: string
//   name: string
//   type: string
//   status: string
//   description?: string
//   config?: Record<string, any>
// }

// // Define LocalJob interface to match ViewJobDialog expectations
// interface LocalJob {
//   id: string
//   name: string
//   category: string
//   lastRun: string
//   status: string
//   createdAt: string
//   stages: JobStage[]
//   FolderName: string
//   datadestination: string
//   jobId: string
//   triggerType: "SCHEDULE" | "File"
//   etag: string
//   email: string
//   FileName: string
//   scheduleDetails: object
//   jobName: string
//   user_id: string
//   steps: JobStepConfig
//   BucketName: string
//   datasource: string
//   description?: string
//   isConnected?: boolean
//   business_logic_rules?: Record<string, string>
// }

// const LOCAL_STORAGE_KEY = "app_data"

// // Status filter options
// const statusFilters = ["All", "Completed", "Running", "Failed"]

// export default function Jobs() {
//   const navigate = useNavigate()
//   const { toast } = useToast()
//   const [jobs, setJobs] = useState<LocalJob[]>([])
//   const [searchTerm, setSearchTerm] = useState("")
//   const [editingJob, setEditingJob] = useState<LocalJob | null>(null)
//   const [viewingJob, setViewingJob] = useState<LocalJob | null>(null)
//   const [startDate, setStartDate] = useState<Date | undefined>()
//   const [endDate, setEndDate] = useState<Date | undefined>()
//   const [filteredJobs, setFilteredJobs] = useState<LocalJob[]>([])
//   const [statusFilter, setStatusFilter] = useState<string>("All")
//   const [isLoading, setIsLoading] = useState(false)

//   // Validate localStorage for bucket and key
//   const validateLocalStorage = () => {
//     const bucket = localStorage.getItem("selectedBucket")
//     const key = localStorage.getItem("selectedFile")
//     if (!bucket || !key) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Missing bucket name or key. Please upload the file again.",
//       })
//       navigate("/dashboard/upload")
//       return false
//     }
//     return { bucket, key }
//   }

//   // Fetch jobs from API and load from localStorage
//   useEffect(() => {
//     if (!validateLocalStorage()) return

//     const fetchJobs = async () => {
//       setIsLoading(true)
//       try {
//         const response = await getJobs()
//         if (response.success) {
//           const mappedJobs: LocalJob[] = response.jobs.map((job: ApiJob) => ({
//             id: job.jobId,
//             name: job.jobName,
//             category: job.category || "Uncategorized",
//             lastRun: job.LastRun || new Date().toISOString(),
//             status: job.Status,
//             createdAt: job.createdAt || new Date().toISOString(),
//             stages: job.steps ? Object.entries(job.steps).map(([type, status], index) => ({
//               id: `stage_${job.jobId}_${index}`,
//               name: type === 'rules' ? 'DQ Rules' :
//                     type === 'ner' ? 'NER' :
//                     type === 'businessLogic' ? 'Business Logic' :
//                     type === 'etl' ? 'ETL' :
//                     type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
//               type,
//               status: typeof status === 'string' ? (status === 'used' || status === 'skipped' ? status : 'pending') : 'pending',
//               description: type === 'upload_center' ? 'Manage data extraction and destination' :
//                            type === 'loading' ? 'Analyze schema of the data' :
//                            type === 'transfer' ? 'Schedule automated job runs' :
//                            type === 'rules' ? 'Validate data quality and consistency' :
//                            type === 'ner' ? 'Named Entity Recognition processing' :
//                            type === 'businessLogic' ? 'Apply business logic to collected data' :
//                            type === 'etl' ? 'Extract, Transform, Load processes' :
//                            `Step ${type}`,
//             })) : [
//               { id: `stage_${job.jobId}_upload`, name: 'Data Upload Center', type: 'upload_center', status: 'pending', description: 'Manage data extraction and destination' },
//               { id: `stage_${job.jobId}_loading`, name: 'Schema Analysis', type: 'loading', status: 'pending', description: 'Analyze schema of the data' },
//               { id: `stage_${job.jobId}_transfer`, name: 'Schedule Jobs', type: 'transfer', status: 'pending', description: 'Schedule automated job runs' },
//             ],
//             FolderName: job.FolderName,
//             datadestination: job.datadestination,
//             jobId: job.jobId,
//             triggerType: job.triggerType,
//             etag: job.etag,
//             email: job.email,
//             FileName: job.FileName,
//             scheduleDetails: job.scheduleDetails,
//             jobName: job.jobName,
//             user_id: job.user_id,
//             steps: job.steps || {
//               rules: 'skipped',
//               ner: 'skipped',
//               businessLogic: 'skipped',
//               etl: 'skipped',
//             },
//             BucketName: job.BucketName,
//             datasource: job.datasource,
//             description: job.description || "No description available",
//             isConnected: job.isConnected || false,
//             business_logic_rules: job.business_logic_rules || {},
//           }))
//           setJobs(mappedJobs)
//           localStorage.setItem(
//             LOCAL_STORAGE_KEY,
//             JSON.stringify({ jobs: mappedJobs })
//           )
//         }
//       } catch (error) {
//         toast({
//           title: "Error",
//           description: "Failed to fetch jobs from API. Loading from local storage.",
//           variant: "destructive",
//         })
//         const storedData = localStorage.getItem(LOCAL_STORAGE_KEY)
//         if (storedData) {
//           const { jobs: storedJobs } = JSON.parse(storedData)
//           setJobs(storedJobs || [])
//         }
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchJobs()
//   }, [])

//   // Filter jobs when dependencies change
//   useEffect(() => {
//     filterJobs()
//   }, [jobs, searchTerm, startDate, endDate, statusFilter])

//   const filterJobs = () => {
//     let filtered = jobs.filter((job) =>
//       job.name.toLowerCase().includes(searchTerm.toLowerCase())
//     )

//     if (startDate) {
//       filtered = filtered.filter((job) => {
//         const lastRunDate = new Date(job.lastRun)
//         return !isNaN(lastRunDate.getTime()) && lastRunDate >= startDate
//       })
//     }
//     if (endDate) {
//       filtered = filtered.filter((job) => {
//         const lastRunDate = new Date(job.lastRun)
//         return !isNaN(lastRunDate.getTime()) && lastRunDate <= endDate
//       })
//     }

//     if (statusFilter !== "All") {
//       filtered = filtered.filter((job) => job.status === statusFilter)
//     }

//     setFilteredJobs(filtered)
//   }

//   const clearDateFilter = () => {
//     setStartDate(undefined)
//     setEndDate(undefined)
//   }

//   const getStatusColor = (status?: string) => {
//     if (!status) {
//       return 'text-gray-500'
//     }
//     switch (status.toLowerCase()) {
//       case 'active':
//         return 'text-green-500'
//       case 'inactive':
//         return 'text-red-500'
//       default:
//         return 'text-gray-500'
//     }
//   }

//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString)
//       if (isNaN(date.getTime())) {
//         return "Invalid Date"
//       }
//       return format(date, "MMM d, yyyy - h:mm a")
//     } catch {
//       return "Invalid Date"
//     }
//   }

//   // Run Job
//   const handleRunJob = async (job: LocalJob) => {
//     if (!validateLocalStorage()) return

//     try {
//       const token = localStorage.getItem("authToken")
//       if (!token) {
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: "Missing auth token. Please login again.",
//         })
//         return
//       }

//       const response = await runStepFunction({
//         job_id: job.jobId,
//         token: token,
//       })

//       toast({
//         title: "Job Started",
//         description: `Execution started: ${response.executionArn}`,
//       })
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Run Failed",
//         description: error.message || "Failed to start job",
//       })
//     }
//   }

//   const handleViewJob = async (job: LocalJob) => {
//     if (!validateLocalStorage()) return

//     try {
//       const response: GetJobDetailsResponse = await getJobDetails(job.jobId)
//       if (response.success && response.job) {
//         const detailedJob: LocalJob = {
//           ...job,
//           name: response.job.name || job.name,
//           category: response.job.category || job.category || "Uncategorized",
//           lastRun: response.job.LastRun || job.lastRun,
//           status: response.job.Status || job.status,
//           stages: response.job.steps ? Object.entries(response.job.steps).map(([type, status], index) => ({
//             id: `stage_${job.jobId}_${index}`,
//             name: type === 'rules' ? 'DQ Rules' :
//                   type === 'ner' ? 'NER' :
//                   type === 'businessLogic' ? 'Business Logic' :
//                   type === 'etl' ? 'ETL' :
//                   type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
//             type,
//             status: typeof status === 'string' ? (status === 'used' || status === 'skipped' ? status : 'pending') : 'pending',
//             description: type === 'upload_center' ? 'Manage data extraction and destination' :
//                          type === 'loading' ? 'Analyze schema of the data' :
//                          type === 'transfer' ? 'Schedule automated job runs' :
//                          type === 'rules' ? 'Validate data quality and consistency' :
//                          type === 'ner' ? 'Named Entity Recognition processing' :
//                          type === 'businessLogic' ? 'Apply business logic to collected data' :
//                          type === 'etl' ? 'Extract, Transform, Load processes' :
//                          `Step ${type}`,
//           })) : [
//             { id: `stage_${job.jobId}_upload`, name: 'Data Upload Center', type: 'upload_center', status: 'pending', description: 'Manage data extraction and destination' },
//             { id: `stage_${job.jobId}_loading`, name: 'Schema Analysis', type: 'loading', status: 'pending', description: 'Analyze schema of the data' },
//             { id: `stage_${job.jobId}_transfer`, name: 'Schedule Jobs', type: 'transfer', status: 'pending', description: 'Schedule automated job runs' },
//           ],
//           description: response.job.description || job.description || "No description available",
//           isConnected: response.job.isConnected !== undefined ? response.job.isConnected : (job.isConnected || false),
//           FileName: response.job.FileName || job.FileName,
//           BucketName: response.job.BucketName || job.BucketName,
//           steps: response.job.steps || job.steps,
//           business_logic_rules: response.job.business_logic_rules || job.business_logic_rules || {},
//         }
//         setViewingJob(detailedJob)
//       } else {
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: response.message || "Failed to fetch job details.",
//         })
//         setViewingJob(job)
//       }
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: error.message || "Failed to fetch job details.",
//       })
//       setViewingJob(job)
//     }
//   }

//   const handleEditJob = async (job: LocalJob) => {
//     if (!validateLocalStorage()) return
//     try {
//       const response = await getJobDetails(job.jobId)
//       if (response.success && response.job) {
//         const detailedJob: LocalJob = {
//           ...job,
//           stages: response.job.steps ? Object.entries(response.job.steps).map(([type, status], index) => ({
//             id: `stage_${job.jobId}_${index}`,
//             name: type === 'rules' ? 'DQ Rules' :
//                   type === 'ner' ? 'NER' :
//                   type === 'businessLogic' ? 'Business Logic' :
//                   type === 'etl' ? 'ETL' :
//                   type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
//             type,
//             status: typeof status === 'string' ? (status === 'used' || status === 'skipped' ? status : 'pending') : 'pending',
//             description: type === 'upload_center' ? 'Manage data extraction and destination' :
//                          type === 'loading' ? 'Analyze schema of the data' :
//                          type === 'transfer' ? 'Schedule automated job runs' :
//                          type === 'rules' ? 'Validate data quality and consistency' :
//                          type === 'ner' ? 'Named Entity Recognition processing' :
//                          type === 'businessLogic' ? 'Apply business logic to collected data' :
//                          type === 'etl' ? 'Extract, Transform, Load processes' :
//                          `Step ${type}`,
//           })) : [
//             { id: `stage_${job.jobId}_upload`, name: 'Data Upload Center', type: 'upload_center', status: 'pending', description: 'Manage data extraction and destination' },
//             { id: `stage_${job.jobId}_loading`, name: 'Schema Analysis', type: 'loading', status: 'pending', description: 'Analyze schema of the data' },
//             { id: `stage_${job.jobId}_transfer`, name: 'Schedule Jobs', type: 'transfer', status: 'pending', description: 'Schedule automated job runs' },
//           ],
//           steps: response.job.steps || job.steps,
//           business_logic_rules: response.job.business_logic_rules || job.business_logic_rules || {},
//         }
//         setEditingJob(detailedJob)
//       } else {
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: response.message || "Failed to fetch job details.",
//         })
//         setEditingJob(job)
//       }
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: error.message || "Failed to fetch job details.",
//       })
//       setEditingJob(job)
//     }
//   }

//   const handleCreateJob = () => {
//     if (!validateLocalStorage()) return
//     navigate("/dashboard/upload")
//   }

//   const handleSaveJobStages = async (jobId: string, stages: JobStage[]) => {
//     if (!validateLocalStorage()) return
//     const job = jobs.find(j => j.id === jobId)
//     if (!job) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Job not found.",
//       })
//       return
//     }

//     try {
//       const steps: JobStepConfig = {
//         rules: stages.some(s => s.type === 'validation') ? 'used' : 'skipped',
//         ner: stages.some(s => s.type === 'processing') ? 'used' : 'skipped',
//         businessLogic: stages.some(s => s.type === 'collection') ? 'used' : 'skipped',
//         etl: stages.some(s => s.type === 'connection') ? 'used' : 'skipped',
//       }

//       const editJobRequest: EditJobRequest = {
//         jobId: job.jobId,
//         jobName: job.jobName,
//         triggerType: job.triggerType,
//         steps,
//         datasource: job.datasource,
//         datadestination: job.datadestination,
//         scheduleDetails: job.scheduleDetails,
//         business_logic_rules: job.business_logic_rules || {},
//       }

//       const response: EditJobResponse = await editJob(editJobRequest)
//       if (response.success) {
//         setJobs((prevJobs) =>
//           prevJobs.map((j) => (j.id === jobId ? { ...j, stages, steps, business_logic_rules: job.business_logic_rules } : j))
//         )
//         toast({
//           title: "Job Updated",
//           description: "Job stages have been updated successfully.",
//         })
//       } else {
//         throw new Error(response.message || "Failed to update job.")
//       }
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: error.message || "Failed to update job stages.",
//       })
//     } finally {
//       setEditingJob(null)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
//       <div className="container mx-auto p-6">
//         <div className="mb-6 mt-14 flex items-start justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-foreground">
//               All Jobs ({filteredJobs.length})
//             </h1>
//             <p className="text-muted-foreground text-sm mt-1">
//               View and manage your jobs
//             </p>
//           </div>
//           <div className="flex gap-2">
//             <Button
//               onClick={handleCreateJob}
//               className="flex items-center gap-2 bg-primary hover:bg-primary/90"
//             >
//               <Plus className="h-4 w-4" /> Create Job
//             </Button>
//           </div>
//         </div>

//         <Card className="shadow-sm">
//           <CardContent className="p-0">
//             <div className="p-4 border-b bg-muted/30">
//               <div className="flex items-center gap-4 flex-wrap">
//                 <div className="relative w-64">
//                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     placeholder="Search jobs..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-9 bg-background dark:bg-gray-800"
//                   />
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className={cn(
//                           "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
//                           !startDate && "text-muted-foreground"
//                         )}
//                       >
//                         <CalendarIcon className="mr-2 h-4 w-4" />
//                         {startDate ? format(startDate, "MMM dd, yyyy") : "Select a Date"}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
//                       <Calendar
//                         mode="single"
//                         selected={startDate}
//                         onSelect={setStartDate}
//                         className="pointer-events-auto"
//                       />
//                     </PopoverContent>
//                   </Popover>

//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className={cn(
//                           "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
//                           !endDate && "text-muted-foreground"
//                         )}
//                       >
//                         <CalendarIcon className="mr-2 h-4 w-4" />
//                         {endDate ? format(endDate, "MMM dd, yyyy") : "Select a Date"}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
//                       <Calendar
//                         mode="single"
//                         selected={endDate}
//                         onSelect={setEndDate}
//                         className="pointer-events-auto"
//                       />
//                     </PopoverContent>
//                   </Popover>

//                   {(startDate || endDate) && (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={clearDateFilter}
//                       className="h-10 px-3"
//                       title="Clear date filter"
//                     >
//                       <X className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//                 <div className="flex gap-2">
//                   {statusFilters.map(status => (
//                     <Button
//                       key={status}
//                       variant={statusFilter === status ? "default" : "outline"}
//                       size="sm"
//                       onClick={() => setStatusFilter(status)}
//                       className={cn(
//                         "text-sm rounded-full",
//                         statusFilter === status
//                           ? "bg-primary text-white dark:bg-blue-500 dark:text-white"
//                           : "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
//                       )}
//                     >
//                       {status}
//                     </Button>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Table Header */}
//             <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-muted/20 border-b text-sm font-medium text-muted-foreground">
//               <div>Job Name</div>
//               <div>Pipelines</div>
//               <div>Created At</div>
//               <div>Last Run</div>
//               <div>Status</div>
//               <div>Actions</div>
//             </div>

//             {/* Table Rows */}
//             <div className="divide-y">
//               {isLoading ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   Loading jobs...
//                 </div>
//               ) : filteredJobs.length === 0 ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   No jobs found.
//                 </div>
//               ) : (
//                 filteredJobs.map((job) => (
//                   <div
//                     key={job.jobId}
//                     className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-muted/50 transition-colors"
//                   >
//                     <div className="font-medium text-foreground">{job.name}</div>
//                     <div className="text-muted-foreground text-sm">
//                       {job.stages.length > 0 ? job.stages.length : "N/A"}
//                     </div>
//                     <div className="text-muted-foreground text-sm">
//                       {formatDate(job.createdAt)}
//                     </div>
//                     <div className="text-muted-foreground text-sm">
//                       {formatDate(job.lastRun)}
//                     </div>
//                     <div>
//                       <Badge
//                         className={cn("text-xs px-2 py-1", getStatusColor(job.status))}
//                       >
//                         {job.status}
//                       </Badge>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <Button
//                         size="sm"
//                         onClick={() => handleRunJob(job)}
//                         className="w-8 h-8 rounded-full p-0 bg-primary hover:bg-primary/90"
//                         title="Run Job"
//                       >
//                         <Play className="w-3 h-3" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleViewJob(job)}
//                         className="w-8 h-8 rounded-full p-0"
//                         title="View job"
//                       >
//                         <Eye className="w-4 h-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleEditJob(job)}
//                         className="w-8 h-8 rounded-full p-0"
//                         title="Edit Job Stages"
//                       >
//                         <Edit className="w-4 h-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </CardContent>
//         </Card>

//         {viewingJob && (
//           <ViewJobDialog
//             job={viewingJob}
//             open={!!viewingJob}
//             onOpenChange={(open) => {
//               if (!open) setViewingJob(null)
//             }}
//           />
//         )}

//         {editingJob && (
//           <EnhancedEditJobDialog01
//             job={editingJob}
//             open={!!editingJob}
//             onOpenChange={(open) => {
//               if (!open) setEditingJob(null)
//             }}
//             onSave={handleSaveJobStages}
//           />
//         )}
//       </div>
//     </div>
//   )
// }


// import { useState, useEffect } from "react"
// import { useNavigate } from "react-router-dom"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Calendar } from "@/components/ui/calendar"
// import { Search, Play, Eye, Plus, Edit, CalendarIcon, X } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"
// import EnhancedEditJobDialog01 from "@/components/jobs/EnhancedEditJobDialog01"
// import ViewJobDialog from "@/components/jobs/ViewJobDialog"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { format } from "date-fns"
// import { cn } from "@/lib/utils"
// import { getJobs, Job as ApiJob, getJobDetails, GetJobDetailsResponse, editJob, EditJobResponse, JobStepConfig, EditJobRequest } from "@/lib/api"
// import { runStepFunction } from "@/lib/api"

// // Define BASE_URL constant (replace with your actual API base URL)
// const BASE_URL = "http://13.233.244.191:8000"

// // Define JobStatusResponse interface
// export interface JobStatusResponse {
//   success: boolean;
//   message: string;
//   jobId: string;
//   Status: string;
//   LastRun: string;
// }

// // Define JobStage interface
// interface JobStage {
//   id: string
//   name: string
//   type: string
//   status: string
//   description?: string
//   config?: Record<string, any>
// }

// // Define LocalJob interface to match ViewJobDialog expectations
// interface LocalJob {
//   id: string
//   name: string
//   category: string
//   lastRun: string
//   status: string
//   createdAt: string
//   stages: JobStage[]
//   FolderName: string
//   datadestination: string
//   jobId: string
//   triggerType: "SCHEDULE" | "File"
//   etag: string
//   email: string
//   FileName: string
//   scheduleDetails: object
//   jobName: string
//   user_id: string
//   steps: JobStepConfig
//   BucketName: string
//   datasource: string
//   description?: string
//   isConnected?: boolean
//   business_logic_rules?: Record<string, string>
// }

// const LOCAL_STORAGE_KEY = "app_data"

// // Status filter options
// const statusFilters = ["All", "COMPLETED", "RUNNING", "FAILED"]

// // getJobStatus function
// export const getJobStatus = async (jobId: string): Promise<JobStatusResponse> => {
//   const token = localStorage.getItem("authToken");
//   const response = await fetch(`${BASE_URL}/get_status?job_id=${jobId}`, {
//     method: "GET",
//     headers: { "Authorization": `Bearer ${token}` },
//   });

//   if (!response.ok) {
//     const errorText = await response.text();
//     console.error(
//       `API Error (${response.status}) at ${new Date().toISOString()}: ${errorText}`
//     );
//     throw new Error(
//       `Failed to fetch job status: ${response.status} - ${errorText}`
//     );
//   }

//   const result: JobStatusResponse = await response.json();
//   console.log("✅ Get Job Status Response:", result);
//   return result;
// };

// export default function Jobs() {
//   const navigate = useNavigate()
//   const { toast } = useToast()
//   const [jobs, setJobs] = useState<LocalJob[]>([])
//   const [searchTerm, setSearchTerm] = useState("")
//   const [editingJob, setEditingJob] = useState<LocalJob | null>(null)
//   const [viewingJob, setViewingJob] = useState<LocalJob | null>(null)
//   const [startDate, setStartDate] = useState<Date | undefined>()
//   const [endDate, setEndDate] = useState<Date | undefined>()
//   const [filteredJobs, setFilteredJobs] = useState<LocalJob[]>([])
//   const [statusFilter, setStatusFilter] = useState<string>("All")
//   const [isLoading, setIsLoading] = useState(false)

//   // Validate localStorage for bucket and key
//   const validateLocalStorage = () => {
//     const bucket = localStorage.getItem("selectedBucket")
//     const key = localStorage.getItem("selectedFile")
//     if (!bucket || !key) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Missing bucket name or key. Please upload the file again.",
//       })
//       navigate("/dashboard/upload")
//       return false
//     }
//     return { bucket, key }
//   }

//   // Fetch jobs from API and load from localStorage
//   useEffect(() => {
//     if (!validateLocalStorage()) return

//     const fetchJobs = async () => {
//       setIsLoading(true)
//       try {
//         const response = await getJobs()
//         if (response.success) {
//           const mappedJobs: LocalJob[] = response.jobs.map((job: ApiJob) => ({
//             id: job.jobId,
//             name: job.jobName,
//             category: job.category || "Uncategorized",
//             lastRun: job.LastRun || new Date().toISOString(),
//             status: job.Status,
//             createdAt: job.createdAt || new Date().toISOString(),
//             stages: job.steps ? Object.entries(job.steps).map(([type, status], index) => ({
//               id: `stage_${job.jobId}_${index}`,
//               name: type === 'rules' ? 'DQ Rules' :
//                     type === 'ner' ? 'NER' :
//                     type === 'businessLogic' ? 'Business Logic' :
//                     type === 'etl' ? 'ETL' :
//                     type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
//               type,
//               status: typeof status === 'string' ? (status === 'used' || status === 'skipped' ? status : 'pending') : 'pending',
//               description: type === 'upload_center' ? 'Manage data extraction and destination' :
//                            type === 'loading' ? 'Analyze schema of the data' :
//                            type === 'transfer' ? 'Schedule automated job runs' :
//                            type === 'rules' ? 'Validate data quality and consistency' :
//                            type === 'ner' ? 'Named Entity Recognition processing' :
//                            type === 'businessLogic' ? 'Apply business logic to collected data' :
//                            type === 'etl' ? 'Extract, Transform, Load processes' :
//                            `Step ${type}`,
//             })) : [
//               { id: `stage_${job.jobId}_upload`, name: 'Data Upload Center', type: 'upload_center', status: 'pending', description: 'Manage data extraction and destination' },
//               { id: `stage_${job.jobId}_loading`, name: 'Schema Analysis', type: 'loading', status: 'pending', description: 'Analyze schema of the data' },
//               { id: `stage_${job.jobId}_transfer`, name: 'Schedule Jobs', type: 'transfer', status: 'pending', description: 'Schedule automated job runs' },
//             ],
//             FolderName: job.FolderName,
//             datadestination: job.datadestination,
//             jobId: job.jobId,
//             triggerType: job.triggerType,
//             etag: job.etag,
//             email: job.email,
//             FileName: job.FileName,
//             scheduleDetails: job.scheduleDetails,
//             jobName: job.jobName,
//             user_id: job.user_id,
//             steps: job.steps || {
//               rules: 'skipped',
//               ner: 'skipped',
//               businessLogic: 'skipped',
//               etl: 'skipped',
//             },
//             BucketName: job.BucketName,
//             datasource: job.datasource,
//             description: job.description || "No description available",
//             isConnected: job.isConnected || false,
//             business_logic_rules: job.business_logic_rules || {},
//           }))
//           setJobs(mappedJobs)
//           localStorage.setItem(
//             LOCAL_STORAGE_KEY,
//             JSON.stringify({ jobs: mappedJobs })
//           )
//         }
//       } catch (error) {
//         toast({
//           title: "Error",
//           description: "Failed to fetch jobs from API. Loading from local storage.",
//           variant: "destructive",
//         })
//         const storedData = localStorage.getItem(LOCAL_STORAGE_KEY)
//         if (storedData) {
//           const { jobs: storedJobs } = JSON.parse(storedData)
//           setJobs(storedJobs || [])
//         }
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchJobs()
//   }, [])

//   // Poll job statuses periodically
//   useEffect(() => {
//     const pollJobStatuses = async () => {
//       if (!validateLocalStorage()) return

//       try {
//         const statusPromises = jobs
//           .filter(job => job.status === 'Running')
//           .map(job => getJobStatus(job.jobId))
//         const statusResponses = await Promise.all(statusPromises)

//         setJobs(prevJobs =>
//           prevJobs.map(job => {
//             const statusUpdate = statusResponses.find(res => res.jobId === job.jobId)
//             if (statusUpdate && statusUpdate.success) {
//               return {
//                 ...job,
//                 status: statusUpdate.Status,
//                 lastRun: statusUpdate.LastRun,
//               }
//             }
//             return job
//           })
//         )
//       } catch (error: any) {
//         console.error('Error polling job statuses:', error)
//       }
//     }

//     // Poll every 30 seconds for running jobs
//     const interval = setInterval(() => {
//       if (jobs.some(job => job.status === 'Running')) {
//         pollJobStatuses()
//       }
//     }, 30000)

//     // Initial poll
//     if (jobs.some(job => job.status === 'Running')) {
//       pollJobStatuses()
//     }

//     return () => clearInterval(interval)
//   }, [jobs])

//   // Filter jobs when dependencies change
//   useEffect(() => {
//     filterJobs()
//   }, [jobs, searchTerm, startDate, endDate, statusFilter])

//   const filterJobs = () => {
//     let filtered = jobs.filter((job) =>
//       job.name.toLowerCase().includes(searchTerm.toLowerCase())
//     )

//     if (startDate) {
//       filtered = filtered.filter((job) => {
//         const lastRunDate = new Date(job.lastRun)
//         return !isNaN(lastRunDate.getTime()) && lastRunDate >= startDate
//       })
//     }
//     if (endDate) {
//       filtered = filtered.filter((job) => {
//         const lastRunDate = new Date(job.lastRun)
//         return !isNaN(lastRunDate.getTime()) && lastRunDate <= endDate
//       })
//     }

//     if (statusFilter !== "All") {
//       filtered = filtered.filter((job) => job.status === statusFilter)
//     }

//     setFilteredJobs(filtered)
//   }

//   const clearDateFilter = () => {
//     setStartDate(undefined)
//     setEndDate(undefined)
//   }

//   const getStatusColor = (status?: string) => {
//     if (!status) {
//       return 'text-gray-500'
//     }
//     switch (status.toLowerCase()) {
//       case 'active':
//       case 'running':
//         return 'text-green-100'
//       case 'inactive':
//       case 'failed':
//         return 'text-red-100'
//       case 'completed':
//         return 'text-blue-100'
//       default:
//         return 'text-gray-100'
//     }
//   }

//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString)
//       if (isNaN(date.getTime())) {
//         return "Invalid Date"
//       }
//       return format(date, "MMM d, yyyy - h:mm a")
//     } catch {
//       return "Invalid Date"
//     }
//   }

//   // Run Job
//   const handleRunJob = async (job: LocalJob) => {
//     if (!validateLocalStorage()) return

//     try {
//       const token = localStorage.getItem("authToken")
//       if (!token) {
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: "Missing auth token. Please login again.",
//         })
//         return
//       }

//       const response = await runStepFunction({
//         job_id: job.jobId,
//         token: token,
//       })

//       // Update job status to Running immediately
//       setJobs(prevJobs =>
//         prevJobs.map(j =>
//           j.jobId === job.jobId ? { ...j, status: 'Running' } : j
//         )
//       )

//       toast({
//         title: "Job Started",
//         description: `Execution started: ${response.executionArn}`,
//       })

//       // Fetch immediate status update
//       try {
//         const statusResponse = await getJobStatus(job.jobId)
//         if (statusResponse.success) {
//           setJobs(prevJobs =>
//             prevJobs.map(j =>
//               j.jobId === job.jobId
//                 ? {
//                     ...j,
//                     status: statusResponse.Status,
//                     lastRun: statusResponse.LastRun,
//                   }
//                 : j
//             )
//           )
//         }
//       } catch (error: any) {
//         console.error('Error fetching immediate job status:', error)
//       }
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Run Failed",
//         description: error.message || "Failed to start job",
//       })
//     }
//   }

//   const handleViewJob = async (job: LocalJob) => {
//     if (!validateLocalStorage()) return

//     try {
//       const response: GetJobDetailsResponse = await getJobDetails(job.jobId)
//       if (response.success && response.job) {
//         const detailedJob: LocalJob = {
//           ...job,
//           name: response.job.name || job.name,
//           category: response.job.category || job.category || "Uncategorized",
//           lastRun: response.job.LastRun || job.lastRun,
//           status: response.job.Status || job.status,
//           stages: response.job.steps ? Object.entries(response.job.steps).map(([type, status], index) => ({
//             id: `stage_${job.jobId}_${index}`,
//             name: type === 'rules' ? 'DQ Rules' :
//                   type === 'ner' ? 'NER' :
//                   type === 'businessLogic' ? 'Business Logic' :
//                   type === 'etl' ? 'ETL' :
//                   type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
//             type,
//             status: typeof status === 'string' ? (status === 'used' || status === 'skipped' ? status : 'pending') : 'pending',
//             description: type === 'upload_center' ? 'Manage data extraction and destination' :
//                          type === 'loading' ? 'Analyze schema of the data' :
//                          type === 'transfer' ? 'Schedule automated job runs' :
//                          type === 'rules' ? 'Validate data quality and consistency' :
//                          type === 'ner' ? 'Named Entity Recognition processing' :
//                          type === 'businessLogic' ? 'Apply business logic to collected data' :
//                          type === 'etl' ? 'Extract, Transform, Load processes' :
//                          `Step ${type}`,
//           })) : [
//             { id: `stage_${job.jobId}_upload`, name: 'Data Upload Center', type: 'upload_center', status: 'pending', description: 'Manage data extraction and destination' },
//             { id: `stage_${job.jobId}_loading`, name: 'Schema Analysis', type: 'loading', status: 'pending', description: 'Analyze schema of the data' },
//             { id: `stage_${job.jobId}_transfer`, name: 'Schedule Jobs', type: 'transfer', status: 'pending', description: 'Schedule automated job runs' },
//           ],
//           description: response.job.description || job.description || "No description available",
//           isConnected: response.job.isConnected !== undefined ? response.job.isConnected : (job.isConnected || false),
//           FileName: response.job.FileName || job.FileName,
//           BucketName: response.job.BucketName || job.BucketName,
//           steps: response.job.steps || job.steps,
//           business_logic_rules: response.job.business_logic_rules || job.business_logic_rules || {},
//         }
//         setViewingJob(detailedJob)
//       } else {
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: response.message || "Failed to fetch job details.",
//         })
//         setViewingJob(job)
//       }
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: error.message || "Failed to fetch job details.",
//       })
//       setViewingJob(job)
//     }
//   }

//   const handleEditJob = async (job: LocalJob) => {
//     if (!validateLocalStorage()) return
//     try {
//       const response = await getJobDetails(job.jobId)
//       if (response.success && response.job) {
//         const detailedJob: LocalJob = {
//           ...job,
//           stages: response.job.steps ? Object.entries(response.job.steps).map(([type, status], index) => ({
//             id: `stage_${job.jobId}_${index}`,
//             name: type === 'rules' ? 'DQ Rules' :
//                   type === 'ner' ? 'NER' :
//                   type === 'businessLogic' ? 'Business Logic' :
//                   type === 'etl' ? 'ETL' :
//                   type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
//             type,
//             status: typeof status === 'string' ? (status === 'used' || status === 'skipped' ? status : 'pending') : 'pending',
//             description: type === 'upload_center' ? 'Manage data extraction and destination' :
//                          type === 'loading' ? 'Analyze schema of the data' :
//                          type === 'transfer' ? 'Schedule automated job runs' :
//                          type === 'rules' ? 'Validate data quality and consistency' :
//                          type === 'ner' ? 'Named Entity Recognition processing' :
//                          type === 'businessLogic' ? 'Apply business logic to collected data' :
//                          type === 'etl' ? 'Extract, Transform, Load processes' :
//                          `Step ${type}`,
//           })) : [
//             { id: `stage_${job.jobId}_upload`, name: 'Data Upload Center', type: 'upload_center', status: 'pending', description: 'Manage data extraction and destination' },
//             { id: `stage_${job.jobId}_loading`, name: 'Schema Analysis', type: 'loading', status: 'pending', description: 'Analyze schema of the data' },
//             { id: `stage_${job.jobId}_transfer`, name: 'Schedule Jobs', type: 'transfer', status: 'pending', description: 'Schedule automated job runs' },
//           ],
//           steps: response.job.steps || job.steps,
//           business_logic_rules: response.job.business_logic_rules || job.business_logic_rules || {},
//         }
//         setEditingJob(detailedJob)
//       } else {
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: response.message || "Failed to fetch job details.",
//         })
//         setEditingJob(job)
//       }
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: error.message || "Failed to fetch job details.",
//       })
//       setEditingJob(job)
//     }
//   }

//   const handleCreateJob = () => {
//     if (!validateLocalStorage()) return
//     navigate("/dashboard/upload")
//   }

//   const handleSaveJobStages = async (jobId: string, stages: JobStage[]) => {
//     if (!validateLocalStorage()) return
//     const job = jobs.find(j => j.id === jobId)
//     if (!job) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Job not found.",
//       })
//       return
//     }

//     try {
//       const steps: JobStepConfig = {
//         rules: stages.some(s => s.type === 'validation') ? 'used' : 'skipped',
//         ner: stages.some(s => s.type === 'processing') ? 'used' : 'skipped',
//         businessLogic: stages.some(s => s.type === 'collection') ? 'used' : 'skipped',
//         etl: stages.some(s => s.type === 'connection') ? 'used' : 'skipped',
//       }

//       const editJobRequest: EditJobRequest = {
//         jobId: job.jobId,
//         jobName: job.jobName,
//         triggerType: job.triggerType,
//         steps,
//         datasource: job.datasource,
//         datadestination: job.datadestination,
//         scheduleDetails: job.scheduleDetails,
//         business_logic_rules: job.business_logic_rules || {},
//       }

//       const response: EditJobResponse = await editJob(editJobRequest)
//       if (response.success) {
//         setJobs((prevJobs) =>
//           prevJobs.map((j) => (j.id === jobId ? { ...j, stages, steps, business_logic_rules: job.business_logic_rules } : j))
//         )
//         toast({
//           title: "Job Updated",
//           description: "Job stages have been updated successfully.",
//         })
//       } else {
//         throw new Error(response.message || "Failed to update job.")
//       }
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: error.message || "Failed to update job stages.",
//       })
//     } finally {
//       setEditingJob(null)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
//       <div className="container mx-auto p-6">
//         <div className="mb-6 mt-14 flex items-start justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-foreground">
//               All Jobs ({filteredJobs.length})
//             </h1>
//             <p className="text-muted-foreground text-sm mt-1">
//               View and manage your jobs
//             </p>
//           </div>
//           <div className="flex gap-2">
//             <Button
//               onClick={handleCreateJob}
//               className="flex items-center gap-2 bg-primary hover:bg-primary/90"
//             >
//               <Plus className="h-4 w-4" /> Create Job
//             </Button>
//           </div>
//         </div>

//         <Card className="shadow-sm">
//           <CardContent className="p-0">
//             <div className="p-4 border-b bg-muted/30">
//               <div className="flex items-center gap-4 flex-wrap">
//                 <div className="relative w-64">
//                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     placeholder="Search jobs..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-9 bg-background dark:bg-gray-800"
//                   />
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className={cn(
//                           "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
//                           !startDate && "text-muted-foreground"
//                         )}
//                       >
//                         <CalendarIcon className="mr-2 h-4 w-4" />
//                         {startDate ? format(startDate, "MMM dd, yyyy") : "Select a Date"}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
//                       <Calendar
//                         mode="single"
//                         selected={startDate}
//                         onSelect={setStartDate}
//                         className="pointer-events-auto"
//                       />
//                     </PopoverContent>
//                   </Popover>

//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className={cn(
//                           "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
//                           !endDate && "text-muted-foreground"
//                         )}
//                       >
//                         <CalendarIcon className="mr-2 h-4 w-4" />
//                         {endDate ? format(endDate, "MMM dd, yyyy") : "Select a Date"}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
//                       <Calendar
//                         mode="single"
//                         selected={endDate}
//                         onSelect={setEndDate}
//                         className="pointer-events-auto"
//                       />
//                     </PopoverContent>
//                   </Popover>

//                   {(startDate || endDate) && (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={clearDateFilter}
//                       className="h-10 px-3"
//                       title="Clear date filter"
//                     >
//                       <X className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//                 <div className="flex gap-2">
//                   {statusFilters.map(status => (
//                     <Button
//                       key={status}
//                       variant={statusFilter === status ? "default" : "outline"}
//                       size="sm"
//                       onClick={() => setStatusFilter(status)}
//                       className={cn(
//                         "text-sm rounded-full",
//                         statusFilter === status
//                           ? "bg-primary text-white dark:bg-blue-500 dark:text-white"
//                           : "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
//                       )}
//                     >
//                       {status}
//                     </Button>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Table Header */}
//             <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-muted/20 border-b text-sm font-medium text-muted-foreground">
//               <div>Job Name</div>
//               <div>Pipelines</div>
//               <div>Created At</div>
//               <div>Last Run</div>
//               <div>Status</div>
//               <div>Actions</div>
//             </div>

//             {/* Table Rows */}
//             <div className="divide-y">
//               {isLoading ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   Loading jobs...
//                 </div>
//               ) : filteredJobs.length === 0 ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   No jobs found.
//                 </div>
//               ) : (
//                 filteredJobs.map((job) => (
//                   <div
//                     key={job.jobId}
//                     className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-muted/50 transition-colors"
//                   >
//                     <div className="font-medium text-foreground">{job.name}</div>
//                     <div className="text-muted-foreground text-sm">
//                       {job.stages.length > 0 ? job.stages.length : "N/A"}
//                     </div>
//                     <div className="text-muted-foreground text-sm">
//                       {formatDate(job.createdAt)}
//                     </div>
//                     <div className="text-muted-foreground text-sm">
//                       {formatDate(job.lastRun)}
//                     </div>
//                     <div>
//                       <Badge
//                         className={cn("text-xs px-2 py-1", getStatusColor(job.status))}
//                       >
//                         {job.status}
//                       </Badge>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <Button
//                         size="sm"
//                         onClick={() => handleRunJob(job)}
//                         className="w-8 h-8 rounded-full p-0 bg-primary hover:bg-primary/90"
//                         title="Run Job"
//                       >
//                         <Play className="w-3 h-3" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleViewJob(job)}
//                         className="w-8 h-8 rounded-full p-0"
//                         title="View job"
//                       >
//                         <Eye className="w-4 h-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleEditJob(job)}
//                         className="w-8 h-8 rounded-full p-0"
//                         title="Edit Job Stages"
//                       >
//                         <Edit className="w-4 h-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </CardContent>
//         </Card>

//         {viewingJob && (
//           <ViewJobDialog
//             job={viewingJob}
//             open={!!viewingJob}
//             onOpenChange={(open) => {
//               if (!open) setViewingJob(null)
//             }}
//           />
//         )}

//         {editingJob && (
//           <EnhancedEditJobDialog01
//             job={editingJob}
//             open={!!editingJob}
//             onOpenChange={(open) => {
//               if (!open) setEditingJob(null)
//             }}
//             onSave={handleSaveJobStages}
//           />
//         )}
//       </div>
//     </div>
//   )
// }

// recent my code

// import { useState, useEffect } from "react"
// import { useNavigate } from "react-router-dom"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Calendar } from "@/components/ui/calendar"
// import { Search, Play, Eye, Plus, Edit, CalendarIcon, X } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"
// import EnhancedEditJobDialog01 from "@/components/jobs/EnhancedEditJobDialog01"
// import ViewJobDialog from "@/components/jobs/ViewJobDialog"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { format } from "date-fns"
// import { cn } from "@/lib/utils"
// import { getJobs, Job as ApiJob, getJobDetails, GetJobDetailsResponse, editJob, EditJobResponse, JobStepConfig, EditJobRequest } from "@/lib/api"
// import { runStepFunction } from "@/lib/api"

// // Define BASE_URL constant (replace with your actual API base URL)
// const BASE_URL = "https://ingestq-backend-954554516.ap-south-1.elb.amazonaws.com"

// // Define JobStatusResponse interface
// export interface JobStatusResponse {
//   success: boolean;
//   message: string;
//   jobId: string;
//   Status: string;
//   LastRun: string;
// }

// // Define JobStage interface
// interface JobStage {
//   id: string
//   name: string
//   type: string
//   status: string
//   description?: string
//   config?: Record<string, any>
// }

// // Define LocalJob interface to match ViewJobDialog expectations
// interface LocalJob {
//   id: string
//   name: string
//   category: string
//   lastRun: string
//   status: string
//   createdAt: string
//   stages: JobStage[]
//   FolderName: string
//   datadestination: string
//   jobId: string
//   triggerType: "SCHEDULE" | "File"
//   etag: string
//   email: string
//   FileName: string
//   scheduleDetails: object
//   jobName: string
//   user_id: string
//   steps: JobStepConfig
//   BucketName: string
//   datasource: string
//   description?: string
//   isConnected?: boolean
//   business_logic_rules?: Record<string, string>
//   jobType?: string
//   glueName?: string
// }

// const LOCAL_STORAGE_KEY = "app_data"

// // Status filter options
// const statusFilters = ["All", "COMPLETED", "RUNNING", "FAILED"]

// // getJobStatus function
// export const getJobStatus = async (jobId: string): Promise<JobStatusResponse> => {
//   const token = localStorage.getItem("authToken");
//   const response = await fetch(`${BASE_URL}/get_status?job_id=${jobId}`, {
//     method: "GET",
//     headers: { "Authorization": `Bearer ${token}` },
//   });

//   if (!response.ok) {
//     const errorText = await response.text();
//     console.error(
//       `API Error (${response.status}) at ${new Date().toISOString()}: ${errorText}`
//     );
//     throw new Error(
//       `Failed to fetch job status: ${response.status} - ${errorText}`
//     );
//   }

//   const result: JobStatusResponse = await response.json();
//   console.log("✅ Get Job Status Response:", result);
//   return result;
// };

// export default function Jobs() {
//   const navigate = useNavigate()
//   const { toast } = useToast()
//   const [jobs, setJobs] = useState<LocalJob[]>([])
//   const [searchTerm, setSearchTerm] = useState("")
//   const [editingJob, setEditingJob] = useState<LocalJob | null>(null)
//   const [viewingJob, setViewingJob] = useState<LocalJob | null>(null)
//   const [startDate, setStartDate] = useState<Date | undefined>()
//   const [endDate, setEndDate] = useState<Date | undefined>()
//   const [filteredJobs, setFilteredJobs] = useState<LocalJob[]>([])
//   const [statusFilter, setStatusFilter] = useState<string>("All")
//   const [isLoading, setIsLoading] = useState(false)

//   // Validate localStorage for bucket and key
//   const validateLocalStorage = () => {
//     const bucket = localStorage.getItem("selectedBucket")
//     const key = localStorage.getItem("selectedFile")
//     if (!bucket || !key) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Missing bucket name or key. Please upload the file again.",
//       })
//       navigate("/dashboard/upload")
//       return false
//     }
//     return { bucket, key }
//   }

//   // Fetch jobs from API and load from localStorage
//   useEffect(() => {
//     if (!validateLocalStorage()) return

//     const fetchJobs = async () => {
//       setIsLoading(true)
//       try {
//         const response = await getJobs()
//         if (response.success) {
//           const mappedJobs: LocalJob[] = response.jobs.map((job: ApiJob) => ({
//             id: job.jobId,
//             name: job.jobName,
//             category: job.category || "Uncategorized",
//             lastRun: job.LastRun || new Date().toISOString(),
//             status: job.Status,
//             createdAt: job.createdAt || new Date().toISOString(),
//             stages: job.steps ? Object.entries(job.steps).map(([type, status], index) => ({
//               id: `stage_${job.jobId}_${index}`,
//               name: type === 'rules' ? 'DQ Rules' :
//                     type === 'ner' ? 'NER' :
//                     type === 'businessLogic' ? 'Business Logic' :
//                     type === 'etl' ? 'ETL' :
//                     type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
//               type,
//               status: typeof status === 'string' ? (status === 'used' || status === 'skipped' ? status : 'pending') : 'pending',
//               description: type === 'upload_center' ? 'Manage data extraction and destination' :
//                            type === 'loading' ? 'Analyze schema of the data' :
//                            type === 'transfer' ? 'Schedule automated job runs' :
//                            type === 'rules' ? 'Validate data quality and consistency' :
//                            type === 'ner' ? 'Named Entity Recognition processing' :
//                            type === 'businessLogic' ? 'Apply business logic to collected data' :
//                            type === 'etl' ? 'Extract, Transform, Load processes' :
//                            `Step ${type}`,
//             })) : [
//               { id: `stage_${job.jobId}_upload`, name: 'Data Upload Center', type: 'upload_center', status: 'pending', description: 'Manage data extraction and destination' },
//               { id: `stage_${job.jobId}_loading`, name: 'Schema Analysis', type: 'loading', status: 'pending', description: 'Analyze schema of the data' },
//               { id: `stage_${job.jobId}_transfer`, name: 'Schedule Jobs', type: 'transfer', status: 'pending', description: 'Schedule automated job runs' },
//             ],
//             FolderName: job.FolderName,
//             datadestination: job.datadestination,
//             jobId: job.jobId,
//             triggerType: job.triggerType,
//             etag: job.etag,
//             email: job.email,
//             FileName: job.FileName,
//             scheduleDetails: job.scheduleDetails,
//             jobName: job.jobName,
//             user_id: job.user_id,
//             steps: job.steps || {
//               rules: 'skipped',
//               ner: 'skipped',
//               businessLogic: 'skipped',
//               etl: 'skipped',
//             },
//             BucketName: job.BucketName,
//             datasource: job.datasource,
//             description: job.description || "No description available",
//             isConnected: job.isConnected || false,
//             business_logic_rules: job.business_logic_rules || {},
//             jobType: job.jobType,
//             glueName: job.glueName,
//           }))
//           setJobs(mappedJobs)
//           localStorage.setItem(
//             LOCAL_STORAGE_KEY,
//             JSON.stringify({ jobs: mappedJobs })
//           )
//         }
//       } catch (error) {
//         toast({
//           title: "Error",
//           description: "Failed to fetch jobs from API. Loading from local storage.",
//           variant: "destructive",
//         })
//         const storedData = localStorage.getItem(LOCAL_STORAGE_KEY)
//         if (storedData) {
//           const { jobs: storedJobs } = JSON.parse(storedData)
//           setJobs(storedJobs || [])
//         }
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchJobs()
//   }, [])

//   // Poll job statuses periodically
//   useEffect(() => {
//     const pollJobStatuses = async () => {
//       if (!validateLocalStorage()) return

//       try {
//         const statusPromises = jobs
//           .filter(job => job.status === 'Running')
//           .map(job => getJobStatus(job.jobId))
//         const statusResponses = await Promise.all(statusPromises)

//         setJobs(prevJobs =>
//           prevJobs.map(job => {
//             const statusUpdate = statusResponses.find(res => res.jobId === job.jobId)
//             if (statusUpdate && statusUpdate.success) {
//               return {
//                 ...job,
//                 status: statusUpdate.Status,
//                 lastRun: statusUpdate.LastRun,
//               }
//             }
//             return job
//           })
//         )
//       } catch (error: any) {
//         console.error('Error polling job statuses:', error)
//       }
//     }

//     // Poll every 30 seconds for running jobs
//     const interval = setInterval(() => {
//       if (jobs.some(job => job.status === 'Running')) {
//         pollJobStatuses()
//       }
//     }, 30000)

//     // Initial poll
//     if (jobs.some(job => job.status === 'Running')) {
//       pollJobStatuses()
//     }

//     return () => clearInterval(interval)
//   }, [jobs])

//   // Filter jobs when dependencies change
//   useEffect(() => {
//     filterJobs()
//   }, [jobs, searchTerm, startDate, endDate, statusFilter])

//   const filterJobs = () => {
//     let filtered = jobs.filter((job) =>
//       job.name.toLowerCase().includes(searchTerm.toLowerCase())
//     )

//     if (startDate) {
//       filtered = filtered.filter((job) => {
//         const lastRunDate = new Date(job.lastRun)
//         return !isNaN(lastRunDate.getTime()) && lastRunDate >= startDate
//       })
//     }
//     if (endDate) {
//       filtered = filtered.filter((job) => {
//         const lastRunDate = new Date(job.lastRun)
//         return !isNaN(lastRunDate.getTime()) && lastRunDate <= endDate
//       })
//     }

//     if (statusFilter !== "All") {
//       filtered = filtered.filter((job) => job.status === statusFilter)
//     }

//     setFilteredJobs(filtered)
//   }

//   const clearDateFilter = () => {
//     setStartDate(undefined)
//     setEndDate(undefined)
//   }

//   const getStatusColor = (status?: string) => {
//     if (!status) {
//       return 'text-gray-500'
//     }
//     switch (status.toLowerCase()) {
//       case 'active':
//       case 'running':
//         return 'text-green-100'
//       case 'inactive':
//       case 'failed':
//         return 'text-red-100'
//       case 'completed':
//         return 'text-blue-100'
//       default:
//         return 'text-gray-100'
//     }
//   }

//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString)
//       if (isNaN(date.getTime())) {
//         return "Invalid Date"
//       }
//       return format(date, "MMM d, yyyy - h:mm a")
//     } catch {
//       return "Invalid Date"
//     }
//   }

//   // Run Job
//   const handleRunJob = async (job: LocalJob) => {
//     if (!validateLocalStorage()) return

//     try {
//       const token = localStorage.getItem("authToken")
//       if (!token) {
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: "Missing auth token. Please login again.",
//         })
//         return
        
//       }

//       const payload = {
//         job_id: job.jobId,
//         token: token,
//       }

//       // If this is a custom job (has jobType and glueName), pass them to the API
//       // This allows the backend to determine which Step Function to trigger
//       if (job.jobType && job.glueName) {
//         // @ts-ignore
//         payload.jobType = job.jobType
//         // @ts-ignore
//         payload.glueName = job.glueName
//       }
// console.log("Payload sent to runStepFunction:", payload);
//       const response = await runStepFunction(payload)

//       // Update job status to Running immediately
//       setJobs(prevJobs =>
//         prevJobs.map(j =>
//           j.jobId === job.jobId ? { ...j, status: 'Running' } : j
//         )
//       )

//       toast({
//         title: "Job Started",
//         description: `Execution started: ${response.executionArn}`,
//       })

//       // Fetch immediate status update
//       try {
//         const statusResponse = await getJobStatus(job.jobId)
//         if (statusResponse.success) {
//           setJobs(prevJobs =>
//             prevJobs.map(j =>
//               j.jobId === job.jobId
//                 ? {
//                     ...j,
//                     status: statusResponse.Status,
//                     lastRun: statusResponse.LastRun,
//                   }
//                 : j
//             )
//           )
//         }
//       } catch (error: any) {
//         console.error('Error fetching immediate job status:', error)
//       }
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Run Failed",
//         description: error.message || "Failed to start job",
//       })
//     }
//   }

//   const handleViewJob = async (job: LocalJob) => {
//     if (!validateLocalStorage()) return

//     try {
//       const response: GetJobDetailsResponse = await getJobDetails(job.jobId)
//       if (response.success && response.job) {
//         const detailedJob: LocalJob = {
//           ...job,
//           name: response.job.name || job.name,
//           category: response.job.category || job.category || "Uncategorized",
//           lastRun: response.job.LastRun || job.lastRun,
//           status: response.job.Status || job.status,
//           stages: response.job.steps ? Object.entries(response.job.steps).map(([type, status], index) => ({
//             id: `stage_${job.jobId}_${index}`,
//             name: type === 'rules' ? 'DQ Rules' :
//                   type === 'ner' ? 'NER' :
//                   type === 'businessLogic' ? 'Business Logic' :
//                   type === 'etl' ? 'ETL' :
//                   type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
//             type,
//             status: typeof status === 'string' ? (status === 'used' || status === 'skipped' ? status : 'pending') : 'pending',
//             description: type === 'upload_center' ? 'Manage data extraction and destination' :
//                          type === 'loading' ? 'Analyze schema of the data' :
//                          type === 'transfer' ? 'Schedule automated job runs' :
//                          type === 'rules' ? 'Validate data quality and consistency' :
//                          type === 'ner' ? 'Named Entity Recognition processing' :
//                          type === 'businessLogic' ? 'Apply business logic to collected data' :
//                          type === 'etl' ? 'Extract, Transform, Load processes' :
//                          `Step ${type}`,
//           })) : [
//             { id: `stage_${job.jobId}_upload`, name: 'Data Upload Center', type: 'upload_center', status: 'pending', description: 'Manage data extraction and destination' },
//             { id: `stage_${job.jobId}_loading`, name: 'Schema Analysis', type: 'loading', status: 'pending', description: 'Analyze schema of the data' },
//             { id: `stage_${job.jobId}_transfer`, name: 'Schedule Jobs', type: 'transfer', status: 'pending', description: 'Schedule automated job runs' },
//           ],
//           description: response.job.description || job.description || "No description available",
//           isConnected: response.job.isConnected !== undefined ? response.job.isConnected : (job.isConnected || false),
//           FileName: response.job.FileName || job.FileName,
//           BucketName: response.job.BucketName || job.BucketName,
//           steps: response.job.steps || job.steps,
//           business_logic_rules: response.job.business_logic_rules || job.business_logic_rules || {},
//           jobType: response.job.jobType || job.jobType,
//           glueName: response.job.glueName || job.glueName,
//         }
//         setViewingJob(detailedJob)
//       } else {
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: response.message || "Failed to fetch job details.",
//         })
//         setViewingJob(job)
//       }
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: error.message || "Failed to fetch job details.",
//       })
//       setViewingJob(job)
//     }
//   }

//   const handleEditJob = async (job: LocalJob) => {
//     if (!validateLocalStorage()) return
//     try {
//       const response = await getJobDetails(job.jobId)
//       if (response.success && response.job) {
//         const detailedJob: LocalJob = {
//           ...job,
//           stages: response.job.steps ? Object.entries(response.job.steps).map(([type, status], index) => ({
//             id: `stage_${job.jobId}_${index}`,
//             name: type === 'rules' ? 'DQ Rules' :
//                   type === 'ner' ? 'NER' :
//                   type === 'businessLogic' ? 'Business Logic' :
//                   type === 'etl' ? 'ETL' :
//                   type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
//             type,
//             status: typeof status === 'string' ? (status === 'used' || status === 'skipped' ? status : 'pending') : 'pending',
//             description: type === 'upload_center' ? 'Manage data extraction and destination' :
//                          type === 'loading' ? 'Analyze schema of the data' :
//                          type === 'transfer' ? 'Schedule automated job runs' :
//                          type === 'rules' ? 'Validate data quality and consistency' :
//                          type === 'ner' ? 'Named Entity Recognition processing' :
//                          type === 'businessLogic' ? 'Apply business logic to collected data' :
//                          type === 'etl' ? 'Extract, Transform, Load processes' :
//                          `Step ${type}`,
//           })) : [
//             { id: `stage_${job.jobId}_upload`, name: 'Data Upload Center', type: 'upload_center', status: 'pending', description: 'Manage data extraction and destination' },
//             { id: `stage_${job.jobId}_loading`, name: 'Schema Analysis', type: 'loading', status: 'pending', description: 'Analyze schema of the data' },
//             { id: `stage_${job.jobId}_transfer`, name: 'Schedule Jobs', type: 'transfer', status: 'pending', description: 'Schedule automated job runs' },
//           ],
//           steps: response.job.steps || job.steps,
//           business_logic_rules: response.job.business_logic_rules || job.business_logic_rules || {},
//           jobType: response.job.jobType || job.jobType,
//           glueName: response.job.glueName || job.glueName,
//         }
//         setEditingJob(detailedJob)
//       } else {
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: response.message || "Failed to fetch job details.",
//         })
//         setEditingJob(job)
//       }
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: error.message || "Failed to fetch job details.",
//       })
//       setEditingJob(job)
//     }
//   }

//   const handleCreateJob = () => {
//     if (!validateLocalStorage()) return
//     navigate("/dashboard/upload")
//   }

//   const handleSaveJobStages = async (jobId: string, stages: JobStage[]) => {
//     if (!validateLocalStorage()) return
//     const job = jobs.find(j => j.id === jobId)
//     if (!job) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Job not found.",
//       })
//       return
//     }

//     try {
//       const steps: JobStepConfig = {
//         rules: stages.some(s => s.type === 'validation') ? 'used' : 'skipped',
//         ner: stages.some(s => s.type === 'processing') ? 'used' : 'skipped',
//         businessLogic: stages.some(s => s.type === 'collection') ? 'used' : 'skipped',
//         etl: stages.some(s => s.type === 'connection') ? 'used' : 'skipped',
//       }

//       const editJobRequest: EditJobRequest = {
//         jobId: job.jobId,
//         jobName: job.jobName,
//         triggerType: job.triggerType,
//         steps,
//         datasource: job.datasource,
//         datadestination: job.datadestination,
//         scheduleDetails: job.scheduleDetails,
//         business_logic_rules: job.business_logic_rules || {},
//       }

//       const response: EditJobResponse = await editJob(editJobRequest)
//       if (response.success) {
//         setJobs((prevJobs) =>
//           prevJobs.map((j) => (j.id === jobId ? { ...j, stages, steps, business_logic_rules: job.business_logic_rules } : j))
//         )
//         toast({
//           title: "Job Updated",
//           description: "Job stages have been updated successfully.",
//         })
//       } else {
//         throw new Error(response.message || "Failed to update job.")
//       }
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: error.message || "Failed to update job stages.",
//       })
//     } finally {
//       setEditingJob(null)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
//       <div className="container mx-auto p-6">
//         <div className="mb-6 mt-14 flex items-start justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-foreground">
//               All Jobs ({filteredJobs.length})
//             </h1>
//             <p className="text-muted-foreground text-sm mt-1">
//               View and manage your jobs
//             </p>
//           </div>
//           <div className="flex gap-2">
//             <Button
//               onClick={handleCreateJob}
//               className="flex items-center gap-2 bg-primary hover:bg-primary/90"
//             >
//               <Plus className="h-4 w-4" /> Create Job
//             </Button>
//           </div>
//         </div>

//         <Card className="shadow-sm">
//           <CardContent className="p-0">
//             <div className="p-4 border-b bg-muted/30">
//               <div className="flex items-center gap-4 flex-wrap">
//                 <div className="relative w-64">
//                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     placeholder="Search jobs..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-9 bg-background dark:bg-gray-800"
//                   />
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className={cn(
//                           "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
//                           !startDate && "text-muted-foreground"
//                         )}
//                       >
//                         <CalendarIcon className="mr-2 h-4 w-4" />
//                         {startDate ? format(startDate, "MMM dd, yyyy") : "Select a Date"}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
//                       <Calendar
//                         mode="single"
//                         selected={startDate}
//                         onSelect={setStartDate}
//                         className="pointer-events-auto"
//                       />
//                     </PopoverContent>
//                   </Popover>

//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className={cn(
//                           "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
//                           !endDate && "text-muted-foreground"
//                         )}
//                       >
//                         <CalendarIcon className="mr-2 h-4 w-4" />
//                         {endDate ? format(endDate, "MMM dd, yyyy") : "Select a Date"}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0 bg-background dark:bg-gray-800 dark:border-gray-600">
//                       <Calendar
//                         mode="single"
//                         selected={endDate}
//                         onSelect={setEndDate}
//                         className="pointer-events-auto"
//                       />
//                     </PopoverContent>
//                   </Popover>

//                   {(startDate || endDate) && (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={clearDateFilter}
//                       className="h-10 px-3"
//                       title="Clear date filter"
//                     >
//                       <X className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//                 <div className="flex gap-2">
//                   {statusFilters.map(status => (
//                     <Button
//                       key={status}
//                       variant={statusFilter === status ? "default" : "outline"}
//                       size="sm"
//                       onClick={() => setStatusFilter(status)}
//                       className={cn(
//                         "text-sm rounded-full",
//                         statusFilter === status
//                           ? "bg-primary text-white dark:bg-blue-500 dark:text-white"
//                           : "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
//                       )}
//                     >
//                       {status}
//                     </Button>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Table Header */}
//             <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-muted/20 border-b text-sm font-medium text-muted-foreground">
//               <div>Job Name</div>
//               <div>Pipelines</div>
//               <div>Created At</div>
//               <div>Last Run</div>
//               <div>Status</div>
//               <div>Actions</div>
//             </div>

//             {/* Table Rows */}
//             <div className="divide-y">
//               {isLoading ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   Loading jobs...
//                 </div>
//               ) : filteredJobs.length === 0 ? (
//                 <div className="p-6 text-center text-muted-foreground">
//                   No jobs found.
//                 </div>
//               ) : (
//                 filteredJobs.map((job) => (
//                   <div
//                     key={job.jobId}
//                     className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-muted/50 transition-colors"
//                   >
//                     <div className="font-medium text-foreground">{job.name}</div>
//                     <div className="text-muted-foreground text-sm">
//                       {job.stages.length > 0 ? job.stages.length : "N/A"}
//                     </div>
//                     <div className="text-muted-foreground text-sm">
//                       {formatDate(job.createdAt)}
//                     </div>
//                     <div className="text-muted-foreground text-sm">
//                       {formatDate(job.lastRun)}
//                     </div>
//                     <div>
//                       <Badge
//                         className={cn("text-xs px-2 py-1", getStatusColor(job.status))}
//                       >
//                         {job.status}
//                       </Badge>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <Button
//                         size="sm"
//                         onClick={() => handleRunJob(job)}
//                         className="w-8 h-8 rounded-full p-0 bg-primary hover:bg-primary/90"
//                         title="Run Job"
//                       >
//                         <Play className="w-3 h-3" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleViewJob(job)}
//                         className="w-8 h-8 rounded-full p-0"
//                         title="View job"
//                       >
//                         <Eye className="w-4 h-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleEditJob(job)}
//                         className="w-8 h-8 rounded-full p-0"
//                         title="Edit Job Stages"
//                       >
//                         <Edit className="w-4 h-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </CardContent>
//         </Card>

//         {viewingJob && (
//           <ViewJobDialog
//             job={viewingJob}
//             open={!!viewingJob}
//             onOpenChange={(open) => {
//               if (!open) setViewingJob(null)
//             }}
//           />
//         )}

//         {editingJob && (
//           <EnhancedEditJobDialog01
//             job={editingJob}
//             open={!!editingJob}
//             onOpenChange={(open) => {
//               if (!open) setEditingJob(null)
//             }}
//             onSave={handleSaveJobStages}
//           />
//         )}
//       </div>
//     </div>
//   )
// }


//recent my code


import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Search, Play, Eye, Plus, Edit, CalendarIcon, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import EnhancedEditJobDialog01 from "@/components/jobs/EnhancedEditJobDialog01"
import ViewJobDialog from "@/components/jobs/ViewJobDialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { getJobs, Job as ApiJob, getJobDetails, GetJobDetailsResponse, editJob, EditJobResponse, JobStepConfig, EditJobRequest } from "@/lib/api"
import { runStepFunction } from "@/lib/api"
 
// Define BASE_URL constant (replace with your actual API base URL)
const BASE_URL = "https://ingestq-backend-954554516.ap-south-1.elb.amazonaws.com"
 
// Define JobStatusResponse interface
export interface JobStatusResponse {
  success: boolean;
  message: string;
  jobId: string;
  Status: string;
  LastRun: string;
}
 
// Define JobStage interface
interface JobStage {
  id: string
  name: string
  type: string
  status: string
  description?: string
  config?: Record<string, any>
}
 
// Define LocalJob interface to match ViewJobDialog expectations
interface LocalJob {
  id: string
  name: string
  category: string
  lastRun: string
  status: string
  createdAt: string
  stages: JobStage[]
  FolderName: string
  datadestination: string
  jobId: string
  triggerType: "SCHEDULE" | "File"
  etag: string
  email: string
  FileName: string
  scheduleDetails: object
  jobName: string
  user_id: string
  steps: JobStepConfig
  BucketName: string
  datasource: string
  description?: string
  isConnected?: boolean
  business_logic_rules?: Record<string, string>
  jobType?: string
  glueName?: string
}
 
const LOCAL_STORAGE_KEY = "app_data"
 
// Status filter options
const statusFilters = ["All", "COMPLETED", "RUNNING", "FAILED", "CREATED"]
 
// getJobStatus function
export const getJobStatus = async (jobId: string): Promise<JobStatusResponse> => {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`${BASE_URL}/get_status?job_id=${jobId}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` },
  });
 
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `API Error (${response.status}) at ${new Date().toISOString()}: ${errorText}`
    );
    throw new Error(
      `Failed to fetch job status: ${response.status} - ${errorText}`
    );
  }
 
  const result: JobStatusResponse = await response.json();
  console.log("✅ Get Job Status Response:", result);
  return result;
};
 
export default function Jobs() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [jobs, setJobs] = useState<LocalJob[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingJob, setEditingJob] = useState<LocalJob | null>(null)
  const [viewingJob, setViewingJob] = useState<LocalJob | null>(null)
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [filteredJobs, setFilteredJobs] = useState<LocalJob[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [isLoading, setIsLoading] = useState(false)
 
  // Validate localStorage for bucket and key
  const validateLocalStorage = () => {
    const bucket = localStorage.getItem("selectedBucket")
    const key = localStorage.getItem("selectedFile")
    if (!bucket || !key) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing bucket name or key. Please upload the file again.",
      })
      navigate("/dashboard/upload")
      return false
    }
    return { bucket, key }
  }
 
  // Fetch jobs from API and load from localStorage
  useEffect(() => {
    if (!validateLocalStorage()) return
 
    const fetchJobs = async () => {
      setIsLoading(true)
      try {
        const response = await getJobs()
        if (response.success) {
          const mappedJobs: LocalJob[] = response.jobs.map((job: ApiJob) => ({
            id: job.jobId,
            name: job.jobName,
            category: job.category || "Uncategorized",
            lastRun: job.LastRun || new Date().toISOString(),
            status: job.Status,
            createdAt: job.createdAt || new Date().toISOString(),
            stages: job.steps ? Object.entries(job.steps).map(([type, status], index) => ({
              id: `stage_${job.jobId}_${index}`,
              name: type === 'rules' ? 'DQ Rules' :
                    type === 'ner' ? 'NER' :
                    type === 'businessLogic' ? 'Business Logic' :
                    type === 'etl' ? 'ETL' :
                    type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
              type,
              status: typeof status === 'string' ? (status === 'used' || status === 'skipped' ? status : 'pending') : 'pending',
              description: type === 'upload_center' ? 'Manage data extraction and destination' :
                           type === 'loading' ? 'Analyze schema of the data' :
                           type === 'transfer' ? 'Schedule automated job runs' :
                           type === 'rules' ? 'Validate data quality and consistency' :
                           type === 'ner' ? 'Named Entity Recognition processing' :
                           type === 'businessLogic' ? 'Apply business logic to collected data' :
                           type === 'etl' ? 'Extract, Transform, Load processes' :
                           `Step ${type}`,
            })) : [
              { id: `stage_${job.jobId}_upload`, name: 'Data Upload Center', type: 'upload_center', status: 'pending', description: 'Manage data extraction and destination' },
              { id: `stage_${job.jobId}_loading`, name: 'Schema Analysis', type: 'loading', status: 'pending', description: 'Analyze schema of the data' },
              { id: `stage_${job.jobId}_transfer`, name: 'Schedule Jobs', type: 'transfer', status: 'pending', description: 'Schedule automated job runs' },
            ],
            FolderName: job.FolderName,
            datadestination: job.datadestination,
            jobId: job.jobId,
            triggerType: job.triggerType,
            etag: job.etag,
            email: job.email,
            FileName: job.FileName,
            scheduleDetails: job.scheduleDetails,
            jobName: job.jobName,
            user_id: job.user_id,
            steps: job.steps || {
              rules: 'skipped',
              ner: 'skipped',
              businessLogic: 'skipped',
              etl: 'skipped',
            },
            BucketName: job.BucketName,
            datasource: job.datasource,
            description: job.description || "No description available",
            isConnected: job.isConnected || false,
            business_logic_rules: job.business_logic_rules || {},
            jobType: job.jobType,
            glueName: job.glueName,
          }))
          setJobs(mappedJobs)
          localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify({ jobs: mappedJobs })
          )
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch jobs from API. Loading from local storage.",
          variant: "destructive",
        })
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (storedData) {
          const { jobs: storedJobs } = JSON.parse(storedData)
          setJobs(storedJobs || [])
        }
      } finally {
        setIsLoading(false)
      }
    }
 
    fetchJobs()
  }, [])
 
  // Poll job statuses periodically
  useEffect(() => {
    const pollJobStatuses = async () => {
      if (!validateLocalStorage()) return
 
      try {
        const statusPromises = jobs
          .filter(job => job.status === 'Running')
          .map(job => getJobStatus(job.jobId))
        const statusResponses = await Promise.all(statusPromises)
 
        setJobs(prevJobs =>
          prevJobs.map(job => {
            const statusUpdate = statusResponses.find(res => res.jobId === job.jobId)
            if (statusUpdate && statusUpdate.success) {
              return {
                ...job,
                status: statusUpdate.Status,
                lastRun: statusUpdate.LastRun,
              }
            }
            return job
          })
        )
      } catch (error: any) {
        console.error('Error polling job statuses:', error)
      }
    }
 
    // Poll every 30 seconds for running jobs
    const interval = setInterval(() => {
      if (jobs.some(job => job.status === 'Running')) {
        pollJobStatuses()
      }
    }, 30000)
 
    // Initial poll
    if (jobs.some(job => job.status === 'Running')) {
      pollJobStatuses()
    }
 
    return () => clearInterval(interval)
  }, [jobs])
 
  // Filter jobs when dependencies change
  useEffect(() => {
    filterJobs()
  }, [jobs, searchTerm, startDate, endDate, statusFilter])
 
  const filterJobs = () => {
    let filtered = jobs.filter((job) =>
      job.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
 
    if (startDate) {
      filtered = filtered.filter((job) => {
        const lastRunDate = new Date(job.lastRun)
        return !isNaN(lastRunDate.getTime()) && lastRunDate >= startDate
      })
    }
    if (endDate) {
      filtered = filtered.filter((job) => {
        const lastRunDate = new Date(job.lastRun)
        return !isNaN(lastRunDate.getTime()) && lastRunDate <= endDate
      })
    }
 
    if (statusFilter !== "All") {
      filtered = filtered.filter((job) => job.status === statusFilter)
    }
 
    setFilteredJobs(filtered)
  }
 
  const clearDateFilter = () => {
    setStartDate(undefined)
    setEndDate(undefined)
  }
 
  const getStatusColor = (status?: string) => {
    if (!status) {
      return 'bg-gray-100 text-gray-800'
    }
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'created':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
 
  const getFilterHoverColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'hover:bg-green-500 hover:text-white'
      case 'running':
        return 'hover:bg-blue-500 hover:text-white'
      case 'failed':
        return 'hover:bg-red-500 hover:text-white'
      case 'created':
        return 'hover:bg-yellow-500 hover:text-white'
      default:
        return 'hover:bg-gray-100 dark:hover:bg-gray-600'
    }
  }
 
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Invalid Date"
      }
      return format(date, "MMM d, yyyy - h:mm a")
    } catch {
      return "Invalid Date"
    }
  }
 
  // Run Job
  const handleRunJob = async (job: LocalJob) => {
    if (!validateLocalStorage()) return
 
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Missing auth token. Please login again.",
        })
        return
      }
 
      const payload = {
        job_id: job.jobId,
        token: token,
      }
 
      if (job.jobType && job.glueName) {
        // @ts-ignore
        payload.jobType = job.jobType
        // @ts-ignore
        payload.glueName = job.glueName
      }
      console.log("Payload sent to runStepFunction:", payload);
      const response = await runStepFunction(payload)
 
      // Update job status to Running immediately
      setJobs(prevJobs =>
        prevJobs.map(j =>
          j.jobId === job.jobId ? { ...j, status: 'Running' } : j
        )
      )
 
      toast({
        title: "Job Started",
        description: `Execution started: ${response.executionArn}`,
      })
 
      // Fetch immediate status update
      try {
        const statusResponse = await getJobStatus(job.jobId)
        if (statusResponse.success) {
          setJobs(prevJobs =>
            prevJobs.map(j =>
              j.jobId === job.jobId
                ? {
                    ...j,
                    status: statusResponse.Status,
                    lastRun: statusResponse.LastRun,
                  }
                : j
            )
          )
        }
      } catch (error: any) {
        console.error('Error fetching immediate job status:', error)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Run Failed",
        description: error.message || "Failed to start job",
      })
    }
  }
 
  const handleViewJob = async (job: LocalJob) => {
    if (!validateLocalStorage()) return
 
    try {
      const response: GetJobDetailsResponse = await getJobDetails(job.jobId)
      if (response.success && response.job) {
        const detailedJob: LocalJob = {
          ...job,
          name: response.job.name || job.name,
          category: response.job.category || job.category || "Uncategorized",
          lastRun: response.job.LastRun || job.lastRun,
          status: response.job.Status || job.status,
          stages: response.job.steps ? Object.entries(response.job.steps).map(([type, status], index) => ({
            id: `stage_${job.jobId}_${index}`,
            name: type === 'rules' ? 'DQ Rules' :
                  type === 'ner' ? 'NER' :
                  type === 'businessLogic' ? 'Business Logic' :
                  type === 'etl' ? 'ETL' :
                  type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            type,
            status: typeof status === 'string' ? (status === 'used' || status === 'skipped' ? status : 'pending') : 'pending',
            description: type === 'upload_center' ? 'Manage data extraction and destination' :
                         type === 'loading' ? 'Analyze schema of the data' :
                         type === 'transfer' ? 'Schedule automated job runs' :
                         type === 'rules' ? 'Validate data quality and consistency' :
                         type === 'ner' ? 'Named Entity Recognition processing' :
                         type === 'businessLogic' ? 'Apply business logic to collected data' :
                         type === 'etl' ? 'Extract, Transform, Load processes' :
                         `Step ${type}`,
          })) : [
            { id: `stage_${job.jobId}_upload`, name: 'Data Upload Center', type: 'upload_center', status: 'pending', description: 'Manage data extraction and destination' },
            { id: `stage_${job.jobId}_loading`, name: 'Schema Analysis', type: 'loading', status: 'pending', description: 'Analyze schema of the data' },
            { id: `stage_${job.jobId}_transfer`, name: 'Schedule Jobs', type: 'transfer', status: 'pending', description: 'Schedule automated job runs' },
          ],
          description: response.job.description || job.description || "No description available",
          isConnected: response.job.isConnected !== undefined ? response.job.isConnected : (job.isConnected || false),
          FileName: response.job.FileName || job.FileName,
          BucketName: response.job.BucketName || job.BucketName,
          steps: response.job.steps || job.steps,
          business_logic_rules: response.job.business_logic_rules || job.business_logic_rules || {},
          jobType: response.job.jobType || job.jobType,
          glueName: response.job.glueName || job.glueName,
        }
        setViewingJob(detailedJob)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to fetch job details.",
        })
        setViewingJob(job)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch job details.",
      })
      setViewingJob(job)
    }
  }
 
  const handleEditJob = async (job: LocalJob) => {
    if (!validateLocalStorage()) return
    try {
      const response = await getJobDetails(job.jobId)
      if (response.success && response.job) {
        const detailedJob: LocalJob = {
          ...job,
          stages: response.job.steps ? Object.entries(response.job.steps).map(([type, status], index) => ({
            id: `stage_${job.jobId}_${index}`,
            name: type === 'rules' ? 'DQ Rules' :
                  type === 'ner' ? 'NER' :
                  type === 'businessLogic' ? 'Business Logic' :
                  type === 'etl' ? 'ETL' :
                  type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            type,
            status: typeof status === 'string' ? (status === 'used' || status === 'skipped' ? status : 'pending') : 'pending',
            description: type === 'upload_center' ? 'Manage data extraction and destination' :
                         type === 'loading' ? 'Analyze schema of the data' :
                         type === 'transfer' ? 'Schedule automated job runs' :
                         type === 'rules' ? 'Validate data quality and consistency' :
                         type === 'ner' ? 'Named Entity Recognition processing' :
                         type === 'businessLogic' ? 'Apply business logic to collected data' :
                         type === 'etl' ? 'Extract, Transform, Load processes' :
                         `Step ${type}`,
          })) : [
            { id: `stage_${job.jobId}_upload`, name: 'Data Upload Center', type: 'upload_center', status: 'pending', description: 'Manage data extraction and destination' },
            { id: `stage_${job.jobId}_loading`, name: 'Schema Analysis', type: 'loading', status: 'pending', description: 'Analyze schema of the data' },
            { id: `stage_${job.jobId}_transfer`, name: 'Schedule Jobs', type: 'transfer', status: 'pending', description: 'Schedule automated job runs' },
          ],
          steps: response.job.steps || job.steps,
          business_logic_rules: response.job.business_logic_rules || job.business_logic_rules || {},
          jobType: response.job.jobType || job.jobType,
          glueName: response.job.glueName || job.glueName,
        }
        setEditingJob(detailedJob)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to fetch job details.",
        })
        setEditingJob(job)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch job details.",
      })
      setEditingJob(job)
    }
  }
 
  const handleCreateJob = () => {
    if (!validateLocalStorage()) return
    navigate("/dashboard/upload")
  }
 
  const handleSaveJobStages = async (jobId: string, stages: JobStage[]) => {
    if (!validateLocalStorage()) return
    const job = jobs.find(j => j.id === jobId)
    if (!job) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Job not found.",
      })
      return
    }
 
    try {
      const steps: JobStepConfig = {
        rules: stages.some(s => s.type === 'validation') ? 'used' : 'skipped',
        ner: stages.some(s => s.type === 'processing') ? 'used' : 'skipped',
        businessLogic: stages.some(s => s.type === 'collection') ? 'used' : 'skipped',
        etl: stages.some(s => s.type === 'connection') ? 'used' : 'skipped',
      }
 
      const editJobRequest: EditJobRequest = {
        jobId: job.jobId,
        jobName: job.jobName,
        triggerType: job.triggerType,
        steps,
        datasource: job.datasource,
        datadestination: job.datadestination,
        scheduleDetails: job.scheduleDetails,
        business_logic_rules: job.business_logic_rules || {},
      }
 
      const response: EditJobResponse = await editJob(editJobRequest)
      if (response.success) {
        setJobs((prevJobs) =>
          prevJobs.map((j) => (j.id === jobId ? { ...j, stages, steps, business_logic_rules: job.business_logic_rules } : j))
        )
        toast({
          title: "Job Updated",
          description: "Job stages have been updated successfully.",
        })
      } else {
        throw new Error(response.message || "Failed to update job.")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update job stages.",
      })
    } finally {
      setEditingJob(null)
    }
  }
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6">
        <div className="mb-6 mt-14 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              All Jobs ({filteredJobs.length})
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              View and manage your jobs
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateJob}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Create Job
            </Button>
          </div>
        </div>
 
        <Card className="shadow-sm">
          <CardContent className="p-0">
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
                        {startDate ? format(startDate, "MMM dd, yyyy") : "Start Date"}
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
                      <Button
                        variant="outline"
                        className={cn(
                          "h-10 justify-start text-left font-normal bg-background w-48 dark:bg-gray-800 dark:border-gray-600",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "MMM dd, yyyy") : "End Date"}
                      </Button>
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
                          ? status === "COMPLETED"
                            ? "bg-green-500 text-white"
                            : status === "RUNNING"
                            ? "bg-blue-500 text-white"
                            : status === "FAILED"
                            ? "bg-red-500 text-white"
                            : status === "CREATED"
                            ? "bg-yellow-500 text-white"
                            : "bg-primary text-white"
                          : `text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 ${getFilterHoverColor(status)}`
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
              <div>Pipelines</div>
              <div>Created At</div>
              <div>Last Run</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
 
            {/* Table Rows */}
            <div className="divide-y">
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground">
                  Loading jobs...
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No jobs found.
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <div
                    key={job.jobId}
                    className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium text-foreground">{job.name}</div>
                    <div className="text-muted-foreground text-sm">
                      {job.stages.length > 0 ? job.stages.length : "N/A"}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {formatDate(job.createdAt)}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {formatDate(job.lastRun)}
                    </div>
                    <div>
                      <Badge
                        className={cn("text-xs px-2 py-1", getStatusColor(job.status))}
                      >
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
                        title="View job"
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
 
        {viewingJob && (
          <ViewJobDialog
            job={viewingJob}
            open={!!viewingJob}
            onOpenChange={(open) => {
              if (!open) setViewingJob(null)
            }}
          />
        )}
 
        {editingJob && (
          <EnhancedEditJobDialog01
            job={editingJob}
            open={!!editingJob}
            onOpenChange={(open) => {
              if (!open) setEditingJob(null)
            }}
            onSave={handleSaveJobStages}
          />
        )}
      </div>
    </div>
  )
}
 