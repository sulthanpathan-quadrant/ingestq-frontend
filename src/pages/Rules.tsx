import { useState } from "react";
import { Plus, Edit, CheckCircle, Play, RefreshCw, X, ArrowRight, AlertTriangle, Wrench, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

const smartRuleProposals: DQRule[] = [
  {
    id: '1',
    column: 'CustomerID',
    description: 'Must be unique and cannot be null - critical for data integrity',
    severity: 'critical',
    status: 'ai-generated',
    type: 'smart-proposal'
  },
  {
    id: '2',
    column: 'Email',
    description: 'Must be a valid email format with @ symbol and domain',
    severity: 'warning', 
    status: 'ai-generated',
    type: 'smart-proposal'
  },
  {
    id: '3',
    column: 'Phone',
    description: 'Should follow standard phone number format (10-15 digits)',
    severity: 'info',
    status: 'ai-generated',
    type: 'smart-proposal'
  }
];

const userEditedRules: DQRule[] = [
  {
    id: '4',
    column: 'AccountBalance',
    description: 'Balance must be non-negative and within reasonable limits (edited by user)',
    severity: 'critical',
    status: 'user-edited',
    type: 'user-rule'
  }
];

const mockFailureAnalysis: FailureAnalysis[] = [
  {
    ruleName: 'CustomerID Uniqueness',
    reasonForFailure: 'Found 23 duplicate CustomerID values in the dataset',
    solution: 'Remove duplicate records keeping the most recent entry based on timestamp'
  },
  {
    ruleName: 'Email Format Validation',
    reasonForFailure: 'Invalid email format detected in 15% of records (missing @ symbol or domain)',
    solution: 'Apply email format standardization and flag invalid entries for manual review'
  }
];

export default function Rules() {
  const [smartRules, setSmartRules] = useState<DQRule[]>(smartRuleProposals);
  const [userRules, setUserRules] = useState<DQRule[]>(userEditedRules);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [showQuickFixDialog, setShowQuickFixDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<DQRule | null>(null);
  const [validationProgress, setValidationProgress] = useState(0);
  const [validationStatus, setValidationStatus] = useState<'running' | 'success' | 'failed' | null>(null);
  const [validationResults, setValidationResults] = useState<{passed: number, failed: number, summary: string} | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<'running' | 'success' | null>(null);
  const [quickFixProgress, setQuickFixProgress] = useState(0);
  const [quickFixStatus, setQuickFixStatus] = useState<'running' | 'success' | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRunValidation = () => {
    setShowValidationDialog(true);
    setValidationStatus('running');
    setValidationProgress(0);

    const interval = setInterval(() => {
      setValidationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          const totalRules = smartRules.length + userRules.length;
          const passed = Math.floor(totalRules * 0.8);
          const failed = totalRules - passed;
          
          setValidationResults({
            passed,
            failed,
            summary: `Validation completed: ${passed} rules passed, ${failed} rules failed. Data quality score: ${Math.round((passed/totalRules) * 100)}%`
          });
          setValidationStatus('success');
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleEditRule = (rule: DQRule) => {
    setEditingRule({ ...rule });
    setShowEditDialog(true);
  };

  const handleSaveRule = () => {
    if (editingRule) {
      const updatedRule = { ...editingRule, status: 'user-edited' as const };
      
      if (editingRule.type === 'smart-proposal') {
        setSmartRules(prev => prev.map(rule => 
          rule.id === editingRule.id ? updatedRule : rule
        ));
      } else {
        setUserRules(prev => prev.map(rule => 
          rule.id === editingRule.id ? updatedRule : rule
        ));
      }
      
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
    setAnalysisStatus('running');
    setAnalysisProgress(0);

    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setAnalysisStatus('success');
          return 100;
        }
        return prev + 12;
      });
    }, 250);
  };

  const handleQuickFix = () => {
    setShowAnalysisDialog(false);
    setShowQuickFixDialog(true);
    setQuickFixStatus('running');
    setQuickFixProgress(0);

    const interval = setInterval(() => {
      setQuickFixProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setQuickFixStatus('success');
          return 100;
        }
        return prev + 8;
      });
    }, 200);
  };

  const handleCancelAnalysis = () => {
    setShowAnalysisDialog(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'warning': return 'bg-warning text-warning-foreground';
      case 'info': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
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
    navigate('/dashboard/ner');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
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

      {/* Smart Rule Proposals */}
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

      {/* User Edited Rules */}
      {userRules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-success">
              <Edit className="w-5 h-5 mr-2" />
              Previously User Edited Rules ({userRules.length})
            </CardTitle>
            <CardDescription>
              Rules that have been customized by users for this file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg bg-success/5">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{rule.column}</h3>
                      <Badge className={`${getStatusColor(rule.status)} pointer-events-none`}>
                        User Edited
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
      )}

      {/* Navigation Buttons */}
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

      {/* Edit Rule Dialog */}
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

      {/* Validation Dialog */}
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
                    Checking data against {smartRules.length + userRules.length} configured rules
                  </p>
                </div>
                <Progress value={validationProgress} className="w-full" />
                <p className="text-center text-sm text-muted-foreground">
                  {validationProgress}% Complete
                </p>
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

      {/* Analyze Failures Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-3xl">
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
                  <p className="text-sm text-muted-foreground">Found {mockFailureAnalysis.length} issues that can be automatically resolved</p>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {mockFailureAnalysis.map((analysis, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-orange-50">
                      <div className="space-y-3">
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

      {/* Quick Fix Dialog */}
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
                    Resolving {mockFailureAnalysis.length} identified issues
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
                    All data quality issues have been automatically resolved.
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
                    setValidationResults(prev => prev ? { ...prev, failed: 0, passed: smartRules.length + userRules.length } : null);
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
