//recent my code

// import { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Plus, X, GripVertical, Play, Database, FileText, Settings, CheckCircle, AlertCircle, Clock, Target, Filter, Calendar } from 'lucide-react';
// import { useToast } from "@/hooks/use-toast";
// import {
//   DndContext,
//   closestCenter,
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   DragEndEvent,
// } from '@dnd-kit/core';
// import {
//   arrayMove,
//   SortableContext,
//   sortableKeyboardCoordinates,
//   verticalListSortingStrategy,
// } from '@dnd-kit/sortable';
// import {
//   useSortable,
// } from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities';
// import StageConfigDialog01 from './StageConfigDialog01';
// import { JobStepConfig } from "@/lib/api";

// interface JobStage {
//   id: string;
//   name: string;
//   type: string;
//   status: string;
//   description?: string;
//   config?: Record<string, any>;
// }

// interface Job {
//   id: string;
//   name: string;
//   category: string;
//   lastRun: string;
//   status: string;
//   description?: string;
//   isConnected?: boolean;
//   stages?: JobStage[];
//   steps: JobStepConfig;
//   business_logic_rules?: Record<string, string>;
// }

// interface EnhancedEditJobDialogProps {
//   job: Job | null;
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onSave: (jobId: string, stages: JobStage[]) => void;
// }

// // Available steps
// const availableSteps = [
//   { id: 'upload_center', name: 'Data Upload Center', icon: Database, color: '#3b82f6', description: 'Manage data extraction and destination', fixed: true },
//   { id: 'loading', name: 'Schema Analysis', icon: Target, color: '#10b981', description: 'Analyze schema of the data', fixed: true },
//   { id: 'validation', name: 'DQ Rules', icon: Filter, color: '#f59e0b', description: 'Validate data quality and consistency', fixed: false },
//   { id: 'processing', name: 'NER', icon: Settings, color: '#ef4444', description: 'Named Entity Recognition processing', fixed: false },
//   { id: 'collection', name: 'Business Logic', icon: Database, color: '#6b7280', description: 'Apply business logic to collected data', fixed: false },
//   { id: 'connection', name: 'ETL', icon: Database, color: '#3b82f6', description: 'Extract, Transform, Load processes', fixed: false },
//   { id: 'transfer', name: 'Schedule Jobs', icon: Target, color: '#10b981', description: 'Schedule automated job runs', fixed: true },
// ];

// function DraggableStepItem({ step, disabled = false }: { step: typeof availableSteps[0], disabled?: boolean }) {
//   const StepIcon = step.icon;
  
//   return (
//     <Card 
//       className={`cursor-${disabled ? 'not-allowed' : 'grab'} hover:shadow-md transition-all border-l-4 active:cursor-grabbing ${disabled ? 'opacity-50' : ''}`}
//       style={{ borderLeftColor: step.color }}
//       draggable={!disabled}
//       onDragStart={(e) => {
//         if (disabled) return;
//         e.dataTransfer.setData('application/json', JSON.stringify({
//           type: 'new-step',
//           step: step
//         }));
//       }}
//     >
//       <CardContent className="p-3">
//         <div className="flex items-center gap-3">
//           <GripVertical className="w-4 h-4 text-muted-foreground" />
//           <div 
//             className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
//             style={{ backgroundColor: `${step.color}20` }}
//           >
//             <StepIcon className="w-4 h-4" style={{ color: step.color }} />
//           </div>
//           <div className="flex-1 min-w-0">
//             <h4 className="font-medium text-sm">{step.name}</h4>
//             <p className="text-xs text-muted-foreground truncate">
//               {step.description}
//             </p>
//           </div>
//           {!disabled && <Plus className="w-4 h-4 text-muted-foreground" />}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// function SortableStageItem({ stage, index, onEdit, onDelete, disabled = false }: {
//   stage: JobStage;
//   index: number;
//   onEdit: (stage: JobStage) => void;
//   onDelete: (stageId: string) => void;
//   disabled?: boolean;
// }) {
//   const {
//     attributes,
//     listeners,
//     setNodeRef,
//     transform,
//     transition,
//     isDragging,
//   } = useSortable({ id: stage.id, disabled });

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     opacity: isDragging ? 0.5 : 1,
//   };

