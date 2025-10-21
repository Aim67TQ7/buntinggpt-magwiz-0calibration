import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
}

const MAGNET_MODELS: MagnetModel[] = [
  {
    name: "55 OCW 25",
    G0: 2410,
    k: 0.0058,
    width: 300,
    thickness: 50,
    beltWidth: 600
  },
  {
    name: "80 OCW 25",
    G0: 3707,
    k: 0.0045,
    width: 400,
    thickness: 60,
    beltWidth: 800
  },
  {
    name: "100 OCW 25",
    G0: 4200,
    k: 0.0040,
    width: 500,
    thickness: 70,
    beltWidth: 1000
  }
];

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

    if (modelName) {
      // Return specific model
      const model = MAGNET_MODELS.find(m => m.name === modelName);
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
      JSON.stringify({ models: MAGNET_MODELS, tramps: TRAMP_OBJECTS }),
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
