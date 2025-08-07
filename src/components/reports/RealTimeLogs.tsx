
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, RotateCcw, Download } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  component?: string;
}

interface RealTimeLogsProps {
  jobId: string;
}

const mockLogs: LogEntry[] = [
  { id: '1', timestamp: '2024-01-31 10:45:32', level: 'INFO', message: 'Job execution started', component: 'JobManager' },
  { id: '2', timestamp: '2024-01-31 10:45:33', level: 'INFO', message: 'Connecting to data source', component: 'DataConnector' },
  { id: '3', timestamp: '2024-01-31 10:45:35', level: 'INFO', message: 'Processing batch 1 of 50', component: 'BatchProcessor' },
  { id: '4', timestamp: '2024-01-31 10:45:40', level: 'WARN', message: 'Slow query detected: execution time 3.2s', component: 'QueryExecutor' },
  { id: '5', timestamp: '2024-01-31 10:45:42', level: 'INFO', message: 'Processing batch 2 of 50', component: 'BatchProcessor' },
  { id: '6', timestamp: '2024-01-31 10:45:45', level: 'ERROR', message: 'Failed to process record ID: 12345', component: 'RecordProcessor' },
  { id: '7', timestamp: '2024-01-31 10:45:47', level: 'INFO', message: 'Retry attempt 1 for record ID: 12345', component: 'RecordProcessor' },
  { id: '8', timestamp: '2024-01-31 10:45:50', level: 'INFO', message: 'Processing batch 3 of 50', component: 'BatchProcessor' },
];

const getLevelColor = (level: string) => {
  switch (level) {
    case 'ERROR': return 'bg-red-500 text-white';
    case 'WARN': return 'bg-yellow-500 text-white';
    case 'INFO': return 'bg-blue-500 text-white';
    case 'DEBUG': return 'bg-gray-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

export default function RealTimeLogs({ jobId }: RealTimeLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [isLive, setIsLive] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        level: ['INFO', 'WARN', 'ERROR', 'DEBUG'][Math.floor(Math.random() * 4)] as LogEntry['level'],
        message: [
          'Processing batch completed successfully',
          'Data validation in progress',
          'Connection established to database',
          'Memory usage: 45%',
          'Processing record batch 15 of 50',
          'Transformation applied to dataset',
        ][Math.floor(Math.random() * 6)],
        component: ['BatchProcessor', 'DataValidator', 'DBConnector', 'SystemMonitor'][Math.floor(Math.random() * 4)]
      };
      
      setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep only last 100 logs
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  const handleToggleLive = () => {
    setIsLive(!isLive);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleDownloadLogs = () => {
    const logText = logs.map(log => 
      `${log.timestamp} [${log.level}] ${log.component ? `[${log.component}] ` : ''}${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-${jobId}-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!jobId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">Select a job to view logs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Real-Time Logs</CardTitle>
            <CardDescription>
              Live logging output for the selected job
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={isLive ? "default" : "outline"}
              size="sm"
              onClick={handleToggleLive}
            >
              {isLive ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isLive ? 'Pause' : 'Resume'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearLogs}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadLogs}>
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 w-full border rounded-lg p-4">
          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No logs to display</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start space-x-2 text-sm">
                  <span className="text-muted-foreground text-xs font-mono min-w-[140px]">
                    {log.timestamp}
                  </span>
                  <Badge className={`${getLevelColor(log.level)} text-xs min-w-[50px] justify-center`}>
                    {log.level}
                  </Badge>
                  {log.component && (
                    <Badge variant="outline" className="text-xs">
                      {log.component}
                    </Badge>
                  )}
                  <span className="flex-1">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