//   const stepInfo = availableSteps.find(step => step.id === stage.type);
//   const StepIcon = stepInfo?.icon || Settings;

//   const getStatusIcon = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
//       case 'running': return <Play className="w-4 h-4 text-blue-500" />;
//       case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
//       default: return <Clock className="w-4 h-4 text-gray-500" />;
//     }
//   };

//   return (
//     <div className="relative">
//       <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium z-10">
//         {index + 1}
//       </div>
//       <Card
//         ref={setNodeRef}
//         className={`cursor-pointer hover:shadow-md transition-all border-l-4 ml-4 ${disabled ? 'opacity-50' : ''}`}
//         style={{
//           ...style,
//           borderLeftColor: stepInfo?.color || '#e5e7eb'
//         }}
//         onClick={() => onEdit(stage)}
//       >
//         <CardContent className="p-4">
//           <div className="flex items-center gap-3">
//             <div
//               {...attributes}
//               {...listeners}
//               className={`cursor-${disabled ? 'not-allowed' : 'grab'} hover:cursor-grabbing`}
//             >
//               <GripVertical className="w-4 h-4 text-muted-foreground" />
//             </div>
            
//             <div 
//               className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
//               style={{ backgroundColor: `${stepInfo?.color}20` }}
//             >
//               <StepIcon className="w-5 h-5" style={{ color: stepInfo?.color }} />
//             </div>
            
//             <div className="flex-1 min-w-0">
//               <div className="flex items-center gap-2 mb-1">
//                 <h4 className="font-medium text-sm truncate">{stage.name}</h4>
//                 {getStatusIcon(stage.status)}
//               </div>
//               <p className="text-xs text-muted-foreground capitalize">
//                 {stage.type.replace('_', ' ')}
//               </p>
//               {stage.description && (
//                 <p className="text-xs text-muted-foreground mt-1 truncate">
//                   {stage.description}
//                 </p>
//               )}
//             </div>

//             {!disabled && (
//               <div className="flex items-center gap-2">
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   className="w-6 h-6 p-0 hover:bg-red-100"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     onDelete(stage.id);
//                   }}
//                 >
//                   <X className="w-3 h-3" />
//                 </Button>
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// function DropZone({ index, onDrop, disabled = false }: { index: number; onDrop: (index: number, data: any) => void; disabled?: boolean }) {
//   const [isOver, setIsOver] = useState(false);

//   return (
//     <div
//       className={`h-8 flex items-center justify-center transition-all ${
//         isOver && !disabled ? 'bg-primary/10 border-2 border-dashed border-primary' : 'border-2 border-dashed border-transparent'
//       }`}
//       onDragOver={(e) => {
//         if (disabled) return;
//         e.preventDefault();
//         setIsOver(true);
//       }}
//       onDragLeave={() => setIsOver(false)}
//       onDrop={(e) => {
//         if (disabled) return;
//         e.preventDefault();
//         setIsOver(false);
//         const data = JSON.parse(e.dataTransfer.getData('application/json'));
//         onDrop(index, data);
//       }}
//     >
//       {isOver && !disabled && (
//         <div className="text-xs text-primary font-medium">Drop here to insert</div>
//       )}
//     </div>
//   );
// }

// export default function EnhancedEditJobDialog({ 
//   job, 
//   open, 
//   onOpenChange, 
//   onSave 
// }: EnhancedEditJobDialogProps) {
//   const { toast } = useToast();
//   const [stages, setStages] = useState<JobStage[]>([]);
//   const [selectedStage, setSelectedStage] = useState<JobStage | null>(null);
//   const [stageConfigDialogOpen, setStageConfigDialogOpen] = useState(false);
//   const [jobType, setJobType] = useState(job?.category || '');
//   const [glueName, setGlueName] = useState(job?.id || '');

