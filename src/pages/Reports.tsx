
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportsJobSelector from "@/components/reports/ReportsJobSelector";
import JobMetrics from "@/components/reports/JobMetrics";
import SystemMonitor from "@/components/reports/SystemMonitor";
import RealTimeLogs from "@/components/reports/RealTimeLogs";
import PreviousRuns from "@/components/reports/PreviousRuns";

export default function Reports() {
  const [searchParams] = useSearchParams();
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  // Check if a job ID was passed via URL parameters
  useEffect(() => {
    const jobId = searchParams.get('jobId');
    if (jobId) {
      setSelectedJobId(jobId);
    }
  }, [searchParams]);

  return (
    <div className="max-w-7xl mx-auto mt-14 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Monitoring & Reports</h1>
          <p className="text-muted-foreground">
            Monitor job performance, system metrics, and view detailed logs
          </p>
        </div>
      </div>

      {/* Job Selection */}
      <ReportsJobSelector 
        selectedJobId={selectedJobId} 
        onJobSelect={setSelectedJobId} 
      />

      {selectedJobId && (
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metrics">Job Metrics</TabsTrigger>
            <TabsTrigger value="system">System Monitor</TabsTrigger>
            <TabsTrigger value="logs">Real-Time Logs</TabsTrigger>
            <TabsTrigger value="history">Previous Runs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="space-y-4">
            <JobMetrics jobId={selectedJobId} />
          </TabsContent>
          
          <TabsContent value="system" className="space-y-4">
            <SystemMonitor jobId={selectedJobId} />
          </TabsContent>
          
          <TabsContent value="logs" className="space-y-4">
            <RealTimeLogs jobId={selectedJobId} />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <PreviousRuns jobId={selectedJobId} />
          </TabsContent>
        </Tabs>
      )}

      {!selectedJobId && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Please select a job from the dropdown above to view its monitoring data and logs.
          </p>
        </div>
      )}
    </div>
  );
}
