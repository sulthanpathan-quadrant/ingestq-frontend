
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Upload } from "lucide-react";

interface Job {
  id: string;
  name: string;
}

interface ScheduleStepProps {
  job: Job | null;
}

export default function ScheduleStep({ job }: ScheduleStepProps) {
  const [scheduleType, setScheduleType] = useState<'time' | 'trigger'>('time');
  const [frequency, setFrequency] = useState('daily');
  const [time, setTime] = useState('09:00');
  const [triggerType, setTriggerType] = useState('file-upload');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Schedule Configuration
          </CardTitle>
          <CardDescription>
            Configure when and how this job should be executed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">Current Schedule</Badge>
            <span className="text-sm text-muted-foreground">Daily at 9:00 AM</span>
          </div>

          <RadioGroup 
            value={scheduleType} 
            onValueChange={(value: 'time' | 'trigger') => setScheduleType(value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="time" id="time-based" />
              <Label htmlFor="time-based" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Time-based Schedule
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="trigger" id="trigger-based" />
              <Label htmlFor="trigger-based" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Event-based Trigger
              </Label>
            </div>
          </RadioGroup>

          {scheduleType === 'time' && (
            <div className="space-y-4 ml-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom Cron</SelectItem>
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
              
              {frequency === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="cronExpression">Cron Expression</Label>
                  <Input
                    id="cronExpression"
                    placeholder="0 9 * * 1-5 (Every weekday at 9 AM)"
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Use standard cron format: minute hour day month weekday
                  </p>
                </div>
              )}
            </div>
          )}

          {scheduleType === 'trigger' && (
            <div className="space-y-4 ml-6">
              <div className="space-y-2">
                <Label htmlFor="triggerType">Trigger Type</Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file-upload">File Upload</SelectItem>
                    <SelectItem value="data-change">Data Change</SelectItem>
                    <SelectItem value="api-call">API Call</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {triggerType === 'file-upload' && (
                <div className="space-y-2">
                  <Label htmlFor="watchPath">Watch Path</Label>
                  <Input
                    id="watchPath"
                    placeholder="/incoming/customer-data/"
                    value="/incoming/customer-data/"
                  />
                  <p className="text-sm text-muted-foreground">
                    Job will trigger when files are uploaded to this path
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Schedule Summary</h4>
            <div className="bg-muted p-3 rounded text-sm">
              {scheduleType === 'time' ? (
                <p>
                  This job will run <strong>{frequency}</strong> at <strong>{time}</strong>
                </p>
              ) : (
                <p>
                  This job will trigger when there is a <strong>{triggerType.replace('-', ' ')}</strong> event
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
