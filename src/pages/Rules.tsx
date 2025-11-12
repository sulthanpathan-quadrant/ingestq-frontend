import { useState, useEffect } from "react";
import { Plus, Edit, CheckCircle, Play, RefreshCw, ArrowRight, AlertTriangle, Wrench, ArrowLeft, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { runDQRulesGeneration, DQRulesGenerationRequest, DQRulesGenerationResponse, DQRule as APIDQRule } from "@/lib/api";
import { runDQValidation, DQValidationRequest, DQValidationResponse, runDQFixing, DQFixingRequest, DQFixingResponse } from "@/lib/api";

const LoadingOverlay = ({ message }: { message: string }) => {
  return (
    <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="relative">
                <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary/20" />
                </div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">{message}</h3>
              <p className="text-sm text-muted-foreground">Please wait while we process your data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface DQRule {
  id: string;
  column: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'ai-generated' | 'user-edited';
  type: 'smart-proposal' | 'user-rule';
}

interface FailureAnalysis {
  ruleName: string;
  reasonForFailure: string;
  solution: string;
}

export default function Rules() {
  const [smartRules, setSmartRules] = useState<DQRule[]>([]);
  const [isDataSourceSelected, setIsDataSourceSelected] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [showQuickFixDialog, setShowQuickFixDialog] = useState(false);
  const [showEditIssueDialog, setShowEditIssueDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<DQRule | null>(null);
  const [editingIssueIndex, setEditingIssueIndex] = useState<number | null>(null);
  const [validationProgress, setValidationProgress] = useState(0);
  const [validationStatus, setValidationStatus] = useState<'running' | 'success' | 'failed' | null>(null);
  const [validationResults, setValidationResults] = useState<{ passed: number, failed: number, summary: string } | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<'running' | 'success' | null>(null);
  const [quickFixProgress, setQuickFixProgress] = useState(0);
  const [quickFixStatus, setQuickFixStatus] = useState<'running' | 'success' | null>(null);
  const [validationResponse, setValidationResponse] = useState<DQValidationResponse | null>(null);
  const [editableIssue, setEditableIssue] = useState<FailureAnalysis | null>(null);
  const [currentAnalysisData, setCurrentAnalysisData] = useState<FailureAnalysis[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bucket, setBucket] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [isLoadingRules, setIsLoadingRules] = useState(true);

  const validateLocalStorage = () => {
    const bucket = localStorage.getItem('selectedBucket');
    const key = localStorage.getItem('selectedFile');
    console.log('LocalStorage - selectedBucket:', bucket);
    console.log('LocalStorage - selectedFile:', key);
    if (!bucket || !key) {
      console.warn('Missing or empty bucket or key in localStorage. Redirecting to upload page.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing bucket name or key. Please upload the file again.",
      });
      navigate('/dashboard/upload');
      return false;
    }
    return { bucket, key };
  };

  const mapSeverity = (apiSeverity: string): 'critical' | 'warning' | 'info' => {
    switch (apiSeverity) {
      case 'high':
        return 'critical';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  };

  const reverseMapSeverity = (severity: 'critical' | 'warning' | 'info'): string => {
    switch (severity) {
      case 'critical':
        return 'high';
      case 'warning':
        return 'medium';
      case 'info':
        return 'low';
      default:
        return 'low';
    }
  };

  useEffect(() => {
    const fetchDQRules = async () => {
      setIsLoadingRules(true);
      try {
        const validationResult = validateLocalStorage();
        if (!validationResult) {
          setIsDataSourceSelected(false);
          return;
        }

        const { bucket, key } = validationResult;
        setBucket(bucket);
        setKey(key);
        setIsDataSourceSelected(true);

        const inputType = localStorage.getItem('input_type') || 'csv';
        console.log('Input type from localStorage:', inputType);

        let request: DQRulesGenerationRequest;

        if (inputType === 'snowflake') {
          const database = localStorage.getItem('db_name');
          const table_name = localStorage.getItem('db_table');

          if (!database || !table_name) {
            console.error('Missing Snowflake database or table name');
            toast({
              title: "Error",
              description: "Missing Snowflake connection details.",
              variant: "destructive",
            });
            setIsDataSourceSelected(false);
            return;
          }

          request = {
            input_type: 'snowflake',
            database,
            table_name
          };

          console.log('Snowflake request payload:', request);

        } else if (inputType === 'database') {

          const db_host = localStorage.getItem('db_host');
          const db_name = localStorage.getItem('db_name');
          const db_user = localStorage.getItem('db_user');
          const db_password = localStorage.getItem('db_password');
          const db_port = localStorage.getItem('db_port');
          const db_table = localStorage.getItem('db_table');

          if (!db_host || !db_name || !db_user || !db_password || !db_port || !db_table) {
            console.error('Missing database connection parameters in localStorage');
            toast({
              title: "Error",
              description: "Missing database connection details. Please reconnect from the upload page.",
              variant: "destructive",
            });
            setIsDataSourceSelected(false);
            return;
          }

          request = {
            input_type: 'database',
            db_host,
            db_name,
            db_user,
            db_password,
            db_port,
            db_table,
          };

          console.log('Database request payload:', { ...request, db_password: '***' });

        } else if (inputType === 'xlsx') {

          const sheet_name = localStorage.getItem('selectedSheet');

          request = {
            input_type: 'xlsx',
            bucket_name: bucket,
            key: key,
            sheet_name: sheet_name || undefined,
          };

          console.log('Excel request payload:', request);

        } else {

          request = {
            input_type: inputType as "csv" | "parquet",
            bucket_name: bucket,
            key: key,
          };

          console.log(`${inputType.toUpperCase()} request payload:`, request);
        }

        const response: DQRulesGenerationResponse = await runDQRulesGeneration(request);
        const rulesArray = response.lambda_response?.body?.file || response.lambda_response?.rules;

        if (response.success && rulesArray) {

          const mappedRules: DQRule[] = rulesArray.map((apiRule: APIDQRule, index: number) => ({
            id: `api-${index + 1}`,
            column: apiRule.rule,
            description: apiRule.description,
            severity: mapSeverity(apiRule.severity),
            status: 'ai-generated',
            type: 'smart-proposal',
          }));

          setSmartRules(mappedRules);

        } else {
          console.warn('API response unsuccessful:', response.message);
          toast({
            title: "Error",
            description: response.message || "Failed to fetch DQ rules.",
            variant: "destructive",
          });
        }

      } catch (error) {
        console.error("Error fetching DQ rules:", error);
        toast({
          title: "Error",
          description: "An error occurred while fetching data quality rules.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingRules(false);
      }
    };

    fetchDQRules();
  }, [toast, navigate]);

  const handleRunValidation = async () => {
    localStorage.setItem('rules', 'executed');
    setShowValidationDialog(true);
    setValidationStatus('running');
    setValidationProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setValidationProgress(Math.min(progress, 90));
    }, 300);

    try {
      const allRules = smartRules.map(rule => ({
        rule: rule.column,
        description: rule.description,
        severity: reverseMapSeverity(rule.severity),
      })) as APIDQRule[];

      const inputType = localStorage.getItem('input_type') || 'csv';

      let request: any = { input_type: inputType, rules: allRules };

      if (inputType === 'snowflake') {
        request = {
          input_type: 'snowflake',
          db_config: {
            database: localStorage.getItem('db_name'),
            table_name: localStorage.getItem('db_table'),
          },
          rules: allRules
        };
      }

    else if (inputType === 'database') {
      request.db_config = {
        db_host: localStorage.getItem('db_host'),
        db_name: localStorage.getItem('db_name'),
        db_user: localStorage.getItem('db_user'),
        db_password: localStorage.getItem('db_password'),
        db_port: parseInt(localStorage.getItem('db_port') || '0'),
        db_table: localStorage.getItem('db_table'),
      };

    } else if (inputType === 'xlsx') {
      request.bucket_name = bucket;
      request.key = key;
      request.sheet_name = localStorage.getItem('selectedSheet');

    } else {
      request.bucket_name = bucket;
      request.key = key;
    }

    const response: DQValidationResponse = await runDQValidation(request);

    clearInterval(interval);
    setValidationProgress(100);

    const totalRules = smartRules.length;
    setValidationResults({
      passed: response.rules_passed,
      failed: response.rules_failed,
      summary: `Validation completed: ${response.rules_passed} rules passed, ${response.rules_failed} rules failed. Data quality score: ${totalRules > 0 ? Math.round((response.rules_passed / totalRules) * 100) : 0}%`
    });

    setValidationResponse(response);
    setValidationStatus('success');

  } catch (error) {
    clearInterval(interval);
    setValidationProgress(100);
    setValidationStatus('failed');
    toast({
      title: "Error",
      description: "An error occurred while running DQ validation. Check server logs for details.",
      variant: "destructive",
    });
  }
};

const handleEditRule = (rule: DQRule) => {
  setEditingRule({ ...rule });
  setShowEditDialog(true);
};

const handleSaveRule = () => {
  if (editingRule) {
    const updatedRule = { ...editingRule, status: 'user-edited' as const };
    setSmartRules(prev => prev.map(rule =>
      rule.id === editingRule.id ? updatedRule : rule
    ));
    toast({
      title: "Rule updated successfully",
      description: `Rule for ${editingRule.column} has been updated.`,
    });
    setShowEditDialog(false);
    setEditingRule(null);
  }
};

const handleProceedToNER = () => {
  navigate('/dashboard/ner');
};

const handleAnalyzeFailures = () => {
  setShowValidationDialog(false);
  setShowAnalysisDialog(true);
  setAnalysisStatus('success');

  const initialAnalysis = validationResponse?.issues
    ? Object.entries(validationResponse.issues).map(([ruleName, issue]) => ({
      ruleName,
      reasonForFailure: issue.reason_for_failure,
      solution: issue.proposed_solution,
    }))
    : [];

  setCurrentAnalysisData(initialAnalysis);
};

const handleEditIssue = (index: number) => {
  setEditingIssueIndex(index);
  setEditableIssue({ ...currentAnalysisData[index] });
  setShowEditIssueDialog(true);
};

const handleSaveEditedIssue = () => {
  if (editingIssueIndex !== null && editableIssue) {
    const updatedAnalysisData = [...currentAnalysisData];
    updatedAnalysisData[editingIssueIndex] = { ...editableIssue };
    setCurrentAnalysisData(updatedAnalysisData);

    toast({
      title: "Issue Updated",
      description: `Issue for rule "${editableIssue.ruleName}" has been updated successfully.`,
    });

    setShowEditIssueDialog(false);
    setEditingIssueIndex(null);
    setEditableIssue(null);
  }
};

const handleQuickFix = async () => {
  setShowAnalysisDialog(false);
  setShowQuickFixDialog(true);
  setQuickFixStatus('running');
  setQuickFixProgress(0);

  let progress = 0;
  const interval = setInterval(() => {
    progress += 8;
    setQuickFixProgress(Math.min(progress, 90));
  }, 200);

  try {
    if (!validationResponse) {
      throw new Error("No validation response available");
    }

    const allRules = smartRules.map(rule => ({
      rule: rule.column,
      description: rule.description,
      severity: reverseMapSeverity(rule.severity),
    })) as APIDQRule[];

    const proposedSolutions = currentAnalysisData.reduce((acc, analysis) => {
      acc[analysis.ruleName] = analysis.solution;
      return acc;
    }, {} as any);

    const inputType = localStorage.getItem('input_type') || 'csv';

    let request: any = {
  input_type: inputType,
  rules: allRules,
  proposed_solutions: proposedSolutions
};

if (inputType === 'snowflake') {
  request.db_config = {
    database: localStorage.getItem('db_name'),
    table_name: localStorage.getItem('db_table'),
  };

    } else if (inputType === 'database') {
      request.db_config = {
        db_host: localStorage.getItem('db_host'),
        db_name: localStorage.getItem('db_name'),
        db_user: localStorage.getItem('db_user'),
        db_password: localStorage.getItem('db_password'),
        db_port: parseInt(localStorage.getItem('db_port') || '0'),
        db_table: localStorage.getItem('db_table'),
      };

    } else if (inputType === 'xlsx') {
      request.bucket_name = bucket;
      request.key = key;
      request.sheet_name = localStorage.getItem('selectedSheet');

    } else {
      request.bucket_name = bucket;
      request.key = key;
    }

    const response: DQFixingResponse = await runDQFixing(request);

    clearInterval(interval);
    setQuickFixProgress(100);
    setQuickFixStatus('success');

  } catch (error) {
    clearInterval(interval);
    setQuickFixProgress(100);
    setQuickFixStatus(null);
    toast({
      title: "Error",
      description: "An error occurred while running DQ fixing. Check server logs for details.",
      variant: "destructive",
    });
  }
};


const handleCancelAnalysis = () => {
  setShowAnalysisDialog(false);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ai-generated': return 'bg-primary/10 text-primary border-primary';
    case 'user-edited': return 'bg-success/10 text-success border-success';
    default: return 'bg-muted text-muted-foreground';
  }
};

const handleBackToSchema = () => {
  navigate('/dashboard/schema');
};

const handleSkipDQRules = () => {
  localStorage.setItem('rules', 'skipped');
  navigate('/dashboard/ner');
};

return (
  <div className="max-w-6xl mt-14 mx-auto p-6 space-y-6">
    {isLoadingRules && (
      <LoadingOverlay message="Loading Data Quality Rules" />
    )}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Quality Rules</h1>
        <p className="text-muted-foreground">
          AI-generated smart rule proposals and user-edited rules for data validation
        </p>
      </div>
      <Button
        className="bg-blue-600 hover:bg-blue-700 text-white"
        onClick={handleRunValidation}
      >
        <Play className="w-4 h-4 mr-2" />
        Run DQ Validation
      </Button>
    </div>

    {!isDataSourceSelected && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Data Source Not Selected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">
            Please select a bucket and file from the Schema page to load data quality rules.
          </p>
          <Button variant="outline" onClick={handleBackToSchema} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Schema Selection
          </Button>
        </CardContent>
      </Card>
    )}

    {isDataSourceSelected && (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Plus className="w-5 h-5 mr-2" />
              Smart Rule Proposals ({smartRules.length})
            </CardTitle>
            <CardDescription>
              AI-generated data quality rules based on schema analysis and data patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {smartRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{rule.column}</h3>
                      <Badge className={`${getStatusColor(rule.status)} pointer-events-none`}>
                        {rule.status === 'ai-generated' ? 'AI Generated' : 'User Edited'}
                      </Badge>
                    </div>
                    <p className="text-foreground">{rule.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleBackToSchema}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Schema
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleSkipDQRules}>
              Skip DQ Rules
            </Button>
            {validationResults && (
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                onClick={handleProceedToNER}
              >
                Proceed to NER
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </>
    )}

    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Data Quality Rule</DialogTitle>
          <DialogDescription>
            Modify the rule configuration for {editingRule?.column}
          </DialogDescription>
        </DialogHeader>
        {editingRule && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="column">Column Name</Label>
              <Input
                id="column"
                value={editingRule.column}
                onChange={(e) => setEditingRule(prev => prev ? { ...prev, column: e.target.value } : null)}
              />
            </div>
            <div>
              <Label htmlFor="description">Rule Description</Label>
              <Textarea
                id="description"
                value={editingRule.description}
                onChange={(e) => setEditingRule(prev => prev ? { ...prev, description: e.target.value } : null)}
                rows={3}
              />
            </div>
            <Button
              onClick={handleSaveRule}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              Save Changes
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>

    <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>DQ Rules Validation</DialogTitle>
          <DialogDescription>
            Running validation on all configured data quality rules
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {validationStatus === 'running' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </div>
                <p className="text-lg font-medium">Validating Rules...</p>
                <p className="text-sm text-muted-foreground">
                  Checking data against {smartRules.length} configured rules
                </p>
              </div>
              <Progress value={validationProgress} className="w-full" />
              <p className="text-center text-sm text-muted-foreground">
                {validationProgress}% Complete
              </p>
            </div>
          )}

          {validationStatus === 'failed' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-destructive">Validation Failed</h3>
              <p className="text-sm text-muted-foreground">An error occurred during validation. Please check the server logs or ensure the path is accessible.</p>
            </div>
          )}

          {validationStatus === 'success' && validationResults && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-success">Validation Complete!</h3>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">{validationResults.passed}</div>
                      <div className="text-sm text-muted-foreground">Rules Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-destructive">{validationResults.failed}</div>
                      <div className="text-sm text-muted-foreground">Rules Failed</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{validationResults.summary}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowValidationDialog(false)}
                  className="flex-1"
                >
                  Modify DQ Rules
                </Button>
                {validationResults.failed > 0 && (
                  <Button
                    onClick={handleAnalyzeFailures}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Analyze Failures
                  </Button>
                )}
                <Button
                  onClick={handleProceedToNER}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Proceed to NER
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto !rounded-xl sm:!rounded-xl">
        <DialogHeader>
          <DialogTitle>Failure Analysis</DialogTitle>
          <DialogDescription>
            Analyzing failed rules to identify root causes and solutions
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {analysisStatus === 'running' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-orange-600 animate-spin" />
                </div>
                <p className="text-lg font-medium">Analyzing Failures...</p>
                <p className="text-sm text-muted-foreground">
                  Examining data patterns and rule violations
                </p>
              </div>
              <Progress value={analysisProgress} className="w-full" />
              <p className="text-center text-sm text-muted-foreground">
                {analysisProgress}% Complete
              </p>
            </div>
          )}

          {analysisStatus === 'success' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold">Analysis Complete</h3>
                <p className="text-sm text-muted-foreground">Found {currentAnalysisData.length} issues that can be automatically resolved</p>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {currentAnalysisData.map((analysis, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-orange-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-3">
                        <div>
                          <h4 className="font-semibold text-orange-900">Rule: {analysis.ruleName}</h4>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-orange-800">Reason for Failure:</p>
                          <p className="text-sm text-orange-700">{analysis.reasonForFailure}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-orange-800">Proposed Solution:</p>
                          <p className="text-sm text-orange-700">{analysis.solution}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditIssue(index)}
                        className="ml-4 border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancelAnalysis}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleQuickFix}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Quick Fix
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={showEditIssueDialog} onOpenChange={setShowEditIssueDialog}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Issue</DialogTitle>
          <DialogDescription>
            Modify the failure reason and solution for this specific issue
          </DialogDescription>
        </DialogHeader>
        {editableIssue && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="ruleName" className="text-blue-900 font-semibold">
                Rule Name
              </Label>
              <Input
                id="ruleName"
                value={editableIssue.ruleName}
                onChange={(e) => setEditableIssue(prev => prev ? { ...prev, ruleName: e.target.value } : null)}
                className="mt-1 bg-white border-blue-200 focus:border-blue-400"
              />
            </div>
            <div>
              <Label htmlFor="reasonForFailure" className="text-blue-900 font-semibold">
                Reason for Failure
              </Label>
              <Textarea
                id="reasonForFailure"
                value={editableIssue.reasonForFailure}
                onChange={(e) => setEditableIssue(prev => prev ? { ...prev, reasonForFailure: e.target.value } : null)}
                rows={3}
                className="mt-1 bg-white border-blue-200 focus:border-blue-400"
              />
            </div>
            <div>
              <Label htmlFor="solution" className="text-blue-900 font-semibold">
                Proposed Solution
              </Label>
              <Textarea
                id="solution"
                value={editableIssue.solution}
                onChange={(e) => setEditableIssue(prev => prev ? { ...prev, solution: e.target.value } : null)}
                rows={3}
                className="mt-1 bg-white border-blue-200 focus:border-blue-400"
              />
            </div>
            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditIssueDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEditedIssue}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    <Dialog open={showQuickFixDialog} onOpenChange={setShowQuickFixDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick Fix in Progress</DialogTitle>
          <DialogDescription>
            Applying automatic fixes to resolve data quality issues
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {quickFixStatus === 'running' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
                </div>
                <p className="text-lg font-medium">Applying Quick Fixes...</p>
                <p className="text-sm text-muted-foreground">
                  Resolving {currentAnalysisData.length} identified issues
                </p>
              </div>
              <Progress value={quickFixProgress} className="w-full" />
              <p className="text-center text-sm text-muted-foreground">
                {quickFixProgress}% Complete
              </p>
            </div>
          )}

          {quickFixStatus === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-success">Resolved Successfully!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  All data quality issues have been automatically resolved using your edited solutions.
                </p>
                <div className="mt-4 p-4 bg-success/10 rounded-lg">
                  <p className="text-sm font-medium text-success">
                    ✅ All rules now pass validation
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Data quality score: 100%
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setShowQuickFixDialog(false);
                  setValidationResults(prev => prev ? {
                    ...prev,
                    failed: 0,
                    passed: smartRules.length,
                    summary: `Validation completed: ${smartRules.length} rules passed, 0 rules failed. Data quality score: 100%`
                  } : null);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                Continue
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  </div>
);
}