//   const sensors = useSensors(
//     useSensor(PointerSensor),
//     useSensor(KeyboardSensor, {
//       coordinateGetter: sortableKeyboardCoordinates,
//     })
//   );

//   useEffect(() => {
//     if (job && job.steps) {
//       // Initialize stages with fixed steps and used steps from job.steps
//       const fixedSteps: JobStage[] = availableSteps
//         .filter(step => step.fixed)
//         .map(step => ({
//           id: `stage_${job.id}_${step.id}`,
//           name: step.name,
//           type: step.id,
//           status: job.stages?.find(s => s.type === step.id)?.status || 'pending',
//           description: step.description as string | undefined, // Explicitly cast to match JobStage
//           config: {} as Record<string, any> | undefined // Explicitly cast to match JobStage
//         } as JobStage)); // Explicitly type as JobStage

//       // Map JobStepConfig to stage types
//       const stepTypeMapping: { [key: string]: string } = {
//         rules: 'validation',
//         ner: 'processing',
//         businessLogic: 'collection',
//         etl: 'connection'
//       };

//       // Include used steps based on job.steps
//       const usedSteps: JobStage[] = Object.entries(job.steps)
//         .filter(([_, status]) => status === 'used')
//         .map(([key]) => {
//           const stepId = stepTypeMapping[key];
//           const stepInfo = availableSteps.find(step => step.id === stepId);
//           if (!stepInfo) return null;
//           return {
//             id: `stage_${job.id}_${stepId}`,
//             name: stepInfo.name,
//             type: stepId,
//             status: job.stages?.find(s => s.type === stepId)?.status || 'pending',
//             description: stepInfo.description as string | undefined, // Explicitly cast to match JobStage
//             config: {} as Record<string, any> | undefined // Explicitly cast to match JobStage
//           } as JobStage; // Explicitly type as JobStage
//         })
//         .filter((step): step is JobStage => step !== null); // Type guard for non-null

//       // Combine fixed and used steps in the correct order
//       const mergedStages: JobStage[] = [
//         fixedSteps.find(fs => fs.type === 'upload_center'),
//         ...usedSteps,
//         fixedSteps.find(fs => fs.type === 'loading'),
//         fixedSteps.find(fs => fs.type === 'transfer'),
//       ].filter((stage): stage is JobStage => stage !== null); // Type guard for non-null

//       setStages(mergedStages);
//       setJobType(job.category);
//       setGlueName(job.id);

//       // Initialize localStorage based on job.steps
//       localStorage.setItem('rules', job.steps.rules);
//       localStorage.setItem('ner', job.steps.ner);
//       localStorage.setItem('businesslogic', job.steps.businessLogic);
//       localStorage.setItem('etl', job.steps.etl);
//     }
//   }, [job]);

//   // Filter available steps to show only skipped non-fixed steps
//   const filteredAvailableSteps = availableSteps.filter(
//     step => !step.fixed && job?.steps[step.id === 'validation' ? 'rules' : 
//                                      step.id === 'processing' ? 'ner' : 
//                                      step.id === 'collection' ? 'businessLogic' : 
//                                      step.id === 'connection' ? 'etl' : ''] === 'skipped'
//   );

//   const handleDragEnd = (event: DragEndEvent) => {
//     const { active, over } = event;

//     if (active.id !== over?.id) {
//       setStages((items) => {
//         const oldIndex = items.findIndex((item) => item.id === active.id);
//         const newIndex = items.findIndex((item) => item.id === over?.id);

//         // Prevent reordering fixed steps
//         const fixedStepIndices = items
//           .map((item, index) => ({ item, index }))
//           .filter(({ item }) => availableSteps.find(step => step.id === item.type)?.fixed)
//           .map(({ index }) => index);

