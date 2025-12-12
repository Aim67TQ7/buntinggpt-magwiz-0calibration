import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History } from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

export const updates = [
  {
    version: "3.25.0",
    date: "2025-12-12",
    type: "minor",
    changes: [
      "Calibrated FF-based extraction against legacy pack (15 OCW 15 @ 200mm, coal)",
      "New formula: RequiredFF = K × momentFactor × envMultiplier × typeMultiplier",
      "Added explicit partType field for all tramps (Generic/Nut/Bolt/Plate/Auto-detect)",
      "Custom items default to Generic - no name inference unless Auto-detect selected",
      "Per-orientation NUT_FLAT_MULT (×1.3) applied only when height is smallest dimension",
      "Capped environmental penalties: burden ≤2.5×, speed ≤2.0×, water ≤2.5×",
      "Added row-level debug popover showing full calibration breakdown",
      "100% legacy targets treated as ≥99% constraints (ratio ≥ 2.0)"
    ]
  },
  {
    version: "3.24.0",
    date: "2025-12-12",
    type: "minor",
    changes: [
      "CRITICAL: Extraction now based on Force Factor (FF), not Gauss - matches legacy behavior",
      "Added calculateRequiredForceFactor() - requiredFF = momentFactor × difficultyMultiplier × stabilityFactor",
      "Extraction ratio = modelForceFactorAtGap / requiredForceFactor",
      "Table columns updated: Reqd FF, Model FF (Gauss shown for reference only)",
      "Validated calculateForceFactorAtGap() - gap=0 returns surfaceFF, decay matches legacy",
      "No calibration constant applied (set to 1.0)"
    ]
  },
  {
    version: "3.22.0",
    date: "2025-12-12",
    type: "minor",
    changes: [
      "Added contact stability factors: Nut ×1.8, Bolt ×1.3, Thin Plate ×1.5 (cubes = baseline)",
      "Thin plate detection: height < 15% of minimum face dimension",
      "Added debug state display to verify slider/material reactivity",
      "Difficulty ranking: cubes easiest → bolts → plates → nuts hardest"
    ]
  },
  {
    version: "3.21.0",
    date: "2025-12-12",
    type: "minor",
    changes: [
      "Fixed difficulty factor inversion - higher burden/water/speed now correctly increases Required Gauss",
      "Added 3-orientation permutations (W,L,H), (W,H,L), (H,L,W) - displays worst-case (max) Required Gauss",
      "Added nut correction - hollow geometry multiplies Required Gauss by 1.35",
      "Extraction calculated from Model Gauss @ Gap / max Required Gauss"
    ]
  },
  {
    version: "3.20.0",
    date: "2025-12-12",
    type: "patch",
    changes: [
      "Fixed Required Gauss calculation - removed incorrect gap distance scaling",
      "Required Gauss is now a baseline value independent of air gap",
      "Extraction ratio correctly compares gap-adjusted Model Gauss vs baseline Required Gauss",
      "Column header updated to 'Reqd Gauss (Baseline)' for clarity"
    ]
  },
  {
    version: "3.19.0",
    date: "2025-12-12",
    type: "minor",
    changes: [
      "Removed temperature scaling reference card from Gauss Table page and PDF export",
      "Required Gauss calculation now includes air gap distance scaling (anchored at 75mm)",
      "Replaced burden loss with embedding loss to avoid double-counting when using effective gap",
      "Column header updated to show 'Reqd Gauss @ {gap}mm' for clarity"
    ]
  },
  {
    version: "3.18.0",
    date: "2025-12-12",
    type: "minor",
    changes: [
      "New tramp metal extraction calculation based on engineering heuristic model",
      "Added material type selector with 11 material difficulty factors",
      "Added water content and belt speed parameters to extraction calculation",
      "Replaced orientation variants with shape penalty based on aspect ratio and thinness",
      "Required Gauss now calculated using speed loss, burden loss, water penalty, and shape penalty"
    ]
  },
  {
    version: "3.17.0",
    date: "2025-12-12",
    type: "minor",
    changes: [
      "Added 'Required Gauss' column to tramp extraction table",
      "Shows minimum Gauss at gap needed for reliable pickup of each tramp item",
      "Added 'Model Gauss' column showing the gap-adjusted Gauss from the selected model",
      "Helps users select magnets by comparing required vs available Gauss"
    ]
  },
  {
    version: "3.16.0",
    date: "2025-12-12",
    type: "minor",
    changes: [
      "Restructured OCW Model Comparison page with saved models on left panel and tramp extraction table on right",
      "Added standard tramp metal presets (25mm Cube, M12 Nut, M16×75mm Bolt, M18 Nut, 6mm Plate)",
      "Auto-generates 3 orientations (flat, edge, corner) for each tramp item with rotated dimensions",
      "Shows extraction percentage confidence for each tramp/orientation combination",
      "Displays gap-adjusted Gauss and Force Factor values used in calculations",
      "Added ability to add custom tramp items with user-defined dimensions"
    ]
  },
  {
    version: "3.15.0",
    date: "2025-12-11",
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
