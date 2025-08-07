import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Search, Play, Eye, Plus, Edit, FileText, CalendarIcon, X, Link, Network } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import EditJobDialog from "@/components/jobs/EditJobDialog";
import ViewJobDialog from "@/components/jobs/ViewJobDialog";
import PipelineBuilderDialog from "@/components/jobs/PipelineBuilderDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface JobStage {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface Job {
  id: string;
  name: string;
  category: string;
  lastRun: string;
  status: string;
  description?: string;
  isConnected?: boolean;
  stages?: JobStage[];
  pipelineId?: string;
  pipelineName?: string;
}

interface Pipeline {
  id: string;
  name: string;
  jobs: string[];
  createdAt: string;
}

const mockJobs: Job[] = [
  {
    id: '1',
    name: 'Customer Data ETL',
    category: 'Glue Jobs',
    lastRun: '2024-01-15 10:30:00',
    status: 'Passed',
    description: 'Process customer data from various sources',
    isConnected: true,
    pipelineId: 'pipeline-1',
    pipelineName: 'Customer Analytics Pipeline',
    stages: [
      { id: 's1', name: 'Extract Data', type: 'extraction', status: 'completed' },
      { id: 's2', name: 'Transform Data', type: 'transformation', status: 'completed' },
      { id: 's3', name: 'Load Data', type: 'loading', status: 'completed' }
    ]
  },
  {
    id: '2',
    name: 'Sales Analytics',
    category: 'Glue Jobs',
    lastRun: '2024-01-15 09:45:00',
    status: 'Failed',
    description: 'Generate sales reports and analytics',
    isConnected: true,
    pipelineId: 'pipeline-1',
    pipelineName: 'Customer Analytics Pipeline',
    stages: [
      { id: 's4', name: 'Data Validation', type: 'validation', status: 'completed' },
      { id: 's5', name: 'Analytics Processing', type: 'processing', status: 'failed' }
    ]
  },
  {
    id: '3',
    name: 'Data Validation',
    category: 'Lambda Jobs',
    lastRun: '2024-01-15 11:15:00',
    status: 'Passed',
    description: 'Validate data quality and consistency',
    stages: [
      { id: 's6', name: 'Schema Validation', type: 'validation', status: 'completed' }
    ]
  },
  {
    id: '4',
    name: 'Report Generation',
    category: 'Batch Jobs',
    lastRun: '2024-01-15 08:20:00',
    status: 'Running',
    description: 'Generate monthly business reports',
    isConnected: true,
    pipelineId: 'pipeline-2',
    pipelineName: 'Reporting Pipeline',
    stages: [
      { id: 's7', name: 'Data Collection', type: 'collection', status: 'completed' },
      { id: 's8', name: 'Report Building', type: 'processing', status: 'running' }
    ]
  },
  {
    id: '5',
    name: 'Data Migration',
    category: 'ADF Jobs',
    lastRun: '2024-01-15 12:00:00',
    status: 'Passed',
    description: 'Migrate data between systems',
    stages: [
      { id: 's9', name: 'Source Connection', type: 'connection', status: 'completed' },
      { id: 's10', name: 'Data Transfer', type: 'transfer', status: 'completed' },
      { id: 's11', name: 'Target Validation', type: 'validation', status: 'completed' }
    ]
  },
];

