import { useState, useEffect, useMemo } from "react"; // ← Added useMemo
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Upload, Info } from "lucide-react";

interface CompactScheduleStepProps {
  config?: Record<string, any>;
  onConfigChange?: (config: Record<string, any>) => void;
  triggerType?: "SCHEDULE" | "File";
  // Separate prop for read-only original API data
  initialScheduleDetails?: {
    frequency?: string;
    time?: string;
    triggerType?: "SCHEDULE" | "File";
  };
  // Keep old scheduleDetails for backward compatibility
  scheduleDetails?: {
    frequency?: string;
    time?: string;
  };
}

export default function CompactScheduleStep({ 
  config, 
  onConfigChange,
  triggerType: initialTriggerType,
  initialScheduleDetails,
  scheduleDetails 
}: CompactScheduleStepProps) {
  const [triggerType, setTriggerType] = useState<"SCHEDULE" | "File">("SCHEDULE"); // Default to SCHEDULE
  const [frequency, setFrequency] = useState("");
  const [time, setTime] = useState("");

  // NEW: Extract primitives from props to stable deps (prevents nested ref issues)
  const extractedConfig = useMemo(() => ({
    triggerType: config?.triggerType,
    frequency: config?.frequency,
    time: config?.time,
  }), [config?.triggerType, config?.frequency, config?.time]);

  const extractedSchedule = useMemo(() => ({
    frequency: scheduleDetails?.frequency,
    time: scheduleDetails?.time,
  }), [scheduleDetails?.frequency, scheduleDetails?.time]);

  const extractedInitial = useMemo(() => ({
    frequency: initialScheduleDetails?.frequency,
    time: initialScheduleDetails?.time,
  }), [initialScheduleDetails?.frequency, initialScheduleDetails?.time]);

  // FIXED: Sync useEffect - Uses stable primitives + guards (no loop on same values)
  useEffect(() => {
    // Guard: Skip if no data (avoids initial empty runs)
    if (!config && !initialTriggerType && !scheduleDetails && !initialScheduleDetails) return;

    const newTriggerType = extractedConfig.triggerType || initialTriggerType || "SCHEDULE"; // Default to SCHEDULE
    const newFrequency = extractedConfig.frequency || extractedSchedule.frequency || extractedInitial.frequency || "";
    const newTime = extractedConfig.time || extractedSchedule.time || extractedInitial.time || "";

    // NEW: Only update if values actually changed (breaks loop)
    if (triggerType !== newTriggerType) setTriggerType(newTriggerType);
    if (frequency !== newFrequency) setFrequency(newFrequency);
    if (time !== newTime) setTime(newTime);

    // TEMP DEBUG: Log only on real changes (remove after testing)
    if (triggerType !== newTriggerType || frequency !== newFrequency || time !== newTime) {
      console.log('🔍 Sync useEffect updated state:', { newTriggerType, newFrequency, newTime });
    }
  }, [
    extractedConfig.triggerType,
    extractedConfig.frequency,
    extractedConfig.time,
    initialTriggerType,
    extractedSchedule.frequency,
    extractedSchedule.time,
    extractedInitial.frequency,
    extractedInitial.time,
    // Only primitives—no unstable objects!
  ]);

  // FIXED: Propagate useEffect - Memoize callback for stability
  const stableOnConfigChange = useMemo(() => onConfigChange, [onConfigChange]);
  useEffect(() => {
    if (stableOnConfigChange) {
      const configToSave = {
        triggerType,
        frequency: triggerType === "SCHEDULE" ? frequency : undefined,
        time: triggerType === "SCHEDULE" ? time : undefined,
      };
      stableOnConfigChange(configToSave);
    }
  }, [triggerType, frequency, time, stableOnConfigChange]);

  // FIXED: Memoize banner text (avoids recompute on every render)
  const lastConfiguredText = useMemo(() => {
    if (!initialScheduleDetails?.frequency || !initialScheduleDetails?.time) return null;
    return `${initialScheduleDetails.frequency.charAt(0).toUpperCase() + initialScheduleDetails.frequency.slice(1)} at ${initialScheduleDetails.time}`;
  }, [initialScheduleDetails?.frequency, initialScheduleDetails?.time]);

  // TEMP DEBUG: Render counter (remove after confirming no loop)
  console.log('🔍 CompactScheduleStep rendered');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Schedule Configuration
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        

        <div className="space-y-3">
          <Label>Trigger Type *</Label>
          <RadioGroup
            value={triggerType}
            onValueChange={(value: "SCHEDULE" | "File") => setTriggerType(value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="SCHEDULE" id="schedule-trigger" />
              <Label htmlFor="schedule-trigger" className="flex items-center gap-2 cursor-pointer font-normal">
                <Clock className="w-4 h-4" />
                Time-based Schedule
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="File" id="file-trigger" />
              <Label htmlFor="file-trigger" className="flex items-center gap-2 cursor-pointer font-normal">
                <Upload className="w-4 h-4" />
                File Upload Trigger
              </Label>
            </div>
          </RadioGroup>
        </div>

        {triggerType === "SCHEDULE" && (
          <div className="space-y-4 pt-2 border-t">
            <div className="grid grid-cols-2 gap-4">
              {/* Frequency Selection */}
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger id="frequency">
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

              {/* Time Input */}
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
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
      </CardContent>
    </Card>
  );
}