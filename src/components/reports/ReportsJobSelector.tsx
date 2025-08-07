
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface Job {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  category: string;
  lastRun: string;
}

interface JobSelectorProps {
  selectedJobId: string;
  onJobSelect: (jobId: string) => void;
}

const mockJobs: Job[] = [
  {
    id: '1',
    name: "Customer Data ETL",
    status: 'running',
    category: 'Glue Jobs',
    lastRun: '2024-01-31 10:30:00'
  },
  {
    id: '2',
    name: "Sales Analytics",
    status: 'completed',
    category: 'Glue Jobs',
    lastRun: '2024-01-31 09:45:00'
  },
  {
    id: '3',
    name: "Data Validation",
    status: 'failed',
    category: 'Lambda Jobs',
    lastRun: '2024-01-31 11:15:00'
  },
  {
    id: '4',
    name: "Report Generation",
    status: 'pending',
    category: 'Batch Jobs',
    lastRun: '2024-01-30 08:20:00'
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running': return <Clock className="w-4 h-4 text-blue-500" />;
    case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
    case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    default: return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'bg-blue-500 text-white';
    case 'completed': return 'bg-green-500 text-white';
    case 'failed': return 'bg-red-500 text-white';
    case 'pending': return 'bg-yellow-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

export default function ReportsJobSelector({ selectedJobId, onJobSelect }: JobSelectorProps) {
  const selectedJob = mockJobs.find(job => job.id === selectedJobId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Job to Monitor</CardTitle>
        <CardDescription>Choose a job to view its detailed monitoring information</CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={selectedJobId} onValueChange={onJobSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a job to monitor" />
          </SelectTrigger>
          <SelectContent>
            {mockJobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(job.status)}
                  <span>{job.name}</span>
                  <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedJob && (
          <div className="mt-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedJob.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedJob.category}</p>
                <p className="text-xs text-muted-foreground">Last run: {selectedJob.lastRun}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(selectedJob.status)}
                <Badge className={getStatusColor(selectedJob.status)}>
                  {selectedJob.status}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
