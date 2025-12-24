// Crop data with planting to harvest durations and seasons
export const cropData = {
  rice: { 
    duration: "3-6 months", 
    seasons: ["Kharif", "Rabi"],
    description: "Rice is a major food staple and a mainstay for the rural population and their food security.",
    waterRequirement: "High",
    soilType: "Clay or clay loam"
  },
  wheat: { 
    duration: "4-5 months", 
    seasons: ["Rabi"],
    description: "Wheat is the second most important cereal crop in India after rice.",
    waterRequirement: "Medium",
    soilType: "Loam or clay loam"
  },
  maize: { 
    duration: "3-4 months", 
    seasons: ["Kharif", "Rabi"],
    description: "Maize is used as both food and fodder and is a major component in livestock feed.",
    waterRequirement: "Medium",
    soilType: "Well-drained loam or silt loam"
  },
  sugarcane: { 
    duration: "12-18 months", 
    seasons: ["Year-round"],
    description: "Sugarcane is the main source of sugar, gur and khandsari, and is used for making alcohol.",
    waterRequirement: "High",
    soilType: "Deep, well-drained loam or clay loam"
  },
  cotton: { 
    duration: "5-6 months", 
    seasons: ["Kharif"],
    description: "Cotton is one of the major fiber crops of global significance and is cultivated in tropical and subtropical regions.",
    waterRequirement: "Medium",
    soilType: "Deep, well-drained black cotton soil"
  },
  soybean: { 
    duration: "3-5 months", 
    seasons: ["Kharif"],
    description: "Soybean is a species of legume widely grown for its edible bean, which has numerous uses.",
    waterRequirement: "Medium",
    soilType: "Well-drained loam or clay loam"
  },
  potato: { 
    duration: "3-4 months", 
    seasons: ["Rabi"],
    description: "Potato is a starchy, tuberous crop that is a versatile, carbohydrate-rich food.",
    waterRequirement: "Medium",
    soilType: "Sandy loam or loamy soil"
  },
  onion: { 
    duration: "3-5 months", 
    seasons: ["Rabi", "Kharif"],
    description: "Onion is a vegetable used in virtually every type of cuisine and is cultivated across India.",
    waterRequirement: "Medium",
    soilType: "Well-drained loam or clayey loam"
  },
  tomato: { 
    duration: "3-4 months", 
    seasons: ["Year-round"],
    description: "Tomato is the most popular garden vegetable crop and is cultivated throughout India.",
    waterRequirement: "Medium",
    soilType: "Well-drained loamy soil rich in organic matter"
  },
  mustard: { 
    duration: "3-5 months", 
    seasons: ["Rabi"],
    description: "Mustard is an important oil seed crop and is widely used as a condiment and for its medicinal properties.",
    waterRequirement: "Low to Medium",
    soilType: "Well-drained loamy soil"
  },
};

// List of Indian states for dropdown
export const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

// Agricultural seasons in India
export const agriculturalSeasons = [
  "Kharif (Monsoon: June-October)",
  "Rabi (Winter: November-April)",
  "Zaid (Summer: March-June)"
];

// Get current season based on month
export function getCurrentSeason() {
  const month = new Date().getMonth();
  // Simple seasonal mapping for India
  if (month >= 5 && month <= 9) {
    return "Kharif"; // June to October (monsoon)
  } else if (month >= 2 && month <= 5) {
    return "Zaid"; // March to June (summer)
  } else {
    return "Rabi"; // November to February (winter)
  }
}

// Calculate the harvest season based on timeRange
export function getHarvestSeason(timeRange: number) {
  const currentMonth = new Date().getMonth();
  const harvestMonth = (currentMonth + timeRange) % 12;
  
  if (harvestMonth >= 5 && harvestMonth <= 9) {
    return "Kharif";
  } else if (harvestMonth >= 2 && harvestMonth <= 5) {
    return "Zaid";
  } else {
    return "Rabi";
  }
}

// Region-specific climate data (simplified)
export const regionClimateData: Record<string, any> = {
  "punjab": { 
    current: "moderate", 
    rainfall: "moderate", 
    suitable_crops: ["wheat", "rice", "maize"],
    description: "Punjab has a subtropical climate with hot summers and cool winters. The region receives moderate rainfall during the monsoon season."
  },
  "maharashtra": { 
    current: "warm", 
    rainfall: "variable", 
    suitable_crops: ["cotton", "sugarcane", "soybean"],
    description: "Maharashtra has diverse climate zones ranging from tropical wet in the coastal areas to semi-arid in the interior parts."
  },
  "kerala": { 
    current: "tropical", 
    rainfall: "high", 
    suitable_crops: ["rice", "coconut", "rubber"],
    description: "Kerala has a tropical climate with high rainfall and humidity throughout the year, making it suitable for plantation crops."
  },
  "gujarat": { 
    current: "hot", 
    rainfall: "low", 
    suitable_crops: ["cotton", "groundnut", "wheat"],
    description: "Gujarat has an arid to semi-arid climate with hot summers, mild winters, and low rainfall, suitable for drought-resistant crops."
  },
  "west bengal": { 
    current: "humid", 
    rainfall: "high", 
    suitable_crops: ["rice", "jute", "tea"],
    description: "West Bengal has a subtropical climate with high humidity and rainfall, making it ideal for rice cultivation."
  },
  // Default fallback for unknown regions
  "default": { 
    current: "variable", 
    rainfall: "moderate", 
    suitable_crops: ["wheat", "rice", "maize", "potato"],
    description: "This region has variable climate conditions with moderate rainfall, suitable for a range of crops."
  }
}; 