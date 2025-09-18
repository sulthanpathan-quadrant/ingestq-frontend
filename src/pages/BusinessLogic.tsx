// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Code, Plus, Edit, ArrowRight, Play, CheckCircle, AlertTriangle, PlayCircle, RefreshCw, X } from "lucide-react";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import { useToast } from "@/hooks/use-toast";
// import { SkipForward } from "lucide-react";

// interface BusinessRule {
//   id: string;
//   name: string;
//   description: string;
//   logic: string;
//   priority: 'high' | 'medium' | 'low';
//   status: 'active' | 'inactive' | 'testing';
//   category: 'validation' | 'transformation' | 'calculation';
// }

// const businessRules: BusinessRule[] = [
//   {
//     id: '1',
//     name: 'Account Balance Validation',
//     description: 'Ensure account balance is within acceptable limits',
//     logic: 'IF balance < 0 AND account_type != "Credit" THEN flag_negative_balance',
//     priority: 'high',
//     status: 'active',
//     category: 'validation'
//   },
//   {
//     id: '2',
//     name: 'Customer Age Calculation',
//     description: 'Calculate customer age from birth date',
//     logic: 'age = YEAR(TODAY()) - YEAR(birth_date)',
//     priority: 'medium',
//     status: 'active',
//     category: 'calculation'
//   },
//   {
//     id: '3',
//     name: 'Email Format Standardization',
//     description: 'Standardize email addresses to lowercase',
//     logic: 'email = LOWER(TRIM(email))',
//     priority: 'low',
//     status: 'active',
//     category: 'transformation'
//   },
//   {
//     id: '4',
//     name: 'VIP Customer Classification',
//     description: 'Classify customers as VIP based on balance and transaction history',
//     logic: 'IF balance > 50000 AND avg_monthly_transactions > 10 THEN vip_status = "VIP"',
//     priority: 'medium',
//     status: 'testing',
//     category: 'calculation'
//   }
// ];

// export default function BusinessLogic() {
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const [rules, setRules] = useState<BusinessRule[]>(businessRules);
//   const [showAddDialog, setShowAddDialog] = useState(false);
//   const [showEditDialog, setShowEditDialog] = useState(false);
//   const [showValidationDialog, setShowValidationDialog] = useState(false);
//   const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);
//   const [validationProgress, setValidationProgress] = useState(0);
//   const [validationStatus, setValidationStatus] = useState<'running' | 'success' | 'failed' | null>(null);
//   const [validationResults, setValidationResults] = useState<{passed: number, failed: number, summary: string} | null>(null);
//   const [newRule, setNewRule] = useState<Partial<BusinessRule>>({
//     name: '',
//     description: '',
//     logic: '',
//     priority: 'medium',
//     status: 'testing',
//     category: 'validation'
//   });

//   const handleAddRule = () => {
//     if (newRule.name && newRule.description && newRule.logic) {
//       const rule: BusinessRule = {
//         id: Date.now().toString(),
//         name: newRule.name,
//         description: newRule.description,
//         logic: newRule.logic,
//         priority: newRule.priority as 'high' | 'medium' | 'low',
//         status: newRule.status as 'active' | 'inactive' | 'testing',
//         category: newRule.category as 'validation' | 'transformation' | 'calculation'
//       };
      
//       setRules(prev => [...prev, rule]);
//       setNewRule({
//         name: '',
//         description: '',
//         logic: '',
//         priority: 'medium',
//         status: 'testing',
//         category: 'validation'
//       });
//       setShowAddDialog(false);
      
//       toast({
//         title: "Business rule added",
//         description: `Rule "${rule.name}" has been created successfully.`,
//       });
//     }
//   };

//   const handleEditRule = (rule: BusinessRule) => {
//     setEditingRule({ ...rule });
//     setShowEditDialog(true);
//   };

//   const handleSaveRule = () => {
//     if (editingRule) {
//       setRules(prev => prev.map(rule => 
//         rule.id === editingRule.id ? editingRule : rule
//       ));
//       setShowEditDialog(false);
//       setEditingRule(null);
      
//       toast({
//         title: "Rule updated",
//         description: `Rule "${editingRule.name}" has been updated successfully.`,
//       });
//     }
//   };

