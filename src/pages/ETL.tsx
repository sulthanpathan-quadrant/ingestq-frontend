// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import { 
//   Database, 
//   RefreshCw, 
//   ArrowRight, 
//   Settings,
//   Play,
//   FileText,
//   Calendar,
//   Cloud,
//   ArrowLeft
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { useToast } from "@/hooks/use-toast";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// interface DataSource {
//   id: string;
//   name: string;
//   type: 'Database' | 'S3 Bucket' | 'Azure Blob';
//   status: 'Connected' | 'Error' | 'Pending';
// }

// interface Transformation {
//   id: string;
//   name: string;
//   status: 'Completed' | 'Running' | 'Pending' | 'Failed';
//   progress: number;
// }

// const mockDataSources: DataSource[] = [
//   { id: 'db-1', name: 'Production Database', type: 'Database', status: 'Connected' },
//   { id: 's3-1', name: 'Marketing S3 Bucket', type: 'S3 Bucket', status: 'Connected' },
//   { id: 'blob-1', name: 'Customer Azure Blob', type: 'Azure Blob', status: 'Error' },
// ];

// const mockTransformations: Transformation[] = [
//   { id: 'tf-1', name: 'Data Cleaning', status: 'Completed', progress: 100 },
//   { id: 'tf-2', name: 'Data Standardization', status: 'Running', progress: 60 },
//   { id: 'tf-3', name: 'Data Enrichment', status: 'Pending', progress: 0 },
//   { id: 'tf-4', name: 'DQ Checks', status: 'Pending', progress: 0 },
// ];

// export default function ETL() {
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const [dataSources] = useState<DataSource[]>(mockDataSources);
//   const [transformations, setTransformations] = useState<Transformation[]>(mockTransformations);
//   const [isJobRunning, setIsJobRunning] = useState(false);
//   const [showScheduleDialog, setShowScheduleDialog] = useState(false);

//   const handleScheduleJob = () => {
//     navigate('/dashboard/schedule-job');
//     toast({
//       title: "Proceeding to Job Scheduling",
//       description: "Configure when your job should run",
//     });
//   };

//   const handleGoBack = () => {
//     navigate('/dashboard/business-logic');
//   };

 

//   const simulateTransformationStep = (stepIndex: number): Promise<void> => {
//     return new Promise((resolve) => {
//       const interval = setInterval(() => {
//         setTransformations(prev => {
//           const updated = [...prev];
//           if (updated[stepIndex].progress < 100) {
//             updated[stepIndex].status = 'Running';
//             updated[stepIndex].progress += 20;
//           } else {
//             updated[stepIndex].status = 'Completed';
//             clearInterval(interval);
//             resolve();
//           }
//           return updated;
//         });
//       }, 500);
//     });
//   };

//   const handleRunJob = async () => {
//     setIsJobRunning(true);
    
//     toast({
//       title: "Job Execution Started",
//       description: "Running ETL pipeline across all data sources",
//     });

//     // Reset all transformations to pending
//     setTransformations(prev => 
//       prev.map(t => ({ ...t, status: 'Pending' as const, progress: 0 }))
//     );

//     // Simulate processing each data source
//     for (const source of dataSources.filter(ds => ds.status === 'Connected')) {
//       toast({
//         title: `Processing ${source.name}`,
//         description: "Running data transformation steps",
//       });

//       // Run each transformation step sequentially
//       for (let i = 0; i < transformations.length; i++) {
//         await simulateTransformationStep(i);
        
//         toast({
//           title: `${transformations[i].name} Completed`,
//           description: `Finished processing data from ${source.name}`,
//         });
//       }
//     }

//     setIsJobRunning(false);
    
//     toast({
//       title: "ETL Pipeline Completed",
//       description: "All data sources processed successfully",
//     });
//   };

//   const handleViewReports = () => {
//     navigate('/dashboard/reports');
//     toast({
//       title: "Navigating to Reports",
//       description: "View detailed reports and analytics",
//     });
//   };

