import { useState } from "react";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock, Download, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const validationResults = {
  totalRecords: 15420,
  validRecords: 14890,
  invalidRecords: 530,
  successRate: 96.6,
  rulesExecuted: 12,
  rulesPassed: 9,
  rulesFailed: 3
};

const ruleResults = [
  { rule: 'AccountID Uniqueness', column: 'AccountID', passed: 15420, failed: 0, severity: 'critical', status: 'passed' },
  { rule: 'CustomerName Not Null', column: 'CustomerName', passed: 15395, failed: 25, severity: 'critical', status: 'warning' },
  { rule: 'AccountType Values', column: 'AccountType', passed: 15200, failed: 220, severity: 'critical', status: 'failed' },
  { rule: 'Balance Range', column: 'Balance', passed: 14950, failed: 470, severity: 'warning', status: 'failed' },
  { rule: 'Email Format', column: 'Email', passed: 15300, failed: 120, severity: 'warning', status: 'warning' },
  { rule: 'Phone Format', column: 'Phone', passed: 15380, failed: 40, severity: 'info', status: 'warning' },
];

const chartData = [
  { name: 'AccountID', passed: 15420, failed: 0 },
  { name: 'CustomerName', passed: 15395, failed: 25 },
  { name: 'AccountType', passed: 15200, failed: 220 },
  { name: 'Balance', passed: 14950, failed: 470 },
  { name: 'Email', passed: 15300, failed: 120 },
  { name: 'Phone', passed: 15380, failed: 40 },
];

const pieData = [
  { name: 'Valid Records', value: validationResults.validRecords, color: '#10b981' },
  { name: 'Invalid Records', value: validationResults.invalidRecords, color: '#ef4444' },
];

const trendData = [
  { date: '2024-01-01', successRate: 94.2 },
  { date: '2024-01-02', successRate: 95.1 },
  { date: '2024-01-03', successRate: 93.8 },
  { date: '2024-01-04', successRate: 96.3 },
  { date: '2024-01-05', successRate: 96.6 },
];

export default function Dashboard() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'warning': return 'bg-warning text-warning-foreground';
      case 'info': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Quality Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights into your data validation results
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-3xl font-bold text-success">{validationResults.successRate}%</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
            <Progress value={validationResults.successRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-3xl font-bold text-foreground">{validationResults.totalRecords.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {validationResults.validRecords.toLocaleString()} valid, {validationResults.invalidRecords.toLocaleString()} invalid
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rules Executed</p>
                <p className="text-3xl font-bold text-foreground">{validationResults.rulesExecuted}</p>
              </div>
              <div className="w-12 h-12 bg-chart-4/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-chart-4" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {validationResults.rulesPassed} passed, {validationResults.rulesFailed} failed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Invalid Records</p>
                <p className="text-3xl font-bold text-destructive">{validationResults.invalidRecords}</p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {((validationResults.invalidRecords / validationResults.totalRecords) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Results */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rules">Rule Results</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="failures">Failure Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Validation Results by Column</CardTitle>
                <CardDescription>Number of passed vs failed validations per column</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="passed" fill="#10b981" />
                    <Bar dataKey="failed" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Data Quality Distribution</CardTitle>
                <CardDescription>Overall data quality summary</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="rules" className="space-y-4">
          <div className="space-y-4">
            {ruleResults.map((result, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(result.status)}
                      <div>
                        <h3 className="font-semibold">{result.rule}</h3>
                        <p className="text-sm text-muted-foreground">Column: {result.column}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Badge className={getSeverityColor(result.severity)}>
                        {result.severity}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-medium text-success">
                          {result.passed.toLocaleString()} passed
                        </p>
                        {result.failed > 0 && (
                          <p className="text-sm font-medium text-destructive">
                            {result.failed.toLocaleString()} failed
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Success Rate</span>
                      <span>{((result.passed / (result.passed + result.failed)) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={(result.passed / (result.passed + result.failed)) * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Success Rate Trend</CardTitle>
              <CardDescription>Data quality success rate over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[90, 100]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="successRate" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="failures" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Failing Rules</CardTitle>
                <CardDescription>Rules with the highest failure rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ruleResults
                    .filter(rule => rule.failed > 0)
                    .sort((a, b) => b.failed - a.failed)
                    .map((rule, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{rule.rule}</p>
                          <p className="text-sm text-muted-foreground">{rule.column}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-destructive">{rule.failed}</p>
                          <p className="text-xs text-muted-foreground">failures</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Suggested Actions</CardTitle>
                <CardDescription>AI-generated recommendations to improve data quality</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                    <h4 className="font-medium text-warning">AccountType Validation</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      220 records have invalid account types. Consider updating the enum values or cleaning the source data.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <h4 className="font-medium text-destructive">Balance Range Issues</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      470 records have balance values outside the expected range. Review business rules for balance limits.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h4 className="font-medium text-primary">Email Format</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      120 email addresses are malformed. Consider implementing data cleansing rules.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}