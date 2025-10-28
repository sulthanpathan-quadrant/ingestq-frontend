import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Play, Database, Settings, CheckCircle, AlertCircle, Clock, Target, Filter, ArrowLeft } from 'lucide-react';

// Import your existing step components
import DataUploadCenterStep from "./steps/DataUploadCenterStep";
import BusinessLogicStep from "./steps/BusinessLogicStep";
import ScheduleStep from "./steps/ScheduleStep";
import DataTransformationStep from "./steps/DataTransformationStep";

// Define BusinessRule interface here (matches BusinessLogicStep.tsx)
interface BusinessRule {
  id: string;
  name: string;
  logic: string;
  description: string;
}

interface JobStage {
  id: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  config?: Record<string, any>;
}

interface StageConfigDialogProps {
  stage: JobStage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (stage: JobStage) => void;
}

// Map stage types to your step components
const stageTypeInfo = {
  upload_center: { 
    icon: Database, 
    color: '#3b82f6', 
    label: 'Data Upload Center',
    description: 'Configure data source and destination settings',
    component: DataUploadCenterStep 
  },
  loading: { 
    icon: Target, 
    color: '#10b981', 
    label: 'Schema Analysis',
    description: 'Analyze schema of the data',
    component: () => <Card><CardContent className="p-4 text-center text-muted-foreground">Click on save configuration to run this step.</CardContent></Card>
  },
  validation: { 
    icon: Filter, 
    color: '#f59e0b', 
    label: 'DQ Rules',
    description: 'Validate data quality and consistency',
    component: () => <Card><CardContent className="p-4 text-center text-muted-foreground">Click on save configuration to run this step.</CardContent></Card>
  },
  processing: { 
    icon: Settings, 
    color: '#ef4444', 
    label: 'NER',
    description: 'Named Entity Recognition processing',
    component: () => <Card><CardContent className="p-4 text-center text-muted-foreground">Click on save configuration to run this step.</CardContent></Card>
  },
  collection: { 
    icon: Database, 
    color: '#6b7280', 
    label: 'Business Logic',
    description: 'Apply business logic to collected data',
    component: BusinessLogicStep 
  },
  connection: { 
    icon: Database, 
    color: '#3b82f6', 
    label: 'Data Transformations',
    description: 'Extract, Transform, Load processes',
    component: DataTransformationStep
  },
  transfer: { 
    icon: Target, 
    color: '#10b981', 
    label: 'Schedule Jobs',
    description: 'Schedule automated job runs',
    component: ScheduleStep 
  },
};

