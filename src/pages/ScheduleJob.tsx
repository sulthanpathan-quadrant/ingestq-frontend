import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Upload, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Utility functions for auth and base URL
const getAuthToken = () => {
  const token = localStorage.getItem("authToken") || "";
  console.log("Auth Token:", token);
  return token;
};

const getBaseUrl = () => {
  const defaultUrl = "https://ingestq-backend-954554516.ap-south-1.elb.amazonaws.com";
  const baseUrl = (typeof process !== 'undefined' && process.env.REACT_APP_API_BASE_URL) || defaultUrl;
  console.log("Base URL:", baseUrl);
  return baseUrl;
};

// Create Job Config Types
export interface JobStepConfig {
  rules: "executed" | "skipped" | "used";
  ner: "executed" | "skipped" | "used";
  businessLogic: "executed" | "skipped" | "used";
  datatransformations?: "executed" | "skipped" | "used";
}

export interface ScheduleDetails {
  frequency?: string;
  time?: string;
}

export interface CreateJobConfigRequest {
  jobName: string;
  triggerType: "SCHEDULE" | "File";
  steps: JobStepConfig;
  datasource: string;
  datadestination: string;
  scheduleDetails?: ScheduleDetails;
  business_logic_rules?: { [key: string]: string };
  job_type?: string;
  glue_name?: string;
  gname: string;
  payload?: { [key: string]: any };
  original_datasource_type?: string;
  original_datasource_path?: string;
  input_type: string;
  bucket_name?: string;
  key?: string;
  sheet_name?: string;
  db_host?: string;
  db_name?: string;
  db_user?: string;
  db_password?: string;
  db_port?: string;
  db_table?: string;
}

export interface JobConfigResponse {
  success: boolean;
  message: string;
  job: {
    jobId: string;
    user_id: string;
    email: string;
    jobName: string;
    triggerType: string;
    steps: JobStepConfig;
    datasource: string;
    datadestination: string;
    scheduleDetails: ScheduleDetails | {};
    business_logic_rules?: { [key: string]: string };
    createdAt: string;
    BucketName: string;
    FolderName: string;
    FileName: string;
    Status: string;
    LastRun: string;
    etag: string;
    job_type?: string;
    glue_name?: string;
    gname: string;
    sheet_name? : string;
    
  original_datasource_type?: string;
  original_datasource_path?: string;
  };
}

// Parse bucket and key from datasource
const parseS3Path = (s3Path: string) => {
  if (!s3Path || !s3Path.startsWith('s3://')) {
    return { bucket_name: '', key: '' };
  }
  
  const pathWithoutProtocol = s3Path.replace('s3://', '');
  const firstSlashIndex = pathWithoutProtocol.indexOf('/');
  
  if (firstSlashIndex === -1) {
    return { bucket_name: pathWithoutProtocol, key: '' };
  }
  
  return {
    bucket_name: pathWithoutProtocol.substring(0, firstSlashIndex),
    key: pathWithoutProtocol.substring(firstSlashIndex + 1)
  };
};

