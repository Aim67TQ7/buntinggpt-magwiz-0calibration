import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MagnetModel {
  name: string;
  G0: number;
  k: number;
  width: number;        // mm - magnet width
  thickness: number;    // mm - magnet thickness
  beltWidth: number;    // mm - recommended belt width
  magnetDimension?: string; // Full magnet dimension string from BMR_magwiz
  prefix?: number;
  suffix?: number;
  frame?: string;
  faceCoverage?: number; // Assembly face width in mm
  fieldCurves?: {
    crossbelt: Array<{ wd_mm: number; gauss_center: number }>;
    inline: Array<{ wd_mm: number; gauss_center: number }>;
  };
}

const TRAMP_OBJECTS = [
  { name: "25mm Cube", threshold: 1400, icon: "⬛", size_mm: 25 },
  { name: "50mm Plate", threshold: 1900, icon: "▬", size_mm: 50 },
  { name: "100mm Object", threshold: 2400, icon: "🔩", size_mm: 100 }
];

// Generate field curves from G0 and k values
const generateFieldCurves = (G0: number, k: number) => {
  const wdPoints = [50, 75, 100, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500];
  const crossbelt = wdPoints.map(wd => ({
    wd_mm: wd,
    gauss_center: Math.round(G0 * Math.exp(-k * wd / 1000) * 0.88) // 12% reduction for crossbelt, k is per mm so divide by 1000
  }));
  const inline = wdPoints.map(wd => ({
    wd_mm: wd,
    gauss_center: Math.round(G0 * Math.exp(-k * wd / 1000))
  }));
  return { crossbelt, inline };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const modelName = url.searchParams.get('model');
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch OCW data from BMR_Top table
    const { data: ocwData, error: ocwError } = await supabase
      .from('BMR_Top')
      .select('*');

    if (ocwError) {
      console.error('Error fetching OCW data:', ocwError);
      throw ocwError;
    }

    // Fetch magnet dimensions from BMR_magwiz table
    const { data: magwizData, error: magwizError } = await supabase
      .from('BMR_magwiz')
      .select('filename, magnet_dimension');

    if (magwizError) {
      console.error('Error fetching magwiz data:', magwizError);
    }

    // Helper function to parse magnet dimensions (e.g., "398 x 398 x 211mm")
    const parseMagnetDimension = (dimension: string | null): { width: number; thickness: number } => {
      if (!dimension) return { width: 400, thickness: 200 };
      
      const parts = dimension.replace('mm', '').split('x').map(p => parseFloat(p.trim()));
      if (parts.length >= 3) {
        return {
          width: parts[0] || 400,
          thickness: parts[2] || 200
        };
      }
      return { width: 400, thickness: 200 };
    };

    // Create a map of magwiz data by filename
    const magwizMap = new Map();
    (magwizData || []).forEach((item: any) => {
      magwizMap.set(item.filename, item);
    });

    // Convert OCW data to MagnetModel format
    const models: MagnetModel[] = (ocwData || []).map((unit: any) => {
      const modelName = `${unit.Prefix} OCW ${unit.Suffix}`;
      const magwizRecord = magwizMap.get(modelName);
      
      // Parse actual magnet dimensions from BMR_magwiz
      const dimensions = parseMagnetDimension(magwizRecord?.magnet_dimension);
      
      // Estimate G0 from surface_gauss
      const G0 = unit.surface_gauss || 2000;
      
      // Estimate k based on suffix (larger suffix = slower decay)
      // Typical range: 0.003 to 0.008 for OCW units
      const k = unit.Suffix ? 0.008 - (unit.Suffix / 10000) : 0.005;
      
      const clampedK = Math.max(0.003, Math.min(0.008, k));
      
      return {
        name: modelName,
        G0: G0,
        k: clampedK,
        width: dimensions.width,
        thickness: dimensions.thickness,
        beltWidth: 1200, // Default belt width - will be overridden by OCW configurator
        magnetDimension: magwizRecord?.magnet_dimension || null,
        prefix: unit.Prefix,
        suffix: unit.Suffix,
        frame: unit.frame,
        faceCoverage: unit.width || dimensions.width, // Use width from BMR_Top or default to magnet width
        fieldCurves: generateFieldCurves(G0, clampedK)
      };
    });

    if (modelName) {
      // Return specific model
      const model = models.find(m => m.name === modelName);
      if (!model) {
        return new Response(
          JSON.stringify({ error: 'Model not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ model, tramps: TRAMP_OBJECTS }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return all models
    return new Response(
      JSON.stringify({ models, tramps: TRAMP_OBJECTS }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