//   const handleRunAllRules = () => {
//     setShowValidationDialog(true);
//     setValidationStatus('running');
//     setValidationProgress(0);
//     setValidationResults(null);

//     const interval = setInterval(() => {
//       setValidationProgress((prev) => {
//         if (prev >= 100) {
//           clearInterval(interval);
//           const totalRules = rules.length;
//           const passed = Math.floor(totalRules * 0.85);
//           const failed = totalRules - passed;
          
//           setValidationResults({
//             passed,
//             failed,
//             summary: `Business rules validation completed. ${passed} rules passed successfully, ${failed} rules failed validation. Overall success rate: ${Math.round((passed/totalRules) * 100)}%`
//           });
//           setValidationStatus('success');
//           return 100;
//         }
//         return prev + 8;
//       });
//     }, 200);
//   };

//   const handleTestRule = (ruleId: string) => {
//     // Simulate rule testing
//     toast({
//       title: "Testing rule",
//       description: "Rule test completed successfully.",
//     });
//   };

//   const handleBackToNER = () => {
//     navigate('/dashboard/ner');
//   };

//   const handleSkipToETL = () => {
//     navigate('/dashboard/etl');
//   };

//   const handleContinueToETL = () => {
//     navigate('/dashboard/etl');
//   };

//   const activeRules = rules.filter(rule => rule.status === 'active');
//   const testingRules = rules.filter(rule => rule.status === 'testing');

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'active':
//         return 'bg-green-100 text-green-800 border-green-200';
//       case 'testing':
//         return 'bg-yellow-100 text-yellow-800 border-yellow-200';
//       case 'inactive':
//         return 'bg-gray-100 text-gray-800 border-gray-200';
//       default:
//         return 'bg-gray-100 text-gray-800 border-gray-200';
//     }
//   };

//   return (
//     <div className="max-w-7xl mt-14 mx-auto p-6 space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-foreground">Business Logic Rules</h1>
//           <p className="text-muted-foreground">
//             Define and manage custom business rules for data processing and validation
//           </p>
//         </div>
        
//         <div className="flex items-center space-x-2">
//           <Button 
//             onClick={handleRunAllRules}
//             variant="outline"
//             className="border-blue-600 text-blue-600 hover:bg-blue-50"
//           >
//             <PlayCircle className="w-4 h-4 mr-2" />
//             Run All Rules
//           </Button>
//           <Button 
//             onClick={() => setShowAddDialog(true)} 
//             className="bg-blue-600 hover:bg-blue-700 text-white"
//           >
//             <Plus className="w-4 h-4 mr-2" />
//             Add New Rule
//           </Button>
//         </div>
//       </div>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center space-x-2">
//               <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
//                 <CheckCircle className="w-4 h-4 text-success" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold text-success">{activeRules.length}</p>
//                 <p className="text-xs text-muted-foreground">Active Rules</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center space-x-2">
//               <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center">
//                 <AlertTriangle className="w-4 h-4 text-warning" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold text-warning">{testingRules.length}</p>
//                 <p className="text-xs text-muted-foreground">Testing</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center space-x-2">
//               <div className="w-8 h-8 bg-blue-600/10 rounded-full flex items-center justify-center">
//                 <Code className="w-4 h-4 text-blue-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold text-blue-600">{rules.length}</p>
//                 <p className="text-xs text-muted-foreground">Total Rules</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center space-x-2">
//               <div className="w-8 h-8 bg-chart-2/10 rounded-full flex items-center justify-center">
//                 <Play className="w-4 h-4 text-chart-2" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold text-chart-2">98%</p>
//                 <p className="text-xs text-muted-foreground">Success Rate</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Business Rules List */}
//       <div className="grid gap-4">
//         {rules.map((rule) => (
//           <Card key={rule.id}>
//             <CardHeader>
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-3">
//                   <CardTitle className="text-lg flex items-center space-x-2">
//                     <span>{rule.name}</span>
//                     <Badge 
//                       variant="outline"
//                       className={`text-xs ${getStatusColor(rule.status)}`}
//                     >
//                       {rule.status}
//                     </Badge>
//                   </CardTitle>
//                 </div>
//                 <div className="flex space-x-2">
//                   <Button 
//                     size="sm" 
//                     variant="outline" 
//                     onClick={() => handleTestRule(rule.id)}
//                     className="border-blue-600 text-blue-600 hover:bg-blue-50"
//                   >
//                     <Play className="w-4 h-4 mr-2" />
//                     Test
//                   </Button>
//                   <Button 
//                     size="sm" 
//                     variant="outline" 
//                     onClick={() => handleEditRule(rule)}
//                     className="border-blue-600 text-blue-600 hover:bg-blue-50"
//                   >
//                     <Edit className="w-4 h-4 mr-2" />
//                     Edit
//                   </Button>
//                 </div>
//               </div>
//               <CardDescription>{rule.description}</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="bg-muted p-3 rounded-lg">
//                 <code className="text-sm font-mono">{rule.logic}</code>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {/* Navigation Buttons */}
//       <div className="flex justify-between items-center">
//         <Button 
//           variant="outline" 
//           onClick={handleBackToNER}
//         >
//           <ArrowRight className="w-4 h-4 rotate-180 mr-2" />
//           Back
//         </Button>
//         <div className="flex space-x-2">
//           <Button 
//             variant="outline" 
//             onClick={handleSkipToETL}
//           >
//             <SkipForward className="w-4 h-4" />
//             Skip
//           </Button>
//           <Button 
//             className="bg-blue-600 hover:bg-blue-700 text-white"
//             onClick={handleContinueToETL}
//           >
//             <ArrowRight className="w-4 h-4 mr-2" />
//             Continue to ETL
//           </Button>
//         </div>
//       </div>