// Create Job Config API
export const createJobConfig = async (
  data: CreateJobConfigRequest
): Promise<JobConfigResponse> => {
  const token = getAuthToken();
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/create-job-config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to create job config: ${response.status} - ${errorText}`
    );
  }

  const result: JobConfigResponse = await response.json();
  console.log("✅ Create Job Config Response:", result);
  return result;
};

export default function ScheduleJob() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [scheduleType, setScheduleType] = useState<"time" | "file">("time");
  const [frequency, setFrequency] = useState("");
  const [time, setTime] = useState("");
  const [jobName, setJobName] = useState("");

  useEffect(() => {
    const storedJobName = localStorage.getItem("jobName") || "";
    setJobName(storedJobName);
  }, []);

  const handleScheduleJob = async () => {
    try {
      // Fetch values from localStorage
      const selectedBucket = localStorage.getItem("selectedBucket") || "";
      const selectedFile = localStorage.getItem("selectedFile") || "";
      const selectedDestBucket = localStorage.getItem("selectedDestBucket") || "processed";
      const selectedDestFolder = localStorage.getItem("selectedDestFolder") || "output";
      
      // Fetch ETL method and responses
      const etlMethod = localStorage.getItem("etl_method") || "Glue";
      const glueETLPayload = localStorage.getItem("glue_etl_payload");
      const adbJobResponse = localStorage.getItem("adb_job_response");
      const fabricJobResponse = localStorage.getItem("fabric_job_response");

      // Fetch step configurations from localStorage
      const rules = localStorage.getItem("rules") || "skipped";
      const ner = localStorage.getItem("ner") || "skipped";
      const datatransformations = localStorage.getItem("datatransformations") || "skipped";
      const businessLogic = localStorage.getItem("businessLogic") || "skipped";

      // Construct S3 paths dynamically
      const datasource = selectedBucket && selectedFile ? `s3://${selectedBucket}/${selectedFile}` : "";
      const datadestination = selectedDestBucket && selectedDestFolder ? `s3://${selectedDestBucket}/${selectedDestFolder}` : "";

      const original_datasource_type = localStorage.getItem("org_inp_type") || "";
      const original_datasource_path = localStorage.getItem("org_data_source") || "";
      const input_type = localStorage.getItem("input_type") || "";
      const sheet_name = localStorage.getItem("selectedSheet") || "";

      // Validate required fields
      if (!datasource || !datadestination || !jobName) {
        throw new Error("Missing required job name, S3 bucket, or file information from localStorage");
      }

      // Prepare payload based on ETL method
      let payload: any = undefined;
      
      if (etlMethod === "Glue" && glueETLPayload) {
        payload = JSON.parse(glueETLPayload);
      } else if (etlMethod === "ADB" && adbJobResponse) {
        const adbData = JSON.parse(adbJobResponse);
        const selectedFiles = JSON.parse(localStorage.getItem("selectedFiles") || "[]");
        
        const file_paths: { [key: string]: { output_path: string } } = {};
        selectedFiles.forEach((file: any) => {
          const inputPath = file.inputPath.replace("s3://", "s3a://");
          const outputPath = file.outputPath.replace("s3://", "s3a://");
          file_paths[inputPath] = { output_path: outputPath };
        });
        
        payload = {
          gname: jobName,
          file_paths: file_paths,
          script_s3_path: adbData.script_s3_path
        };
      } else if (etlMethod === "Fabric" && fabricJobResponse) {
        const fabricData = JSON.parse(fabricJobResponse);
        const selectedFiles = JSON.parse(localStorage.getItem("selectedFiles") || "[]");
        
        const file_paths: { [key: string]: { [key: string]: string } } = {};
        selectedFiles.forEach((file: any) => {
          const inputPath = file.inputPath.replace("s3://", "s3a://");
          const outputPath = file.outputPath.replace("s3://", "s3a://");
          file_paths[inputPath] = { output_path: outputPath };
        });
        
        payload = {
          gname: fabricData.gname,
          file_paths: file_paths,
          sjd_id: fabricData.sjd_id,
          script_path: fabricData.script_path
        };
      }

      // Extract bucket and key
      const { bucket_name, key } = parseS3Path(datasource);

      const data: CreateJobConfigRequest = {
        jobName,
        triggerType: scheduleType === "time" ? "SCHEDULE" : "File",
        steps: {
          rules: rules as "executed" | "skipped" | "used",
          ner: ner as "executed" | "skipped" | "used",
          businessLogic: businessLogic as "executed" | "skipped" | "used",
          datatransformations: datatransformations as "executed" | "skipped" | "used",
        },
        datasource,
        datadestination,
        scheduleDetails: scheduleType === "time" ? { frequency, time } : undefined,
        gname: jobName,
        job_type: etlMethod === "Glue" ? "" : etlMethod.toLowerCase(),
        glue_name: etlMethod === "Glue" ? jobName : undefined,
        payload: payload,
        input_type,
        sheet_name,
        // Always include bucket_name and key for S3 sources (required by backend)
        ...(bucket_name && key && {
          bucket_name,
          key,
        }),

        // Include original datasource info for delta, onelake, and blob
        ...((original_datasource_type === "delta-tables" || original_datasource_type === "onelake" || original_datasource_type === "azure-blob") && {
          original_datasource_type,
          original_datasource_path,
        })
      };

      const result = await createJobConfig(data);

      if (result.success) {
        toast({
          title: "Job Scheduled Successfully",
          description: result.message,
        });

        // Clear localStorage and navigate
        localStorage.removeItem("rules");
        localStorage.removeItem("ner");
        localStorage.removeItem("datatransformations");
        localStorage.removeItem("businessLogic");
        localStorage.removeItem("selectedBucket");
        localStorage.removeItem("selectedFile");
        localStorage.removeItem("selectedDestBucket");
        localStorage.removeItem("selectedDestFolder");
        localStorage.removeItem("jobName");
        localStorage.removeItem("etl_method");
        localStorage.removeItem("adb_job_response");
        localStorage.removeItem("fabric_job_response");
        localStorage.removeItem("glue_etl_payload");
        localStorage.removeItem("etlJobResponse");
        localStorage.removeItem("selectedFiles");
    
        navigate("/dashboard/jobs");
      } else {
        toast({
          title: "Error Scheduling Job",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error Scheduling Job",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    navigate("/dashboard/etl");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mt-14 mx-auto p-6">
        <div className="flex items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Schedule Job</h1>
            <p className="text-muted-foreground">
              Configure when and how your job should run
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardDescription>
                Choose how you want to trigger your job execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Job Name Input */}
              <div className="space-y-2">
                <Label htmlFor="jobName">Job Name</Label>
                <Input
                  id="jobName"
                  type="text"
                  value={jobName}
                  readOnly
                  placeholder="Job name set in ETL page"
                  className="bg-muted"
                />
              </div>

              {/* Trigger Type Selection */}
              <RadioGroup
                value={scheduleType}
                onValueChange={(value: "time" | "file") => setScheduleType(value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="time" id="time-based" />
                  <Label
                    htmlFor="time-based"
                    className="flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Time-based Schedule
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="file" id="file-based" />
                  <Label
                    htmlFor="file-based"
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    File Upload Trigger
                  </Label>
                </div>
              </RadioGroup>

              {/* Time-based Config */}
              {scheduleType === "time" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger>
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
                </div>
              )}

              {/* File-based Config */}
              {scheduleType === "file" && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    The job will be triggered when a newer version of the
                    selected source file is received.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <Button onClick={handleBack} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleScheduleJob}
                  className="flex-1"
                  disabled={
                    scheduleType === "time" ? !frequency || !time || !jobName : !jobName
                  }
                >
                  Schedule Job
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button variant="outline" onClick={handleBack} className="mt-6 mr-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    </div>
  );
}