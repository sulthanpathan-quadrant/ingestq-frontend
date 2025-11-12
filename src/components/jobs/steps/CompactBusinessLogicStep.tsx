import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Settings, Database } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface BusinessRule {
  id: string;
  name: string;
  logic: string;
  description: string;
  isFromApi?: boolean;
}

interface CompactBusinessLogicStepProps {
  config?: Record<string, any>;
  onConfigChange?: (config: Record<string, any>) => void;
  jobId?: string;
}

export default function CompactBusinessLogicStep({
  config = {},
  onConfigChange,
  jobId,
}: CompactBusinessLogicStepProps) {
  const { toast } = useToast();
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState<Partial<BusinessRule>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedFromApi, setHasFetchedFromApi] = useState(false);

  // Memoize onConfigChange to ensure stability
  const stableOnConfigChange = useMemo(() => onConfigChange || (() => {}), [onConfigChange]);

  // Memoize config.business_logic_rules to prevent unnecessary re-runs
  const memoizedConfigRules = useMemo(
    () => config.business_logic_rules || {},
    [config.business_logic_rules]
  );

  // Initialize from config
  useEffect(() => {
    if (memoizedConfigRules && Object.keys(memoizedConfigRules).length > 0 && !hasFetchedFromApi) {
      console.log('📦 Initializing from config:', memoizedConfigRules);
      const configRules = Object.entries(memoizedConfigRules).map(([key, value]) => ({
        id: key,
        name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        logic: value as string,
        description: 'Existing rule from configuration',
        isFromApi: true,
      }));
      setRules(configRules);
    }
  }, [memoizedConfigRules, hasFetchedFromApi]);

  // Fetch business rules from API
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchBusinessRules = async () => {
      if (!jobId || hasFetchedFromApi) {
        console.log('🚫 Skipping API fetch:', { jobId, hasFetchedFromApi });
        return;
      }

      // Validate jobId format (UUID)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId)) {
        console.log('🚫 Invalid jobId, skipping fetch:', jobId);
        if (isMounted) {
          setRules([]);
          setHasFetchedFromApi(true);
          setIsLoading(false);
        }
        return;
      }

      console.log('🌐 Fetching business rules for jobId:', jobId);
      if (isMounted) setIsLoading(true);
      try {
        const response = await fetch(
          `https://ingestq-backend-954554516.ap-south-1.elb.amazonaws.com/get_job_details?job_id=${jobId}`,
          {
            signal: abortController.signal,
            headers: {
              // Add authentication header if available
              Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
            },
          }
        );
        if (!isMounted) {
          console.log('🚫 Component unmounted, aborting fetch handling');
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP error! status: ${response.status}, detail: ${errorData.detail || 'Unknown'}`);
        }
        const data = await response.json();

        console.log('🌐 API response:', data);

        if (data.success && data.job) {
          const businessLogicRules = data.job.business_logic_rules || {};
          const apiRules = Object.entries(businessLogicRules).map(([key, value]) => ({
            id: key,
            name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            logic: value as string,
            description: '',
            isFromApi: true,
          }));

          console.log('🌐 Fetched rules:', apiRules);
          if (isMounted) {
            setRules(apiRules);
            setHasFetchedFromApi(true);

            // Only update parent if rules have changed
            const currentRules = memoizedConfigRules;
            const rulesChanged = Object.keys(businessLogicRules).some(
              (key) => businessLogicRules[key] !== currentRules[key]
            );

            if (rulesChanged && stableOnConfigChange) {
              console.log('🔄 Updating parent with new rules:', businessLogicRules);
              stableOnConfigChange({
                rules: apiRules,
                business_logic_rules: businessLogicRules,
              });
            } else {
              console.log('✅ Rules unchanged, skipping parent update');
            }
          }
        } else {
          console.log('⚠️ API returned success: false or no job data, treating as no rules');
          if (isMounted) {
            setRules([]);
            setHasFetchedFromApi(true);
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log('🚫 Fetch aborted due to component unmount');
          return;
        }
        console.error('Error fetching business rules:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
        if (isMounted) {
          // Handle authentication error specifically
          if (error instanceof Error && error.message.includes('status: 401')) {
            toast({
              variant: "destructive",
              title: "Authentication Error",
              description: "You are not authenticated. Please log in again.",
            });
          } else if (
            error instanceof TypeError || // Network errors
            (error instanceof Error && error.message.includes('HTTP error') && !error.message.includes('404'))
          ) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to fetch business rules due to a network or server issue. Please try again.",
            });
          }
          setRules([]);
          setHasFetchedFromApi(true);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBusinessRules();

    // Cleanup to prevent updates after unmount
    return () => {
      isMounted = false;
      abortController.abort();
      console.log('🔍 CompactBusinessLogicStep unmounted');
    };
  }, [jobId, hasFetchedFromApi, stableOnConfigChange]);

  // Update parent when rules change (user adds/removes rules)
  useEffect(() => {
    if (stableOnConfigChange && rules.length > 0) {
      const business_logic_rules: Record<string, string> = {};
      rules.forEach((rule) => {
        business_logic_rules[rule.id] = rule.logic;
      });

      const rulesChanged = Object.keys(business_logic_rules).some(
        (key) => business_logic_rules[key] !== memoizedConfigRules[key]
      );

      if (rulesChanged) {
        console.log('💾 Updating parent with rules:', business_logic_rules);
        stableOnConfigChange({
          rules,
          business_logic_rules,
        });
      } else {
        console.log('✅ Local rules unchanged, skipping parent update');
      }
    }
  }, [rules, stableOnConfigChange, memoizedConfigRules]);

  const addRule = () => {
    if (newRule.name && newRule.logic) {
      const ruleKey = newRule.name.toLowerCase().replace(/\s+/g, '_');
      const rule: BusinessRule = {
        id: ruleKey,
        name: newRule.name!,
        logic: newRule.logic!,
        description: newRule.description || 'User-defined rule',
        isFromApi: false,
      };

      console.log('➕ Adding new rule:', rule);
      setRules((prevRules) => [...prevRules, rule]);
      setNewRule({});
      setIsAddDialogOpen(false);
      toast({
        title: "Rule Added",
        description: `Rule "${rule.name}" added successfully.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please provide both a rule name and logic.",
      });
    }
  };

  const removeRule = (id: string) => {
    console.log('🗑️ Removing rule:', id);
    setRules((prevRules) => prevRules.filter((rule) => rule.id !== id));
    toast({
      title: "Rule Removed",
      description: `Rule "${id}" removed successfully.`,
    });
  };

  console.log('🔍 CompactBusinessLogicStep rendered');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Business Logic Rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              {isLoading ? "Loading rules..." : `Active Rules (${rules.length})`}
            </h4>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Business Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ruleName">Rule Name</Label>
                    <Input
                      id="ruleName"
                      placeholder="Enter rule name (e.g., rule3, validation_rule)"
                      value={newRule.name || ''}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ruleDescription">Description</Label>
                    <Textarea
                      id="ruleDescription"
                      placeholder="Describe what this rule does"
                      value={newRule.description || ''}
                      onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ruleLogic">Business Logic</Label>
                    <Textarea
                      id="ruleLogic"
                      placeholder="Enter the business logic (e.g., validate_column_not_null, check_date_format)"
                      value={newRule.logic || ''}
                      onChange={(e) => setNewRule({ ...newRule, logic: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <Button onClick={addRule} className="w-full">Add Rule</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {rules.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {rules.map((rule) => (
                <div key={rule.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{rule.name}</span>
                        
                      </div>
                      <div className="bg-muted p-2 rounded text-xs font-mono">
                        {rule.logic}
                      </div>
                      {rule.description && (
                        <p className="text-xs text-muted-foreground">{rule.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRule(rule.id)}
                      className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                      title={rule.isFromApi ? "Remove rule" : "Remove rule"}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
              {isLoading
                ? "Loading business rules..."
                : "No business rules defined. Click 'Add Rule' to create one."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}