//       {/* Add Rule Dialog */}
//       <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Add New Business Rule</DialogTitle>
//             <DialogDescription>
//               Create a new business logic rule for data processing
//             </DialogDescription>
//           </DialogHeader>
          
//           <div className="space-y-4">
//             <div>
//               <Label htmlFor="name">Rule Name</Label>
//               <Input
//                 id="name"
//                 value={newRule.name || ''}
//                 onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
//                 placeholder="Enter rule name"
//               />
//             </div>
            
//             <div>
//               <Label htmlFor="description">Description</Label>
//               <Input
//                 id="description"
//                 value={newRule.description || ''}
//                 onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
//                 placeholder="Describe what this rule does"
//               />
//             </div>
            
//             <div>
//               <Label htmlFor="logic">Business Logic</Label>
//               <Textarea
//                 id="logic"
//                 value={newRule.logic || ''}
//                 onChange={(e) => setNewRule(prev => ({ ...prev, logic: e.target.value }))}
//                 placeholder="Enter the business logic (e.g., IF condition THEN action)"
//                 rows={4}
//               />
//             </div>
            
//             <div className="flex space-x-2">
//               <Button variant="outline" onClick={() => setShowAddDialog(false)}>
//                 Cancel
//               </Button>
//               <Button 
//                 onClick={handleAddRule} 
//                 className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
//               >
//                 Add Rule
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* Edit Rule Dialog */}
//       <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Edit Business Rule</DialogTitle>
//             <DialogDescription>
//               Modify the business logic rule configuration
//             </DialogDescription>
//           </DialogHeader>
          
//           {editingRule && (
//             <div className="space-y-4">
//               <div>
//                 <Label htmlFor="edit-name">Rule Name</Label>
//                 <Input
//                   id="edit-name"
//                   value={editingRule.name}
//                   onChange={(e) => setEditingRule(prev => prev ? { ...prev, name: e.target.value } : null)}
//                 />
//               </div>
              
//               <div>
//                 <Label htmlFor="edit-description">Description</Label>
//                 <Input
//                   id="edit-description"
//                   value={editingRule.description}
//                   onChange={(e) => setEditingRule(prev => prev ? { ...prev, description: e.target.value } : null)}
//                 />
//               </div>
              
//               <div>
//                 <Label htmlFor="edit-logic">Business Logic</Label>
//                 <Textarea
//                   id="edit-logic"
//                   value={editingRule.logic}
//                   onChange={(e) => setEditingRule(prev => prev ? { ...prev, logic: e.target.value } : null)}
//                   rows={4}
//                 />
//               </div>
              
//               <div className="flex justify-end">
//                 <Button 
//                   onClick={handleSaveRule} 
//                   className="bg-blue-600 hover:bg-blue-700 text-white"
//                 >
//                   Save Changes
//                 </Button>
//               </div>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>

