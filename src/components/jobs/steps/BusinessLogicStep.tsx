import { useState, useEffect } from "react"; // Added useEffect for controlled mode
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Job {
  
  id: string;
  name: string;
}

interface BusinessLogicStepProps {
  job: Job | null;
  rules?: BusinessRule[]; // Added: Controlled rules prop
  onRulesChange?: (rules: BusinessRule[]) => void; // Added: Callback to emit changes
}

interface BusinessRule {
  id: string;
  name: string;
  logic: string;
  description: string;
}

export default function BusinessLogicStep({ job, rules: externalRules, onRulesChange }: BusinessLogicStepProps) {
  // Use external rules if provided (controlled mode), otherwise local state (uncontrolled)
  const [rules, setRules] = useState<BusinessRule[]>(externalRules || []);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState<Partial<BusinessRule>>({});

  // Sync with external rules when they change
  useEffect(() => {
    if (externalRules !== undefined) {
      setRules(externalRules);
    }
  }, [externalRules]);

  const addRule = () => {
    if (newRule.name && newRule.logic) {
      const rule: BusinessRule = {
        id: Math.random().toString(36).substr(2, 9),
        name: newRule.name!,
        logic: newRule.logic!,
        description: newRule.description || ''
      };
      const updatedRules = [...rules, rule];
      setRules(updatedRules);
      if (onRulesChange) {
        onRulesChange(updatedRules); // Emit change to parent
      }
      setNewRule({});
      setIsAddDialogOpen(false);
    }
  };

  const removeRule = (id: string) => {
    const updatedRules = rules.filter(rule => rule.id !== id);
    setRules(updatedRules);
    if (onRulesChange) {
      onRulesChange(updatedRules); // Emit change to parent
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Business Logic Rules
          </CardTitle>
          <CardDescription>
            Define business rules for your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Rules */}
          <div className="space-y-4">
            <h4 className="font-medium">Active Rules ({rules.length})</h4>
            {rules.map((rule, index) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.name}</span>
                      <Badge variant="outline">Rule {index + 1}</Badge>
                    </div>
                    <div className="bg-muted p-3 rounded text-sm font-mono">
                      {rule.logic}
                    </div>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(rule.id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Rule Button */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Business Rule
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
                    placeholder="Enter rule name"
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
                    placeholder="Enter the business logic (e.g., IF condition THEN action)"
                    value={newRule.logic || ''}
                    onChange={(e) => setNewRule({ ...newRule, logic: e.target.value })}
                    rows={4}
                  />
                </div>
                <Button onClick={addRule}>Add Rule</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}