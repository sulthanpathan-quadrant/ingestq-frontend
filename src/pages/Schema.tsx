import { useState, useEffect } from "react";
import { Database, ArrowRight, Plus, Minus, AlertTriangle, CheckCircle, Eye, Network, ArrowLeft, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { runSchemaAnalysis, previewData, SchemaAnalysisRequest, viewRelationship, SchemaAnalysisResponse, PreviewDataResponse, RelationshipResponse } from '@/lib/api';
import { toast } from "@/components/ui/use-toast";

interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  status: 'new' | 'existing' | 'modified' | 'deleted';
  samples?: string[];
}

export default function Schema() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const [selectedFile] = useState(() => {
    const file = localStorage.getItem("selectedFile");
    if (!file) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No file selected. Please upload a file.",
      });
      navigate('/dashboard/upload');
      return '';
    }
    return file || 'Book1.csv';
  });

  const getStatusColor = (status: string) => {
  switch (status) {
    case 'new': return 'bg-success text-success-foreground';
    case 'deleted': return 'bg-destructive text-destructive-foreground';
    case 'modified': return 'bg-warning text-warning-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'new': return <Plus className="w-3 h-3" />;
    case 'deleted': return <Minus className="w-3 h-3" />;
    case 'modified': return <AlertTriangle className="w-3 h-3" />;
    default: return <CheckCircle className="w-3 h-3" />;
  }
};


  const fileExtension = selectedFile.split('.').pop()?.toLowerCase();
  const isCsv = fileExtension === 'csv';
  const isExcel = fileExtension === 'xlsx' || fileExtension === 'xls';
  const isParquet = fileExtension === 'parquet';
  const isDatabase = false; // removed mock DB flag since we now rely on input_type

  const [showPreview, setShowPreview] = useState(false);
  const [showRelationships, setShowRelationships] = useState(false);
  const [hoveredRelationship, setHoveredRelationship] = useState<string | null>(null);

  const [schemaDataState, setSchemaDataState] = useState<Record<string, { currentSchema: SchemaColumn[], previousSchema: SchemaColumn[] }>>({});

  // ✅ Updated Strict Types for Preview Data
  const [previewDataState, setPreviewDataState] = useState<Record<string, { columns: string[]; rows: any[] }>>({});
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPageSize, setPreviewPageSize] = useState(10);

  // ✅ Updated Strict Types for Relationship Data
  const [relationshipDataState, setRelationshipDataState] = useState<
    Record<string, {
      tables: {
        name: string;
        columns: { name: string; isKey: boolean }[];
        position: { x: number; y: number };
      }[];
      connections: {
        id: string;
        from: { table: string; column: string };
        to: { table: string; column: string };
        type: string;
        description: string;
      }[];
    }>
  >({});
  const [relationshipPage, setRelationshipPage] = useState(1);
  const [relationshipPageSize, setRelationshipPageSize] = useState(10);

  const currentSelection = selectedFile;

  const currentSchema = schemaDataState[currentSelection]?.currentSchema || [];
  const previousSchema = schemaDataState[currentSelection]?.previousSchema || [];
  const relationshipTables = relationshipDataState[currentSelection]?.tables || [];
  const relationshipConnections = relationshipDataState[currentSelection]?.connections || [];

  const org_data_source = localStorage.getItem("org_data_source");
  

  const buildPayload = () => {
    const inputType = localStorage.getItem("input_type");
    if (!inputType) return null;

    if (inputType === "snowflake") {
      return {
        input_type: inputType,
        database: localStorage.getItem("db_name"),
        table_name: localStorage.getItem("db_table"),
      };
    }

    if (inputType === "database") {
      return {
        input_type: inputType,
        db_type: localStorage.getItem("db_type"),
        db_host: localStorage.getItem("db_host"),
        db_port: localStorage.getItem("db_port"),
        db_name: localStorage.getItem("db_name"),
        db_user: localStorage.getItem("db_user"),
        db_password: localStorage.getItem("db_password"),
        db_table: localStorage.getItem("db_table"),
      };
    }

    const bucket = localStorage.getItem("selectedBucket");
    const fileKey = localStorage.getItem("selectedFile");
    const sheetName = localStorage.getItem("selectedSheet");

    const payload: any = {
      input_type: inputType,
      bucket_name: bucket,
      key: fileKey,
    };

    if (inputType === "xlsx" && sheetName) {
      payload.sheet_name = sheetName;
    }

    return payload;
  };

  const handlePreviewClick = () => {
    const payload = buildPayload();
    if (!payload) return;

    previewData(payload).then((res: PreviewDataResponse) => {
      if (res.success && res.data) {
        setPreviewDataState(prev => ({
          ...prev,
          [currentSelection]: {
            columns: res.data.columns ?? [],
            rows: res.data.rows ?? [],
          },
        }));
        setPreviewPage(1); // ✅ Reset to first page on load
        setShowPreview(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch preview data. Please try again.",
        });
      }
    }).catch(err => {
      console.error('Error fetching preview data:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while fetching preview data.",
      });
    });
  };

  const handleViewRelationshipsClick = () => {
    const payload = buildPayload();
    if (!payload) return;

    viewRelationship(payload).then((res: RelationshipResponse) => {
      if (res.success && res.relationships) {
        const rels = Array.isArray(res.relationships) ? res.relationships : [res.relationships];

        const uniqueTables = new Set<string>();
        rels.forEach(r => {
          uniqueTables.add(r.file1);
          uniqueTables.add(r.file2);
        });

        const tables = Array.from(uniqueTables).map((name, idx) => ({
          name,
          columns: rels
            .filter(r => r.file1 === name || r.file2 === name)
            .map(r => ({ name: r.column, isKey: r.file1 === name })),
          position: { x: idx * 400 + 100, y: 100 },
        }));

        const connections = rels.map((r, idx) => ({
          id: `rel${idx + 1}`,
          from: { table: r.file1, column: r.column },
          to: { table: r.file2, column: r.column },
          type: "1:M",
          description: `One ${r.file1} to many ${r.file2} via ${r.column}`,
        }));

        setRelationshipDataState(prev => ({
          ...prev,
          [currentSelection]: { tables, connections },
        }));

        setRelationshipPage(1); // ✅ Reset to first page
        setShowRelationships(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch relationships. Please try again.",
        });
      }
    }).catch(err => {
      console.error('Error fetching relationships:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while fetching relationships.",
      });
    });
  };
  const handleBackToUpload = () => {
    navigate('/dashboard/upload');
  };

  useEffect(() => {
    setIsLoading(true);

    const bucket = localStorage.getItem("selectedBucket");
    const fileKey = localStorage.getItem("selectedFile");
    const sheetName = localStorage.getItem("selectedSheet");
    const inputType = localStorage.getItem("input_type") as "csv" | "xlsx" | "parquet" | "snowflake" | "database" | null;
    const dbName = localStorage.getItem("db_name");
    const dbTable = localStorage.getItem("db_table");

    if (!inputType) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "File type information is missing. Please upload the file again.",
      });
      navigate('/dashboard/upload');
      return;
    }

    if (inputType === "snowflake" || inputType === "database") {
      if (!dbName || !dbTable) {
        toast({
          variant: "destructive",
          title: "Configuration Error",
          description: "Missing database or table name. Please select again.",
        });
        navigate('/dashboard/upload');
        return;
      }
    } else {
      if (!bucket || !fileKey) {
        toast({
          variant: "destructive",
          title: "Configuration Error",
          description: "Missing required file information. Please select a file again.",
        });
        navigate('/dashboard/upload');
        return;
      }
    }

    const [cleanFileKey, embeddedSheet] = fileKey?.split('#') || [];
    const finalSheetName = sheetName || embeddedSheet || undefined;

    let payload: SchemaAnalysisRequest;

    if (inputType === "snowflake") {
      payload = {
        input_type: inputType,
        database: dbName!,
        table_name: dbTable!,
      };
    } else if (inputType === "database") {
      payload = {
        input_type: inputType,
        db_host: localStorage.getItem("db_host")!,
        db_port: localStorage.getItem("db_port")!,
        db_name: dbName!,
        db_user: localStorage.getItem("db_user")!,
        db_password: localStorage.getItem("db_password")!,
        db_table: dbTable!,
      };
    } else {
      payload = {
        input_type: inputType,
        bucket_name: bucket!,
        key: cleanFileKey,
        ...(inputType === "xlsx" && finalSheetName ? { sheet_name: finalSheetName } : {}),
      };
    }

    runSchemaAnalysis(payload)
      .then((res: SchemaAnalysisResponse) => {
        if (!res.success || !res.lambda_response?.results) {
          toast({
            variant: "destructive",
            title: "Error",
            description: res.lambda_response?.message || "Failed to fetch schema analysis. Please try again.",
          });
          return;
        }

        const results = res.lambda_response.results;
        const sheet = Object.keys(results)[0];
        const resSheet = results[sheet];

        const newCols = resSheet.Changes.NewColumn_names || [];
        const missingCols = resSheet.Changes.MissingColumn_names || [];
        const currentMap = resSheet.CurrentSchema || {};
        const prevMap = resSheet.PreviousSchema || {};
        const samples = resSheet.Samples || {};
        const nullable = resSheet.Nullable || {};

        const currentSchemaArr: SchemaColumn[] = Object.entries(currentMap).map(([name, type]: any) => ({
          name,
          type,
          nullable: nullable[name] ?? false,
          status: newCols.includes(name) ? 'new' :
            (prevMap[name] && prevMap[name] !== type ? 'modified' : 'existing'),
          samples: samples[name] ?? [],
        }));

        const previousSchemaArr: SchemaColumn[] = Object.entries(prevMap).map(([name, type]: any) => ({
          name,
          type,
          nullable: missingCols.includes(name) ? false : (nullable[name] ?? false),
          status: missingCols.includes(name) ? 'deleted' :
            (currentMap[name] && currentMap[name] !== type ? 'modified' : 'existing'),
        }));

        setSchemaDataState(prev => ({
          ...prev,
          [currentSelection]: {
            currentSchema: currentSchemaArr,
            previousSchema: previousSchemaArr,
          },
        }));

        toast({
          title: "Schema Analysis Complete",
          description: `Analyzed ${currentSchemaArr.length} columns successfully`,
        });

        setIsLoading(false);
      })
      .catch(err => {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load schema data.",
        });
      });
  }, [currentSelection, navigate]);


  return (
    <div className="max-w-7xl mt-14 mx-auto p-6 space-y-6">
      {isLoading && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-30 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Loading Schema Analysis...</h3>
                  <p className="text-sm text-muted-foreground">Please wait while we process your data...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schema Analysis</h1>
          <p className="text-muted-foreground">
            Compare and analyze schema differences for data quality validation
          </p>
        </div>
        <Button variant="outline" onClick={handleBackToUpload}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Upload
        </Button>
      </div>

      {/* === KPI CARDS === */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                <Plus className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{currentSchema.filter(col => col.status === 'new').length}</p>
                <p className="text-xs text-muted-foreground">New Columns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center">
                <Minus className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{previousSchema.filter(col => col.status === 'deleted').length}</p>
                <p className="text-xs text-muted-foreground">Deleted Columns</p>
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
                <p className="text-2xl font-bold text-warning">{currentSchema.filter(col => col.status === 'modified').length}</p>
                <p className="text-xs text-muted-foreground">Modified Columns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Database className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{currentSchema.length}</p>
                <p className="text-xs text-muted-foreground">Total Columns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

<Tabs defaultValue="current" className="w-full">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="current">Current Schema</TabsTrigger>
    <TabsTrigger value="previous">Previous Schema</TabsTrigger>
    <TabsTrigger value="changes">Changes Summary</TabsTrigger>
  </TabsList>
  
  {/* Current Schema Tab */}
  <TabsContent value="current" className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>Current Schema Structure</CardTitle>
        <CardDescription>
          Schema detected from the selected {isCsv ? 'CSV file' : isExcel ? 'Excel sheet' : isParquet ? 'Parquet file' : 'source'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column Name</TableHead>
              <TableHead>Data Type</TableHead>
              <TableHead>Nullable</TableHead>
              <TableHead>Status</TableHead>
              {/* <TableHead>Sample Values</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentSchema.map((column, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{column.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{column.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={column.nullable ? "destructive" : "default"}>
                    {column.nullable ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(column.status)}>
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(column.status)}
                      <span className="capitalize">{column.status}</span>
                    </span>
                  </Badge>
                </TableCell>
                {/* <TableCell>
                  {column.samples && (
                    <div className="flex flex-wrap gap-1">
                      {column.samples.slice(0, 3).map((sample, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {sample}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </TabsContent>
  
  {/* Previous Schema Tab */}
  <TabsContent value="previous" className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>Previous Schema Structure</CardTitle>
        <CardDescription>Last known schema structure for comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column Name</TableHead>
              <TableHead>Data Type</TableHead>
              <TableHead>Nullable</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previousSchema.map((column, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{column.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{column.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={column.nullable ? "destructive" : "default"}>
                    {column.nullable ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(column.status)}>
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(column.status)}
                      <span className="capitalize">{column.status}</span>
                    </span>
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </TabsContent>
  
  {/* Changes Summary Tab */}
  <TabsContent value="changes" className="space-y-4">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {currentSchema.filter(col => col.status === 'new').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-success" />
              <span>New Columns ({currentSchema.filter(col => col.status === 'new').length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentSchema.filter(col => col.status === 'new').map((column, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-success/5 rounded-lg border border-success/20">
                  <div>
                    <p className="font-medium">{column.name}</p>
                    <p className="text-xs text-muted-foreground">{column.type}</p>
                  </div>
                  <Badge className="bg-success text-success-foreground">New</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {previousSchema.filter(col => col.status === 'deleted').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Minus className="w-5 h-5 text-destructive" />
              <span>Deleted Columns ({previousSchema.filter(col => col.status === 'deleted').length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {previousSchema.filter(col => col.status === 'deleted').map((column, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-destructive/5 rounded-lg border border-destructive/20">
                  <div>
                    <p className="font-medium">{column.name}</p>
                    <p className="text-xs text-muted-foreground">{column.type}</p>
                  </div>
                  <Badge className="bg-destructive text-destructive-foreground">Deleted</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {currentSchema.filter(col => col.status === 'modified').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span>Modified Columns ({currentSchema.filter(col => col.status === 'modified').length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentSchema.filter(col => col.status === 'modified').map((column, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-warning/5 rounded-lg border border-warning/20">
                  <div>
                    <p className="font-medium">{column.name}</p>
                    <p className="text-xs text-muted-foreground">{column.type}</p>
                  </div>
                  <Badge className="bg-warning text-warning-foreground">Modified</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  </TabsContent>
</Tabs>
      

      {/* === PREVIEW DATA & RELATIONSHIPS ACTIONS === */}
      <div className="flex justify-between items-center">
        <div></div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handlePreviewClick}>
            <Eye className="w-4 h-4 mr-2" />
            Preview Data
          </Button>

          <Button variant="outline" onClick={handleViewRelationshipsClick}>
            <Network className="w-4 h-4 mr-2" />
            View Relationships
          </Button>

          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate('/dashboard/rules')}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Configure DQ Rules
          </Button>
        </div>
      </div>


      {/* ===========================
          ✅ PREVIEW DATA DIALOG
      ============================ */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Data Preview - {org_data_source}</DialogTitle>
            <DialogDescription>
              
            </DialogDescription>
          </DialogHeader>

          {/* Table */}
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  {previewDataState[currentSelection]?.columns?.map((col: string) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {previewDataState[currentSelection] &&
                  previewDataState[currentSelection].rows
                    .slice((previewPage - 1) * previewPageSize, previewPage * previewPageSize)
                    .map((row, index) => (
                      <TableRow key={index}>
                        {previewDataState[currentSelection].columns.map((col: string) => (
                          <TableCell key={col}>{row[col] ?? ''}</TableCell>
                        ))}
                      </TableRow>
                    ))}

                {!previewDataState[currentSelection] && (
                  <TableRow>
                    <TableCell colSpan={currentSchema.length}>No data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {/* {previewDataState[currentSelection] && previewDataState[currentSelection].rows.length > 0 && (
              <div className="flex justify-between items-center mt-2">
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select 
                    value={previewPageSize.toString()} 
                    onValueChange={(value) => {
                      setPreviewPageSize(Number(value));
                      setPreviewPage(1); // Reset to first page
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map(size => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-1">
                  {(() => {
                    const totalRows = previewDataState[currentSelection]?.rows.length || 0;
                    const totalPages = Math.ceil(totalRows / previewPageSize);
                    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

                    return (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={previewPage === 1}
                          onClick={() => setPreviewPage(prev => prev - 1)}
                        >
                          &lt;
                        </Button>

                        {pageNumbers.map((pageNum) => (
                          <Button
                            key={pageNum}
                            variant={pageNum === previewPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPreviewPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        ))}

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={previewPage === totalPages}
                          onClick={() => setPreviewPage(prev => prev + 1)}
                        >
                          &gt;
                        </Button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )} */}

            <div className="text-center">
              <Button onClick={() => setShowPreview(false)}>
                Close Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* ================================
          ✅ RELATIONSHIPS DIALOG
      ================================= */}
      <Dialog open={showRelationships} onOpenChange={setShowRelationships}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Relationships</DialogTitle>
            <DialogDescription>
              Showing detected relationships between tables
            </DialogDescription>
          </DialogHeader>


          {/* Relationship Graph */}
          <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-12 min-h-[300px] border border-slate-200 overflow-auto">
            {relationshipTables.map((table, index) => (
              <div
                key={table.name}
                className="absolute"
                style={{ left: table.position.x, top: table.position.y }}
              >
                <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6 w-48">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">{table.name}</h3>
                    <Database className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    {table.columns.map((col, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium text-slate-700">{col.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {col.isKey ? 'PK' : 'FK'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Connections SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              {relationshipConnections.map((conn, index) => {
                const fromTable = relationshipTables.find(t => t.name === conn.from.table);
                const toTable = relationshipTables.find(t => t.name === conn.to.table);
                if (!fromTable || !toTable) return null;

                return (
                  <g key={conn.id}>
                    <line
                      x1={fromTable.position.x + 200}
                      y1={fromTable.position.y + 50}
                      x2={toTable.position.x}
                      y2={toTable.position.y + 50}
                      stroke="#3b82f6"
                      strokeWidth="3"
                      onMouseEnter={() => setHoveredRelationship(conn.id)}
                      onMouseLeave={() => setHoveredRelationship(null)}
                    />
                    <circle cx={fromTable.position.x + 200} cy={fromTable.position.y + 50} r="5" fill="#3b82f6" />
                    <circle cx={toTable.position.x} cy={toTable.position.y + 50} r="5" fill="#3b82f6" />

                    {hoveredRelationship === conn.id && (
                      <g>
                        <rect
                          x={(fromTable.position.x + toTable.position.x + 200) / 2 - 25}
                          y={(fromTable.position.y + toTable.position.y + 100) / 2 - 15}
                          width="50"
                          height="30"
                          rx="6"
                          fill="#1f2937"
                        />
                        <text
                          x={(fromTable.position.x + toTable.position.x + 200) / 2}
                          y={(fromTable.position.y + toTable.position.y + 100) / 2}
                          textAnchor="middle"
                          className="text-sm font-medium fill-white"
                          dy="0.3em"
                        >
                          {conn.type}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>


          {/* Relationship Cards Pagination */}
          {relationshipConnections.length > 0 && (
            <>
              <div className="mt-6 space-y-4">
                {relationshipConnections
                  .slice((relationshipPage - 1) * relationshipPageSize, relationshipPage * relationshipPageSize)
                  .map((conn) => (
                    <div key={conn.id} className="flex justify-center">
                      <Card className="w-96">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                            <span>{conn.from.table} - {conn.to.table}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Relationship Type</span>
                              <Badge variant="outline">{conn.type}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Linking Column</span>
                              <Badge variant="secondary">{conn.from.column}</Badge>
                            </div>
                            <p className="text-sm text-slate-600 mt-2">{conn.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-4">
                
                {/* Page Size Dropdown */}
                {/* <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Items per page:</span>
                  <Select 
                    value={relationshipPageSize.toString()} 
                    onValueChange={(value) => {
                      setRelationshipPageSize(Number(value));
                      setRelationshipPage(1); // Reset to page 1
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 20].map(size => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div> */}

                {/* Page Navigation */}
                <div className="flex items-center space-x-1">
                  {(() => {
                    const total = relationshipConnections.length || 0;
                    const totalPages = Math.ceil(total / relationshipPageSize);
                    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

                    return (
                      <>
                        {/* <Button
                          variant="outline"
                          size="sm"
                          disabled={relationshipPage === 1}
                          onClick={() => setRelationshipPage(prev => prev - 1)}
                        >
                          &lt;
                        </Button> */}

                        {/* {pageNumbers.map((pageNum) => (
                          <Button
                            key={pageNum}
                            variant={pageNum === relationshipPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setRelationshipPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        ))} */}

                        {/* <Button
                          variant="outline"
                          size="sm"
                          disabled={relationshipPage === totalPages}
                          onClick={() => setRelationshipPage(prev => prev + 1)}
                        >
                          &gt;
                        </Button> */}
                      </>
                    );
                  })()}
                </div>
              </div>
            </>
          )}

          <div className="text-center mt-6">
            <Button onClick={() => setShowRelationships(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
