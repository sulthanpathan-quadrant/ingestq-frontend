import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { format, startOfDay, startOfMonth, eachHourOfInterval, eachDayOfInterval, endOfDay, endOfMonth, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface LocalJob {
  id: string
  name: string
  category: string
  lastRun: string
  createdAt: string
  status: string
  description?: string
  isConnected?: boolean
  pipelines?: any[]
  stages?: any[]
  duration?: string
  jobId: string
}

interface DashboardProps {
  jobs: LocalJob[]
  allJobs: LocalJob[]
  onViewResults: () => void
  showViewResults: boolean
  currentView: "chart" | "table"
  onStatusFilter: (status: string) => void
  selectedStatus: string
  onCategoryFilter: (category: string) => void
  selectedCategory: string
  onDateRangeFilter: (range: string) => void
  selectedDateRange: string
}

const CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF4567"]
const STATUS_COLORS = {
  Completed: "#28a745",
  Running: "#17a2b8",
  Failed: "#dc3545",
  Queued: "#ffc107",
  PENDING:"#fd7e14",
  Created:"#6c757d"
}

const CATEGORY_COLORS: Record<string, string> = {
  "Glue Jobs": "#3b82f6",
  "Lambda Jobs": "#8b5cf6",
  "Batch Jobs": "#10b981",
  "ADF Jobs": "#f59e0b",
}

export default function Dashboard({
  jobs,
  allJobs,
  onViewResults,
  showViewResults,
  currentView,
  onStatusFilter,
  selectedStatus,
  onCategoryFilter,
  selectedCategory,
  onDateRangeFilter,
  selectedDateRange,
}: DashboardProps) {
  const { toast } = useToast()
  const [timePeriod, setTimePeriod] = useState<"daily" | "monthly">("daily")

  const getStatusData = () => {
    
    const statusCounts = jobs.reduce(
      
      (acc, job) => {

        acc[job.status] = (acc[job.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    fill: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '6b7280',

    }))
  }

  const getCategoryData = () => {
    const categoryCounts = jobs.reduce(
      (acc, job) => {
        acc[job.category] = (acc[job.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(categoryCounts).map(([category, count], index) => ({
      name: category,
      value: count,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }))
  }

  const getTimePeriodData = () => {
    let filteredJobs = allJobs
    let glueJobsCount = 0
    const now = new Date()
    
    if (timePeriod === "daily") {
      const startOfToday = startOfDay(now)
      filteredJobs = allJobs.filter((job) => {
        const jobDate = parseISO(job.createdAt)
        return startOfDay(jobDate).getTime() === startOfToday.getTime()
      })
    } else {
      const startOfCurrentMonth = startOfMonth(now)
      const endOfCurrentMonth = endOfMonth(now)
      filteredJobs = allJobs.filter((job) => {
        const jobDate = parseISO(job.createdAt)
        return jobDate >= startOfCurrentMonth && jobDate <= endOfCurrentMonth
      })
    }

    // Calculate total Glue Jobs count for the filtered jobs
    glueJobsCount = filteredJobs.filter((job) => job.category === "Glue").length

    if (timePeriod === "daily") {
      const startOfSelectedDay = startOfDay(now)
      const endOfSelectedDay = endOfDay(now)
      const hours = eachHourOfInterval({ start: startOfSelectedDay, end: endOfSelectedDay })
      
      const hourlyData: Record<string, Record<string, number>> = {}
      hours.forEach(hour => {
        const hourKey = format(hour, "HH:mm")
        hourlyData[hourKey] = {
          "Glue Jobs": 0,
        }
      })

      filteredJobs.forEach(job => {
        const jobDate = parseISO(job.createdAt)
        const hourKey = format(jobDate, "HH:mm")
        if (hourlyData[hourKey] && job.category === "Glue") {
          hourlyData[hourKey]["Glue Jobs"] = (hourlyData[hourKey]["Glue Jobs"] || 0) + 1
        }
      })

      return {
        data: Object.entries(hourlyData).map(([time, categories]) => ({
          time,
          ...categories,
        })),
        glueJobsCount,
      }
    } else {
      const startOfSelectedMonth = startOfMonth(now)
      const endOfSelectedMonth = endOfMonth(now)
      const days = eachDayOfInterval({ start: startOfSelectedMonth, end: endOfSelectedMonth })
      
      const dailyData: Record<string, Record<string, number>> = {}
      days.forEach(day => {
        const dayKey = format(day, "dd/MM")
        dailyData[dayKey] = {
          "Glue Jobs": 0,
        }
      })

      filteredJobs.forEach(job => {
        const jobDate = parseISO(job.createdAt)
        const dayKey = format(jobDate, "dd/MM")
        if (dailyData[dayKey] && job.category === "Glue") {
          dailyData[dayKey]["Glue Jobs"] = (dailyData[dayKey]["Glue Jobs"] || 0) + 1
        }
      })

      return {
        data: Object.entries(dailyData).map(([time, categories]) => ({
          time,
          ...categories,
        })),
        glueJobsCount,
      }
    }
  }

  const getChartTitle = () => {
    const { glueJobsCount } = getTimePeriodData()
    if (timePeriod === "daily") {
      return `Glue Jobs Created by Hour - ${format(new Date(), "MMM dd, yyyy")} (Total Glue Jobs: ${glueJobsCount})`
    } else {
      return `Glue Jobs Created by Day - ${format(new Date(), "MMM yyyy")} (Total Glue Jobs: ${glueJobsCount})`
    }
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0)
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${timePeriod === "daily" ? "Hour" : "Date"}: ${label}`}</p>
          <p className="text-sm text-muted-foreground mb-2">{`Total Glue Jobs Created: ${total}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {showViewResults && (
          <Button onClick={onViewResults} variant="outline" className="mb-4">
            View Results
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Jobs by Category</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={getCategoryData()} cx="50%" cy="50%" outerRadius={65} paddingAngle={5} dataKey="value">
                    {getCategoryData().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        onClick={() => {
                          const newCategory = selectedCategory === entry.name ? "All" : entry.name
                          onCategoryFilter(newCategory)
                          toast({ title: "Filter Applied", description: `Showing ${newCategory} category jobs` })
                        }}
                        className="cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Job Status Distribution</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={getStatusData()} cx="50%" cy="50%" outerRadius={65} paddingAngle={5} dataKey="value">
                    {getStatusData().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        onClick={() => {
                          const newStatus = selectedStatus === entry.name ? "All" : entry.name
                          onStatusFilter(newStatus)
                          toast({ title: "Filter Applied", description: `Showing ${newStatus} jobs` })
                        }}
                        className="cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm col-span-1 lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{getChartTitle()}</h3>
              <div className="flex gap-2">
                <Select
                  value={timePeriod}
                  onValueChange={(value) => setTimePeriod(value as "daily" | "monthly")}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily (by Hour)</SelectItem>
                    <SelectItem value="monthly">Monthly (by Day)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getTimePeriodData().data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    interval={timePeriod === "daily" ? 2 : 1}
                  />
                  <YAxis />
                  <Tooltip content={customTooltip} />
                  <Legend />
                  <Bar dataKey="Glue Jobs" stackId="a" fill={CATEGORY_COLORS["Glue Jobs"]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}