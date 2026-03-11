import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Badge variant="secondary">Coming soon</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-muted-foreground">
            <Settings className="h-4 w-4" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Personal settings, API keys, and notification preferences will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
