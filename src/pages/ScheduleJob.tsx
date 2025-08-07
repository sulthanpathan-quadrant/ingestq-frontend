import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Upload, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ScheduleJob() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scheduleType, setScheduleType] = useState<'time' | 'file'>('time');
  const [frequency, setFrequency] = useState('');
  const [time, setTime] = useState('');
  const [datasource, setDatasource] = useState('');

  const handleScheduleJob = () => {
    toast({
      title: "Job Scheduled Successfully",
      description: `Job has been scheduled ${scheduleType === 'time' ? 'based on time' : 'based on file upload'}`,
    });
    navigate('/dashboard/jobs');
  };

  const handleBack = () => {
    navigate('/dashboard/etl');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Schedule Job</h1>
            <p className="text-muted-foreground">Configure when and how your job should run</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule Configuration
              </CardTitle>
              <CardDescription>
                Choose how you want to trigger your job execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup 
                value={scheduleType} 
                onValueChange={(value: 'time' | 'file') => setScheduleType(value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="time" id="time-based" />
                  <Label htmlFor="time-based" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time-based Schedule
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="file" id="file-based" />
                  <Label htmlFor="file-based" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    File Upload Trigger
                  </Label>
                </div>
              </RadioGroup>

              {scheduleType === 'time' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {scheduleType === 'file' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="datasource">Data Source</Label>
                    <Select value={datasource} onValueChange={setDatasource}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data source to monitor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="s3-bucket-1">S3 Bucket - Production Data</SelectItem>
                        <SelectItem value="s3-bucket-2">S3 Bucket - Staging Data</SelectItem>
                        <SelectItem value="azure-blob-1">Azure Blob - Customer Files</SelectItem>
                        <SelectItem value="database-1">Database - Transaction Logs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      The job will automatically trigger when new files are uploaded to the selected data source.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-6">
                <Button onClick={handleBack} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleScheduleJob} 
                  className="flex-1"
                  disabled={scheduleType === 'time' ? !frequency || !time : !datasource}
                >
                  Schedule Job
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
