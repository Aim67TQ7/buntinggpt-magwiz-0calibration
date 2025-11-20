import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PCB_KNOWLEDGE = `
=== PART 1: Magnetic Cross Belt Separators (CBS) ===

I. Overview and Applications
The Magnetic Cross Belt (CBS) is a heavy-duty magnetic separator used across various recycling and material handling industries to capture and remove ferrous tramp metal from a conveyed product stream.

Nomenclature and Types
• CBS stands for Cross Belt Systems.
• The highest volume of cross belts built and sold utilize Ceramic 8 strontium ferrite permanent magnets.
• Some applications use Neodymium (Neo) permanent magnets for a higher intensity field.
• Occasionally, competitors or specialized systems utilize electro cross belts.

Primary Industries Utilizing Cross Belts
Magnetic cross belts are utilized across numerous applications where large-scale ferrous metal separation is required:
• Plastic Recycling: The number one application, utilized across almost every type of plastic recycling process.
• Metal and Automotive Recycling (ASR): Virtually every metal recycling facility uses multiple cross belts.
• Tire Recycling: A huge user, often requiring multiple cross belts to pull out tire wire during various stages of shredding.
• Aggregates, Concrete, Wood Chip, and Municipal Recycling: Used for pulling out materials like nails, screws, and large pieces of ferrous waste.
• Electronic Separation: Requires higher intensity fields, sometimes leading to the use of rare earth (Neo) cross belts.

II. Sizing and Magnetic Reach Out
Cross belts are dimensioned based on the width of the main conveying belt below them, the depth of the material burden, and the required magnetic strength (reach out).

Physical Dimensions
• Length (Coverage): The plate magnet inside the cross belt should be approximately eight inches or more longer than the width of the lower conveying belt to ensure full coverage of the material stream.
• Width Range: Cross belts accommodate lower conveyor widths ranging from about one foot wide up to seven or eight feet wide.
• Common Lengths: Common cross belt magnetic lengths include 36 and 48 inches.

Magnetic Sizing (Reach Out)
The required magnetic strength is directly proportional to the width of the magnetic assembly used: The wider the magnetic assembly inside the frame, the more reach out it has.
Magnet Assembly Width | Typical Reach Out (Ceramic 8) | Application Requirement Example
24 inches | 8 to 10 inches | Low burden depth (e.g., 6 to 8 inches set distance)
30 inches | 8 to 12 inches | Moderate reach requirements
36 inches | 10 to 16 inches | Deep reach requirements (e.g., set 18 inches away for municipal waste with large items)
Required magnetic strength (Gauss or flux density) is higher when the material burden is thicker, more dense, or if the metal pieces being pulled out are small (such as fine wires).
III. Magnet Types and Design Specifics
Ceramic (Ferrite) Cross Belts
• Ceramic 8 magnets are the most common type used.
• Ceramic plate magnets have one primary magnetic loop running from the North Pole through the South Pole.
• The poles go lengthwise with the conveyor frame to maintain a consistent strong field across the lower belt's width.
Neodymium (Neo) Cross Belts
• Neo magnets provide a higher intensity field and are typically reserved for applications requiring fine separation, like electronic separation or when shredded material is low on the belt.
• Neo plate magnets generally have less reach out than large ceramic plates.
• Design Caution (Tire Wire): Neo cross belts generate large side magnetic loops. In applications handling highly magnetic material (like tire wire), the belt must be significantly wider than the Neo plate magnet (e.g., a 24-inch Neo plate should have at least a 30-inch wide belt) to prevent wire from being pulled off the edge and accumulating inside the frame, which causes belt damage.
Magnetic Circuitry and Maintenance
• All cross belts made by Bunting utilize a two-pole plate magnet design.
• The strong magnetic field of a cross belt requires that the surrounding areas be properly designed, as it is a big magnetic field.
IV. Installation and Anti-Contamination Requirements
Proper installation is critical to prevent the magnetic field from interfering with the separation process or damaging equipment.
Non-Ferrous Requirements
• Lower Conveyor Frame: The frame of the lower conveyor below the cross belt (and extending at least one to two feet on either side) must be made of non-ferrous material (e.g., 300 series stainless steel, wood, or plastic).
• Risk of Magnetization: If the cross belt is suspended over a mild steel frame, the frame will become magnetized. This causes the metal below the belt to be held down by the magnetized frame, preventing it from snapping up to the cross belt, leading to missed metal separation.
• Inline Applications: When a cross belt is run in line over a discharge pulley, that pulley must also be stainless steel to prevent it from being magnetized and holding the tramp metal down.
Belt Stability and Cleaning
• UHMW Skirting: UHMW skirting is used along the bottom edges of the cross belt, machined to hold the belt up and prevent sagging. Sagging can cause contamination (metal fines/wire) to work its way between the belt and the magnetic plate, building up inside the system.
• Cleats: Cleats are often inset on the cross belt to aid in pulling the collected metal off the magnet surface.
Tire Recycling Specific Design (Deluxe Cross Belt)
Due to the extreme magnetism of tire wire, specialized cross belt designs are often required:
1. Extended Frame: The conveyor frame may be made approximately 12 inches longer (six inches further on both ends) to create more distance between the pulleys and the plate magnet.
2. Stainless Steel Pulleys: Drive and tail pulleys are constructed from stainless steel to prevent magnetization.
3. Access Doors: Access clean-out doors are installed behind the drive pulley and in front of the tail pulley to allow manual removal of fine wire that works its way inside the frame.
4. Urethane Belts: A poured urethane topped rubber belt with urethane cleats is sometimes utilized to prevent tire wires from impregnating the belt surface.
V. Electromagnets and Competitors (Emax / Electro)
The sources distinguish permanent magnetic systems (like CBS) from systems relying on electrical components:
• Electro Cross Belts: These are occasionally utilized, particularly in auto recycling facilities, possibly to allow for more clearance on the belts for irregular materials.
• Electromagnet Risks: Permanent magnet systems (like Bunting's proprietary pneumatic rotary switches, which were alternatives to electrical switches) are favored because they involve no heat. Competitor electrical switches (electromagnets) have been known to pose a fire hazard in oily press room environments.
• Variable Magnetism: Competitor systems (such as Redrich disc separators) rely on electromagnets because they allow the Gauss intensity to be changed for purifying materials like sand and Zurich (stainless steel).
• Emax/Eries: A competitor known as "Eries" is mentioned, characterized by spectacular marketing and creativity on verbiage.

=== PART 2: Electromagnetic Overband Magnets (OCW, ACW, ElectroMax) ===

I. Overview
In quarrying, few equipment choices impact productivity as directly as the overband magnet. Whether feeding a jaw crusher, screening fines, or loading aggregate to stockpile, even one piece of stray rebar or steel bolt can result in thousands in repairs and unplanned downtime. Tramp metal protection is essential, and selecting the correct type of electromagnetic overband magnet is critical.

What is an Electromagnetic Overband Magnet?
Electromagnetic overband magnets (Electro overband magnets) use a charged coil to generate a strong magnetic field onto a conveyor, lifting ferrous metals from the material stream and discharging them via a self-cleaning belt. They are ideal for high-capacity, high-burden applications where deep field penetration and maximum tramp metal recovery are required.

Bunting offers three primary electromagnetic overband systems:
• OCW (Oil Cooled): Deep magnetic field and sustained duty cycle
• ACW (Air Cooled): Strong performance without oil-related maintenance
• ElectroMax (Air Cooled): Compact and lightweight with high-intensity field strength

II. Air-Cooled vs Oil-Cooled: What's the Difference?

1. Cooling Method
• Oil-cooled (OCW) systems use circulating oil to cool the internal coil. This allows for a wider range of working ambient temperatures, making them ideal for the deepest burden depths and widest belts.
• Air-cooled (ACW, ElectroMax) systems rely on airflow to manage temperature. These designs eliminate oil maintenance and are typically lighter and easier to install.

2. Application Suitability
• Mobile crushing or space-limited applications → ElectroMax: Compact and 25% lighter than conventional models, with a high-intensity air-cooled field
• Mid-range conveyor lines with moderate burden → ACW: Reliable air-cooling suitable for belt widths up to 2,000 mm
• High-burden, deep suspension, large tramp metal → OCW: Provides a deep magnetic field and handles continuous duty with high power output

III. When to Choose Air-Cooled (ACW / ElectroMax)

Advantages:
• No oil system, which simplifies maintenance
• Lighter weight, ideal for mobile or retrofit systems
• Delivers strong magnetic power with reduced environmental risk

Use Air-Cooled If:
• Suspension height is moderate, typically under 500 to 600 mm
• Installation is on an existing structure with space or weight constraints
• Tramp volumes are moderate and you prefer minimal system upkeep

IV. When to Choose Oil-Cooled (OCW)

Advantages:
• Maximum field strength at greater depths
• Designed for wide belts over 2,000 mm and heavy tramp metal
• Suitable for high-temperature environments

Use Oil-Cooled If:
• A deep magnetic field is needed to extract tramp through high burden
• Suspension height is 600 to 800 mm
• Operation runs 24/7 under heavy load or in harsh conditions

V. When to Choose ElectroMax

Advantages:
• High-intensity magnetic field in a compact, lightweight frame
• Air-cooled design with no oil system, reducing complexity and maintenance
• Ideal for mobile equipment or retrofit projects with limited structural capacity
• Exceptional power-to-weight ratio, removing even stubborn tramp metal efficiently

Use ElectroMax If:
• The installation is on mobile crushers, screens, or modular conveyors
• You require strong magnetic separation but can't accommodate a heavy oil-cooled system
• Suspension height is limited, and deep field strength is still needed
• Your site demands quick installation and minimal ongoing maintenance
• You're replacing or upgrading a permanent magnet and need higher performance in the same footprint

VI. Practical Selection Factors

To ensure optimal system performance, evaluate:
• Suspension height: the distance from magnet face to belt
• Burden depth: the material height on the belt
• Tramp metal characteristics: including size, frequency, and shape
• Belt width and conveyor speed
• Installation constraints: such as space, weight, or structural load
• Maintenance capabilities and service access at your site
• Ambient temperature, particularly in extreme climates
• Altitude

VII. Key Differences: Electromagnetic vs Permanent Magnet Systems

Electromagnetic Overband Magnets (OCW/ACW/ElectroMax):
• Require electrical power to generate magnetic field
• Magnetic strength can be controlled and adjusted
• Self-cleaning belt discharge system
• Require cooling systems (oil or air)
• Best for: quarrying, aggregates, mining, crusher protection
• Typical depths: 500-800mm suspension heights

Permanent Magnet Cross Belt Separators (CBS):
• No electrical power required - permanent magnetic field
• Magnetic strength is fixed based on magnet type
• Self-cleaning belt discharge system
• No cooling system needed
• Best for: recycling (plastics, metals, tires, electronics)
• Typical depths: 8-16 inches reach out

VIII. Final Recommendations

Your overband magnet choice should reflect actual site conditions rather than default specs. Air-cooled electromagnetic models like the ACW and ElectroMax offer strong tramp removal performance with simple installation and maintenance. For deep burden removal, wide conveyors, and large tramp fragments, the OCW oil-cooled system provides the magnetic depth and power needed for uninterrupted protection.

Bunting can help configure the ideal solution for your operation based on material flow, conveyor specs, and the tramp metal profile.

NotebookLM can be inaccurate; please double check its responses.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, questionnaireAnswers } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch OCW models if questionnaire answers are provided
    let ocwRecommendations = '';
    if (questionnaireAnswers) {
      const beltWidth = parseInt(questionnaireAnswers.beltWidth) || 1200;
      
      // Query BMR_Top and BMR_magwiz for suitable OCW models
      const { data: topModels, error: topError } = await supabaseClient
        .from('BMR_Top')
        .select('*')
        .gte('width', beltWidth * 0.9)
        .order('surface_gauss', { ascending: false })
        .limit(20);

      if (!topError && topModels && topModels.length > 0) {
        const modelFilenames = topModels
          .map(m => `OCW-${String(m.Prefix).padStart(2, '0')}${String(m.Suffix).padStart(2, '0')}.csv`)
          .slice(0, 10);

        const { data: detailedSpecs } = await supabaseClient
          .from('BMR_magwiz')
          .select('*')
          .in('filename', modelFilenames);

        const rankedModels = topModels.slice(0, 5).map((model, index) => {
          const specs = detailedSpecs?.find(
            s => s.filename === `OCW-${String(model.Prefix).padStart(2, '0')}${String(model.Suffix).padStart(2, '0')}.csv`
          );

          return {
            model: model.model,
            prefix: model.Prefix,
            suffix: model.Suffix,
            width: model.width,
            surface_gauss: model.surface_gauss,
            force_factor: model.force_factor,
            watts: model.watts,
            frame: model.frame,
            belt_width: specs?.belt_width,
            suitability: index === 0 ? 'Best Match' : index === 1 ? 'Strong Match' : 'Good Match'
          };
        });

        ocwRecommendations = `\n\n## Recommended OCW Models Based on Your Specifications\n\n` +
          `**Your Requirements:**\n` +
          `- Belt Width: ${questionnaireAnswers.beltWidth}\n` +
          `- Suspension Height: ${questionnaireAnswers.suspensionHeight}\n` +
          `- Burden Depth: ${questionnaireAnswers.burdenDepth}\n` +
          `- Conveyor Type: ${questionnaireAnswers.conveyorType}\n\n` +
          `**Top 5 Suitable OCW Models:**\n\n` +
          rankedModels.map((m, i) => 
            `${i + 1}. **OCW-${String(m.prefix).padStart(2, '0')}${String(m.suffix).padStart(2, '0')}** (${m.suitability})\n` +
            `   - Magnet Width: ${m.width}mm\n` +
            `   - Surface Gauss: ${m.surface_gauss}G\n` +
            `   - Force Factor: ${m.force_factor}\n` +
            `   - Power: ${m.watts}W\n` +
            `   - Frame: ${m.frame}\n`
          ).join('\n');
        
        console.log('OCW Recommendations generated');
      }
    }
    
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    console.log('Received chat request with', messages.length, 'messages');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert assistant on magnetic separation equipment from Bunting. Use the following knowledge base to answer questions accurately and helpfully. If you don't know something or it's not in the knowledge base, say so honestly.

KNOWLEDGE BASE:
${PCB_KNOWLEDGE}

${ocwRecommendations}

You can answer questions about:
1. Magnetic Cross Belt Separators (CBS) - permanent magnet systems for recycling applications
2. Electromagnetic Overband Magnets (OCW, ACW, ElectroMax) - powered systems for quarrying and mining

Always provide detailed, technical answers when appropriate. Use the specific measurements, specifications, and examples from the knowledge base when relevant. When OCW model recommendations are provided above based on the user's questionnaire answers, present them clearly and explain why each model is suitable for their specific application requirements.`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 2048,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Successfully received response from Groq');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in pcb-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