//         if (fixedStepIndices.includes(oldIndex) || fixedStepIndices.includes(newIndex)) {
//           return items;
//         }

//         // Restrict reordering to between upload_center and loading
//         const uploadIndex = items.findIndex(s => s.type === 'upload_center');
//         const loadingIndex = items.findIndex(s => s.type === 'loading');
//         if (newIndex <= uploadIndex || newIndex >= loadingIndex) return items;

//         const nonFixedItems = items.slice(uploadIndex + 1, loadingIndex);
//         const nonFixedOldIndex = nonFixedItems.findIndex(item => item.id === active.id);
//         const nonFixedNewIndex = newIndex - (uploadIndex + 1);

//         if (nonFixedOldIndex === -1 || nonFixedNewIndex < 0 || nonFixedNewIndex > nonFixedItems.length) return items;

//         const newNonFixedItems = arrayMove(nonFixedItems, nonFixedOldIndex, nonFixedNewIndex);

//         // Reconstruct the full list
//         return [
//           ...items.slice(0, uploadIndex + 1),
//           ...newNonFixedItems,
//           ...items.slice(loadingIndex)
//         ];
//       });
//     }
//   };

//   const handleDropAtPosition = (index: number, data: any) => {
//     if (data.type === 'new-step') {
//       const stepInfo = availableSteps.find(step => step.id === data.step.id);
//       if (stepInfo?.fixed) return; // Prevent adding fixed steps

//       // Prevent dropping before upload_center or after loading
//       const uploadIndex = stages.findIndex(s => s.type === 'upload_center');
//       const loadingIndex = stages.findIndex(s => s.type === 'loading');
//       if (index <= uploadIndex || index > loadingIndex) return;

//       const newStage: JobStage = {
//         id: `stage_${Date.now()}`,
//         name: data.step.name,
//         type: data.step.id,
//         status: 'pending',
//         description: data.step.description,
//         config: {}
//       };

//       setStages(prev => {
//         const newStages = [...prev];
//         newStages.splice(index, 0, newStage);
//         if (newStage.type === 'validation') localStorage.setItem('rules', 'used');
//         if (newStage.type === 'processing') localStorage.setItem('ner', 'used');
//         if (newStage.type === 'collection') localStorage.setItem('businesslogic', 'used');
//         if (newStage.type === 'connection') localStorage.setItem('etl', 'used');
//         return newStages;
//       });
      
//       toast({
//         title: "Stage Added",
//         description: `${data.step.name} has been added to position ${index + 1}`,
//       });
//     }
//   };

//   const addStepToEnd = (step: typeof availableSteps[0]) => {
//     if (step.fixed) return; // Prevent adding fixed steps

//     const newStage: JobStage = {
//       id: `stage_${Date.now()}`,
//       name: step.name,
//       type: step.id,
//       status: 'pending',
//       description: step.description,
//       config: {}
//     };
//     setStages(prev => {
//       // Insert before loading
//       const loadingIndex = prev.findIndex(s => s.type === 'loading');
//       const newStages = [...prev];
//       newStages.splice(loadingIndex, 0, newStage);
//       if (newStage.type === 'validation') localStorage.setItem('rules', 'used');
//       if (newStage.type === 'processing') localStorage.setItem('ner', 'used');
//       if (newStage.type === 'collection') localStorage.setItem('businesslogic', 'used');
//       if (newStage.type === 'connection') localStorage.setItem('etl', 'used');
//       return newStages;
//     });
    
//     toast({
//       title: "Stage Added",
//       description: `${step.name} has been added to the job`,
//     });
//   };

//   const handleEditStage = (stage: JobStage) => {
//     setSelectedStage(stage);
//     setStageConfigDialogOpen(true);
//   };

//   const handleDeleteStage = (stageId: string) => {
//     const stage = stages.find(s => s.id === stageId);
//     if (stage && availableSteps.find(step => step.id === stage.type)?.fixed) {
//       return; // Prevent deleting fixed steps
//     }

