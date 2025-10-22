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
}

const TRAMP_OBJECTS = [
  { name: "25mm Cube", threshold: 200, icon: "⬛" },
  { name: "M12 Nut", threshold: 300, icon: "⬢" },
  { name: "M16×75 Bolt", threshold: 350, icon: "🔩" },
  { name: "6mm Plate", threshold: 700, icon: "▬" }
];

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
      
      return {
        name: modelName,
        G0: G0,
        k: Math.max(0.003, Math.min(0.008, k)), // Clamp between 0.003 and 0.008
        width: dimensions.width,
        thickness: dimensions.thickness,
        beltWidth: 1200, // Default belt width - will be overridden by OCW configurator
        magnetDimension: magwizRecord?.magnet_dimension || null,
        prefix: unit.Prefix,
        suffix: unit.Suffix,
        frame: unit.frame
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
