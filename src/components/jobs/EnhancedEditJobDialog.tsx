
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Added for form labels
import { Plus, X, GripVertical, Play, Database, FileText, Settings, CheckCircle, AlertCircle, Clock, Target, Filter, Calendar } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import StageConfigDialog from "./StageConfigDialog";
import { Job, JobStage } from '@/components/types/jobs';
import { createJobConfig, CreateJobConfigRequest, JobStepConfig, ScheduleDetails } from "@/pages/ScheduleJob";

// Extend Job interface to include config (your work)
interface JobConfig {
  jobName: string;
  triggerType: "SCHEDULE" | "File";
  steps: JobStepConfig;
  datasource: string;         // e.g., "s3://bucket/key.csv"
  datadestination: string;    // e.g., "s3://bucket/output/"
  scheduleDetails?: ScheduleDetails;
  business_logic_rules?: { [key: string]: string };
  job_type?: string;
  glue_name?: string;
  gname: string;
}

// Extend Job interface to include config and the missing datasource/datadestination fields
interface JobConfig {
  jobName: string;
  triggerType: "SCHEDULE" | "File";
  steps: JobStepConfig;
  datasource: string;         // e.g., "s3://bucket/key.csv"
  datadestination: string;    // e.g., "s3://bucket/output/"
  scheduleDetails?: ScheduleDetails;
  business_logic_rules?: { [key: string]: string };
  job_type?: string;
  glue_name?: string;
  gname: string;
}

interface ExtendedJob extends Job {
  config?: JobConfig;
  datasource?: string;        // Add this for source path (optional for new jobs)
  datadestination?: string;   // Add this for destination path (optional for new jobs)
}

interface EnhancedEditJobDialogProps {
  job: ExtendedJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (jobId: string, stages: JobStage[], jobName: string) => void;
}



const availableSteps = [
  { id: 'upload_center', name: 'Data Upload Center', icon: Database, color: '#3b82f6', description: 'Manage data extraction and destination' },
  { id: 'loading', name: 'Schema Analysis', icon: Target, color: '#10b981', description: 'Analyze schema of the data' },
  { id: 'validation', name: 'DQ Rules', icon: Filter, color: '#f59e0b', description: 'Validate data quality and consistency' },
  { id: 'processing', name: 'NER', icon: Settings, color: '#ef4444', description: 'Named Entity Recognition processing' },
  { id: 'collection', name: 'Business Logic', icon: Database, color: '#6b7280', description: 'Apply business logic to collected data' },
  { id: 'connection', name: 'Data Transformations', icon: Database, color: '#3b82f6', description: 'Extract, Transform, Load processes' },
  { id: 'transfer', name: 'Schedule Jobs', icon: Target, color: '#10b981', description: 'Schedule automated job runs' },
];