export default function StageConfigDialog({ 
  stage, 
  open, 
  onOpenChange, 
  onSave 
}: StageConfigDialogProps) {
  const { toast } = useToast();
  const [stageConfig, setStageConfig] = useState<Record<string, any>>({});
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>([]);

  useEffect(() => {
    if (stage) {
      setStageConfig(stage.config || {});
      if (stage.type === 'collection' && stage.config?.business_logic_rules) {
        // Handle both array and object formats
        if (Array.isArray(stage.config.business_logic_rules)) {
          setBusinessRules(stage.config.business_logic_rules);
        } else if (typeof stage.config.business_logic_rules === 'object') {
          // Convert object to array format if needed
          const rulesArray = Object.entries(stage.config.business_logic_rules).map(([name, logic]) => ({
            id: `rule_${Date.now()}_${Math.random()}`,
            name,
            logic: logic as string,
            description: ''
          }));
          setBusinessRules(rulesArray);
        }
      }
    }
  }, [stage]);

  const handleConfigChange = (config: Record<string, any>) => {
    setStageConfig((prev) => ({ ...prev, ...config }));
  };

  const handleBusinessRulesChange = (rules: BusinessRule[]) => {
    setBusinessRules(rules);
    // Convert rules array to object format for backend
    const rulesObject = rules.reduce((acc, rule) => {
      acc[rule.name] = rule.logic;
      return acc;
    }, {} as Record<string, string>);
    
    setStageConfig((prev) => ({ 
      ...prev, 
      business_logic_rules: rulesObject 
    }));
  };

  const handleSave = () => {
    // Validation for Business Logic stage
    if (stage.type === 'collection') {
      if (!businessRules || businessRules.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please add at least one business rule before saving.",
          variant: "destructive",
        });
        return;
      }

      // Validate each rule has required fields
      const invalidRule = businessRules.find(rule => !rule.name || !rule.logic);
      if (invalidRule) {
        toast({
          title: "Validation Error",
          description: "All business rules must have a name and logic definition.",
          variant: "destructive",
        });
        return;
      }
    }

    const updatedStage: JobStage = {
      ...stage,
      config: stageConfig,
    };
    onSave(updatedStage);

    // Save stage-specific local storage keys
    switch (stage.type) {
      case 'loading':
        localStorage.setItem('schema', 'executed');
        break;
      case 'validation':
        localStorage.setItem('rules', 'executed');
        break;
      case 'processing':
        localStorage.setItem('ner', 'executed');
        break;
      case 'collection':
        localStorage.setItem('businessLogic', 'executed');
        break;
      case 'connection':
        localStorage.setItem('datatransformations', 'executed');
        break;
      case 'transfer':
        localStorage.setItem('schedule', 'executed');
        if (stageConfig.scheduleType) {
          localStorage.setItem('scheduleType', stageConfig.scheduleType);
          if (stageConfig.scheduleType === 'time') {
            if (!stageConfig.frequency || !stageConfig.time) {
              toast({
                title: "Incomplete Schedule Configuration",
                description: "Please select both frequency and time for time-based scheduling.",
                variant: "destructive",
              });
              return;
            }
            localStorage.setItem('frequency', stageConfig.frequency);
            localStorage.setItem('time', stageConfig.time);
          } else {
            localStorage.removeItem('frequency');
            localStorage.removeItem('time');
          }
        }
        break;
      default:
        break;
    }

    toast({
      title: "Configuration Saved",
      description: `Configuration for ${stageTypeInfo[stage.type as keyof typeof stageTypeInfo]?.label || stage.type} stage has been saved successfully.`,
    });

    onOpenChange(false);
  };

  const handleCancel = () => {
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
      case 'transfer':
        localStorage.setItem('schedule', 'skipped');
        localStorage.removeItem('scheduleType');
        localStorage.removeItem('frequency');
        localStorage.removeItem('time');
        break;
      default:
        break;
    }
    onOpenChange(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'running': return <Play className="w-5 h-5 text-blue-500" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const renderStageSpecificConfig = () => {
    switch (stage.type) {
      case 'upload_center':
        return <DataUploadCenterStep />;
      case 'loading':
        return <Card><CardContent className="p-4 text-center text-muted-foreground">Click on save configuration to run this step.</CardContent></Card>;
      case 'validation':
        return <Card><CardContent className="p-4 text-center text-muted-foreground">Click on save configuration to run this step.</CardContent></Card>;
      case 'processing':
        return <Card><CardContent className="p-4 text-center text-muted-foreground">Click on save configuration to run this step.</CardContent></Card>;
      case 'collection':
        return (
          <BusinessLogicStep 
            rules={businessRules}
            onRulesChange={handleBusinessRulesChange}
          />
        );
      case 'connection':
        return <DataTransformationStep />;
      case 'transfer':
        return (
          <ScheduleStep 
            onConfigChange={handleConfigChange}
          />
        );
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unknown Stage Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Configuration for stage type "{stage.type}" is not available.
                </p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  const typeInfo = stageTypeInfo[stage.type as keyof typeof stageTypeInfo] || {
    icon: Settings,
    color: '#6b7280',
    label: 'Unknown Stage',
    description: 'Unknown stage type',
    component: null
  };
  const TypeIcon = typeInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${typeInfo.color}20` }}
            >
              <TypeIcon className="w-5 h-5" style={{ color: typeInfo.color }} />
            </div>
            Configure Stage: {stage.name}
          </DialogTitle>
          <DialogDescription>
            Adjust the settings for the {typeInfo.label} stage in your job pipeline.
          </DialogDescription>
          <div className="flex justify-start pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Flow
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stage Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Stage Type</div>
                  <p className="font-medium">{typeInfo.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{typeInfo.description}</p>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Current Status</div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(stage.status)}
                    <Badge className={`${stage.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      stage.status === 'running' ? 'bg-blue-100 text-blue-800' : 
                      stage.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                      {stage.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {renderStageSpecificConfig()}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}