//       {/* Run All Rules Validation Dialog */}
//       <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Business Rules Validation</DialogTitle>
//             <DialogDescription>
//               Running validation on all configured business logic rules
//             </DialogDescription>
//           </DialogHeader>
          
//           <div className="space-y-6">
//             {validationStatus === 'running' && (
//               <div className="space-y-4">
//                 <div className="text-center">
//                   <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
//                     <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
//                   </div>
//                   <p className="text-lg font-medium">Validating Business Rules...</p>
//                   <p className="text-sm text-muted-foreground">
//                     Processing {rules.length} business logic rules
//                   </p>
//                 </div>
//                 <Progress value={validationProgress} className="w-full" />
//                 <p className="text-center text-sm text-muted-foreground">
//                   {validationProgress}% Complete
//                 </p>
//               </div>
//             )}

//             {validationStatus === 'success' && validationResults && (
//               <div className="text-center space-y-4">
//                 <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
//                   <CheckCircle className="w-8 h-8 text-success" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-success">Validation Complete!</h3>
//                   <div className="mt-4 p-4 bg-muted rounded-lg">
//                     <div className="grid grid-cols-2 gap-4 mb-4">
//                       <div className="text-center">
//                         <div className="text-2xl font-bold text-success">{validationResults.passed}</div>
//                         <div className="text-sm text-muted-foreground">Rules Passed</div>
//                       </div>
//                       <div className="text-center">
//                         <div className="text-2xl font-bold text-destructive">{validationResults.failed}</div>
//                         <div className="text-sm text-muted-foreground">Rules Failed</div>
//                       </div>
//                     </div>
//                     <p className="text-sm text-muted-foreground">{validationResults.summary}</p>
//                   </div>
//                 </div>
//                 <div className="flex space-x-2">
//                   <Button 
//                     variant="outline" 
//                     onClick={() => setShowValidationDialog(false)}
//                     className="flex-1"
//                   >
//                     Edit Business Rules
//                   </Button>
//                   <Button 
//                     onClick={handleContinueToETL} 
//                     className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
//                   >
//                     <ArrowRight className="w-4 h-4 mr-2" />
//                     Continue to ETL
//                   </Button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

//------------------------------------------------------------------------------

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, ArrowRight, CheckCircle, AlertTriangle, Code, RefreshCw, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export interface BLValidationRequest {
  payload: {
    input: {
      input_type: string;
      Records: {
        s3: {
          bucket: { name: string };
          object: { key: string };
        };
      }[];
    };
    rules: {
      [ruleName: string]: string;
    };
  };
}

export interface BLValidationResponse {
  statusCode: number;
  body: {
    statusCode: number;
    passed_rules?: number;
    failed_rules?: number;
    details?: {
      [ruleName: string]: {
        passed_count: number;
        failed_count: number;
      };
    };
    errorType?: string;
    errorMessage?: string;
  };
}

const getBaseUrl = () => {
  const defaultUrl = "https://ingestq-backend-954554516.ap-south-1.elb.amazonaws.com";
  const baseUrl = (typeof process !== 'undefined' && process.env.REACT_APP_API_BASE_URL) || defaultUrl;
  console.log("Base URL:", baseUrl);
  return baseUrl;
};

export const runBLValidation = async (
  data: BLValidationRequest
): Promise<BLValidationResponse> => {
  const token = localStorage.getItem("authToken") || "default-token";
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/invoke-bl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        `Failed to run BL validation: ${response.status} - ${
          result.errorMessage || "Unknown error"
        }`
      );
    }

    // Validate response structure
    if (!result.statusCode || !result.body) {
      throw new Error("Invalid response format from BL validation API");
    }

    console.log("✅ BL Validation Response:", result);
    return result as BLValidationResponse;
  } catch (error) {
    console.error("Error in BL validation:", error);
    throw error;
  }
};

interface BusinessRule {
  id: string;
  name: string;
  description: string;
  logic: string;
  priority: "high" | "medium" | "low";
  status: "active" | "inactive" | "testing";
  category: "validation" | "transformation" | "calculation";
}

