import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History } from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

export const updates = [
  {
    version: "3.15.0",
    date: "2025-12-12",
    type: "minor",
    changes: [
      "Geometry-based magnetic decay calculations - decay constants now derived from backplate thickness",
      "New formulas: K_gauss = 0.1485/bp^0.95, K_ff = 0.3438/bp",
      "Surface Gauss and Force Factor can now be calculated from magnet geometry and grade",
      "Added parseModelName utility to extract core and backplate from model strings",
      "All gap-adjusted calculations now use backplate-aware decay constants"
    ]
  },
  {
    version: "3.13.0",
    date: "2025-12-11",
    type: "minor",
    changes: [
      "Fixed Gauss and Force Factor display - now shows values calculated at operating gap, not surface values",
      "Aligned calculations with legacy MagWiz application behavior",
      "Values now correctly decay based on specified air gap distance"
    ]
  },
  {
    version: "3.12.0",
    date: "2025-12-11",
    type: "minor",
    changes: [
      "Fixed toggle save functionality - now works without requiring OCW_magwiz data",
      "Improved delete logic for saved configurations",
      "Enhanced error handling for configuration save/remove operations",
    ]
  },
  {
    version: "3.11.0",
    date: "2025-12-10",
    type: "minor",
    changes: [
      "Redesigned OCW Selector with side-by-side layout (inputs left, results right)",
      "Added toggle checkbox to save configurations for Model Comparison",
      "Model Comparison now displays saved/toggled models as a list with confidence indicators",
      "Removed dropdown model selector from Model Comparison page",
      "Removed Gauss table from Model Comparison (available via separate Gauss button)",
      "Parameters now passed from OCW Selector to Model Comparison instead of sliders",
      "Added 'Back to OCW Selector' button on OCW Specs and Gauss Table pages",
      "Added Bunting logo to OCW Specifications PDF header",
      "Renamed 'Shape' section to 'Tramp Metal' in OCW Selector",
      "Changed 'View' button to 'Specs' and 'Decay Chart' to 'Gauss'",
    ]
  },
  {
    version: "3.10.0",
    date: "2025-12-05",
    type: "minor",
    changes: [
      "Revised tramp metal evaluation method using physics-based calculations",
      "Added W × L × H dimension inputs for tramp geometry",
      "Implemented confidence percentage indicator for pickup likelihood",
      "Added detailed breakdown of orientation, burden, and safety factors",
      "Integrated tramp pickup check into OCW Selector page",
    ]
  },
  {
    version: "3.9.1",
    date: "2025-11-20",
    type: "patch",
    changes: [
      "Removed checkboxes from OCW Selector recommendations list",
      "Updated navigation version display",
      "Added Updates page for tracking revisions",
    ]
  },
  {
    version: "3.9.0",
    date: "2025-11-15",
    type: "minor",
    changes: [
      "Enhanced OCW Model Comparison page",
      "Added detailed specifications popup",
      "Improved performance analysis charts",
    ]
  },
];

// Reusable component for displaying updates content (used in dialog)
export function UpdatesContent() {
  return (
    <ScrollArea className="max-h-[60vh]">
      <div className="space-y-4 pr-4">
        {updates.map((update) => (
          <Card key={update.version}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    Version {update.version}
                    <Badge variant={update.type === "minor" ? "default" : "secondary"} className="text-xs">
                      {update.type}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">{update.date}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1 text-sm">
                {update.changes.map((change, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

export default function Updates() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="w-8 h-8" />
            MagWiz 3 Updates
          </h1>
          <p className="text-muted-foreground mt-1">Version history and release notes</p>
        </div>
      </div>

      <div className="space-y-4">
        {updates.map((update) => (
          <Card key={update.version}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Version {update.version}
                    <Badge variant={update.type === "minor" ? "default" : "secondary"}>
                      {update.type}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{update.date}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {update.changes.map((change, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
