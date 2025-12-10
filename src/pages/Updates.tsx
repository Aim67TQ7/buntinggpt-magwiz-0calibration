import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History } from "lucide-react";
import { Link } from "react-router-dom";

const updates = [
  {
    version: "3.10.1",
    date: "2025-12-10",
    type: "patch",
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
