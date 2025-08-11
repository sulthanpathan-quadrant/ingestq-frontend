"use client"

import { Button } from "@/components/ui/button"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Zap } from "lucide-react"

interface ScheduleStepProps {
  data?: any
  onChange?: (data: any) => void
}

export default function ScheduleStep({ data = {}, onChange }: ScheduleStepProps) {
  const [config, setConfig] = useState({
    scheduleType: data.scheduleType || "cron",
    cronExpression: data.cronExpression || "0 0 * * *",
    timezone: data.timezone || "UTC",
    enabled: data.enabled || true,
    maxRetries: data.maxRetries || 3,
    retryDelay: data.retryDelay || 300,
    eventTrigger: data.eventTrigger || "",
    dependencies: data.dependencies || [],
    ...data,
  })

  const handleChange = (field: string, value: any) => {
    const newConfig = { ...config, [field]: value }
    setConfig(newConfig)
    onChange?.(newConfig)
  }

  const getScheduleTypeIcon = (type: string) => {
    switch (type) {
      case "cron":
        return <Clock className="w-4 h-4" />
      case "event":
        return <Zap className="w-4 h-4" />
      case "manual":
        return <Calendar className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const cronPresets = [
    { label: "Every minute", value: "* * * * *" },
    { label: "Every hour", value: "0 * * * *" },
    { label: "Daily at midnight", value: "0 0 * * *" },
    { label: "Weekly on Sunday", value: "0 0 * * 0" },
    { label: "Monthly on 1st", value: "0 0 1 * *" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Schedule Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="scheduleType">Schedule Type</Label>
          <Select value={config.scheduleType} onValueChange={(value) => handleChange("scheduleType", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cron">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time-based (Cron)
                </div>
              </SelectItem>
              <SelectItem value="event">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Event-based
                </div>
              </SelectItem>
              <SelectItem value="manual">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Manual Trigger
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.scheduleType === "cron" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="cronExpression">Cron Expression</Label>
              <Input
                id="cronExpression"
                value={config.cronExpression}
                onChange={(e) => handleChange("cronExpression", e.target.value)}
                placeholder="0 0 * * *"
              />
              <div className="text-sm text-muted-foreground">
                Current: {config.cronExpression}
                <Badge variant="outline" className="ml-2">
                  {getScheduleTypeIcon(config.scheduleType)}
                  {config.scheduleType}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quick Presets</Label>
              <div className="flex flex-wrap gap-2">
                {cronPresets.map((preset) => (
                  <Button
                    key={preset.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleChange("cronExpression", preset.value)}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={config.timezone} onValueChange={(value) => handleChange("timezone", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {config.scheduleType === "event" && (
          <div className="space-y-2">
            <Label htmlFor="eventTrigger">Event Trigger</Label>
            <Select value={config.eventTrigger} onValueChange={(value) => handleChange("eventTrigger", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select event trigger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="file-arrival">File Arrival</SelectItem>
                <SelectItem value="database-change">Database Change</SelectItem>
                <SelectItem value="api-webhook">API Webhook</SelectItem>
                <SelectItem value="queue-message">Queue Message</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => handleChange("enabled", checked)}
          />
          <Label htmlFor="enabled">Enable Schedule</Label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxRetries">Max Retries</Label>
            <Input
              id="maxRetries"
              type="number"
              value={config.maxRetries}
              onChange={(e) => handleChange("maxRetries", Number.parseInt(e.target.value))}
              placeholder="3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retryDelay">Retry Delay (seconds)</Label>
            <Input
              id="retryDelay"
              type="number"
              value={config.retryDelay}
              onChange={(e) => handleChange("retryDelay", Number.parseInt(e.target.value))}
              placeholder="300"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