//   const handleDataSourceSettings = (source: DataSource) => {
//     toast({
//       title: "Data Source Settings",
//       description: `Configure settings for ${source.name}`,
//     });
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
//       <div className="container mt-14 mx-auto p-6">
//         {/* Header with Actions */}
//         <div className="flex items-center justify-between mb-6">
//           <div className="text-start">
//             <h1 className="text-3xl font-bold text-foreground">ETL Pipeline</h1>
//             <p className="text-muted-foreground">Design, manage, and monitor your data pipelines</p>
//           </div>
//           <div className="flex items-center gap-4">
//             <Button onClick={handleScheduleJob} variant="secondary">
//               <Calendar className="w-4 h-4 mr-2" />
//               Schedule Job
//             </Button>
//             <Button onClick={handleViewReports} variant="outline">
//               <FileText className="w-4 h-4 mr-2" />
//               View Reports
//             </Button>
//             <Button 
//               onClick={handleRunJob} 
//               disabled={isJobRunning}
//               className={cn(isJobRunning && "opacity-75")}
//             >
//               <Play className="w-4 h-4 mr-2" />
//               {isJobRunning ? "Running..." : "Run Job"}
//             </Button>
            
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {/* Data Sources Card */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Database className="w-5 h-5" />
//                 Data Sources
//               </CardTitle>
//               <CardDescription>
//                 Connected data sources for ingestion
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               {dataSources.map((source) => (
//                 <div key={source.id} className="flex items-center justify-between">
//                   <div className="flex items-center space-x-4">
//                     <div className="rounded-full p-2 bg-muted">
//                       {source.type === 'Database' && <Database className="w-4 h-4 text-foreground" />}
//                       {source.type === 'S3 Bucket' && <FileText className="w-4 h-4 text-foreground" />}
//                       {source.type === 'Azure Blob' && <Cloud className="w-4 h-4 text-foreground" />}
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium text-foreground">{source.name}</p>
//                       <p className="text-xs text-muted-foreground">{source.type}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Badge className={cn(
//                       "text-white",
//                       source.status === 'Connected' && "bg-green-500 hover:bg-green-600",
//                       source.status === 'Error' && "bg-red-500 hover:bg-red-600",
//                       source.status === 'Pending' && "bg-yellow-500 hover:bg-yellow-600"
//                     )}>
//                       {source.status}
//                     </Badge>
//                     <Button variant="ghost" size="icon" onClick={() => handleDataSourceSettings(source)}>
//                       <Settings className="w-4 h-4" />
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </CardContent>
//           </Card>

//           {/* Transformations Card */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <RefreshCw className="w-5 h-5" />
//                 Data Transformations
//               </CardTitle>
//               <CardDescription>
//                 Data processing and transformation steps
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               {transformations.map((transform) => (
//                 <div key={transform.id} className="space-y-2">
//                   <div className="flex items-center justify-between">
//                     <p className="text-sm font-medium text-foreground">{transform.name}</p>
//                     <Badge className={cn(
//                       "text-white",
//                       transform.status === 'Completed' && "bg-green-500 hover:bg-green-600",
//                       transform.status === 'Running' && "bg-blue-500 hover:bg-blue-600",
//                       transform.status === 'Pending' && "bg-yellow-500 hover:bg-yellow-600",
//                       transform.status === 'Failed' && "bg-red-500 hover:bg-red-600"
//                     )}>
//                       {transform.status}
//                     </Badge>
//                   </div>
//                   <Progress value={transform.progress} />
//                 </div>
//               ))}
//             </CardContent>
//           </Card>
//         </div>

//         {/* Navigation Buttons */}
//         <div className="flex justify-between mt-6">
          
//           <Button
//             variant="outline"
//             onClick={handleGoBack}
//             className="flex items-center gap-2"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             Back
//           </Button>
          
          
//         </div>

//         {/* Schedule Job Dialog */}
//         <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>Schedule ETL Job</DialogTitle>
//               <DialogDescription>
//                 Configure the schedule for your ETL pipeline
//               </DialogDescription>
//             </DialogHeader>
//             <div className="space-y-4">
//               <div>
//                 <p className="text-sm text-muted-foreground">
//                   Data source to be fetched from backend
//                 </p>
//               </div>
//               <div className="flex justify-end space-x-2">
//                 <Button 
//                   variant="outline" 
//                   onClick={() => setShowScheduleDialog(false)}
//                 >
//                   Cancel
//                 </Button>
//                 <Button 
//                   className="bg-blue-600 hover:bg-blue-700 text-white"
//                   onClick={() => {
//                     setShowScheduleDialog(false);
//                     toast({
//                       title: "Job Scheduled",
//                       description: "ETL job has been scheduled successfully",
//                     });
//                   }}
//                 >
//                   Schedule
//                 </Button>
//               </div>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>
//     </div>
//   );
// }


// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import { FileText, Calendar, Play, ArrowLeft, RefreshCw, Settings } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { useToast } from "@/hooks/use-toast";

// // ================== ETL API ==================

// export interface ETLRequest {
//   payload: {
//     file_paths: {
//       [filePath: string]: {
//         output_path: string;
//       };
//     };
//   };
// }

// export interface ETLResponse {
//   statusCode: number;
//   body: {
//     statusCode: number;
//     body: string; // e.g. "{\"etl_method\": \"Glue\"}"
//   };
// }

// const getAuthToken = () => {
//   // Implement or import your getAuthToken logic here
//   return localStorage.getItem("authToken") || "";
// };

// const getBaseUrl = () => {
//   // Dynamically determine base URL, e.g., from environment or config
//   return process.env.REACT_APP_API_BASE_URL || window.location.origin;
// };

// export const runETL = async (data: ETLRequest): Promise<ETLResponse> => {
//   const token = getAuthToken();
//   const baseUrl = getBaseUrl();
//   console.log("API Request URL:", `${baseUrl}/invoke-etl`);
//   console.log("API Request Data:", data);
//   const response = await fetch(`${baseUrl}/invoke-etl`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer ${token}`,
//     },
//     body: JSON.stringify(data),
//   });

//   if (!response.ok) {
//     const errorText = await response.text();
//     console.error("API Error:", `Failed to invoke ETL: ${response.status} - ${errorText}`);
//     throw new Error(`Failed to invoke ETL: ${response.status} - ${errorText}`);
//   }

//   const result = await response.json();
//   console.log("API Response:", result);
//   return result;
// };

// interface DataSource {
//   id: string;
//   name: string;
//   type: "S3 Bucket";
//   status: "Connected" | "Error" | "Pending";
//   bucketName?: string;
//   fileName?: string;
//   inputPath?: string;
//   outputPath?: string;
// }

// interface Transformation {
//   id: string;
//   name: string;
//   status: "Completed" | "Running" | "Pending" | "Failed";
//   progress: number;
// }

// const validateLocalStorage = () => {
//   const bucket = localStorage.getItem("selectedBucket");
//   const key = localStorage.getItem("selectedFile");
//   console.log("LocalStorage - selectedBucket:", bucket);
//   console.log("LocalStorage - selectedFile:", key);
//   if (!bucket || !key) {
//     console.warn("Missing or empty bucket or key in localStorage.");
//     return false;
//   }
//   return { bucket, key };
// };

// const initialTransformations: Transformation[] = [
//   { id: "tf-1", name: "Data Cleaning", status: "Pending", progress: 0 },
//   { id: "tf-2", name: "Data Standardization", status: "Pending", progress: 0 },
//   { id: "tf-3", name: "Data Enrichment", status: "Pending", progress: 0 },
// ];

// export default function ETL() {
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const [dataSources, setDataSources] = useState<DataSource[]>([]);
//   const [transformations, setTransformations] = useState<Transformation[]>(initialTransformations);
//   const [isJobRunning, setIsJobRunning] = useState(false);
//   const [bucket, setBucket] = useState<string>("");
//   const [key, setKey] = useState<string>("");

//   useEffect(() => {
//     const storageData = validateLocalStorage();
//     if (!storageData) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Missing bucket name or key. Please upload the file again.",
//       });
//       navigate("/dashboard/upload");
//       return;
//     }
//     const { bucket, key } = storageData;
//     setBucket(bucket);
//     setKey(key);
//     const outputPath = `s3://${bucket}/parquet/${key.replace(/\.[^/.]+$/, "")}.parquet`;
//     setDataSources([
//       {
//         id: "s3-1",
//         name: "Selected S3 Data",
//         type: "S3 Bucket",
//         status: "Connected",
//         bucketName: bucket,
//         fileName: key,
//         inputPath: `s3://${bucket}/${key}`,
//         outputPath: outputPath,
//       },
//     ]);
//   }, [navigate, toast]);

//   const handleScheduleJob = () => {
//     navigate("/dashboard/schedule-job");
//     toast({
//       title: "Proceeding to Job Scheduling",
//       description: "Configure when your job should run",
//     });
//   };

//   const handleGoBack = () => {
//     navigate("/dashboard/business-logic");
//   };

//   const handleRunJob = async () => {
//     setIsJobRunning(true);
//     setTransformations((prev) =>
//       prev.map((t) => ({ ...t, status: "Running" as const, progress: 0 }))
//     );

//     // Simulate progress for each step sequentially
//     for (let i = 0; i < transformations.length; i++) {
//       await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second per step
//       setTransformations((prev) =>
//         prev.map((t, index) =>
//           index === i
//             ? { ...t, progress: 100, status: "Completed" as const }
//             : t
//         )
//       );
//     }

//     setIsJobRunning(false);
//     setTransformations((prev) =>
//       prev.map((t) => ({ ...t, status: "Completed" as const }))
//     );
//     toast({
//       title: "ETL Job Runs Successfully",
//       description: "All transformations have been completed successfully.",
//     });
//   };

//   const handleViewReports = () => {
//     navigate("/dashboard/reports");
//     toast({
//       title: "Navigating to Reports",
//       description: "View detailed reports and analytics",
//     });
//   };

//   const handleDataSourceSettings = (source: DataSource) => {
//     toast({
//       title: "Data Source Settings",
//       description: `Configure settings for ${source.name}`,
//     });
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
//       <div className="container mt-14 mx-auto p-6">
//         {/* Header with Actions */}
//         <div className="flex items-center justify-between mb-6">
//           <div className="text-start">
//             <h1 className="text-3xl font-bold text-foreground">ETL Pipeline</h1>
//             <p className="text-muted-foreground">Design, manage, and monitor your data pipelines</p>
//           </div>
//           <div className="flex items-center gap-4">
//             <Button onClick={handleScheduleJob} variant="secondary">
//               <Calendar className="w-4 h-4 mr-2" />
//               Schedule Job
//             </Button>
//             <Button onClick={handleViewReports} variant="outline">
//               <FileText className="w-4 h-4 mr-2" />
//               View Reports
//             </Button>
//             <Button
//               onClick={handleRunJob}
//               disabled={isJobRunning}
//               className={cn(isJobRunning && "opacity-75")}
//             >
//               <Play className="w-4 h-4 mr-2" />
//               {isJobRunning ? "Running..." : "Run Job"}
//             </Button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {/* Data Sources Card */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <FileText className="w-5 h-5" />
//                 Data Sources
//               </CardTitle>
//               <CardDescription>Connected data sources for ingestion</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               {dataSources.map((source) => (
//                 <div key={source.id} className="flex items-center justify-between">
//                   <div className="flex items-center space-x-4">
//                     <div className="rounded-full p-2 bg-muted">
//                       <FileText className="w-4 h-4 text-foreground" />
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium text-foreground">{source.name}</p>
//                       <p className="text-xs text-muted-foreground">Bucket: {source.bucketName || "N/A"}</p>
//                       <p className="text-xs text-muted-foreground">File: {source.fileName || "N/A"}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Badge
//                       className={cn(
//                         "text-white",
//                         source.status === "Connected" && "bg-green-500 hover:bg-green-600",
//                         source.status === "Error" && "bg-red-500 hover:bg-red-600",
//                         source.status === "Pending" && "bg-yellow-500 hover:bg-yellow-600"
//                       )}
//                     >
//                       {source.status}
//                     </Badge>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       onClick={() => handleDataSourceSettings(source)}
//                     >
//                       <Settings className="w-4 h-4" />
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </CardContent>
//           </Card>

//           {/* Transformations Card */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <RefreshCw className="w-5 h-5" />
//                 Data Transformations
//               </CardTitle>
//               <CardDescription>Data processing and transformation steps</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               {transformations.map((transform) => (
//                 <div key={transform.id} className="space-y-2">
//                   <div className="flex items-center justify-between">
//                     <p className="text-sm font-medium text-foreground">{transform.name}</p>
//                     <Badge
//                       className={cn(
//                         "text-white",
//                         transform.status === "Completed" && "bg-green-500 hover:bg-green-600",
//                         transform.status === "Running" && "bg-blue-500 hover:bg-blue-600",
//                         transform.status === "Pending" && "bg-yellow-500 hover:bg-yellow-600",
//                         transform.status === "Failed" && "bg-red-500 hover:bg-red-600"
//                       )}
//                     >
//                       {transform.status}
//                     </Badge>
//                   </div>
//                   <Progress value={transform.progress} />
//                 </div>
//               ))}
//               {!isJobRunning &&
//                 transformations.every((t) => t.status === "Completed") && (
//                   <p className="text-sm text-green-600 font-medium mt-2">
//                     ETL Job Runs Successfully
//                   </p>
//                 )}
//             </CardContent>
//           </Card>
//         </div>

//         {/* Navigation Buttons */}
//         <div className="flex justify-between mt-6">
//           <Button
//             variant="outline"
//             onClick={handleGoBack}
//             className="flex items-center gap-2"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             Back
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }



// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import { FileText, Calendar, Play, ArrowLeft, RefreshCw, Settings } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { useToast } from "@/hooks/use-toast";

// // ================== ETL API ==================

// export interface ETLRequest {
//   payload: {
//     file_paths: {
//       [filePath: string]: {
//         output_path: string;
//       };
//     };
//   };
// }

// export interface ETLResponse {
//   statusCode: number;
//   body: {
//     statusCode: number;
//     body: string; // e.g. "{\"etl_method\": \"Glue\", \"s3_output\": \"s3://bucket/parquet/file.parquet\"}"
//   };
// }

// const getAuthToken = () => {
//   // Implement or import your getAuthToken logic here
//   return localStorage.getItem("authToken") || "";
// };

// const getBaseUrl = () => {
//   // Safely handle process.env in browser context
//   return (typeof process !== 'undefined' && process.env.REACT_APP_API_BASE_URL) || window.location.origin;
// };

// export const runETL = async (data: ETLRequest): Promise<ETLResponse> => {
//   const token = getAuthToken();
//   const baseUrl = getBaseUrl();
//   console.log("API Request URL:", `${baseUrl}/invoke-etl`);
//   console.log("API Request Data:", data);
//   const response = await fetch(`${baseUrl}/invoke-etl`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer ${token}`,
//     },
//     body: JSON.stringify(data),
//   });

//   if (!response.ok) {
//     const errorText = await response.text();
//     console.error("API Error:", `Failed to invoke ETL: ${response.status} - ${errorText}`);
//     throw new Error(`Failed to invoke ETL: ${response.status} - ${errorText}`);
//   }

//   const result = await response.json();
//   console.log("API Response:", result); // Log the full API response
//   if (result.body && result.body.body) {
//     console.log("S3 Output Path (if provided):", JSON.parse(result.body.body).s3_output || "Not specified");
//   }
//   return result;
// };

// interface DataSource {
//   id: string;
//   name: string;
//   type: "S3 Bucket";
//   status: "Connected" | "Error" | "Pending";
//   bucketName?: string;
//   fileName?: string;
//   inputPath?: string;
//   outputPath?: string;
// }

// interface Transformation {
//   id: string;
//   name: string;
//   status: "Completed" | "Running" | "Pending" | "Failed";
//   progress: number;
// }

// const validateLocalStorage = () => {
//   const bucket = localStorage.getItem("selectedBucket");
//   const key = localStorage.getItem("selectedFile");
//   console.log("LocalStorage - selectedBucket:", bucket);
//   console.log("LocalStorage - selectedFile:", key);
//   if (!bucket || !key) {
//     console.warn("Missing or empty bucket or key in localStorage.");
//     return false;
//   }
//   return { bucket, key };
// };

// const initialTransformations: Transformation[] = [
//   { id: "tf-1", name: "Data Cleaning", status: "Pending", progress: 0 },
//   { id: "tf-2", name: "Data Standardization", status: "Pending", progress: 0 },
//   { id: "tf-3", name: "Data Enrichment", status: "Pending", progress: 0 },
// ];

// export default function ETL() {
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const [dataSources, setDataSources] = useState<DataSource[]>([]);
//   const [transformations, setTransformations] = useState<Transformation[]>(initialTransformations);
//   const [isJobRunning, setIsJobRunning] = useState(false);
//   const [bucket, setBucket] = useState<string>("");
//   const [key, setKey] = useState<string>("");

//   useEffect(() => {
//     const storageData = validateLocalStorage();
//     if (!storageData) {
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Missing bucket name or key. Please upload the file again.",
//       });
//       navigate("/dashboard/upload");
//       return;
//     }
//     const { bucket, key } = storageData;
//     setBucket(bucket);
//     setKey(key);
//     const outputPath = `s3://${bucket}/parquet/${key.replace(/\.[^/.]+$/, "")}.parquet`;
//     setDataSources([
//       {
//         id: "s3-1",
//         name: "Selected S3 Data",
//         type: "S3 Bucket",
//         status: "Connected",
//         bucketName: bucket,
//         fileName: key,
//         inputPath: `s3://${bucket}/${key}`,
//         outputPath: outputPath,
//       },
//     ]);
//   }, [navigate, toast]);

//   const handleScheduleJob = () => {
//     navigate("/dashboard/schedule-job");
//     toast({
//       title: "Proceeding to Job Scheduling",
//       description: "Configure when your job should run",
//     });
//   };

//   const handleGoBack = () => {
//     navigate("/dashboard/business-logic");
//   };

//   const handleRunJob = async () => {
//     setIsJobRunning(true);
//     setTransformations((prev) =>
//       prev.map((t) => ({ ...t, status: "Running" as const, progress: 0 }))
//     );

//     // Simulate progress for each step sequentially
//     for (let i = 0; i < transformations.length; i++) {
//       await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second per step
//       setTransformations((prev) =>
//         prev.map((t, index) =>
//           index === i
//             ? { ...t, progress: 100, status: "Completed" as const }
//             : t
//         )
//       );
//     }

//     setIsJobRunning(false);
//     setTransformations((prev) =>
//       prev.map((t) => ({ ...t, status: "Completed" as const }))
//     );
//     toast({
//       title: "ETL Job Runs Successfully",
//       description: "All transformations have been completed successfully.",
//     });

//     // Attempt API call to store output in Parquet
//     try {
//       const storageData = validateLocalStorage();
//       if (!storageData) {
//         throw new Error("Missing bucket or key in local storage.");
//       }

//       const { bucket, key } = storageData;
//       const outputPath = `s3://${bucket}/parquet/${key.replace(/\.[^/.]+$/, "")}.parquet`;
//       const file_paths: { [filePath: string]: { output_path: string } } = {
//         [`s3://${bucket}/${key}`]: { output_path: outputPath },
//       };

//       if (Object.keys(file_paths).length > 0) {
//         const data: ETLRequest = { payload: { file_paths } };
//         const response = await runETL(data);
//         console.log("API Response with S3 Output:", response);
//         if (response.body && response.body.body) {
//           const bodyData = JSON.parse(response.body.body);
//           if (bodyData.s3_output) {
//             console.log("Parquet file stored at:", bodyData.s3_output);
//             toast({
//               title: "Output Stored",
//               description: `Parquet file successfully stored at ${bodyData.s3_output}`,
//             });
//           } else {
//             console.warn("No S3 output path returned in API response.");
//             toast({
//               title: "Warning",
//               description: "ETL completed, but output storage path not confirmed.",
//             });
//           }
//         }
//       }
//     } catch (error: any) {
//       console.error("API Call Error:", error.message);
//       toast({
//         title: "ETL Error",
//         description: error.message || "An error occurred while running the ETL job.",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleViewReports = () => {
//     navigate("/dashboard/reports");
//     toast({
//       title: "Navigating to Reports",
//       description: "View detailed reports and analytics",
//     });
//   };

//   const handleDataSourceSettings = (source: DataSource) => {
//     toast({
//       title: "Data Source Settings",
//       description: `Configure settings for ${source.name}`,
//     });
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
//       <div className="container mt-14 mx-auto p-6">
//         {/* Header with Actions */}
//         <div className="flex items-center justify-between mb-6">
//           <div className="text-start">
//             <h1 className="text-3xl font-bold text-foreground">ETL Pipeline</h1>
//             <p className="text-muted-foreground">Design, manage, and monitor your data pipelines</p>
//           </div>
//           <div className="flex items-center gap-4">
//             <Button onClick={handleScheduleJob} variant="secondary">
//               <Calendar className="w-4 h-4 mr-2" />
//               Schedule Job
//             </Button>
//             <Button onClick={handleViewReports} variant="outline">
//               <FileText className="w-4 h-4 mr-2" />
//               View Reports
//             </Button>
//             <Button
//               onClick={handleRunJob}
//               disabled={isJobRunning}
//               className={cn(isJobRunning && "opacity-75")}
//             >
//               <Play className="w-4 h-4 mr-2" />
//               {isJobRunning ? "Running..." : "Run Job"}
//             </Button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {/* Data Sources Card */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <FileText className="w-5 h-5" />
//                 Data Sources
//               </CardTitle>
//               <CardDescription>Connected data sources for ingestion</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               {dataSources.map((source) => (
//                 <div key={source.id} className="flex items-center justify-between">
//                   <div className="flex items-center space-x-4">
//                     <div className="rounded-full p-2 bg-muted">
//                       <FileText className="w-4 h-4 text-foreground" />
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium text-foreground">{source.name}</p>
//                       <p className="text-xs text-muted-foreground">Bucket: {source.bucketName || "N/A"}</p>
//                       <p className="text-xs text-muted-foreground">File: {source.fileName || "N/A"}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Badge
//                       className={cn(
//                         "text-white",
//                         source.status === "Connected" && "bg-green-500 hover:bg-green-600",
//                         source.status === "Error" && "bg-red-500 hover:bg-red-600",
//                         source.status === "Pending" && "bg-yellow-500 hover:bg-yellow-600"
//                       )}
//                     >
//                       {source.status}
//                     </Badge>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       onClick={() => handleDataSourceSettings(source)}
//                     >
//                       <Settings className="w-4 h-4" />
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </CardContent>
//           </Card>

//           {/* Transformations Card */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <RefreshCw className="w-5 h-5" />
//                 Data Transformations
//               </CardTitle>
//               <CardDescription>Data processing and transformation steps</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               {transformations.map((transform) => (
//                 <div key={transform.id} className="space-y-2">
//                   <div className="flex items-center justify-between">
//                     <p className="text-sm font-medium text-foreground">{transform.name}</p>
//                     <Badge
//                       className={cn(
//                         "text-white",
//                         transform.status === "Completed" && "bg-green-500 hover:bg-green-600",
//                         transform.status === "Running" && "bg-blue-500 hover:bg-blue-600",
//                         transform.status === "Pending" && "bg-yellow-500 hover:bg-yellow-600",
//                         transform.status === "Failed" && "bg-red-500 hover:bg-red-600"
//                       )}
//                     >
//                       {transform.status}
//                     </Badge>
//                   </div>
//                   <Progress value={transform.progress} />
//                 </div>
//               ))}
//               {!isJobRunning &&
//                 transformations.every((t) => t.status === "Completed") && (
//                   <p className="text-sm text-green-600 font-medium mt-2">
//                     ETL Job Runs Successfully
//                   </p>
//                 )}
//             </CardContent>
//           </Card>
//         </div>

//         {/* Navigation Buttons */}
//         <div className="flex justify-between mt-6">
//           <Button
//             variant="outline"
//             onClick={handleGoBack}
//             className="flex items-center gap-2"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             Back
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Calendar, Play, ArrowLeft, RefreshCw, Settings, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ================== ETL API ==================

export interface ETLRequest {
  payload: {
    file_paths: {
      [filePath: string]: {
        output_path: string;
      };
    };
  };
}

export interface ETLResponse {
  statusCode: number;
  body: {
    statusCode: number;
    body: string; // e.g. "{\"etl_method\": \"Glue\", \"s3_output\": \"s3://bucket/parquet/file.parquet\"}"
  };
}

const getAuthToken = () => {
  const token = localStorage.getItem("authToken") || "";
  console.log("Auth Token:", token);
  return token;
};

const getBaseUrl = () => {
  // Fallback to a default URL if environment variable is not set
  const defaultUrl = "http://13.233.244.191:8000"; // Update this to your backend URL
  const baseUrl = (typeof process !== 'undefined' && process.env.REACT_APP_API_BASE_URL) || defaultUrl;
  console.log("Base URL:", baseUrl);
  return baseUrl;
};

export const runETL = async (data: ETLRequest): Promise<ETLResponse> => {
  const token = getAuthToken();
  const baseUrl = getBaseUrl();
  console.log("API Request URL:", `${baseUrl}/invoke-etl`);
  console.log("API Request Data:", JSON.stringify(data, null, 2));

  try {
    const response = await fetch(`${baseUrl}/invoke-etl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    console.log("Response Status:", response.status);
    console.log("Response Headers:", Object.fromEntries(response.headers));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`Failed to invoke ETL: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("API Response:", result);
    if (result.body && result.body.body) {
      console.log("S3 Output Path:", JSON.parse(result.body.body).s3_output || "Not specified");
    }
    return result;
  } catch (error: any) {
    console.error("Fetch Error:", error.message);
    throw error;
  }
};

interface DataSource {
  id: string;
  name: string;
  type: "S3 Bucket";
  status: "Connected" | "Error" | "Pending";
  bucketName?: string;
  fileName?: string;
  inputPath?: string;
  outputPath?: string;
}

interface Transformation {
  id: string;
  name: string;
  status: "Completed" | "Running" | "Pending" | "Failed";
  progress: number;
}

const validateLocalStorage = () => {
  const bucket = localStorage.getItem("selectedBucket");
  const key = localStorage.getItem("selectedFile");
  console.log("LocalStorage - selectedBucket:", bucket);
  console.log("LocalStorage - selectedFile:", key);
  if (!bucket || !key) {
    console.warn("Missing or empty bucket or key in localStorage.");
    return false;
  }
  return { bucket, key };
};

const initialTransformations: Transformation[] = [
  { id: "tf-1", name: "Data Cleaning", status: "Pending", progress: 0 },
  { id: "tf-2", name: "Data Standardization", status: "Pending", progress: 0 },
  { id: "tf-3", name: "Data Enrichment", status: "Pending", progress: 0 },
];

export default function ETL() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [transformations, setTransformations] = useState<Transformation[]>(initialTransformations);
  const [isJobRunning, setIsJobRunning] = useState(false);
  const [bucket, setBucket] = useState<string>("");
  const [key, setKey] = useState<string>("");

  useEffect(() => {
    const storageData = validateLocalStorage();
    if (!storageData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing bucket name or key. Please upload the file again.",
      });
      navigate("/dashboard/upload");
      return;
    }
    const { bucket, key } = storageData;
    setBucket(bucket);
    setKey(key);
    const outputPath = `s3://${bucket}/parquet/${key.replace(/\.[^/.]+$/, "")}.parquet`;
    setDataSources([
      {
        id: "s3-1",
        name: "Selected S3 Data",
        type: "S3 Bucket",
        status: "Connected",
        bucketName: bucket,
        fileName: key,
        inputPath: `s3://${bucket}/${key}`,
        outputPath: outputPath,
      },
    ]);
  }, [navigate, toast]);

  const handleScheduleJob = () => {
    navigate("/dashboard/schedule-job");
    toast({
      title: "Proceeding to Job Scheduling",
      description: "Configure when your job should run",
    });
  };

  const handleGoBack = () => {
    navigate("/dashboard/business-logic");
  };
  const handleSkip = () => {
            localStorage.setItem('etl', 'skipped');

    navigate("/dashboard/schedule-job");
    toast({
      title: "NER Skipped",
      description: "Named Entity Resolution has been skipped",
    });
  };

  const handleRunJob = async () => {
            localStorage.setItem('etl', 'used');
    setIsJobRunning(true);
    setTransformations((prev) =>
      prev.map((t) => ({ ...t, status: "Running" as const, progress: 0 }))
    );

    try {
      // Simulate progress for each step sequentially
      for (let i = 0; i < transformations.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second per step
        setTransformations((prev) =>
          prev.map((t, index) =>
            index === i
              ? { ...t, progress: 100, status: "Completed" as const }
              : t
          )
        );
      }

      // Perform API call after transformations
      const storageData = validateLocalStorage();
      if (!storageData) {
        throw new Error("Missing bucket or key in local storage.");
      }

      const { bucket, key } = storageData;
      const outputPath = `s3://${bucket}/parquet/${key.replace(/\.[^/.]+$/, "")}.parquet`;
      const file_paths: { [filePath: string]: { output_path: string } } = {
        [`s3://${bucket}/${key}`]: { output_path: outputPath },
      };

      if (Object.keys(file_paths).length > 0) {
        const data: ETLRequest = { payload: { file_paths } };
        const response = await runETL(data);
        const bodyData = JSON.parse(response.body.body);
        
        setIsJobRunning(false);
        setTransformations((prev) =>
          prev.map((t) => ({ ...t, status: "Completed" as const }))
        );

        if (bodyData.s3_output) {
          toast({
            title: "Success",
            description: `ETL job completed. Parquet file stored at ${bodyData.s3_output}`,
          });
        } else {
          toast({
            title: "Warning",
            description: "ETL job completed, but output storage path not confirmed.",
          });
        }
      }
    } catch (error: any) {
      setIsJobRunning(false);
      setTransformations((prev) =>
        prev.map((t) => ({ ...t, status: "Failed" as const, progress: 0 }))
      );
      console.error("API Call Error:", error.message);
      toast({
        title: "ETL Error",
        description: error.message || "An error occurred while running the ETL job.",
        variant: "destructive",
      });
    }
  };

  const handleViewReports = () => {
    navigate("/dashboard/reports");
    toast({
      title: "Navigating to Reports",
      description: "View detailed reports and analytics",
    });
  };

  const handleDataSourceSettings = (source: DataSource) => {
    toast({
      title: "Data Source Settings",
      description: `Configure settings for ${source.name}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mt-14 mx-auto p-6">
        {/* Header with Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-start">
            <h1 className="text-3xl font-bold text-foreground">ETL Pipeline</h1>
            <p className="text-muted-foreground">Design, manage, and monitor your data pipelines</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleScheduleJob} variant="secondary">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Job
            </Button>
            <Button onClick={handleViewReports} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              View Reports
            </Button>
            <Button
              onClick={handleRunJob}
              disabled={isJobRunning}
              className={cn(isJobRunning && "opacity-75")}
            >
              <Play className="w-4 h-4 mr-2" />
              {isJobRunning ? "Running..." : "Run ETL"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Sources Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Data Sources
              </CardTitle>
              <CardDescription>Connected data sources for ingestion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dataSources.map((source) => (
                <div key={source.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full p-2 bg-muted">
                      <FileText className="w-4 h-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{source.name}</p>
                      <p className="text-xs text-muted-foreground">Bucket: {source.bucketName || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">File: {source.fileName || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-white",
                        source.status === "Connected" && "bg-green-500 hover:bg-green-600",
                        source.status === "Error" && "bg-red-500 hover:bg-red-600",
                        source.status === "Pending" && "bg-yellow-500 hover:bg-yellow-600"
                      )}
                    >
                      {source.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDataSourceSettings(source)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Transformations Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Data Transformations
              </CardTitle>
              <CardDescription>Data processing and transformation steps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {transformations.map((transform) => (
                <div key={transform.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{transform.name}</p>
                    <Badge
                      className={cn(
                        "text-white",
                        transform.status === "Completed" && "bg-green-500 hover:bg-green-600",
                        transform.status === "Running" && "bg-blue-500 hover:bg-blue-600",
                        transform.status === "Pending" && "bg-yellow-500 hover:bg-yellow-600",
                        transform.status === "Failed" && "bg-red-500 hover:bg-red-600"
                      )}
                    >
                      {transform.status}
                    </Badge>
                  </div>
                  <Progress value={transform.progress} />
                </div>
              ))}
              {!isJobRunning &&
                transformations.every((t) => t.status === "Completed") && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    ETL Job Completed Successfully
                  </p>
                )}
              {!isJobRunning &&
                transformations.some((t) => t.status === "Failed") && (
                  <p className="text-sm text-red-600 font-medium mt-2">
                    ETL Job Failed
                  </p>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
           <Button
              variant="outline"
              onClick={handleSkip}
              className="flex items-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </Button>
        </div>
      </div>
    </div>
  );
}