function DraggableStepItem({ step }: { step: typeof availableSteps[0] }) {
  const StepIcon = step.icon;

  return (
    <Card
      className="cursor-grab hover:shadow-md transition-all border-l-4 active:cursor-grabbing"
      style={{ borderLeftColor: step.color }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'new-step',
          step: step
        }));
      }}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <div
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${step.color}20` }}
          >
            <StepIcon className="w-4 h-4" style={{ color: step.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{step.name}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {step.description}
            </p>
          </div>
          <Plus className="w-4 h-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function SortableStageItem({ stage, index, onEdit, onDelete }: {
  stage: JobStage;
  index: number;
  onEdit: (stage: JobStage) => void;
  onDelete: (stageId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const stepInfo = availableSteps.find(step => step.id === stage.type);
  const StepIcon = stepInfo?.icon || Settings;

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running': return <Play className="w-4 h-4 text-blue-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium z-10">
        {index + 1}
      </div>
      <Card
        ref={setNodeRef}
        className="cursor-pointer hover:shadow-md transition-all border-l-4 ml-4"
        style={{
          ...style,
          borderLeftColor: stepInfo?.color || '#e5e7eb'
        }}
        onClick={() => onEdit(stage)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>

            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${stepInfo?.color}20` }}
            >
              <StepIcon className="w-5 h-5" style={{ color: stepInfo?.color }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm truncate">{stage.name}</h4>
                {getStatusIcon(stage.status)}
              </div>
              <p className="text-xs text-muted-foreground capitalize">
                {stage.type.replace('_', ' ')}
              </p>
              {stage.description && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {stage.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0 hover:bg-red-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(stage.id);
                  switch (stage.type) {
                    case 'loading':
                      localStorage.setItem('schema', 'skipped');
                      break;
                    case 'validation':
                      localStorage.setItem('rules', 'skipped');
                      break;
                    case 'processing':
                      localStorage.setItem('ner', 'skipped');
                      break;
                    case 'collection':
                      localStorage.setItem('businessLogic', 'skipped');
                      break;
                    case 'connection':
                      localStorage.setItem('datatransformations', 'skipped');
                      break;
                    default:
                      break;
                  }
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DropZone({ index, onDrop }: { index: number; onDrop: (index: number, data: any) => void }) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      className={`h-8 flex items-center justify-center transition-all ${isOver ? 'bg-primary/10 border-2 border-dashed border-primary' : 'border-2 border-dashed border-transparent'
        }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        onDrop(index, data);
      }}
    >
      {isOver && (
        <div className="text-xs text-primary font-medium">Drop here to insert</div>
      )}
    </div>
  );
}

export default function EnhancedEditJobDialog({
  job,
  open,
  onOpenChange,
  onSave
}: EnhancedEditJobDialogProps) {
  const { toast } = useToast();
  const [stages, setStages] = useState<JobStage[]>([]);
  const [selectedStage, setSelectedStage] = useState<JobStage | null>(null);
  const [stageConfigDialogOpen, setStageConfigDialogOpen] = useState(false);
  const [jobType, setJobType] = useState(job?.category || 'glue');
  const [glueName, setGlueName] = useState(job?.id || '');
  const [jobName, setJobName] = useState(job?.name || '');
  const [isCreating, setIsCreating] = useState(false); // From teammate's work

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (job && open) {
      // Determine if this is a new job (start fresh) or edit (load existing config)
      const isNewJob = !job.id || job.id === 'new' || localStorage.getItem("creatingNewJob") === "true";

      if (isNewJob) {
        // Clear all upload-related localStorage for a fresh start (no pre-filled paths)
        localStorage.removeItem('selectedSource');
        localStorage.removeItem('selectedDestination');
        localStorage.removeItem('sourceConfig');
        localStorage.removeItem('destinationConfig');
        localStorage.removeItem('datasource');
        localStorage.removeItem('datadestination');
        localStorage.removeItem('selectedBucket');
        localStorage.removeItem('selectedFile');
        localStorage.removeItem('selectedDestBucket');
        localStorage.removeItem('selectedDestFolder');
        // Clear any other stage-specific keys if needed (e.g., from previous creations)
        localStorage.removeItem('rules');
        localStorage.removeItem('ner');
        localStorage.removeItem('businessLogic');
        localStorage.removeItem('datatransformations');
        localStorage.removeItem('schema');
        localStorage.removeItem('scheduleType');
        localStorage.removeItem('frequency');
        localStorage.removeItem('time');

        // Clean up the new job flag
        localStorage.removeItem("creatingNewJob");
      } else {
        // For edits: Parse and set localStorage from job.datasource and job.datadestination
        try {
          if (job.datasource) {
            const sourceMatch = job.datasource.match(/^(\w+):\/\/([^\/]+)\/(.*)$/);
            if (sourceMatch) {
              const [, sourceType, bucket, path] = sourceMatch;
              localStorage.setItem('selectedSource', sourceType);
              localStorage.setItem('sourceConfig', JSON.stringify({
                bucket,
                currentPath: path.split('/').slice(0, -1).join('/') || ''
              }));
              localStorage.setItem('datasource', job.datasource);
              localStorage.setItem('selectedBucket', bucket);
              localStorage.setItem('selectedFile', path.split('/').pop() || path); // Use filename if available
            }
          }
          if (job.datadestination) {
            const destMatch = job.datadestination.match(/^(\w+):\/\/([^\/]+)\/(.*)$/);
            if (destMatch) {
              const [, destType, bucket, path] = destMatch;
              localStorage.setItem('selectedDestination', destType);
              localStorage.setItem('destinationConfig', JSON.stringify({
                type: destType,
                bucket,
                currentPath: path || ''
              }));
              localStorage.setItem('datadestination', job.datadestination);
              localStorage.setItem('selectedDestBucket', bucket);
              localStorage.setItem('selectedDestFolder', path || '');
            }
          }
        } catch (error) {
          console.warn("Failed to parse job datasource/datadestination:", error);
          // Fallback: Clear if parsing fails to avoid stale data
          localStorage.removeItem('datasource');
          localStorage.removeItem('datadestination');
        }
      }

      // Set basic job state (common for new/edit)
      setJobType(job.category || 'glue');
      setGlueName(job.id || ''); // Use empty for new jobs
      setJobName(job.name || '');
      localStorage.setItem('jobName', job.name || '');

      // Mandatory stages logic (adapted for all categories; for new jobs, always set mandatory)
      if (job.stages && job.stages.length > 0 && !isNewJob) {
        setStages(job.stages);
      } else {
        const mandatoryStageIds = ['upload_center', 'loading', 'transfer'];
        const mandatoryStages = availableSteps
          .filter(step => mandatoryStageIds.includes(step.id))
          .map(step => ({
            id: `stage_${step.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID for new stages
            name: step.name,
            type: step.id,
            status: 'Pending',
            description: step.description,
            config: {}
          }));
        setStages(mandatoryStages);
      }
    }
  }, [job, open]);

  const filteredAvailableSteps = availableSteps.filter(
    step => !stages.some(stage => stage.type === step.id)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setStages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDropAtPosition = (index: number, data: any) => {
    if (data.type === 'new-step') {
      const newStage: JobStage = {
        id: `stage_${Date.now()}`,
        name: data.step.name,
        type: data.step.id,
        status: 'Pending',
        description: data.step.description,
        config: {}
      };

      setStages(prev => {
        const newStages = [...prev];
        newStages.splice(index, 0, newStage);
        if (newStage.type === 'loading') localStorage.setItem('schema', 'executed');
        if (newStage.type === 'validation') localStorage.setItem('rules', 'executed');
        if (newStage.type === 'processing') localStorage.setItem('ner', 'executed');
        if (newStage.type === 'collection') localStorage.setItem('businessLogic', 'executed');
        if (newStage.type === 'connection') localStorage.setItem('datatransformations', 'executed');
        return newStages;
      });

      toast({
        title: "Stage Added",
        description: `${data.step.name} has been added to position ${index + 1}`,
      });
    }
  };

  const addStepToEnd = (step: typeof availableSteps[0]) => {
    const newStage: JobStage = {
      id: `stage_${Date.now()}`,
      name: step.name,
      type: step.id,
      status: 'Pending',
      description: step.description,
      config: {}
    };
    setStages(prev => [...prev, newStage]);
    if (newStage.type === 'loading') localStorage.setItem('schema', 'executed');
    if (newStage.type === 'validation') localStorage.setItem('rules', 'executed');
    if (newStage.type === 'processing') localStorage.setItem('ner', 'executed');
    if (newStage.type === 'collection') localStorage.setItem('businessLogic', 'executed');
    if (newStage.type === 'connection') localStorage.setItem('datatransformations', 'executed');

    toast({
      title: "Stage Added",
      description: `${step.name} has been added to the job`,
    });
  };

  const handleEditStage = (stage: JobStage) => {
    setSelectedStage(stage);
    setStageConfigDialogOpen(true);
  };

  const handleDeleteStage = (stageId: string) => {
    setStages(prev => prev.filter(stage => stage.id !== stageId));

    toast({
      title: "Stage Removed",
      description: "Stage has been removed from the pipeline",
    });
  };

  const handleSaveStageConfig = (updatedStage: JobStage) => {
    setStages(prev => prev.map(stage =>
      stage.id === updatedStage.id ? updatedStage : stage
    ));
    setStageConfigDialogOpen(false);
    setSelectedStage(null);
  };

  const handleJobNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setJobName(newName);
    if (job) {
      localStorage.setItem(`jobName_${job.id}`, newName);
      localStorage.setItem('jobName', newName);
    }
  };

  // Merged handleSave (your Glue save + teammate's create logic, unified for all categories)
  const handleSave = async () => {
    if (!job || !jobName.trim()) {
      toast({
        title: "Validation Error",
        description: "Job name is required",
        variant: "destructive",
      });
      return;
    }
    if (!jobType) {
      throw new Error("Job type is required. Please select a category in the ETL setup.");
    }

    setIsCreating(true);

    try {
      // Call onSave for stages (your work)
      onSave(job.id, stages, jobName);
      localStorage.setItem("refreshJobsAfterCreate", "true");

      // Fetch values from localStorage
      const selectedSource = localStorage.getItem("selectedSource") || "";
      const selectedDestination = localStorage.getItem("selectedDestination") || "";
      const selectedBucket = localStorage.getItem("selectedBucket") || "";
      const selectedFile = localStorage.getItem("selectedFile") || "";
      const selectedSheet = localStorage.getItem("selectedSheet") || "";
      const selectedDestBucket = localStorage.getItem("selectedDestBucket") || "";
      const selectedDestFolder = localStorage.getItem("selectedDestFolder") || "";

      const businessLogicStage = stages.find(s => s.type === 'collection');
      const businessLogicRules = businessLogicStage?.config?.business_logic_rules || {};

      // Construct datasource path based on source type
      let datasource = "";
      if (selectedSource === "local") {
        // For local files, use just the filename (optionally with sheet)
        datasource = selectedSheet ? `${selectedFile}#${selectedSheet}` : selectedFile;
      } else if (selectedSource === "s3") {
        datasource = selectedSheet
          ? `s3://${selectedBucket}/${selectedFile}#${selectedSheet}`
          : `s3://${selectedBucket}/${selectedFile}`;
      } else if (selectedSource === "azure-blob") {
        datasource = selectedSheet
          ? `azure-blob://${selectedBucket}/${selectedFile}#${selectedSheet}`
          : `azure-blob://${selectedBucket}/${selectedFile}`;
      } else if (selectedSource === "onelake") {
        // For OneLake: onelake://workspace/lakehouse/path/file
        const sourceConfig = JSON.parse(localStorage.getItem('sourceConfig') || '{}');
        const lakehouse = sourceConfig.lakehouse || "";
        datasource = selectedSheet
          ? `onelake://${selectedBucket}/${lakehouse}/${selectedFile}#${selectedSheet}`
          : `onelake://${selectedBucket}/${lakehouse}/${selectedFile}`;
      } else if (selectedSource === "delta-tables") {
        // For Delta Tables: delta-tables://workspace/lakehouse/tablename
        datasource = `delta-tables://${selectedBucket}/${selectedFile}`;
      } else if (selectedSource === "database") {
        // For database: use the full path as stored
        datasource = selectedFile; // This would be like "dbname.tablename"
      }
      else if (selectedSource === "snowflake") {
        // For Snowflake: snowflake://database/table
        const dbName = localStorage.getItem("db_name") || selectedBucket;
        const dbTable = localStorage.getItem("db_table") || selectedFile;
        datasource = `snowflake://${dbName}/${dbTable}`;
      }

      // Construct datadestination path based on destination type
      let datadestination = "";
      if (selectedDestination === "s3") {
        datadestination = `s3://${selectedDestBucket}/${selectedDestFolder}`;
      } else if (selectedDestination === "azure-blob") {
        datadestination = `azure-blob://${selectedDestBucket}/${selectedDestFolder}`;
      } else if (selectedDestination === "onelake") {
        const destConfig = JSON.parse(localStorage.getItem('destinationConfig') || '{}');
        const lakehouse = destConfig.lakehouse || "";
        datadestination = `onelake://${selectedDestBucket}/${lakehouse}/${selectedDestFolder}`;
      } else if (selectedDestination === "delta-tables") {
        const destConfig = JSON.parse(localStorage.getItem('destinationConfig') || '{}');
        const lakehouse = destConfig.lakehouse || "";
        datadestination = `delta-tables://${selectedDestBucket}/${lakehouse}/${selectedDestFolder}`;
      } else if (selectedDestination === "database") {
        datadestination = selectedDestFolder; // This would be like "dbname.tablename"
      }

      else if (selectedDestination === "snowflake") {
        // For Snowflake destination: snowflake://database
        datadestination = `snowflake://${selectedDestBucket}`;
      }
      // Validate required fields
      if (!datasource || !datadestination) {
        toast({
          title: "Validation Error",
          description: "Data source and destination must be configured. Please complete the Data Upload Center step.",
          variant: "destructive",
        });
        setIsCreating(false);
        return;
      }

      console.log("Datasource:", datasource);
      console.log("Datadestination:", datadestination);

      // Get the category which maps to job_type in backend
      const jobCategory = localStorage.getItem("jobCategory") || job.category || "glue";
      const jobType = localStorage.getItem("jobType") || jobCategory;

      // Get category-specific fields from localStorage
      const glueName = localStorage.getItem("glueName") || jobName || "";
      const gname = localStorage.getItem("gname") || jobName;
      const resourcegroup = localStorage.getItem("resourceGroup") || "";
      const datafactory = localStorage.getItem("dataFactory") || "";
      const pipeline = localStorage.getItem("pipeline") || "";

      // Construct steps object based on stages and localStorage
      const hasValidation = stages.some(s => s.type === 'validation');
      const hasNER = stages.some(s => s.type === 'processing');
      const hasBusinessLogic = stages.some(s => s.type === 'collection');
      const hasTransformations = stages.some(s => s.type === 'connection');

      const steps: JobStepConfig = {
        rules: hasValidation ? 'executed' : 'skipped',
        ner: hasNER ? 'executed' : 'skipped',
        businessLogic: hasBusinessLogic ? 'executed' : 'skipped',
        datatransformations: hasTransformations ? 'executed' : 'skipped',
      };

      const scheduleStage = stages.find(s => s.type === 'transfer');
      const scheduleConfig = scheduleStage?.config || {};

      // Determine trigger type
      const triggerType = scheduleConfig.triggerType || "File";


      // Derive input_type from datasource file extension
      const getInputType = (source: string): string => {

        if (source.startsWith('snowflake://')) return 'snowflake';

        // Remove sheet reference if present (e.g., "file.xlsx#Sheet1" -> "file.xlsx")
        const cleanSource = source.split('#')[0];
        const extension = cleanSource.split('.').pop()?.toLowerCase() || '';

        switch (extension) {
          case 'csv': return 'csv';
          case 'xlsx': return 'xlsx';
          case 'xls': return 'xlsx';
          case 'json': return 'json';
          case 'parquet': return 'parquet';
          case 'txt': return 'text';
          default: return 'csv'; // default fallback
        }
      };

      const input_type = getInputType(datasource);
      // Parse datasource into bucket_name and key
      const parsePath = (path: string) => {
        // Match pattern: protocol://bucket/key
        const match = path.match(/^(\w+(?:-\w+)*):\/\/([^\/]+)\/(.*)$/);
        if (match) {
          const [, protocol, bucket, key] = match;
          return { bucket, key };
        }
        // Fallback for local files (no protocol)
        return { bucket: '', key: path };
      };

      const sourceInfo = parsePath(datasource);
      const destInfo = parsePath(datadestination);
      // Extract Snowflake-specific fields if source is Snowflake
      let snowflakeDatabase = "";
      let snowflakeTable = "";

      if (selectedSource === "snowflake") {
        snowflakeDatabase = localStorage.getItem("db_name") || selectedBucket || "";
        snowflakeTable = localStorage.getItem("db_table") || selectedFile || "";
      }

      // Base job configuration
      const payload: CreateJobConfigRequest = {
        jobName,
        triggerType,
        steps,
        datasource,
        datadestination,
        input_type,
        bucket_name: sourceInfo.bucket,     // ← Add this
        key: sourceInfo.key,
        ...(input_type === 'snowflake' && {
          database: snowflakeDatabase,
          table_name: snowflakeTable,
        }),
        // dest_bucket: destInfo.bucket,        // ← Add this
        // dest_key: destInfo.key,  
        // Only include scheduleDetails if trigger type is SCHEDULE
        ...(triggerType === "SCHEDULE" && {
          scheduleDetails: {
            frequency: scheduleConfig.frequency || "daily",
            time: scheduleConfig.time || "00:00"
          }

        }),
        ...(input_type === 'xlsx' && selectedSheet && {
          sheet_name: selectedSheet,
        }),
          business_logic_rules: businessLogicRules,
          job_type: jobType.toLowerCase(),
          glue_name: jobName,
          gname: jobName,
          ...(jobType.toLowerCase() === 'adf' && {
            resourcegroup,
            datafactory,
            pipeline,
          })
        };

        console.log("Creating job with payload:", payload);
        console.log("input_type:", input_type);  // ← Add this for debugging

        console.log("glue_name value:", payload.glue_name);
        console.log("job_type:", payload.job_type);


        const result = await createJobConfig(payload);

        if(result.success) {
          toast({
            title: 'Success',
            description: `${jobType.toUpperCase()} job pipeline configured and created successfully`,
          });

      // Clear localStorage to avoid stale data
      localStorage.removeItem("rules");
      localStorage.removeItem("ner");
      localStorage.removeItem("datatransformations");
      localStorage.removeItem("businessLogic");
      localStorage.removeItem("schema");
      localStorage.removeItem("selectedBucket");
      localStorage.removeItem("selectedFile");
      localStorage.removeItem("selectedSheet");
      localStorage.removeItem("selectedDestBucket");
      localStorage.removeItem("selectedDestFolder");
      localStorage.removeItem("selectedSource");
      localStorage.removeItem("selectedDestination");
      localStorage.removeItem("sourceConfig");
      localStorage.removeItem("destinationConfig");
      localStorage.removeItem(`jobName_${job.id}`);
      localStorage.setItem('jobName', jobName);

      // Update the job with new data
      const updatedJob: ExtendedJob = {
        ...job,
        category: jobType,
        id: glueName,
        name: jobName,
        stages,
        config: {
          ...job.config,
          ...payload,
        },
        datasource,
        datadestination,
      };
      onSave(updatedJob.id, stages, jobName);
      onOpenChange(false);
    } else {
      toast({
        title: 'Error',
        description: result.message || "Failed to create job",
        variant: 'destructive',
      });
    }
  } catch (error: any) {
    console.error("Error creating job:", error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to save job configuration',
      variant: 'destructive',
    });
  } finally {
    setIsCreating(false);
  }
};

