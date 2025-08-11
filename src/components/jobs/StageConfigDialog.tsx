import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Database, FileText, Settings, CheckCircle, AlertCircle, Clock, Target, Filter, Calendar, ArrowLeft } from 'lucide-react';

// Import your existing step components
import DataSourceStep from "./steps/DataSourceStep";
import DestinationStep from "./steps/DestinationStep";
import BusinessLogicStep from "./steps/BusinessLogicStep";
import DQRulesStep from "./steps/DQRulesStep";
import ScheduleStep from "./steps/ScheduleStep";

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

// Map stage types to your existing step components
const stageTypeInfo = {
  source: { 
    icon: Database, 
    color: '#3b82f6', 
    label: 'Source Stage',
    description: 'Configure data source connections and extraction settings',
    component: DataSourceStep 
  },
  destination: { 
    icon: Target, 
    color: '#10b981', 
    label: 'Destination Stage',
    description: 'Configure target systems and data loading settings',
    component: DestinationStep 
  },
  business_logic: { 
    icon: Settings, 
    color: '#8b5cf6', 
    label: 'Business Logic Stage',
    description: 'Define data transformations and business rules',
    component: BusinessLogicStep 
  },
  dq_rules: { 
    icon: Filter, 
    color: '#f59e0b', 
    label: 'Data Quality Rules Stage',
    description: 'Configure data validation and quality checks',
    component: DQRulesStep 
  },
  schedule: { 
    icon: Calendar, 
    color: '#ef4444', 
    label: 'Schedule Stage',
    description: 'Configure time-based or event-based triggers',
    component: ScheduleStep 
  },
  // Additional mappings for common stage types that might use existing components
  datasource: { 
    icon: Database, 
    color: '#3b82f6', 
    label: 'Data Source',
    description: 'Configure data source connections',
    component: DataSourceStep 
  },
  extraction: { 
    icon: Database, 
    color: '#3b82f6', 
    label: 'Data Extraction',
    description: 'Extract data from source systems',
    component: DataSourceStep 
  },
  transformation: { 
    icon: Settings, 
    color: '#8b5cf6', 
    label: 'Data Transformation',
    description: 'Transform and process data',
    component: BusinessLogicStep 
  },
  loading: { 
    icon: Target, 
    color: '#10b981', 
    label: 'Data Loading',
    description: 'Load data into target systems',
    component: DestinationStep 
  },
  validation: { 
    icon: Filter, 
    color: '#f59e0b', 
    label: 'Data Validation',
    description: 'Validate data quality and integrity',
    component: DQRulesStep 
  },
  processing: { 
    icon: Settings, 
    color: '#8b5cf6', 
    label: 'Data Processing',
    description: 'Process and analyze data',
    component: BusinessLogicStep 
  },
};

export default function StageConfigDialog({ 
  stage, 
  open, 
  onOpenChange, 
  onSave 
}: StageConfigDialogProps) {
  const [stageConfig, setStageConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (stage) {
      setStageConfig(stage.config || {});
    }
  }, [stage]);

  const handleSave = () => {
    const updatedStage: JobStage = {
      ...stage,
      config: stageConfig,
    };
    onSave(updatedStage);
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
    const typeInfo = stageTypeInfo[stage.type as keyof typeof stageTypeInfo];
    
    if (!typeInfo?.component) {
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
              <p className="text-xs text-muted-foreground mt-2">
                Available types: source, destination, business_logic, dq_rules, schedule
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const StageConfigComponent = typeInfo.component;
    
    // Create a mock job object for the step components
    const mockJob = {
      id: stage.id,
      name: stage.name
    };
    
    return (
      <StageConfigComponent job={mockJob} />
    );
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
          {/* Back to Flow Button */}
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
          {/* Stage Overview */}
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

          {/* Stage-Specific Configuration - Using your existing step components */}
          {renderStageSpecificConfig()}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
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