//     setStages(prev => prev.filter(stage => stage.id !== stageId));
//     if (stage) {
//       switch (stage.type) {
//         case 'validation':
//           localStorage.setItem('rules', 'skipped');
//           break;
//         case 'processing':
//           localStorage.setItem('ner', 'skipped');
//           break;
//         case 'collection':
//           localStorage.setItem('businesslogic', 'skipped');
//           break;
//         case 'connection':
//           localStorage.setItem('etl', 'skipped');
//           break;
//         default:
//           break;
//       }
//     }
//   };

//   const handleSaveStageConfig = (updatedStage: JobStage) => {
//     setStages(prev => prev.map(stage => 
//       stage.id === updatedStage.id ? updatedStage : stage
//     ));
//     setStageConfigDialogOpen(false);
//     setSelectedStage(null);
//   };

//   const handleSave = () => {
//     if (!job) return;
//     const updatedJob = {
//       ...job,
//       category: jobType,
//       id: glueName
//     };
//     onSave(updatedJob.id, stages);
//   };

//   if (!job) return null;

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
//         <DialogHeader>
//           <DialogTitle>Edit Job Stages: {job.name}</DialogTitle>
//           <div className="grid grid-cols-3 gap-4 mt-4">
//             <div>
//               <label className="text-sm font-medium">Job Name</label>
//               <p className="text-sm text-muted-foreground">{job.name}</p>
//             </div>
//           </div>
//         </DialogHeader>

//         <div className="flex-1 flex gap-6 overflow-hidden">
//           {/* Left Panel - Available Steps */}
//           <div className="w-80 flex flex-col">
//             <h3 className="font-semibold mb-4">Available Steps</h3>
//             <div className="flex-1 overflow-y-auto space-y-2">
//               {filteredAvailableSteps.length === 0 ? (
//                 <div className="text-center py-6">
//                   <p className="text-muted-foreground">All available steps have been added</p>
//                 </div>
//               ) : (
//                 filteredAvailableSteps.map((step) => (
//                   <div key={step.id} onClick={() => addStepToEnd(step)}>
//                     <DraggableStepItem step={step} />
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>

//           {/* Right Panel - Job Stage Pipeline */}
//           <div className="flex-1 border-l pl-6 flex flex-col">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-semibold">Job Stage Pipeline ({stages.length} stages)</h3>
//               <div className="text-sm text-muted-foreground">
//                 Drag to reorder • Click to configure
//               </div>
//             </div>
            
//             <div className="flex-1 overflow-y-auto">
//               {stages.length === 0 ? (
//                 <div className="flex items-center justify-center h-full border-2 border-dashed border-muted-foreground/25 rounded-lg">
//                   <div className="text-center">
//                     <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
//                     <p className="text-muted-foreground mb-2">No stages added</p>
//                     <p className="text-sm text-muted-foreground">Drag steps from the left panel to build your pipeline</p>
//                   </div>
//                 </div>
//               ) : (
//                 <DndContext
//                   sensors={sensors}
//                   collisionDetection={closestCenter}
//                   onDragEnd={handleDragEnd}
//                 >
//                   <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
//                     <div className="space-y-1">
//                       <DropZone index={0} onDrop={handleDropAtPosition} disabled={stages[0]?.type === 'upload_center'} />
//                       {stages.map((stage, index) => (
//                         <div key={stage.id}>
//                           <SortableStageItem
//                             stage={stage}
//                             index={index}
//                             onEdit={handleEditStage}
//                             onDelete={handleDeleteStage}
//                             disabled={availableSteps.find(step => step.id === stage.type)?.fixed}
//                           />
//                           <DropZone 
//                             index={index + 1} 
//                             onDrop={handleDropAtPosition}
//                             disabled={index === 0 || (index >= stages.findIndex(s => s.type === 'loading') && stage.type !== 'transfer')}
//                           />
//                         </div>
//                       ))}
//                     </div>
//                   </SortableContext>
//                 </DndContext>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Actions */}
//         <div className="flex justify-end gap-2 pt-4 border-t">
//           <Button variant="outline" onClick={() => onOpenChange(false)}>
//             Cancel
//           </Button>
//           <Button onClick={handleSave}>
//             Save Changes
//           </Button>
//         </div>