if (!job) return null;

return (
  <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Custom {job.category.toUpperCase()} Job: {jobName} </DialogTitle>
          <DialogDescription>
            Configure the stages for your job pipeline and set the job name.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4 mt-4">
          <div>
            <Label htmlFor="jobName">Job Name / Pipeline Name</Label>
            <Input
              id="jobName"
              type="text"
              value={jobName}
              onChange={handleJobNameChange}
              className="mt-1"
              placeholder="Enter job/pipeline name"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This name will be used for the {job.category.toUpperCase()} job configuration
            </p>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          <div className="w-80 flex flex-col">
            <h3 className="font-semibold mb-4">Available Steps</h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredAvailableSteps.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">All available steps have been added</p>
                </div>
              ) : (
                filteredAvailableSteps.map((step) => (
                  <div key={step.id} onClick={() => addStepToEnd(step)}>
                    <DraggableStepItem step={step} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 border-l pl-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Job Stage Pipeline ({stages.length} stages)</h3>
              <div className="text-sm text-muted-foreground">
                Click + to add stages • Click to configure
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {stages.length === 0 ? (
                <div className="flex items-center justify-center h-full border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <div className="text-center">
                    <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-2">No stages added</p>
                    <p className="text-sm text-muted-foreground">Drag steps from the left panel to build your pipeline</p>
                  </div>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      <DropZone index={0} onDrop={handleDropAtPosition} />
                      {stages.map((stage, index) => (
                        <div key={stage.id}>
                          <SortableStageItem
                            stage={stage}
                            index={index}
                            onEdit={handleEditStage}
                            onDelete={handleDeleteStage}
                          />
                          <DropZone index={index + 1} onDrop={handleDropAtPosition} />
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isCreating}>
            {isCreating ? "Creating..." : "Save Changes & Create Job"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {selectedStage && (
      <StageConfigDialog
        job={job}
        stage={selectedStage}
        open={stageConfigDialogOpen}
        onOpenChange={setStageConfigDialogOpen}
        onSave={handleSaveStageConfig}
      />
    )}
  </>
);
}