export default function BusinessLogic() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);
  const [validationProgress, setValidationProgress] = useState(0);
  const [validationStatus, setValidationStatus] = useState<"running" | "success" | "failed" | null>(null);
  const [validationResults, setValidationResults] = useState<{ passed: number; failed: number; summary: string } | null>(null);
  const [newRule, setNewRule] = useState<Partial<BusinessRule>>({
    name: "",
    description: "",
    logic: "",
    priority: "medium",
    status: "testing",
    category: "validation",
  });

  const handleAddRule = () => {
    if (newRule.name && newRule.description && newRule.logic) {
      const rule: BusinessRule = {
        id: Date.now().toString(),
        name: newRule.name,
        description: newRule.description,
        logic: newRule.logic,
        priority: newRule.priority as "high" | "medium" | "low",
        status: newRule.status as "active" | "inactive" | "testing",
        category: newRule.category as "validation" | "transformation" | "calculation",
      };

      setRules((prev) => [...prev, rule]);
      setNewRule({
        name: "",
        description: "",
        logic: "",
        priority: "medium",
        status: "testing",
        category: "validation",
      });
      setShowAddDialog(false);

      toast({
        title: "Business rule added",
        description: `Rule "${rule.name}" has been created successfully.`,
      });
    }
  };

  const handleEditRule = (rule: BusinessRule) => {
    setEditingRule({ ...rule });
    setShowEditDialog(true);
  };

  const handleSaveRule = () => {
    if (editingRule) {
      setRules((prev) =>
        prev.map((rule) => (rule.id === editingRule.id ? editingRule : rule))
      );
      setShowEditDialog(false);
      setEditingRule(null);

      toast({
        title: "Rule updated",
        description: `Rule "${editingRule.name}" has been updated successfully.`,
      });
    }
  };

  const handleRunAllRules = async () => {
            localStorage.setItem('businesslogic', 'executed');

    if (rules.length === 0) {
      toast({
        title: "No rules",
        description: "Please add at least one rule before running validation.",
        variant: "destructive",
      });
      return;
    }

    // Fetch S3 bucket and key from localStorage with fallback values
    const s3Bucket = localStorage.getItem("selectedBucket") || "default-bucket";
    const s3Key = localStorage.getItem("selectedFile") || "default-key";

    // Validate S3 bucket and key
    if (s3Bucket === "default-bucket" || s3Key === "default-key") {
      toast({
        title: "Configuration Error",
        description: "S3 bucket or key not set in localStorage. Please configure valid S3 details.",
        variant: "destructive",
      });
      return;
    }

    setShowValidationDialog(true);
    setValidationStatus("running");
    setValidationProgress(0);
    setValidationResults(null);

    const interval = setInterval(() => {
      setValidationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 8;
      });
    }, 200);

    try {
      const requestData: BLValidationRequest = {
        payload: {
          input: {
            input_type: "csv",
            Records: [
              {
                s3: {
                  bucket: { name: s3Bucket },
                  object: { key: s3Key },
                },
              },
            ],
          },
          rules: Object.fromEntries(rules.map((rule) => [rule.name, rule.logic])),
        },
      };

      const result = await runBLValidation(requestData);
      clearInterval(interval);
      setValidationProgress(100);

      // Check if the response contains valid validation results
      if (
        result.body.passed_rules !== undefined &&
        result.body.failed_rules !== undefined &&
        typeof result.body.passed_rules === "number" &&
        typeof result.body.failed_rules === "number"
      ) {
        setValidationResults({
          passed: result.body.passed_rules,
          failed: result.body.failed_rules,
          summary: `Business rules validation completed. ${result.body.passed_rules} rules passed successfully, ${result.body.failed_rules} rules failed validation. Overall success rate: ${Math.round(
            (result.body.passed_rules / (result.body.passed_rules + result.body.failed_rules)) * 100
          )}%`,
        });
        setValidationStatus("success");
      } else {
        throw new Error(
          result.body.errorMessage || "Invalid validation results format"
        );
      }
    } catch (error) {
      clearInterval(interval);
      setValidationProgress(100);
      setValidationStatus("failed");
      setValidationResults({
        passed: 0,
        failed: rules.length,
        summary: `Business rules validation failed. Please check the configuration and try again. Error: ${(error as Error).message}`,
      });
      toast({
        title: "Validation Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleBackToNER = () => {
    navigate("/dashboard/ner");
  };

  const handleSkipToETL = () => {
            localStorage.setItem('businesslogic', 'skipped');

    navigate("/dashboard/etl");
  };

  const handleContinueToETL = () => {
    navigate("/dashboard/etl");
  };

  const activeRules = rules.filter((rule) => rule.status === "active");
  const testingRules = rules.filter((rule) => rule.status === "testing");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "testing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="max-w-7xl mt-14 mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Business Logic Rules</h1>
          <p className="text-muted-foreground">
            Define and manage custom business rules for data processing and validation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRunAllRules}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Code className="w-4 h-4 mr-2" />
            Run All Rules
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Rule
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{activeRules.length}</p>
                <p className="text-xs text-muted-foreground">Active Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{testingRules.length}</p>
                <p className="text-xs text-muted-foreground">Testing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600/10 rounded-full flex items-center justify-center">
                <Code className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{rules.length}</p>
                <p className="text-xs text-muted-foreground">Total Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-chart-2/10 rounded-full flex items-center justify-center">
                <Code className="w-4 h-4 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold text-chart-2">
                  {rules.length > 0 && validationResults
                    ? Math.round(
                        (validationResults.passed /
                          (validationResults.passed + validationResults.failed)) *
                          100
                      ) + "%"
                    : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Rules List */}
      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <span>{rule.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(rule.status)}`}
                    >
                      {rule.status}
                    </Badge>
                  </CardTitle>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditRule(rule)}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
              <CardDescription>{rule.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded-lg">
                <code className="text-sm font-mono">{rule.logic}</code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleBackToNER}>
          <ArrowRight className="w-4 h-4 rotate-180 mr-2" />
          Back
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleSkipToETL}>
            <X className="w-4 h-4" />
            Skip
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleContinueToETL}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Continue to Data transformations
          </Button>
        </div>
      </div>

      {/* Add Rule Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Business Rule</DialogTitle>
            <DialogDescription>
              Create a new business logic rule for data processing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={newRule.name || ""}
                onChange={(e) =>
                  setNewRule((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter rule name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newRule.description || ""}
                onChange={(e) =>
                  setNewRule((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe what this rule does"
              />
            </div>
            <div>
              <Label htmlFor="logic">Business Logic</Label>
              <Textarea
                id="logic"
                value={newRule.logic || ""}
                onChange={(e) =>
                  setNewRule((prev) => ({ ...prev, logic: e.target.value }))
                }
                placeholder="Enter the business logic (e.g., IF condition THEN action)"
                rows={4}
              />
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddRule}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Rule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Business Rule</DialogTitle>
            <DialogDescription>
              Modify the business logic rule configuration
            </DialogDescription>
          </DialogHeader>
          {editingRule && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Rule Name</Label>
                <Input
                  id="edit-name"
                  value={editingRule.name}
                  onChange={(e) =>
                    setEditingRule((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingRule.description}
                  onChange={(e) =>
                    setEditingRule((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-logic">Business Logic</Label>
                <Textarea
                  id="edit-logic"
                  value={editingRule.logic}
                  onChange={(e) =>
                    setEditingRule((prev) =>
                      prev ? { ...prev, logic: e.target.value } : null
                    )
                  }
                  rows={4}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveRule}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Run All Rules Validation Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Business Rules Validation</DialogTitle>
            <DialogDescription>
              Running validation on all configured business logic rules
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {validationStatus === "running" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                  <p className="text-lg font-medium">Validating Business Rules...</p>
                  <p className="text-sm text-muted-foreground">
                    Processing {rules.length} business logic rules
                  </p>
                </div>
                <Progress value={validationProgress} className="w-full" />
                <p className="text-center text-sm text-muted-foreground">
                  {validationProgress}% Complete
                </p>
              </div>
            )}
            {validationStatus === "success" && validationResults && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-success">Validation Complete!</h3>
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">
                          {validationResults.passed}
                        </div>
                        <div className="text-sm text-muted-foreground">Rules Passed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-destructive">
                          {validationResults.failed}
                        </div>
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
                    Edit Business Rules
                  </Button>
                  <Button
                    onClick={handleContinueToETL}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Continue to Data Transformations
                  </Button>
                </div>
              </div>
            )}
            {validationStatus === "failed" && validationResults && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <X className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-destructive">Validation Failed!</h3>
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{validationResults.summary}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowValidationDialog(false)}
                    className="flex-1"
                  >
                    Edit Business Rules
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRunAllRules}
                    className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