//         {/* Stage Configuration Dialog */}
//         {selectedStage && (
//           <StageConfigDialog01
//             stage={selectedStage}
//             open={stageConfigDialogOpen}
//             onOpenChange={setStageConfigDialogOpen}
//             onSave={handleSaveStageConfig}
//           />
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// }

//recent my code

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import StageConfigDialog01 from './StageConfigDialog01';
import { JobStepConfig } from "@/lib/api";
 
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
  steps: JobStepConfig;
  business_logic_rules?: Record<string, string>;
}
 
interface EnhancedEditJobDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (jobId: string, stages: JobStage[]) => void;
}
 
// Available steps
const availableSteps = [
  { id: 'upload_center', name: 'Data Upload Center', icon: Database, color: '#3b82f6', description: 'Manage data extraction and destination', fixed: true },
  { id: 'loading', name: 'Schema Analysis', icon: Target, color: '#10b981', description: 'Analyze schema of the data', fixed: true },
  { id: 'validation', name: 'DQ Rules', icon: Filter, color: '#f59e0b', description: 'Validate data quality and consistency', fixed: false },
  { id: 'processing', name: 'NER', icon: Settings, color: '#ef4444', description: 'Named Entity Recognition processing', fixed: false },
  { id: 'collection', name: 'Business Logic', icon: Database, color: '#6b7280', description: 'Apply business logic to collected data', fixed: false },
  { id: 'connection', name: 'ETL', icon: Database, color: '#3b82f6', description: 'Extract, Transform, Load processes', fixed: false },
  { id: 'transfer', name: 'Schedule Jobs', icon: Target, color: '#10b981', description: 'Schedule automated job runs', fixed: true },
];
 
