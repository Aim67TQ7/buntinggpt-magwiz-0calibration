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

    // Convert OCW data to MagnetModel format
    const models: MagnetModel[] = (ocwData || []).map((unit: any) => {
      // Estimate G0 from surface_gauss
      const G0 = unit.surface_gauss || 2000;
      
      // Estimate k based on suffix (larger suffix = slower decay)
      // Typical range: 0.003 to 0.008 for OCW units
      const k = unit.Suffix ? 0.008 - (unit.Suffix / 10000) : 0.005;
      
      // Estimate thickness from suffix (suffix is roughly in mm)
      const thickness = unit.Suffix || 50;
      
      return {
        name: `${unit.Prefix} OCW ${unit.Suffix}`,
        G0: G0,
        k: Math.max(0.003, Math.min(0.008, k)), // Clamp between 0.003 and 0.008
        width: unit.width || 1000, // width field from BMR_Top is the magnet/belt width
        thickness: thickness,
        beltWidth: unit.width || 1000, // Same as width for OCW units
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
