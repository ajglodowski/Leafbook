-- Leafbook seed data
-- This file runs after migrations during `supabase db reset`

-- Add sample plant types for development/testing
INSERT INTO public.plant_types (
  name, scientific_name, description, light_requirement, 
  watering_frequency_days, fertilizing_frequency_days, size_category, care_notes
)
VALUES
  (
    'Pothos', 
    'Epipremnum aureum', 
    'A hardy, trailing vine perfect for beginners. Tolerates low light and irregular watering.', 
    'low_to_bright_indirect', 
    7, 30, 'medium',
    'Let soil dry between waterings. Trim leggy vines to encourage bushier growth. Propagates easily in water.'
  ),
  (
    'Snake Plant', 
    'Dracaena trifasciata', 
    'An architectural plant with stiff, upright leaves. Extremely drought tolerant.', 
    'low_to_bright_indirect', 
    14, 60, 'medium',
    'Water sparingly—overwatering is the main killer. Wipe leaves occasionally to remove dust.'
  ),
  (
    'Monstera', 
    'Monstera deliciosa', 
    'Iconic split-leaf plant that adds a tropical feel. Loves humidity and bright indirect light.', 
    'bright_indirect', 
    7, 30, 'large',
    'Provide a moss pole for climbing. Fenestrations (holes) develop as the plant matures. Mist regularly or use a humidifier.'
  ),
  (
    'Spider Plant', 
    'Chlorophytum comosum', 
    'Fast-growing plant that produces baby "spiderettes". Great air purifier.', 
    'bright_indirect', 
    7, 14, 'small',
    'Brown tips usually mean fluoride in tap water—use filtered water. Babies can be propagated in water or soil.'
  ),
  (
    'Peace Lily', 
    'Spathiphyllum', 
    'Elegant flowering plant that thrives in low light. Droops dramatically when thirsty.', 
    'low_to_medium', 
    7, 30, 'medium',
    'Drooping is normal when thirsty—it perks up within hours of watering. Wipe leaves to keep them glossy.'
  ),
  (
    'Fiddle Leaf Fig', 
    'Ficus lyrata', 
    'Statement plant with large, violin-shaped leaves. Needs consistent care and bright light.', 
    'bright_indirect', 
    10, 30, 'large',
    'Hates being moved—find a spot and stick with it. Brown spots often indicate overwatering or cold drafts.'
  ),
  (
    'ZZ Plant', 
    'Zamioculcas zamiifolia', 
    'Nearly indestructible plant with glossy leaves. Thrives on neglect.', 
    'low_to_bright_indirect', 
    21, 60, 'medium',
    'Rhizomes store water, so err on the side of underwatering. Wipe leaves to maintain their shine.'
  ),
  (
    'Rubber Plant', 
    'Ficus elastica', 
    'Bold, glossy leaves in deep green or burgundy. Easy care with moderate light.', 
    'medium_to_bright_indirect', 
    10, 30, 'large',
    'Dust leaves regularly for best photosynthesis. Can be pruned to control height and encourage branching.'
  ),
  (
    'Philodendron', 
    'Philodendron hederaceum', 
    'Heart-shaped leaves on trailing vines. Very forgiving and fast-growing.', 
    'low_to_bright_indirect', 
    7, 30, 'medium',
    'Yellowing leaves usually mean overwatering. Loves to climb—give it a trellis or let it trail from a shelf.'
  ),
  (
    'Calathea', 
    'Calathea spp.', 
    'Stunning patterned leaves that move with the light. Loves humidity, hates tap water.', 
    'medium_indirect', 
    5, 30, 'medium',
    'Use filtered or distilled water to avoid crispy edges. Keep soil consistently moist but not soggy. Leaves fold up at night (nyctinasty).'
  ),
  (
    'String of Pearls', 
    'Senecio rowleyanus', 
    'Delicate succulent with bead-like leaves on trailing stems. A showstopper in hanging planters.', 
    'bright_indirect', 
    14, 30, 'small',
    'Water when pearls look slightly deflated. Very sensitive to overwatering—ensure excellent drainage.'
  ),
  (
    'Bird of Paradise', 
    'Strelitzia reginae', 
    'Tropical statement plant with large, banana-like leaves. Can produce stunning orange flowers indoors with enough light.', 
    'direct_sun', 
    7, 14, 'extra_large',
    'Needs lots of bright light to flower. Leaves splitting is natural. Rotate regularly for even growth.'
  ),
  (
    'Aloe Vera', 
    'Aloe barbadensis miller', 
    'Medicinal succulent with thick, gel-filled leaves. The gel soothes burns and skin irritations.', 
    'bright_indirect', 
    14, 60, 'small',
    'Let soil dry completely between waterings. Pups (babies) can be separated and repotted. Needs well-draining soil.'
  ),
  (
    'Boston Fern', 
    'Nephrolepis exaltata', 
    'Lush, feathery fronds that love humidity. Classic choice for hanging baskets and bathrooms.', 
    'medium_indirect', 
    3, 30, 'medium',
    'Mist frequently or place on a pebble tray. Brown fronds are normal—trim them to encourage new growth.'
  ),
  (
    'Chinese Evergreen', 
    'Aglaonema', 
    'Beautifully patterned leaves in silver, pink, or red. One of the most tolerant houseplants.', 
    'low_to_medium', 
    10, 30, 'medium',
    'Avoid cold drafts and temperatures below 60°F. Variegated varieties need more light to maintain color.'
  )
ON CONFLICT (name) DO NOTHING;