function DraggableStepItem({ step, disabled = false }: { step: typeof availableSteps[0], disabled?: boolean }) {
  const StepIcon = step.icon;
 
  return (
    <Card
      className={`cursor-${disabled ? 'not-allowed' : 'grab'} hover:shadow-md transition-all border-l-4 active:cursor-grabbing ${disabled ? 'opacity-50' : ''}`}
      style={{ borderLeftColor: step.color }}
      draggable={!disabled}
      onDragStart={(e) => {
        if (disabled) return;
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
          {!disabled && <Plus className="w-4 h-4 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  );
}
 
function SortableStageItem({ stage, index, onEdit, onDelete, disabled = false }: {
  stage: JobStage;
  index: number;
  onEdit: (stage: JobStage) => void;
  onDelete: (stageId: string) => void;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id, disabled });
 
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
        className={`cursor-pointer hover:shadow-md transition-all border-l-4 ml-4 ${disabled ? 'opacity-50' : ''}`}
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
              className={`cursor-${disabled ? 'not-allowed' : 'grab'} hover:cursor-grabbing`}
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
 
            {!disabled && (
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
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
 
function DropZone({ index, onDrop, disabled = false }: { index: number; onDrop: (index: number, data: any) => void; disabled?: boolean }) {
  const [isOver, setIsOver] = useState(false);
 
  return (
    <div
      className={`h-8 flex items-center justify-center transition-all ${
        isOver && !disabled ? 'bg-primary/10 border-2 border-dashed border-primary' : 'border-2 border-dashed border-transparent'
      }`}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setIsOver(false);
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        onDrop(index, data);
      }}
    >
      {isOver && !disabled && (
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
  const [jobType, setJobType] = useState(job?.category || '');
  const [glueName, setGlueName] = useState(job?.id || '');
 
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
 
  useEffect(() => {
    if (job && job.steps) {
      // Initialize stages with fixed steps and used steps from job.steps
      const fixedSteps: JobStage[] = availableSteps
        .filter(step => step.fixed)
        .map(step => ({
          id: `stage_${job.id}_${step.id}`,
          name: step.name,
          type: step.id,
          status: job.stages?.find(s => s.type === step.id)?.status || 'pending',
          description: step.description as string | undefined, // Explicitly cast to match JobStage
          config: {} as Record<string, any> | undefined // Explicitly cast to match JobStage
        } as JobStage)); // Explicitly type as JobStage
 
      // Map JobStepConfig to stage types
      const stepTypeMapping: { [key: string]: string } = {
        rules: 'validation',
        ner: 'processing',
        businessLogic: 'collection',
        etl: 'connection'
      };
 
      // Include used steps based on job.steps
      const usedSteps: JobStage[] = Object.entries(job.steps)
        .filter(([_, status]) => status === 'used')
        .map(([key]) => {
          const stepId = stepTypeMapping[key];
          const stepInfo = availableSteps.find(step => step.id === stepId);
          if (!stepInfo) return null;
          return {
            id: `stage_${job.id}_${stepId}`,
            name: stepInfo.name,
            type: stepId,
            status: job.stages?.find(s => s.type === stepId)?.status || 'pending',
            description: stepInfo.description as string | undefined, // Explicitly cast to match JobStage
            config: {} as Record<string, any> | undefined // Explicitly cast to match JobStage
          } as JobStage; // Explicitly type as JobStage
        })
        .filter((step): step is JobStage => step !== null); // Type guard for non-null
 
      // Combine fixed and used steps in the correct order
      const mergedStages: JobStage[] = [
        fixedSteps.find(fs => fs.type === 'upload_center'),
        ...usedSteps,
        fixedSteps.find(fs => fs.type === 'loading'),
        fixedSteps.find(fs => fs.type === 'transfer'),
      ].filter((stage): stage is JobStage => stage !== null); // Type guard for non-null
 
      setStages(mergedStages);
      setJobType(job.category);
      setGlueName(job.id);
 
      // Initialize localStorage based on job.steps
      localStorage.setItem('rules', job.steps.rules);
      localStorage.setItem('ner', job.steps.ner);
      localStorage.setItem('businesslogic', job.steps.businessLogic);
      localStorage.setItem('etl', job.steps.etl);
    }
  }, [job]);
 
  // Filter available steps to show only non-fixed steps not currently in stages
  const filteredAvailableSteps = availableSteps.filter(
    step => !step.fixed && !stages.some(s => s.type === step.id)
  );
 
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
 
    if (active.id !== over?.id) {
      setStages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
 
        // Prevent reordering fixed steps
        const fixedStepIndices = items
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => availableSteps.find(step => step.id === item.type)?.fixed)
          .map(({ index }) => index);
 
        if (fixedStepIndices.includes(oldIndex) || fixedStepIndices.includes(newIndex)) {
          return items;
        }
 
        // Restrict reordering to between upload_center and loading
        const uploadIndex = items.findIndex(s => s.type === 'upload_center');
        const loadingIndex = items.findIndex(s => s.type === 'loading');
        if (newIndex <= uploadIndex || newIndex >= loadingIndex) return items;
 
        const nonFixedItems = items.slice(uploadIndex + 1, loadingIndex);
        const nonFixedOldIndex = nonFixedItems.findIndex(item => item.id === active.id);
        const nonFixedNewIndex = newIndex - (uploadIndex + 1);
 
        if (nonFixedOldIndex === -1 || nonFixedNewIndex < 0 || nonFixedNewIndex > nonFixedItems.length) return items;
 
        const newNonFixedItems = arrayMove(nonFixedItems, nonFixedOldIndex, nonFixedNewIndex);
 
        // Reconstruct the full list
        return [
          ...items.slice(0, uploadIndex + 1),
          ...newNonFixedItems,
          ...items.slice(loadingIndex)
        ];
      });
    }
  };
 
  const handleDropAtPosition = (index: number, data: any) => {
    if (data.type === 'new-step') {
      const stepInfo = availableSteps.find(step => step.id === data.step.id);
      if (stepInfo?.fixed) return; // Prevent adding fixed steps
 
      // Prevent dropping before upload_center or after loading
      const uploadIndex = stages.findIndex(s => s.type === 'upload_center');
      const loadingIndex = stages.findIndex(s => s.type === 'loading');
      if (index <= uploadIndex || index > loadingIndex) return;
 
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
        if (newStage.type === 'validation') localStorage.setItem('rules', 'used');
        if (newStage.type === 'processing') localStorage.setItem('ner', 'used');
        if (newStage.type === 'collection') localStorage.setItem('businesslogic', 'used');
        if (newStage.type === 'connection') localStorage.setItem('etl', 'used');
        return newStages;
      });
     
      toast({
        title: "Stage Added",
        description: `${data.step.name} has been added to position ${index + 1}`,
      });
    }
  };
 
  const addStepToEnd = (step: typeof availableSteps[0]) => {
    if (step.fixed) return; // Prevent adding fixed steps
 
    const newStage: JobStage = {
      id: `stage_${Date.now()}`,
      name: step.name,
      type: step.id,
      status: 'pending',
      description: step.description,
      config: {}
    };
    setStages(prev => {
      // Insert before loading
      const loadingIndex = prev.findIndex(s => s.type === 'loading');
      const newStages = [...prev];
      newStages.splice(loadingIndex, 0, newStage);
      if (newStage.type === 'validation') localStorage.setItem('rules', 'used');
      if (newStage.type === 'processing') localStorage.setItem('ner', 'used');
      if (newStage.type === 'collection') localStorage.setItem('businesslogic', 'used');
      if (newStage.type === 'connection') localStorage.setItem('etl', 'used');
      return newStages;
    });
   
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
    const stage = stages.find(s => s.id === stageId);
    if (stage && availableSteps.find(step => step.id === stage.type)?.fixed) {
      return; // Prevent deleting fixed steps
    }
 
    setStages(prev => prev.filter(stage => stage.id !== stageId));
    if (stage) {
      switch (stage.type) {
        case 'validation':
          localStorage.setItem('rules', 'skipped');
          break;
        case 'processing':
          localStorage.setItem('ner', 'skipped');
          break;
        case 'collection':
          localStorage.setItem('businesslogic', 'skipped');
          break;
        case 'connection':
          localStorage.setItem('etl', 'skipped');
          break;
        default:
          break;
      }
    }
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
    const updatedJob = {
      ...job,
      category: jobType,
      id: glueName
    };
    onSave(updatedJob.id, stages);
  };
 
  if (!job) return null;
 
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Job Stages: {job.name}</DialogTitle>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium">Job Name</label>
              <p className="text-sm text-muted-foreground">{job.name}</p>
            </div>
          </div>
        </DialogHeader>
 
        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left Panel - Available Steps */}
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
                      <DropZone index={0} onDrop={handleDropAtPosition} disabled={stages[0]?.type === 'upload_center'} />
                      {stages.map((stage, index) => {
                        const loadingIndex = stages.findIndex(s => s.type === 'loading');
                        return (
                          <div key={stage.id}>
                            <SortableStageItem
                              stage={stage}
                              index={index}
                              onEdit={handleEditStage}
                              onDelete={handleDeleteStage}
                              disabled={availableSteps.find(step => step.id === stage.type)?.fixed}
                            />
                            <DropZone
                              index={index + 1}
                              onDrop={handleDropAtPosition}
                              disabled={(index + 1) > loadingIndex}
                            />
                          </div>
                        );
                      })}
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
          <StageConfigDialog01
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
 //Hello