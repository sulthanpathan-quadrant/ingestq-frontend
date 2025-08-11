import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, GripVertical, Play, Database, FileText, Settings, CheckCircle, AlertCircle, Clock, Target, Filter, Calendar } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import StageConfigDialog from './StageConfigDialog';

interface JobStage {
  id: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  config?: Record<string, any>;
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
}

interface EnhancedEditJobDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (jobId: string, stages: JobStage[]) => void;
}

// Updated available steps to match your stage types
const availableSteps = [
  { id: 'source', name: 'Source Stage', icon: Database, color: '#3b82f6', description: 'Configure data source connections and extraction settings' },
  { id: 'destination', name: 'Destination Stage', icon: Target, color: '#10b981', description: 'Configure target systems and data loading settings' },
  { id: 'business_logic', name: 'Business Logic Stage', icon: Settings, color: '#8b5cf6', description: 'Define data transformations and business rules' },
  { id: 'dq_rules', name: 'Data Quality Rules Stage', icon: Filter, color: '#f59e0b', description: 'Configure data validation and quality checks' },
  { id: 'schedule', name: 'Schedule Stage', icon: Calendar, color: '#ef4444', description: 'Configure time-based or event-based triggers' },
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
      className={`h-8 flex items-center justify-center transition-all ${
        isOver ? 'bg-primary/10 border-2 border-dashed border-primary' : 'border-2 border-dashed border-transparent'
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (job) {
      setStages(job.stages || []);
    }
  }, [job]);

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
        status: 'pending',
        description: data.step.description,
        config: {}
      };
      
      setStages(prev => {
        const newStages = [...prev];
        newStages.splice(index, 0, newStage);
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
      status: 'pending',
      description: step.description,
      config: {}
    };
    setStages(prev => [...prev, newStage]);
    
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
  };

  const handleSaveStageConfig = (updatedStage: JobStage) => {
    setStages(prev => prev.map(stage => 
      stage.id === updatedStage.id ? updatedStage : stage
    ));
    setStageConfigDialogOpen(false);
    setSelectedStage(null);
  };

  const handleSave = () => {
    if (!job) return;
    onSave(job.id, stages);
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Job Stages: {job.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left Panel - Available Steps */}
          <div className="w-80 flex flex-col">
            <h3 className="font-semibold mb-4">Available Steps</h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {availableSteps.map((step) => (
                <div key={step.id} onClick={() => addStepToEnd(step)}>
                  <DraggableStepItem step={step} />
                </div>
              ))}
            </div>
            {/* <div className="mt-4 p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">
                💡 Drag steps to specific positions or click to add to end
              </p>
            </div> */}
          </div>

          {/* Right Panel - Job Stage Pipeline */}
          <div className="flex-1 border-l pl-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Job Stage Pipeline ({stages.length} stages)</h3>
              <div className="text-sm text-muted-foreground">
                Drag to reorder • Click to configure
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

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>

        {/* Stage Configuration Dialog */}
        {selectedStage && (
          <StageConfigDialog
            stage={selectedStage}
            open={stageConfigDialogOpen}
            onOpenChange={setStageConfigDialogOpen}
            onSave={handleSaveStageConfig}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