export default function Jobs() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [pipelines, setPipelines] = useState<Pipeline[]>([
    { id: 'pipeline-1', name: 'Customer Analytics Pipeline', jobs: ['1', '2'], createdAt: '2024-01-15' },
    { id: 'pipeline-2', name: 'Reporting Pipeline', jobs: ['4'], createdAt: '2024-01-14' }
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [pipelineBuilderOpen, setPipelineBuilderOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(mockJobs);

  const handleFilter = () => {
    const filtered = jobs.filter(job => {
      const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!startDate && !endDate) return matchesSearch;
      
      const jobDate = new Date(job.lastRun);
      const matchesDateRange = (!startDate || jobDate >= startDate) && 
                              (!endDate || jobDate <= endDate);
      
      return matchesSearch && matchesDateRange;
    });
    setFilteredJobs(filtered);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const filtered = jobs.filter(job => {
      const matchesSearch = job.name.toLowerCase().includes(value.toLowerCase()) ||
        job.category.toLowerCase().includes(value.toLowerCase());
      
      if (!startDate && !endDate) return matchesSearch;
      
      const jobDate = new Date(job.lastRun);
      const matchesDateRange = (!startDate || jobDate >= startDate) && 
                              (!endDate || jobDate <= endDate);
      
      return matchesSearch && matchesDateRange;
    });
    setFilteredJobs(filtered);
  };

  const clearDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setFilteredJobs(jobs.filter(job => 
      job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.category.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  };

  const handleRunJob = (job: Job) => {
    toast({
      title: "Job Started",
      description: `${job.name} is now running`,
    });
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
  };

  const handleViewJob = (job: Job) => {
    setViewingJob(job);
  };

  const handleOpenPipelineBuilder = () => {
    setPipelineBuilderOpen(true);
  };

  const handleSavePipeline = (pipelineData: { name: string; jobs: string[]; nodes: any[]; edges: any[] }) => {
    const newPipeline: Pipeline = {
      id: `pipeline-${Date.now()}`,
      name: pipelineData.name,
      jobs: pipelineData.jobs,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setPipelines(prev => [...prev, newPipeline]);

    // Update jobs to mark them as connected to this pipeline
    setJobs(prev => prev.map(job => {
      if (pipelineData.jobs.includes(job.id)) {
        return {
          ...job,
          isConnected: true,
          pipelineId: newPipeline.id,
          pipelineName: newPipeline.name
        };
      }
      return job;
    }));

    setFilteredJobs(prev => prev.map(job => {
      if (pipelineData.jobs.includes(job.id)) {
        return {
          ...job,
          isConnected: true,
          pipelineId: newPipeline.id,
          pipelineName: newPipeline.name
        };
      }
      return job;
    }));

    toast({
      title: "Pipeline Created",
      description: `Pipeline "${pipelineData.name}" has been created with ${pipelineData.jobs.length} jobs`,
    });
    setPipelineBuilderOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'passed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'scheduled': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const handleCreateJob = () => {
    navigate("/dashboard/upload");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto mt-12 p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              All Jobs ({filteredJobs.length})
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              View and manage your all jobs • {pipelines.length} pipelines active
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleOpenPipelineBuilder}
              className="flex items-center gap-2"
            >
              <Network className="h-4 w-4" />
              Create Pipeline
            </Button>
            <Button onClick={handleCreateJob} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Job
            </Button>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            {/* Search and Date Filter Bar */}
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9 bg-background"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-10 justify-start text-left font-normal bg-background w-48",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "MMM dd, yyyy") : "Start Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                          "h-10 justify-start text-left font-normal bg-background w-48",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "MMM dd, yyyy") : "End Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  <Button onClick={handleFilter} className="h-10">
                    Filter
                  </Button>
                  
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
                      <span title={`Part of ${job.pipelineName}`}>
                        <Network className="w-4 h-4 text-blue-500" />
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground">{job.category}</div>
                  <div className="text-muted-foreground">
                    {job.pipelineName ? (
                      <Badge variant="secondary" className="text-xs">
                        {job.pipelineName}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not connected</span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm">{job.lastRun}</div>
                  <div>
                    <Badge className={`${getStatusColor(job.status)} text-white text-xs px-2 py-1`}>
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
                      onClick={handleOpenPipelineBuilder}
                      className="w-8 h-8 rounded-full p-0"
                      title="Create Pipeline"
                    >
                      <Link className="w-4 h-4" />
                    </Button>
                   
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <EditJobDialog
          job={editingJob}
          open={!!editingJob}
          onOpenChange={(open) => !open && setEditingJob(null)}
          onSave={() => {
            toast({
              title: "Job Stages Updated",
              description: "Job stages have been saved successfully",
            });
            setEditingJob(null);
          }}
        />

        <ViewJobDialog
          job={viewingJob}
          open={!!viewingJob}
          onOpenChange={(open) => !open && setViewingJob(null)}
        />

        <PipelineBuilderDialog
          open={pipelineBuilderOpen}
          onOpenChange={setPipelineBuilderOpen}
          jobs={jobs}
          onSave={handleSavePipeline}
        />
      </div>
    </div>
  );
}
