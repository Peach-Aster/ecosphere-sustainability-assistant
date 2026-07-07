interface CoachResponse {
  content: string;
  suggestions?: string[];
}

const KNOWLEDGE_BASE: Array<{
  keywords: string[];
  response: CoachResponse;
}> = [
  {
    keywords: ['transport', 'car', 'drive', 'commute', 'vehicle', 'gas'],
    response: {
      content: 'Transportation is one of the biggest sources of personal carbon emissions. A gasoline car emits about 0.192 kg CO₂ per km, while public transit emits roughly half that. Consider carpooling, public transport, biking for short trips, or switching to an electric vehicle (0.053 kg CO₂/km). Even one car-free day per week can cut your transport emissions by over 14%.',
      suggestions: ['How much CO₂ does an electric car save?', 'Tips for eco-friendly commuting', 'Compare bus vs train emissions'],
    },
  },
  {
    keywords: ['energy', 'electricity', 'power', 'light', 'heat', 'cool'],
    response: {
      content: 'Home energy use accounts for a significant share of your footprint. Electricity in most grids emits about 0.475 kg CO₂/kWh. Switching to LED bulbs saves 80% on lighting energy. Unplugging idle electronics, using a smart thermostat, and choosing renewable energy plans can cut your energy emissions substantially. Solar panels can bring your home energy emissions close to zero.',
      suggestions: ['Are solar panels worth it?', 'How to reduce heating costs', 'Best way to lower electricity use'],
    },
  },
  {
    keywords: ['diet', 'food', 'meat', 'beef', 'vegan', 'vegetarian', 'meal'],
    response: {
      content: 'What you eat matters a lot. Beef produces about 27 kg CO₂ per kg — far more than chicken (6.9), fish (5.1), or plant-based proteins (1.5). You don\'t have to go fully vegan to make an impact: replacing just one beef meal per week with a plant-based option can save roughly 2.5 kg CO₂. Start with meatless Mondays and build from there.',
      suggestions: ['What is the most sustainable diet?', 'How much water does beef use?', 'Easy plant-based meal ideas'],
    },
  },
  {
    keywords: ['reduce', 'tip', 'tips', 'help', 'how', 'start', 'improve'],
    response: {
      content: 'Here are high-impact ways to lower your footprint: 1) Shift one car trip per week to biking or transit. 2) Replace incandescent bulbs with LEDs. 3) Eat one plant-based meal per day. 4) Wash clothes in cold water. 5) Buy second-hand when possible. Small consistent changes compound — track them here to see your score climb.',
      suggestions: ['What changes have the biggest impact?', 'Set a weekly sustainability goal', 'How is my EcoSphere score calculated?'],
    },
  },
  {
    keywords: ['score', 'rating', 'how calculated', 'dashboard'],
    response: {
      content: 'Your EcoSphere score ranges from 0 to 100 — higher is better. It compares your daily emissions (transport + energy + diet) against an average daily footprint of about 13 kg CO₂. If you match the average, your score is around 50. Cut your emissions in half and you\'ll hit 100. Log activities in the Carbon Tracker to see your score update in real time.',
      suggestions: ['How do I reach a score of 80?', 'What is a good daily emissions target?', 'Compare my score to the average'],
    },
  },
  {
    keywords: ['product', 'buy', 'shop', 'scan', 'plastic', 'bottle'],
    response: {
      content: 'Choosing sustainable products makes a real difference. A single-use plastic bottle has a footprint many times higher than a reusable steel bottle over its lifetime. Use the Eco-Scanner to search any product and see its sustainability score, carbon footprint, and greener alternatives. Look for certifications like Energy Star, Organic, and Fair Trade.',
      suggestions: ['What eco labels should I look for?', 'Is recycling worth it?', 'How to avoid greenwashing'],
    },
  },
];

const DEFAULT_RESPONSE: CoachResponse = {
  content: 'I\'m your EcoSphere sustainability coach. I can help you understand your carbon footprint, suggest ways to reduce emissions, compare products, and plan greener transport. Try asking about transport, energy, diet, or how your score works.',
  suggestions: ['How do I reduce my footprint?', 'Tips for eco-friendly commuting', 'What is the most sustainable diet?'],
};

export const generateCoachResponse = (userMessage: string): CoachResponse => {
  const lower = userMessage.toLowerCase();
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.response;
    }
  }
  return DEFAULT_RESPONSE;
};
