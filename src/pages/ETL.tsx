import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { checkJobGName } from "@/lib/api";
import { createADBJob, invokeFabricFunction, createJobConfig, CreateJobConfigRequest, ADBJobRequest, FabricFunctionRequest, triggerADBPipeline, invokeFabricJobByName } from "@/lib/api"; import {
  FileText,
  Calendar,
  Play,
  ArrowLeft,
  RefreshCw,
  Settings,
  Cloud,
  HardDrive,
  Folder,
  File,
  ChevronRight,
  X,
  Upload,
  SkipForward,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getBuckets, getObjects } from "@/lib/api";

// ================== ETL API ==================

export interface ETLRequest {
  payload: {
    file_paths: {
      [filePath: string]: {
        output_path: string;
      };
    };
    gname?: string;
    etl_method?: string; // Added to support ADF or Glue selection
  };
}

export interface ETLResponse {
  statusCode: number;
  body: {
    statusCode: number;
    body: string; // e.g. "{\"etl_method\": \"Glue\", \"s3_output\": \"s3://bucket/parquet/file.parquet\"}"
  };
}

export interface CheckJobResponse {
  status_code: number;
  success: boolean;
}

const getAuthToken = () => {
  return localStorage.getItem("authToken") || "";
};

const getBaseUrl = () => {
  const defaultUrl = "https://ingestq-backend-954554516.ap-south-1.elb.amazonaws.com";
  return (typeof process !== 'undefined' && process.env.REACT_APP_API_BASE_URL) || defaultUrl;
};

