
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  RefreshCw, 
  ArrowRight, 
  Settings,
  Play,
  FileText,
  Calendar,
  Cloud,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface DataSource {
  id: string;
  name: string;
  type: 'Database' | 'S3 Bucket' | 'Azure Blob';
  status: 'Connected' | 'Error' | 'Pending';
}

interface Transformation {
  id: string;
  name: string;
  status: 'Completed' | 'Running' | 'Pending' | 'Failed';
  progress: number;
}

const mockDataSources: DataSource[] = [
  { id: 'db-1', name: 'Production Database', type: 'Database', status: 'Connected' },
  { id: 's3-1', name: 'Marketing S3 Bucket', type: 'S3 Bucket', status: 'Connected' },
  { id: 'blob-1', name: 'Customer Azure Blob', type: 'Azure Blob', status: 'Error' },
];

const mockTransformations: Transformation[] = [
  { id: 'tf-1', name: 'Data Cleaning', status: 'Completed', progress: 100 },
  { id: 'tf-2', name: 'Data Standardization', status: 'Running', progress: 60 },
  { id: 'tf-3', name: 'Data Enrichment', status: 'Pending', progress: 0 },
  { id: 'tf-4', name: 'DQ Checks', status: 'Pending', progress: 0 },
];

export default function ETL() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dataSources] = useState<DataSource[]>(mockDataSources);
  const [transformations, setTransformations] = useState<Transformation[]>(mockTransformations);
  const [isJobRunning, setIsJobRunning] = useState(false);

  const handleScheduleJob = () => {
    navigate('/dashboard/schedule-job');
    toast({
      title: "Proceeding to Job Scheduling",
      description: "Configure when your job should run",
    });
  };

  const handleGoBack = () => {
    navigate('/dashboard/business-logic');
  };

  const handleGoNext = () => {
    navigate('/dashboard/rules');
  };

  const simulateTransformationStep = (stepIndex: number): Promise<void> => {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        setTransformations(prev => {
          const updated = [...prev];
          if (updated[stepIndex].progress < 100) {
            updated[stepIndex].status = 'Running';
            updated[stepIndex].progress += 20;
          } else {
            updated[stepIndex].status = 'Completed';
            clearInterval(interval);
            resolve();
          }
          return updated;
        });
      }, 500);
    });
  };

  const handleRunJob = async () => {
    setIsJobRunning(true);
    
    toast({
      title: "Job Execution Started",
      description: "Running ETL pipeline across all data sources",
    });

    // Reset all transformations to pending
    setTransformations(prev => 
      prev.map(t => ({ ...t, status: 'Pending' as const, progress: 0 }))
    );

    // Simulate processing each data source
    for (const source of dataSources.filter(ds => ds.status === 'Connected')) {
      toast({
        title: `Processing ${source.name}`,
        description: "Running data transformation steps",
      });

      // Run each transformation step sequentially
      for (let i = 0; i < transformations.length; i++) {
        await simulateTransformationStep(i);
        
        toast({
          title: `${transformations[i].name} Completed`,
          description: `Finished processing data from ${source.name}`,
        });
      }
    }

    setIsJobRunning(false);
    
    toast({
      title: "ETL Pipeline Completed",
      description: "All data sources processed successfully",
    });
  };

  const handleViewReports = () => {
    navigate('/dashboard/reports');
    toast({
      title: "Navigating to Reports",
      description: "View detailed reports and analytics",
    });
  };

  const handleDataSourceSettings = (source: DataSource) => {
    toast({
      title: "Data Source Settings",
      description: `Configure settings for ${source.name}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">ETL Pipeline</h1>
            <p className="text-muted-foreground">Design, manage, and monitor your data pipelines</p>
          </div>

          <Button
            onClick={handleGoNext}
            className="flex items-center gap-2"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Sources Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Sources
              </CardTitle>
              <CardDescription>
                Connected data sources for ingestion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dataSources.map((source) => (
                <div key={source.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full p-2 bg-muted">
                      {source.type === 'Database' && <Database className="w-4 h-4 text-foreground" />}
                      {source.type === 'S3 Bucket' && <FileText className="w-4 h-4 text-foreground" />}
                      {source.type === 'Azure Blob' && <Cloud className="w-4 h-4 text-foreground" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{source.name}</p>
                      <p className="text-xs text-muted-foreground">{source.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      "text-white",
                      source.status === 'Connected' && "bg-green-500 hover:bg-green-600",
                      source.status === 'Error' && "bg-red-500 hover:bg-red-600",
                      source.status === 'Pending' && "bg-yellow-500 hover:bg-yellow-600"
                    )}>
                      {source.status}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleDataSourceSettings(source)}>
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Transformations Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Data Transformations
              </CardTitle>
              <CardDescription>
                Data processing and transformation steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {transformations.map((transform) => (
                <div key={transform.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{transform.name}</p>
                    <Badge className={cn(
                      "text-white",
                      transform.status === 'Completed' && "bg-green-500 hover:bg-green-600",
                      transform.status === 'Running' && "bg-blue-500 hover:bg-blue-600",
                      transform.status === 'Pending' && "bg-yellow-500 hover:bg-yellow-600",
                      transform.status === 'Failed' && "bg-red-500 hover:bg-red-600"
                    )}>
                      {transform.status}
                    </Badge>
                  </div>
                  <Progress value={transform.progress} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 mt-6">
          <Button onClick={handleScheduleJob} variant="secondary">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Job
          </Button>
          <Button 
            onClick={handleRunJob} 
            disabled={isJobRunning}
            className={cn(isJobRunning && "opacity-75")}
          >
            <Play className="w-4 h-4 mr-2" />
            {isJobRunning ? "Running..." : "Run Job"}
          </Button>
          <Button onClick={handleViewReports} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>
    </div>
  );
}