export const runETL = async (data: ETLRequest): Promise<ETLResponse> => {
  const token = getAuthToken();
  const baseUrl = getBaseUrl();
  console.log("API Request URL:", `${baseUrl}/invoke-etl`);
  console.log("API Request Data:", data);
  const response = await fetch(`${baseUrl}/invoke-etl`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error:", `Failed to invoke ETL: ${response.status} - ${errorText}`);
    throw new Error(`Failed to invoke ETL: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("API Response:", result);
  if (data.payload.file_paths) {
  const outputPaths = Object.values(data.payload.file_paths).map(fp => fp.output_path);
  console.log("S3 Output Paths:", outputPaths.join(", "));
}
  return result;
};


interface DataSource {
  id: string;
  name: string;
  type: "S3 Bucket" | "Local File" | "Azure Blob";
  status: "Connected" | "Error" | "Pending";
  bucketName?: string;
  fileName?: string;
  inputPath?: string;
  outputPath?: string;
  localFile?: File;
}

interface Transformation {
  id: string;
  name: string;
  status: "Completed" | "Running" | "Pending" | "Failed";
  progress: number;
}

interface Bucket {
  name: string;
}

interface Object {
  key: string;
  isFolder?: boolean;
}

const initialTransformations: Transformation[] = [
  { id: "tf-1", name: "Data Cleaning", status: "Pending", progress: 0 },
  { id: "tf-2", name: "Data Standardization", status: "Pending", progress: 0 },
];

const LoadingOverlay = ({ progress, message }: { progress: number; message: string }) => {
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
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">{progress}% Complete</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


export default function ETL() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [transformations, setTransformations] = useState<Transformation[]>(initialTransformations);
  const [isJobRunning, setIsJobRunning] = useState(false);
  const [jobName, setJobName] = useState<string>("");
  const [isUploadToggleOn, setIsUploadToggleOn] = useState<boolean>(false);
  const [etlMethod, setEtlMethod] = useState<string>("Glue"); // New state for ETL method
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showS3Browser, setShowS3Browser] = useState<boolean>(false);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [objects, setObjects] = useState<Object[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [selectedBucket, setSelectedBucket] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [adbJobResponse, setAdbJobResponse] = useState<any>(null);
  const [fabricJobResponse, setFabricJobResponse] = useState<any>(null);

  const [jobProgress, setJobProgress] = useState(0); // Add this
  const [jobStatusMessage, setJobStatusMessage] = useState(""); // Add this


  // Load only the most recent file from Upload step
  useEffect(() => {
    const loadRecentFile = () => {
      const selectedBucket = localStorage.getItem("selectedBucket");
      const selectedFile = localStorage.getItem("selectedFile");

      if (selectedBucket && selectedFile) {
        const newDataSources: DataSource[] = [];

        if (selectedBucket !== "local") {
          // Handle S3 file
          const inputPath = `s3://${selectedBucket}/${selectedFile}`;
          const outputPath = `s3://${selectedBucket}/parquet/${selectedFile.replace(/\.[^/.]+$/, "")}.parquet`;

          // Get original data source path
          const orgDataSource = localStorage.getItem("org_data_source") || inputPath;

          const newDataSource: DataSource = {
            id: `s3-${Date.now()}`,
            name: orgDataSource, // Show original path instead of S3 path
            type: "S3 Bucket",
            status: "Connected",
            bucketName: selectedBucket,
            fileName: selectedFile,
            inputPath: inputPath,
            outputPath: outputPath,
          };
          newDataSources.push(newDataSource);

          // Initialize selectedFiles in localStorage as an array if not already set
          const existingFiles = JSON.parse(localStorage.getItem("selectedFiles") || "[]");
          if (!existingFiles.some((file: any) => file.inputPath === inputPath)) {
            existingFiles.push({
              bucket: selectedBucket,
              key: selectedFile,
              inputPath: inputPath,
              outputPath: outputPath
            });
            localStorage.setItem("selectedFiles", JSON.stringify(existingFiles));
          }
        } else {
          // Handle local file
          const inputPath = `local://${selectedFile}`;
          const outputPath = `processed/${selectedFile.replace('.py', '_processed.py')}`;

          const newDataSource: DataSource = {
            id: `local-${Date.now()}`,
            name: `Local File - ${selectedFile}`,
            type: "Local File",
            status: "Connected",
            fileName: selectedFile,
            inputPath: inputPath,
            outputPath: outputPath,
          };
          newDataSources.push(newDataSource);

          // Initialize selectedLocalFiles in localStorage as an array if not already set
          const existingLocalFiles = JSON.parse(localStorage.getItem("selectedLocalFiles") || "[]");
          if (!existingLocalFiles.some((file: any) => file.inputPath === inputPath)) {
            existingLocalFiles.push({
              name: selectedFile,
              inputPath: inputPath,
              outputPath: outputPath
            });
            localStorage.setItem("selectedLocalFiles", JSON.stringify(existingLocalFiles));
          }
        }

        setDataSources(newDataSources);
        // if (newDataSources.length > 0) {
        //   toast({
        //     title: "File Loaded",
        //     description: `Loaded recent file: ${selectedFile}`,
        //   });
        // }
      }
    };

    loadRecentFile();
  }, []);

  const handleSelectSourceType = (type: "s3" | "local") => {
    if (type === "s3") {
      handleOpenS3Browser();
    } else if (type === "local") {
      handleSelectLocalFile();
    }
  };

  const handleSelectLocalFile = () => {
    toast({
      title: "File Selection",
      description: "Please select only .py files",
    });

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.py')) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please select only .py files",
      });
      return;
    }

    setSelectedFile(file);
    toast({
      title: "File Selected Successfully",
      description: `${file.name} has been selected and is ready to upload`,
    });
  };

  const handleOpenS3Browser = async () => {
    try {
      const bucketData = await getBuckets();
      if (Array.isArray(bucketData)) {
        const formattedBuckets = bucketData.map((name: string) => ({ name }));
        setBuckets(formattedBuckets);
      } else {
        setBuckets([]);
        toast({
          title: "Warning",
          description: "Unexpected bucket data format.",
          variant: "destructive",
        });
      }
      setShowS3Browser(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch S3 buckets",
      });
    }
  };

  const handleSelectBucket = async (bucketName: string) => {
    setSelectedBucket(bucketName);
    setCurrentPath("");
    try {
      const objectData = await getObjects(bucketName, "");
      setObjects(objectData || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to fetch bucket contents: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      setObjects([]);
    }
    setSelectedItem(null);
  };

  const handleS3Navigation = async (item: string, isFolder: boolean) => {
    if (item === "..") {
      const parts = currentPath.split("/").filter((p) => p);
      if (parts.length === 0) {
        setSelectedBucket("");
        setCurrentPath("");
        setObjects([]);
        try {
          const bucketData = await getBuckets();
          if (Array.isArray(bucketData)) {
            const formattedBuckets = bucketData.map((name: string) => ({ name }));
            setBuckets(formattedBuckets);
          }
        } catch (error) {
          console.error("Error fetching buckets:", error);
        }
      } else {
        parts.pop();
        const newPath = parts.join("/") + (parts.length > 0 ? "/" : "");
        setCurrentPath(newPath);
        try {
          const objectData = await getObjects(selectedBucket, newPath);
          setObjects(objectData || []);
        } catch (error) {
          console.error("Error navigating back:", error);
        }
      }
    } else if (isFolder) {
      const newPath = (currentPath || "") + item + "/";
      setCurrentPath(newPath);
      try {
        const objectData = await getObjects(selectedBucket, newPath);
        setObjects(objectData || []);
      } catch (error) {
        console.error("Error navigating into folder:", error);
      }
    } else {
      const fileKey = (currentPath || "") + item;
      const outputPath = `s3://${selectedBucket}/parquet/${fileKey.replace(/\.[^/.]+$/, "")}.parquet`;

      const existingSource = dataSources.find(
        source => source.inputPath === `s3://${selectedBucket}/${fileKey}`
      );

      if (existingSource) {
        toast({
          title: "File Already Selected",
          description: `${selectedBucket}/${fileKey} is already in your sources`,
          variant: "destructive",
        });
        return;
      }

      const newId = `s3-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newDataSource: DataSource = {
        id: newId,
        name: `S3 Data - ${fileKey.split('/').pop()}`,
        type: "S3 Bucket",
        status: "Connected",
        bucketName: selectedBucket,
        fileName: fileKey,
        inputPath: `s3://${selectedBucket}/${fileKey}`,
        outputPath: outputPath,
      };

      setDataSources(prev => [...prev, newDataSource]);

      const existingFiles = JSON.parse(localStorage.getItem("selectedFiles") || "[]");
      const newFileInfo = {
        bucket: selectedBucket,
        key: fileKey,
        inputPath: `s3://${selectedBucket}/${fileKey}`,
        outputPath: outputPath
      };

      const updatedFiles = [...existingFiles, newFileInfo];
      localStorage.setItem("selectedFiles", JSON.stringify(updatedFiles));

      setShowS3Browser(false);
      toast({
        title: "S3 File Added",
        description: `Added: ${selectedBucket}/${fileKey}`,
      });
    }
    setSelectedItem(null);
  };

  const handleSelectS3File = () => {
    if (!selectedItem || !selectedBucket) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file from S3",
      });
      return;
    }
    const item = selectedItem;
    const fileKey = (currentPath || "") + item;
    const outputPath = `s3://${selectedBucket}/parquet/${fileKey.replace(/\.[^/.]+$/, "")}.parquet`;

    const existingSource = dataSources.find(
      source => source.inputPath === `s3://${selectedBucket}/${fileKey}`
    );

    if (existingSource) {
      toast({
        title: "File Already Selected",
        description: `${selectedBucket}/${fileKey} is already in your sources`,
        variant: "destructive",
      });
      return;
    }

    const newId = `s3-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newDataSource: DataSource = {
      id: newId,
      name: `S3 Data - ${fileKey.split('/').pop()}`,
      type: "S3 Bucket",
      status: "Connected",
      bucketName: selectedBucket,
      fileName: fileKey,
      inputPath: `s3://${selectedBucket}/${fileKey}`,
      outputPath: outputPath,
    };

    setDataSources(prev => [...prev, newDataSource]);

    const existingFiles = JSON.parse(localStorage.getItem("selectedFiles") || "[]");
    const newFileInfo = {
      bucket: selectedBucket,
      key: fileKey,
      inputPath: `s3://${selectedBucket}/${fileKey}`,
      outputPath: outputPath
    };

    const updatedFiles = [...existingFiles, newFileInfo];
    localStorage.setItem("selectedFiles", JSON.stringify(updatedFiles));

    setShowS3Browser(false);
    setSelectedItem(null);
    toast({
      title: "S3 File Added",
      description: `Added: ${selectedBucket}/${fileKey}`,
    });
  };

  const handleRemoveDataSource = (sourceId: string) => {
    const sourceToRemove = dataSources.find(source => source.id === sourceId);

    if (sourceToRemove) {
      setDataSources(prev => prev.filter(source => source.id !== sourceId));

      if (sourceToRemove.type === "S3 Bucket") {
        const existingFiles = JSON.parse(localStorage.getItem("selectedFiles") || "[]");
        const updatedFiles = existingFiles.filter((file: any) =>
          file.inputPath !== sourceToRemove.inputPath
        );
        localStorage.setItem("selectedFiles", JSON.stringify(updatedFiles));
      }

      if (sourceToRemove.type === "Local File") {
        const existingLocalFiles = JSON.parse(localStorage.getItem("selectedLocalFiles") || "[]");
        const updatedLocalFiles = existingLocalFiles.filter((file: any) =>
          file.inputPath !== sourceToRemove.inputPath
        );
        localStorage.setItem("selectedLocalFiles", JSON.stringify(updatedLocalFiles));
      }

      toast({
        title: "Data Source Removed",
        description: `Removed: ${sourceToRemove.name}`,
      });
    }
  };

  const handleUploadLocalFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const existingSource = dataSources.find(
        source => source.fileName === selectedFile.name && source.type === "Local File"
      );

      if (existingSource) {
        toast({
          title: "File Already Uploaded",
          description: `${selectedFile.name} is already in your sources`,
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      const newDataSource: DataSource = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `Local File - ${selectedFile.name}`,
        type: "Local File",
        status: "Connected",
        fileName: selectedFile.name,
        inputPath: `local://${selectedFile.name}`,
        outputPath: `processed/${selectedFile.name.replace('.py', '_processed.py')}`,
        localFile: selectedFile,
      };

      setDataSources(prev => [...prev, newDataSource]);

      const existingLocalFiles = JSON.parse(localStorage.getItem("selectedLocalFiles") || "[]");
      const newLocalFileInfo = {
        name: selectedFile.name,
        inputPath: `local://${selectedFile.name}`,
        outputPath: `processed/${selectedFile.name.replace('.py', '_processed.py')}`
      };

      const updatedLocalFiles = [...existingLocalFiles, newLocalFileInfo];
      localStorage.setItem("selectedLocalFiles", JSON.stringify(updatedLocalFiles));

      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} has been uploaded and added to sources`,
      });

      setSelectedFile(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload the file. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleScheduleJob = () => {
    if (jobName) {
      localStorage.setItem("jobName", jobName);
    }
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
    localStorage.setItem('datatransformations', 'skipped');
    if (jobName) {
      localStorage.setItem("jobName", jobName);
    }
    navigate("/dashboard/schedule-job");
    toast({
      title: "NER Skipped",
      description: "Named Entity Resolution has been skipped",
    });
  };
  const handleRunJob = async () => {
  if (!jobName) {
    toast({
      title: "Error",
      description: "Please enter a job name before running the ETL job.",
      variant: "destructive",
    });
    return;
  }

  if (dataSources.length === 0) {
    toast({
      title: "Error",
      description: "Please add at least one data source before running the ETL job.",
      variant: "destructive",
    });
    return;
  }

  // Check if job name exists for ALL methods (Glue, ADB, and Fabric)
  try {
    const checkResponse = await checkJobGName(jobName);

    // If status_code is 200 and success is true, job already exists
    if (checkResponse.status_code === 200 && checkResponse.success) {
      toast({
        title: "Job Name Already Exists",
        description: `A job with the name "${jobName}" already exists. Please choose a different name.`,
        variant: "destructive",
      });
      return;
    }

    // If status_code is 409, job already exists
    if (checkResponse.status_code === 409) {
      toast({
        title: "Job Name Already Exists",
        description: `A job with the name "${jobName}" already exists. Please choose a different name.`,
        variant: "destructive",
      });
      return;
    }

    // If status_code is 404, job doesn't exist - this is good, continue
    if (checkResponse.status_code === 404) {
      console.log(`Job name "${jobName}" is available`);
    }
  } catch (error: any) {
    // If it's a 404 error, job doesn't exist - continue
    const errorMessage = error.message?.toLowerCase() || "";
    if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      console.log(`Job name "${jobName}" is available (404 caught)`);
      // Continue with job creation
    } else {
      toast({
        title: "Error Checking Job Name",
        description: error.message || "Failed to check job name availability. Please try again.",
        variant: "destructive",
      });
      return;
    }
  }

  setIsJobRunning(true);
  setJobProgress(0);
  setJobStatusMessage("Initializing ETL Job...");

  setTransformations((prev) =>
    prev.map((t) => ({ ...t, status: "Running" as const, progress: 0 }))
  );

  try {
    // Simulate transformation progress with status updates
    setJobStatusMessage("Running Data Transformations...");
    for (let i = 0; i < transformations.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const progressPercent = Math.round(((i + 1) / (transformations.length + 1)) * 50); // First 50%
      setJobProgress(progressPercent);

      setTransformations((prev) =>
        prev.map((t, index) =>
          index === i
            ? { ...t, progress: 100, status: "Completed" as const }
            : t
        )
      );
    }

    // Update progress for ETL execution phase
    setJobProgress(60);
    setJobStatusMessage(`Executing ${etlMethod} Job...`);

    const s3Sources = dataSources.filter(source => source.type === "S3 Bucket");
    const localSources = dataSources.filter(source => source.type === "Local File");
    const inputType = localStorage.getItem('input_type');
const dbType = localStorage.getItem('db_type');

if (inputType === 'database' || inputType === 'snowflake') {
  const dbName = localStorage.getItem('db_name');
  const dbTable = localStorage.getItem('db_table');
  
  if (!dbName || !dbTable) {
    throw new Error("Database name or table is missing");
  }

  const outputPath = `s3://agntic-bl/database_inp/${dbTable}.parquet`;

  if (dbType === 'snowflake' || inputType === 'snowflake') {
    const snowflakePayload = {
      gname: jobName,
      input_type: "snowflake",
      file_paths: {
        database: {
          database: dbName,
          table_name: dbTable,
          output_path: outputPath
        }
      }
    };

    setJobStatusMessage("Invoking Glue ETL Job for Snowflake...");
    setJobProgress(70);

    const glueETLData: ETLRequest = {
      payload: snowflakePayload
    };

    await runETL(glueETLData);
    setJobProgress(90);

    toast({
      title: "Glue Job Invoked",
      description: `Glue ETL job invoked for Snowflake table: ${dbTable}`,
    });

    localStorage.setItem('etl_method', 'Glue');
    localStorage.setItem('glue_etl_payload', JSON.stringify(snowflakePayload));
    
    // Mark ETL as executed and store job name
    localStorage.setItem('datatransformations', 'executed');
    localStorage.setItem("jobName", jobName);
    
    setJobProgress(100);
    setJobStatusMessage("ETL Job Completed Successfully!");

    await new Promise(resolve => setTimeout(resolve, 500));

    setIsJobRunning(false);
    setJobProgress(0);
    setJobStatusMessage("");

    setTransformations((prev) =>
      prev.map((t) => ({ ...t, status: "Completed" as const }))
    );

    toast({
      title: "ETL Job Completed",
      description: "Please proceed to schedule your job",
    });
    
    return; // Exit early for database sources
  } else {
    // Handle MySQL/PostgreSQL with standard database payload
    const dbHost = localStorage.getItem('db_host');
    const dbUser = localStorage.getItem('db_user');
    const dbPassword = localStorage.getItem('db_password');
    const dbPort = localStorage.getItem('db_port');

    const databasePayload = {
      gname: jobName,
      input_type: "database",
      file_paths: {
        database: {
          db_host: dbHost,
          db_name: dbName,
          db_user: dbUser,
          db_password: dbPassword,
          db_port: parseInt(dbPort || '3306'),
          db_table: dbTable,
          output_path: outputPath
        }
      }
    };

    setJobStatusMessage("Invoking Glue ETL Job for Database...");
    setJobProgress(70);

    const glueETLData: ETLRequest = {
      payload: databasePayload
    };

    await runETL(glueETLData);
    setJobProgress(90);

    toast({
      title: "Glue Job Invoked",
      description: `Glue ETL job invoked for database table: ${dbTable}`,
    });

    localStorage.setItem('etl_method', 'Glue');
    localStorage.setItem('glue_etl_payload', JSON.stringify(databasePayload));
    
    localStorage.setItem('datatransformations', 'executed');
    localStorage.setItem("jobName", jobName);
    
    setJobProgress(100);
    setJobStatusMessage("ETL Job Completed Successfully!");

    await new Promise(resolve => setTimeout(resolve, 500));

    setIsJobRunning(false);
    setJobProgress(0);
    setJobStatusMessage("");

    setTransformations((prev) =>
      prev.map((t) => ({ ...t, status: "Completed" as const }))
    );

    toast({
      title: "ETL Job Completed",
      description: "Please proceed to schedule your job",
    });
    
    return;
  }
}
    // Handle S3 sources
    if (s3Sources.length > 0) {
      const file_paths: {
        [filePath: string]: {
          output_path: string;
          subsheet?: string;
        }
      } = {};

      const selectedSheet = localStorage.getItem("selectedSheet");

      s3Sources.forEach(source => {
        if (source.inputPath && source.outputPath) {
          const inputPath = (etlMethod === "ADB" || etlMethod === "Fabric")
            ? source.inputPath.replace("s3://", "s3a://")
            : source.inputPath;
          const outputPath = (etlMethod === "ADB" || etlMethod === "Fabric")
            ? source.outputPath.replace("s3://", "s3a://")
            : source.outputPath;

          const fileName = source.fileName || "";
          const isExcel = /\.(xlsx|xls|xlsm)$/i.test(fileName);

          if (isExcel && selectedSheet) {
            file_paths[inputPath] = {
              output_path: outputPath,
              subsheet: selectedSheet
            };
          } else {
            file_paths[inputPath] = { output_path: outputPath };
          }
        }
      });

      // Execute based on ETL method
      if (etlMethod === "Glue") {
        setJobStatusMessage("Invoking Glue ETL Job...");
        setJobProgress(70);

        const glueETLPayload = {
          gname: jobName,
          file_paths: file_paths
        };

        const glueETLData: ETLRequest = {
          payload: glueETLPayload
        };

        await runETL(glueETLData);
        setJobProgress(90);

        toast({
          title: "Glue Job Invoked",
          description: `Glue ETL job invoked for ${Object.keys(file_paths).length} S3 files`,
        });

        localStorage.setItem('etl_method', 'Glue');
        localStorage.setItem('glue_etl_payload', JSON.stringify(glueETLPayload));

      } else if (etlMethod === "ADB") {
        setJobStatusMessage("Creating ADB Job...");
        setJobProgress(70);

       
        const adbData: ADBJobRequest = {
          gname: jobName,
          file_paths: file_paths
        };

        const adbJobResponse = await createADBJob(adbData);

        // toast({
        //   title: "ADB Job Created",
        //   description: `Step 1/2 Complete: ${adbJobResponse.message}`,
        // });

        setJobProgress(80);
        setJobStatusMessage("Triggering ADB Pipeline...");

        // toast({
        //   title: "Triggering ADB Pipeline",
        //   description: "Step 2/2: Starting pipeline execution...",
        // });

        const triggerResponse = await triggerADBPipeline({
          pipeline_name: jobName
        });

        localStorage.setItem('etl_method', 'ADB');
        localStorage.setItem('adb_job_response', JSON.stringify({
          message: adbJobResponse.message,
          script_s3_path: adbJobResponse.script_s3_path,
          job_id: triggerResponse.job_id,
          run_id: triggerResponse.run_id,
          monitor_url: triggerResponse.monitor_url
        }));

        setJobProgress(90);

        toast({
          title: "ADB Pipeline Started",
          description: `Job ID: ${triggerResponse.job_id}, Run ID: ${triggerResponse.run_id}`,
        });

      } else if (etlMethod === "Fabric") {
        setJobStatusMessage("Creating Fabric Job...");
        setJobProgress(70);

        // toast({
        //   title: "Creating Fabric Job",
        //   description: "Step 1/2: Creating Fabric job...",
        // });

        const fabricFilePaths: {
          [key: string]: {
            output_path: string;
            subsheet?: string;
          }
        } = {};

        Object.entries(file_paths).forEach(([inputPath, fileConfig]) => {
          fabricFilePaths[inputPath] = {
            output_path: fileConfig.output_path,
            ...(fileConfig.subsheet && { subsheet: fileConfig.subsheet })
          };
        });

        const fabricData: FabricFunctionRequest = {
          gname: jobName,
          file_paths: fabricFilePaths
        };

        const fabricJobResponse = await invokeFabricFunction(fabricData);

        // toast({
        //   title: "Fabric Job Created",
        //   description: `Step 1/2 Complete: ${fabricJobResponse.message}`,
        // });

        setJobProgress(80);
        setJobStatusMessage("Invoking Fabric Job...");

        // toast({
        //   title: "Invoking Fabric Job",
        //   description: "Step 2/2: Starting job execution...",
        // });

        const invokeResponse = await invokeFabricJobByName(jobName);

        localStorage.setItem('etl_method', 'Fabric');
        localStorage.setItem('fabric_job_response', JSON.stringify({
          status: fabricJobResponse.status,
          gname: fabricJobResponse.gname,
          sjd_id: fabricJobResponse.sjd_id,
          script_path: fabricJobResponse.script_path,
          message: fabricJobResponse.message,
          invoke_response: invokeResponse
        }));

        setJobProgress(90);

        toast({
          title: "Fabric Job Invoked",
          description: `Job "${jobName}" has been successfully started`,
        });
      }
    }

    if (localSources.length > 0) {
      toast({
        title: "Success",
        description: `Local file processing completed for ${localSources.length} files`,
      });
    }

    // Mark ETL as executed and store job name
    localStorage.setItem('datatransformations', 'executed');
    localStorage.setItem("jobName", jobName);

    // Store selected files info for ScheduleJob to use
    const selectedFilesInfo = s3Sources.map(source => ({
      bucket: source.bucketName,
      key: source.fileName,
      inputPath: source.inputPath,
      outputPath: source.outputPath
    }));
    localStorage.setItem("selectedFiles", JSON.stringify(selectedFilesInfo));
    if (s3Sources.length > 0 && s3Sources[0].bucketName && s3Sources[0].fileName) {
      localStorage.setItem("selectedBucket", s3Sources[0].bucketName);
      localStorage.setItem("selectedFile", s3Sources[0].fileName);
    }

    setJobProgress(100);
    setJobStatusMessage("ETL Job Completed Successfully!");

    await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause to show 100%

    setIsJobRunning(false);
    setJobProgress(0);
    setJobStatusMessage("");

    setTransformations((prev) =>
      prev.map((t) => ({ ...t, status: "Completed" as const }))
    );

    toast({
      title: "ETL Job Completed",
      description: "Please proceed to schedule your job",
    });

  } catch (error: any) {
    setIsJobRunning(false);
    setJobProgress(0);
    setJobStatusMessage("");
    
    setTransformations((prev) =>
      prev.map((t) => ({ ...t, status: "Failed" as const, progress: 0 }))
    );

    console.error("ETL Error:", error);

    // Specific error messages based on the step
    let errorTitle = "ETL Error";
    let errorDescription = error.message || "An error occurred while running the ETL job.";

    if (error.message?.includes("check-job-gname")) {
      errorTitle = "Job Name Check Failed";
      errorDescription = "Failed to verify job name availability. Please try again.";
    } else if (error.message?.includes("invoke-etl") || error.message?.includes("Glue")) {
      errorTitle = "Glue Job Invocation Failed";
      errorDescription = "Failed to invoke Glue ETL job. Please check your configuration and try again.";
    } else if (error.message?.includes("create-adf-job") || error.message?.includes("create ADB")) {
      errorTitle = "ADB Job Creation Failed";
      errorDescription = "Failed to create ADB job. Please check your configuration and try again.";
    } else if (error.message?.includes("trigger-adb-pipeline") || error.message?.includes("trigger ADB")) {
      errorTitle = "ADB Pipeline Trigger Failed";
      errorDescription = "ADB job was created but pipeline failed to start. Please try triggering manually.";
    } else if (error.message?.includes("create-fabric-job") || error.message?.includes("create Fabric")) {
      errorTitle = "Fabric Job Creation Failed";
      errorDescription = "Failed to create Fabric job. Please check your configuration and try again.";
    } else if (error.message?.includes("invoke-fabric-job") || error.message?.includes("invoke Fabric")) {
      errorTitle = "Fabric Job Invocation Failed";
      errorDescription = "Fabric job was created but failed to start. Please try invoking manually.";
    }

    toast({
      title: errorTitle,
      description: errorDescription,
      variant: "destructive",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRunJob()}
        >
          Retry
        </Button>
      ),
    });
  }
};

  
    const Breadcrumbs = () => {
      return (
        <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-2">
          <span
            onClick={async () => {
              setSelectedBucket("");
              setCurrentPath("");
              setObjects([]);
              setSelectedItem(null);
              try {
                const bucketData = await getBuckets();
                if (Array.isArray(bucketData)) {
                  const formattedBuckets = bucketData.map((name: string) => ({ name }));
                  setBuckets(formattedBuckets);
                }
              } catch (error) {
                console.error("Error resetting to root:", error);
              }
            }}
            className="cursor-pointer hover:underline flex items-center"
          >
            <Folder className="w-4 h-4 mr-1" /> Root
          </span>
          {selectedBucket && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span
                onClick={async () => {
                  setCurrentPath("");
                  setSelectedItem(null);
                  try {
                    const objectData = await getObjects(selectedBucket, "");
                    setObjects(objectData || []);
                  } catch (error) {
                    console.error("Error navigating to bucket root:", error);
                  }
                }}
                className="cursor-pointer hover:underline"
              >
                {selectedBucket}
              </span>
            </>
          )}
          {currentPath &&
            currentPath
              .split("/")
              .filter((p) => p)
              .map((part, idx, arr) => (
                <div key={idx} className="flex items-center">
                  <ChevronRight className="w-4 h-4" />
                  <span
                    onClick={async () => {
                      const newPath = arr.slice(0, idx + 1).join("/") + "/";
                      setCurrentPath(newPath);
                      setSelectedItem(null);
                      try {
                        const objectData = await getObjects(selectedBucket, newPath);
                        setObjects(objectData || []);
                      } catch (error) {
                        console.error("Error navigating to path:", error);
                      }
                    }}
                    className="cursor-pointer hover:underline"
                  >
                    {part}
                  </span>
                </div>
              ))}
        </div>
      );
    };


    const parseOrgDataSource = (orgPath: string) => {
      if (orgPath.startsWith("azure-blob://")) {
        const path = orgPath.replace("azure-blob://", "");
        const parts = path.split("/");
        const container = parts[0];
        const file = parts.slice(1).join("/");
        return { type: "Azure Blob", container, file };
      } else if (orgPath.startsWith("onelake://")) {
        const path = orgPath.replace("onelake://", "");
        const parts = path.split("/");
        const workspace = parts[0];
        const lakehouse = parts[1];
        const file = parts.slice(3).join("/"); // Skip "Files" folder
        return { type: "OneLake", workspace, lakehouse, file };
      } else if (orgPath.startsWith("delta-tables://")) {
        const path = orgPath.replace("delta-tables://", "");
        const parts = path.split("/");
        const workspace = parts[0];
        const lakehouse = parts[1];
        const table = parts[2];
        return { type: "Delta Tables", workspace, lakehouse, table };
      } else if (orgPath.startsWith("s3://")) {
        const path = orgPath.replace("s3://", "");
        const parts = path.split("/");
        const bucket = parts[0];
        const file = parts.slice(1).join("/");
        return { type: "S3", bucket, file };
      }
      return null;
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {isJobRunning && (
          <LoadingOverlay progress={jobProgress} message={jobStatusMessage} />
        )}

        <div className="container mt-14 mx-auto p-6">

          <input
            ref={fileInputRef}
            type="file"
            accept=".py"
            onChange={handleFileChange}
            className="hidden"
          />

          <Dialog open={showS3Browser} onOpenChange={(open) => {
            setShowS3Browser(open);
            if (!open) {
              setSelectedBucket("");
              setCurrentPath("");
              setObjects([]);
              setSelectedItem(null);
            }
          }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Browse S3 Buckets</DialogTitle>
                <DialogDescription>Select a bucket and file for the data source.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Breadcrumbs />
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  {!selectedBucket ? (
                    buckets.length > 0 ? (
                      buckets.map((bucket) => (
                        <div
                          key={bucket.name}
                          className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${selectedItem === bucket.name ? "bg-primary/20 border-primary/50" : ""
                            }`}
                          onDoubleClick={() => handleSelectBucket(bucket.name)}
                          onClick={() => setSelectedItem(bucket.name)}
                        >
                          <Folder className="w-4 h-4 text-blue-500" />
                          <div className="flex-1 font-medium">{bucket.name}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">
                        No buckets available.
                      </div>
                    )
                  ) : (
                    <>
                      <div
                        className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
                        onDoubleClick={() => handleS3Navigation("..", true)}
                      >
                        <Folder className="w-4 h-4 text-blue-500" />
                        <div className="flex-1 font-medium">..</div>
                      </div>
                      {objects.length > 0 ? (
                        objects.map((obj) => {
                          const isFolder = obj.isFolder || obj.key.endsWith("/");
                          const displayName = obj.key.split("/").pop() || obj.key;
                          return (
                            <div
                              key={obj.key}
                              className={`flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${selectedItem === obj.key ? "bg-primary/20 border-primary/50" : ""
                                }`}
                              onDoubleClick={() => handleS3Navigation(obj.key, isFolder)}
                              onClick={() => setSelectedItem(obj.key)}
                            >
                              {isFolder ? (
                                <Folder className="w-4 h-4 text-blue-500" />
                              ) : (
                                <File className="w-4 h-4 text-gray-500" />
                              )}
                              <div className="flex-1 font-medium">{displayName}</div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-muted-foreground">
                          No objects available.
                        </div>
                      )}
                    </>
                  )}
                </div>
                {selectedBucket && selectedItem && !selectedItem.endsWith("/") && (
                  <Button
                    onClick={handleSelectS3File}
                    className="w-fit flex items-center gap-2"
                  >
                    Add {selectedItem.split("/").pop() || selectedItem}
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-between mb-6">
            <div className="text-start">
              <h1 className="text-3xl font-bold text-foreground">Data Transformations</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={handleScheduleJob} variant="secondary">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Job
              </Button>
              <Button
                onClick={handleRunJob}
                disabled={isJobRunning || !jobName || dataSources.length === 0}
                className={cn(
                  "min-w-[140px]",
                  isJobRunning && "opacity-75 cursor-not-allowed"
                )}
              >
                {isJobRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Steps
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
               <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100">
                  <FileText className="w-5 h-5  text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Sources ({dataSources.length})</CardTitle>
                    <CardDescription>Connected sources for ingestion</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="upload-toggle">Upload File</Label>
                  <Switch
                    id="upload-toggle"
                    checked={isUploadToggleOn}
                    onCheckedChange={setIsUploadToggleOn}
                  />
                </div>
              </div>
            </CardHeader>
              <CardContent className="space-y-4">
                {isUploadToggleOn && (
                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleSelectSourceType("s3")}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Cloud className="w-4 h-4" />
                      Upload from S3
                    </Button>
                    <Button
                      onClick={() => handleSelectSourceType("local")}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <HardDrive className="w-4 h-4" />
                      Upload from Local
                    </Button>
                  </div>
                )}
                <p className="text-sm font-medium text-foreground">Choose your Compute Instance: </p>

                <div className="space-y-2">
                  {/* <Label>ETL Method</Label> */}
                  <RadioGroup
                    value={etlMethod}
                    onValueChange={setEtlMethod}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Glue" id="glue" />
                      <Label htmlFor="glue">Glue Job</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ADB" id="adb" />
                      <Label htmlFor="adb">ADB Job</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Fabric" id="fabric" />
                      <Label htmlFor="fabric">Fabric Job</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobName">Job Name:</Label>
                  <Input
                    id="jobName"
                    type="text"
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    placeholder="Enter job name"
                  />
                </div>

                {selectedFile && (
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="rounded-full p-2 bg-primary/10">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Selected Python File</p>
                          <p className="text-xs text-muted-foreground">File: {selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
                          Selected
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleUploadLocalFile}
                          disabled={isUploading}
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          {isUploading ? "Uploading..." : "Upload"}
                        </Button>
                        <Button
                          onClick={() => setSelectedFile(null)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {dataSources.map((source) => (
                    <div key={source.id} className="p-3 border rounded-lg bg-background">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="rounded-full p-2 bg-muted">
                            <FileText className="w-4 h-4 text-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{source.name}</p>
                            {source.type === "S3 Bucket" && (() => {
                              const parsed = parseOrgDataSource(source.name);
                              if (!parsed) {
                                return (
                                  <>
                                    <p className="text-xs text-muted-foreground truncate">Bucket: {source.bucketName || "N/A"}</p>
                                    <p className="text-xs text-muted-foreground truncate">File: {source.fileName || "N/A"}</p>
                                  </>
                                );
                              }

                              if (parsed.type === "Azure Blob") {
                                return (
                                  <>
                                    <p className="text-xs text-muted-foreground truncate">Container: {parsed.container}</p>
                                    <p className="text-xs text-muted-foreground truncate">File: {parsed.file}</p>
                                  </>
                                );
                              } else if (parsed.type === "OneLake") {
                                return (
                                  <>
                                    <p className="text-xs text-muted-foreground truncate">Workspace: {parsed.workspace}</p>
                                    <p className="text-xs text-muted-foreground truncate">Lakehouse: {parsed.lakehouse}</p>
                                    <p className="text-xs text-muted-foreground truncate">File: {parsed.file}</p>
                                  </>
                                );
                              } else if (parsed.type === "Delta Tables") {
                                return (
                                  <>
                                    <p className="text-xs text-muted-foreground truncate">Workspace: {parsed.workspace}</p>
                                    <p className="text-xs text-muted-foreground truncate">Lakehouse: {parsed.lakehouse}</p>
                                    <p className="text-xs text-muted-foreground truncate">Table: {parsed.table}</p>
                                  </>
                                );
                              } else if (parsed.type === "S3") {
                                return (
                                  <>
                                    <p className="text-xs text-muted-foreground truncate">Bucket: {parsed.bucket}</p>
                                    <p className="text-xs text-muted-foreground truncate">File: {parsed.file}</p>
                                  </>
                                );
                              }
                              return null;
                            })()}
                            {source.type === "Local File" && (
                              <p className="text-xs text-muted-foreground truncate">File: {source.fileName || "N/A"}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              "text-white text-xs",
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
                            className="h-8 w-8"
                            onClick={() => {
                              toast({
                                title: "Data Source Settings",
                                description: `Configure settings for ${source.name}`,
                              });
                            }}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveDataSource(source.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {dataSources.length === 0 && (
                    <div className="p-6 text-center text-muted-foreground border rounded-lg border-dashed">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No sources added yet</p>
                      <p className="text-xs">Enable "Upload File" to add sources</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              

<CardHeader>
              <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-100">

                <RefreshCw className="w-5 h-5  text-purple-600" />
                </div>
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

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            {/* <Button
              variant="outline"
              onClick={handleSkip}
              className="flex items-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </Button> */}
          </div>
        </div>
      </div>
    );
  }