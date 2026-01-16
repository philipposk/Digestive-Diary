import { FoodLog, Symptom, Context, Experiment, Realization, ChatSession, ChatMessage, ExperimentLog, Source } from '@/types';

// Helper to create a simple placeholder image data URL (tiny colored square)
function createPlaceholderImage(color: string = '#e5e7eb'): string {
  const svg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="${color}"/><text x="50%" y="50%" font-family="Arial" font-size="12" fill="#666" text-anchor="middle" dominant-baseline="middle">Photo</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

const foodOptions = [
  { food: 'Oatmeal with banana', quantity: '1 bowl', tags: ['gluten', 'fiber-rich'], macros: { calories: 350, protein: 12, carbs: 65, fat: 6, fiber: 8 } },
  { food: 'Greek yogurt with berries', quantity: '1 cup', tags: ['dairy'], macros: { calories: 150, protein: 15, carbs: 20, fat: 3, fiber: 2 } },
  { food: 'Scrambled eggs with toast', quantity: '2 eggs, 2 slices', tags: ['gluten', 'processed'], macros: { calories: 400, protein: 22, carbs: 35, fat: 18, fiber: 3 } },
  { food: 'Avocado toast', quantity: '2 slices', tags: ['gluten', 'fatty'], macros: { calories: 380, protein: 10, carbs: 40, fat: 22, fiber: 12 } },
  { food: 'Pancakes with maple syrup', quantity: '3 pancakes', tags: ['gluten', 'processed'], macros: { calories: 450, protein: 12, carbs: 75, fat: 12, fiber: 2 } },
  { food: 'Smoothie bowl', quantity: '1 bowl', tags: ['dairy', 'fiber-rich'], macros: { calories: 320, protein: 8, carbs: 65, fat: 5, fiber: 10 } },
  { food: 'Bagel with cream cheese', quantity: '1 bagel', tags: ['dairy', 'gluten', 'processed'], macros: { calories: 420, protein: 14, carbs: 55, fat: 16, fiber: 3 } },
  { food: 'French toast', quantity: '2 slices', tags: ['gluten', 'dairy', 'processed'], macros: { calories: 480, protein: 15, carbs: 60, fat: 20, fiber: 2 } },
  { food: 'Granola with milk', quantity: '1 bowl', tags: ['dairy', 'gluten', 'processed'], macros: { calories: 380, protein: 10, carbs: 58, fat: 12, fiber: 6 } },
  
  { food: 'Chicken salad sandwich', quantity: '1 sandwich', tags: ['gluten', 'processed'], macros: { calories: 450, protein: 28, carbs: 45, fat: 16, fiber: 4 } },
  { food: 'Pasta with marinara sauce', quantity: '1 bowl', tags: ['gluten'], macros: { calories: 380, protein: 12, carbs: 70, fat: 6, fiber: 5 } },
  { food: 'Grilled chicken with rice', quantity: '1 plate', tags: [], macros: { calories: 520, protein: 45, carbs: 55, fat: 12, fiber: 2 } },
  { food: 'Pizza slice', quantity: '2 slices', tags: ['dairy', 'gluten', 'processed'], macros: { calories: 560, protein: 22, carbs: 68, fat: 22, fiber: 4 } },
  { food: 'Burger with fries', quantity: '1 burger', tags: ['gluten', 'fatty', 'processed'], macros: { calories: 780, protein: 32, carbs: 75, fat: 38, fiber: 5 } },
  { food: 'Sushi rolls', quantity: '8 pieces', tags: ['raw'], macros: { calories: 320, protein: 18, carbs: 52, fat: 6, fiber: 2 } },
  { food: 'Caesar salad', quantity: '1 large bowl', tags: ['dairy', 'gluten'], macros: { calories: 420, protein: 18, carbs: 28, fat: 26, fiber: 4 } },
  { food: 'Tacos', quantity: '3 tacos', tags: ['gluten', 'spicy', 'fatty'], macros: { calories: 480, protein: 25, carbs: 52, fat: 20, fiber: 6 } },
  { food: 'Pad Thai', quantity: '1 plate', tags: ['gluten', 'spicy', 'processed'], macros: { calories: 520, protein: 22, carbs: 68, fat: 18, fiber: 4 } },
  { food: 'Soup and salad', quantity: '1 bowl soup', tags: ['gluten', 'processed'], macros: { calories: 320, protein: 12, carbs: 45, fat: 10, fiber: 8 } },
  { food: 'Wrap with vegetables', quantity: '1 wrap', tags: ['gluten', 'fiber-rich'], macros: { calories: 380, protein: 16, carbs: 48, fat: 14, fiber: 10 } },
  
  { food: 'Grilled salmon with vegetables', quantity: '1 fillet', tags: ['fatty'], macros: { calories: 450, protein: 38, carbs: 12, fat: 26, fiber: 6 } },
  { food: 'Baked fish', quantity: '1 fillet', tags: [], macros: { calories: 280, protein: 32, carbs: 2, fat: 14, fiber: 1 } },
  { food: 'Fish and vegetables', quantity: '1 portion', tags: [], macros: { calories: 350, protein: 35, carbs: 15, fat: 16, fiber: 8 } },
  { food: 'Tuna salad', quantity: '1 bowl', tags: ['fiber-rich'], macros: { calories: 320, protein: 30, carbs: 12, fat: 18, fiber: 6 } },
  { food: 'Grilled fish', quantity: '1 fillet', tags: [], macros: { calories: 300, protein: 34, carbs: 3, fat: 16, fiber: 1 } },
  { food: 'Pasta carbonara', quantity: '1 bowl', tags: ['dairy', 'gluten', 'fatty', 'processed'], macros: { calories: 680, protein: 28, carbs: 72, fat: 32, fiber: 4 } },
  { food: 'Stir-fry with tofu', quantity: '1 plate', tags: ['spicy', 'fiber-rich'], macros: { calories: 380, protein: 22, carbs: 42, fat: 14, fiber: 10 } },
  { food: 'Lasagna', quantity: '1 slice', tags: ['dairy', 'gluten', 'processed'], macros: { calories: 520, protein: 28, carbs: 48, fat: 24, fiber: 4 } },
  { food: 'Chicken curry with rice', quantity: '1 plate', tags: ['spicy'], macros: { calories: 580, protein: 35, carbs: 68, fat: 18, fiber: 6 } },
  { food: 'Mac and cheese', quantity: '1 bowl', tags: ['dairy', 'gluten', 'processed'], macros: { calories: 520, protein: 20, carbs: 58, fat: 24, fiber: 3 } },
  { food: 'Burrito', quantity: '1 large', tags: ['gluten', 'dairy', 'spicy', 'processed'], macros: { calories: 680, protein: 32, carbs: 82, fat: 26, fiber: 12 } },
  { food: 'Ramen', quantity: '1 bowl', tags: ['gluten', 'processed'], macros: { calories: 480, protein: 18, carbs: 72, fat: 14, fiber: 4 } },
  { food: 'Fajitas', quantity: '1 plate', tags: ['gluten', 'spicy'], macros: { calories: 520, protein: 38, carbs: 52, fat: 18, fiber: 8 } },
  { food: 'Fish and chips', quantity: '1 portion', tags: ['gluten', 'fatty', 'processed'], macros: { calories: 680, protein: 32, carbs: 72, fat: 32, fiber: 5 } },
  
  { food: 'Ice cream', quantity: '1 cup', tags: ['dairy'], macros: { calories: 280, protein: 5, carbs: 32, fat: 14, fiber: 1 } },
  { food: 'Chocolate chip cookies', quantity: '3 cookies', tags: ['gluten', 'dairy', 'processed'], macros: { calories: 240, protein: 3, carbs: 32, fat: 12, fiber: 1 } },
  { food: 'Cheesecake', quantity: '1 slice', tags: ['dairy', 'fatty', 'processed'], macros: { calories: 420, protein: 8, carbs: 38, fat: 26, fiber: 1 } },
  { food: 'Brownies', quantity: '2 pieces', tags: ['gluten', 'processed'], macros: { calories: 320, protein: 4, carbs: 42, fat: 16, fiber: 2 } },
  { food: 'Yogurt parfait', quantity: '1 cup', tags: ['dairy', 'fiber-rich'], macros: { calories: 220, protein: 12, carbs: 32, fat: 6, fiber: 5 } },
  { food: 'Fruit salad', quantity: '1 bowl', tags: ['fiber-rich'], macros: { calories: 150, protein: 2, carbs: 38, fat: 0, fiber: 8 } },
  { food: 'Popcorn', quantity: '1 bowl', tags: ['fiber-rich', 'processed'], macros: { calories: 130, protein: 4, carbs: 26, fat: 4, fiber: 5 } },
  { food: 'Chips and salsa', quantity: '1 bowl', tags: ['spicy', 'processed'], macros: { calories: 280, protein: 4, carbs: 38, fat: 14, fiber: 6 } },
  { food: 'Mixed nuts', quantity: '1 handful', tags: ['fatty'], macros: { calories: 200, protein: 6, carbs: 8, fat: 18, fiber: 3 } },
  { food: 'Dark chocolate', quantity: '2 squares', tags: ['processed'], macros: { calories: 120, protein: 2, carbs: 12, fat: 8, fiber: 3 } },
  
  { food: 'Coffee with cream', quantity: '1 cup', tags: ['dairy'], macros: { calories: 45, protein: 1, carbs: 2, fat: 4, fiber: 0 } },
  { food: 'Green smoothie', quantity: '1 glass', tags: ['fiber-rich'], macros: { calories: 180, protein: 4, carbs: 38, fat: 2, fiber: 8 } },
  { food: 'Tea with honey', quantity: '1 cup', tags: [], macros: { calories: 60, protein: 0, carbs: 16, fat: 0, fiber: 0 } },
  { food: 'Orange juice', quantity: '1 glass', tags: ['fiber-rich'], macros: { calories: 120, protein: 2, carbs: 28, fat: 0, fiber: 2 } },
  { food: 'Protein shake', quantity: '1 serving', tags: ['dairy', 'processed'], macros: { calories: 180, protein: 30, carbs: 8, fat: 3, fiber: 1 } },
  { food: 'Wine', quantity: '1 glass', tags: ['alcohol'], macros: { calories: 125, protein: 0, carbs: 4, fat: 0, fiber: 0 } },
  { food: 'Beer', quantity: '1 bottle', tags: ['alcohol'], macros: { calories: 150, protein: 1, carbs: 13, fat: 0, fiber: 0 } },
];

const symptomTypes = [
  'bloating', 
  'pain', 
  'nausea', 
  'gas', 
  'constipation', 
  'diarrhea', 
  'heartburn',
  'hypoglycemia',
  'low energy',
  'low concentration',
  'cramps',
  'intestinal pinching',
  'inflammation',
  'rash',
  'pimple',
  'skin irritation',
  'sugar craving'
];
const durations = ['30 minutes', '1 hour', '2 hours', '3 hours', '4 hours', 'half day'];

export function generateSampleData(): { foodLogs: FoodLog[]; symptoms: Symptom[]; contexts: Context[]; experiments: Experiment[]; realizations: Realization[]; chatSession: ChatSession | null; sources: Source[] } {
  const foodLogs: FoodLog[] = [];
  const symptoms: Symptom[] = [];
  const contexts: Context[] = [];
  const experiments: Experiment[] = [];
  const realizations: Realization[] = [];
  const sources: Source[] = [];
  
  const now = new Date();
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  // Create 3 experiments (2 past, 1 ongoing)
  // Past experiment 1: "No Dairy" - 10 days ago to 4 days ago
  const noDairyStart = new Date(twoWeeksAgo);
  noDairyStart.setDate(noDairyStart.getDate() + 4);
  noDairyStart.setHours(0, 0, 0, 0);
  const noDairyEnd = new Date(twoWeeksAgo);
  noDairyEnd.setDate(noDairyEnd.getDate() + 10);
  noDairyEnd.setHours(23, 59, 59, 999);
  
  const noDairyExpId = crypto.randomUUID();
  experiments.push({
    id: noDairyExpId,
    name: 'No Dairy',
    startDate: noDairyStart,
    endDate: noDairyEnd,
    active: false,
    notes: 'Testing if removing dairy reduces bloating and intestinal pinching',
    logs: [
      {
        id: crypto.randomUUID(),
        experimentId: noDairyExpId,
        type: 'text',
        content: 'Day 1: Removed all dairy from my diet. Feeling optimistic about this experiment.',
        timestamp: new Date(noDairyStart.getTime() + 12 * 60 * 60 * 1000),
        notes: 'Initial log',
      },
      {
        id: crypto.randomUUID(),
        experimentId: noDairyExpId,
        type: 'text',
        content: 'Day 3: Still no dairy. Had some bloating today but not as severe as usual.',
        timestamp: new Date(noDairyStart.getTime() + 3 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000),
      },
      {
        id: crypto.randomUUID(),
        experimentId: noDairyExpId,
        type: 'image',
        content: createPlaceholderImage('#fef3c7'),
        timestamp: new Date(noDairyStart.getTime() + 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
        notes: 'Photo: Meal without dairy options',
      },
    ],
  });
  
  // Past experiment 2: "Low Gluten" - 12 days ago to 7 days ago
  const lowGlutenStart = new Date(twoWeeksAgo);
  lowGlutenStart.setDate(lowGlutenStart.getDate() + 2);
  lowGlutenStart.setHours(0, 0, 0, 0);
  const lowGlutenEnd = new Date(twoWeeksAgo);
  lowGlutenEnd.setDate(lowGlutenEnd.getDate() + 7);
  lowGlutenEnd.setHours(23, 59, 59, 999);
  
  experiments.push({
    id: crypto.randomUUID(),
    name: 'Low Gluten',
    startDate: lowGlutenStart,
    endDate: lowGlutenEnd,
    active: false,
    notes: 'Reduced gluten intake to see if it helps with inflammation',
  });
  
  // Ongoing experiment: "Fish Focus" - started 3 days ago
  const fishFocusStart = new Date(now);
  fishFocusStart.setDate(fishFocusStart.getDate() - 3);
  fishFocusStart.setHours(0, 0, 0, 0);
  
  const fishFocusExpId = crypto.randomUUID();
  experiments.push({
    id: fishFocusExpId,
    name: 'Fish Focus',
    startDate: fishFocusStart,
    endDate: undefined,
    active: true,
    notes: 'Eating fish twice a week, focusing on anti-inflammatory foods. Glutamine supplements.',
    logs: [
      {
        id: crypto.randomUUID(),
        experimentId: fishFocusExpId,
        type: 'text',
        content: 'Started Fish Focus experiment. Planning to eat salmon and other fatty fish regularly.',
        timestamp: new Date(fishFocusStart.getTime() + 8 * 60 * 60 * 1000),
      },
      {
        id: crypto.randomUUID(),
        experimentId: fishFocusExpId,
        type: 'image',
        content: createPlaceholderImage('#dbeafe'),
        timestamp: new Date(fishFocusStart.getTime() + 1 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000),
        notes: 'Photo: Grilled salmon dinner',
      },
      {
        id: crypto.randomUUID(),
        experimentId: fishFocusExpId,
        type: 'text',
        content: 'Day 3: Feeling better, less inflammation. Continuing with fish meals and supplements.',
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
    ],
  });

  // Generate 60 food logs over 2 weeks (more diverse, some with photos and macros)
  for (let i = 0; i < 60; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    
    const timestamp = new Date(twoWeeksAgo);
    timestamp.setDate(timestamp.getDate() + daysAgo);
    timestamp.setHours(hours, minutes, 0, 0);

    const foodOption = foodOptions[Math.floor(Math.random() * foodOptions.length)];
    
    // 30% of food logs have photos (with placeholder images)
    const hasPhoto = Math.random() < 0.3;
    // 50% have macros (most recent ones)
    const hasMacros = Math.random() < 0.5 || daysAgo < 3;
    
    const foodLog: FoodLog = {
      id: crypto.randomUUID(),
      food: foodOption.food,
      quantity: foodOption.quantity,
      tags: foodOption.tags,
      timestamp,
      notes: Math.random() > 0.7 ? 'Had this for lunch' : undefined,
    };
    
    if (hasMacros && foodOption.macros) {
      foodLog.macros = { ...foodOption.macros };
      foodLog.portionWeight = Math.floor(foodOption.macros.calories! / 2.5); // Rough estimate
    }
    
    foodLogs.push(foodLog);
  }
  
  // Add some food logs with photos (special ones)
  const pizzaLogId = crypto.randomUUID();
  foodLogs.push({
    id: pizzaLogId,
    food: 'Pizza slice',
    quantity: '2 slices',
    tags: ['dairy', 'gluten', 'processed'],
    timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000),
    notes: 'Friday night dinner',
    macros: { calories: 560, protein: 22, carbs: 68, fat: 22, fiber: 4 },
    portionWeight: 250,
  });
  
  const saladLogId = crypto.randomUUID();
  foodLogs.push({
    id: saladLogId,
    food: 'Caesar salad',
    quantity: '1 large bowl',
    tags: ['dairy', 'gluten'],
    timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000),
    macros: { calories: 420, protein: 18, carbs: 28, fat: 26, fiber: 4 },
    portionWeight: 350,
  });

  // Generate symptoms (about 30, with some having photos and AI analysis)
  let previousRashId: string | undefined;
  
  for (let i = 0; i < 30; i++) {
    const foodLog = foodLogs[Math.floor(Math.random() * foodLogs.length)];
    const hoursLater = 1 + Math.random() * 5; // 1-6 hours after food
    
    const timestamp = new Date(foodLog.timestamp);
    timestamp.setHours(timestamp.getHours() + hoursLater);
    
    // Weighted symptom selection
    const weightedSymptoms = [
      ...Array(3).fill('cramps'),
      ...Array(3).fill('low energy'),
      ...Array(2).fill('hypoglycemia'),
      ...Array(2).fill('intestinal pinching'),
      ...Array(2).fill('bloating'),
      ...Array(2).fill('pain'),
      ...Array(1).fill('inflammation'),
      ...Array(1).fill('low concentration'),
      ...Array(1).fill('gas'),
      ...Array(1).fill('constipation'),
      ...Array(1).fill('diarrhea'),
      ...Array(1).fill('nausea'),
      ...Array(1).fill('heartburn'),
      ...Array(1).fill('rash'),
      ...Array(1).fill('pimple'),
      ...Array(1).fill('skin irritation'),
      ...Array(1).fill('sugar craving'),
    ];
    
    const symptomType = weightedSymptoms[Math.floor(Math.random() * weightedSymptoms.length)];
    const severity = (Math.floor(Math.random() * 5) + 3) as 3 | 4 | 5 | 6 | 7;
    const duration = durations[Math.floor(Math.random() * durations.length)];

    let notes: string | undefined;
    if (symptomType === 'intestinal pinching' && Math.random() > 0.5) {
      notes = 'Tea and oregano helps';
    } else if (symptomType === 'inflammation' && Math.random() > 0.5) {
      notes = 'Glutamine helps';
    } else if (Math.random() > 0.6) {
      notes = 'After eating';
    }

    const linkedFoodId = Math.random() > 0.4 ? foodLog.id : undefined;

    // Some symptoms have photos (especially skin-related)
    const hasPhoto = (symptomType === 'rash' || symptomType === 'pimple' || symptomType === 'skin irritation') && Math.random() > 0.3;
    
    const symptomId = crypto.randomUUID();
    const symptom: Symptom = {
      id: symptomId,
      type: symptomType,
      severity,
      duration,
      timestamp,
      notes,
      linkedFoodId,
    };
    
    // Link skin symptoms for evolution tracking
    if ((symptomType === 'rash' || symptomType === 'pimple') && previousRashId) {
      symptom.linkedSymptomId = previousRashId;
    }
    if (symptomType === 'rash' || symptomType === 'pimple') {
      previousRashId = symptomId;
    }
    
    // Add photo and AI analysis for skin symptoms
    if (hasPhoto) {
      symptom.photoUrl = createPlaceholderImage('#fee2e2');
      symptom.aiAnalysis = {
        description: `The photo shows ${symptomType === 'rash' ? 'a red, raised rash on the skin with small bumps' : 'a small raised pimple with redness around it'}. This appears to be a localized skin reaction.`,
        suggestion: 'Consider consulting a dermatologist if this persists or worsens. Keep tracking photos daily to monitor changes.',
        possibleCauses: [
          `May be related to recent consumption of ${foodLog.food.toLowerCase()} (dairy or processed foods can sometimes cause skin reactions)`,
          'Could be a reaction to environmental factors or stress',
        ],
        analysisTimestamp: timestamp,
      };
    } else if (symptomType === 'sugar craving') {
      // Add psychological flag example
      symptom.notes = (symptom.notes ? symptom.notes + '. ' : '') + 'Strong craving after seeing desserts';
    }

    symptoms.push(symptom);
  }
  
  // Add a specific rash symptom with photo and AI analysis (demo feature)
  const rashSymptomId = crypto.randomUUID();
  const rashTimestamp = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000);
  symptoms.push({
    id: rashSymptomId,
    type: 'rash',
    severity: 6,
    duration: '2 hours',
    timestamp: rashTimestamp,
    linkedFoodId: pizzaLogId,
    photoUrl: createPlaceholderImage('#fee2e2'),
    aiAnalysis: {
      description: 'The photo shows a red, raised rash with small bumps appearing on the forearm. The rash appears to be localized and somewhat inflamed.',
      suggestion: 'This type of rash may be a food reaction or contact dermatitis. Consider consulting a dermatologist if it persists beyond 24-48 hours or if you experience other symptoms like swelling or difficulty breathing. For now, avoid scratching and keep the area clean.',
      possibleCauses: [
        'May be related to recent consumption of pizza (dairy and gluten are common triggers for skin reactions)',
        'Could be a delayed reaction to something eaten 2-4 hours earlier',
        'Environmental factors or stress may also contribute',
      ],
      analysisTimestamp: rashTimestamp,
    },
    notes: 'Appeared about 2 hours after dinner',
  });

  // Generate context entries (about 20, with enhanced sleep data)
  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const timestamp = new Date(twoWeeksAgo);
    timestamp.setDate(timestamp.getDate() + daysAgo);
    timestamp.setHours(8 + Math.floor(Math.random() * 12), 0, 0, 0);

    const sleepQualities: Array<'poor' | 'ok' | 'good'> = ['poor', 'ok', 'good'];
    const stressLevels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
    const activityLevels: Array<'none' | 'light' | 'intense'> = ['none', 'light', 'intense'];

    // Create sleep times for some entries
    const hasSleepData = Math.random() > 0.4;
    let sleepStartTime: Date | undefined;
    let sleepEndTime: Date | undefined;
    let sleepQuality: 'poor' | 'ok' | 'good' | undefined;
    
    if (hasSleepData) {
      sleepQuality = sleepQualities[Math.floor(Math.random() * sleepQualities.length)];
      // Sleep from 22:00-23:30 to 6:00-8:00
      const sleepStart = new Date(timestamp);
      sleepStart.setDate(sleepStart.getDate() - 1);
      sleepStart.setHours(22 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
      sleepStartTime = sleepStart;
      
      sleepEndTime = new Date(timestamp);
      sleepEndTime.setHours(6 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
    }

    contexts.push({
      id: crypto.randomUUID(),
      sleepQuality,
      sleepStartTime,
      sleepEndTime,
      sleepDuration: sleepStartTime && sleepEndTime 
        ? (sleepEndTime.getTime() - sleepStartTime.getTime()) / (1000 * 60 * 60)
        : undefined,
      stressLevel: stressLevels[Math.floor(Math.random() * stressLevels.length)],
      activityLevel: activityLevels[Math.floor(Math.random() * activityLevels.length)],
      bowelMovement: Math.random() > 0.5,
      bowelType: Math.random() > 0.3 ? (['normal', 'loose', 'hard'][Math.floor(Math.random() * 3)] as 'normal' | 'loose' | 'hard') : undefined,
      timestamp,
      notes: Math.random() > 0.7 ? 'Feeling tired today' : undefined,
    });
  }
  
  // Add a recent context with complete sleep data
  const recentContextTimestamp = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  const recentSleepStart = new Date(now.getTime() - 15 * 60 * 60 * 1000);
  const recentSleepEnd = new Date(now.getTime() - 8 * 60 * 60 * 1000);
  contexts.push({
    id: crypto.randomUUID(),
    sleepQuality: 'good',
    sleepStartTime: recentSleepStart,
    sleepEndTime: recentSleepEnd,
    sleepDuration: 7,
    stressLevel: 'low',
    activityLevel: 'light',
    bowelMovement: true,
    bowelType: 'normal',
    timestamp: recentContextTimestamp,
    notes: 'Slept well last night, feeling refreshed',
  });

  // Generate sample realizations (5 examples)
  const realizationsData = [
    {
      content: 'I noticed that when I avoid dairy for a few days, my intestinal pinching reduces significantly. Tea with oregano seems to help when I do get symptoms.',
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      content: 'Glutamine supplements appear to help with inflammation. I\'ve been taking them during my Fish Focus experiment and symptoms are milder.',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      content: 'Symptoms typically appear 2-4 hours after eating, especially with processed foods or foods containing dairy.',
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      content: 'Stress and poor sleep seem to make my symptoms worse, even when eating the same foods.',
      timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      content: 'The rash I developed seems to be linked to pizza consumption. I\'ll avoid dairy for a week to see if it clears up.',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  realizationsData.forEach((r) => {
    realizations.push({
      id: crypto.randomUUID(),
      content: r.content,
      timestamp: r.timestamp,
    });
  });

  // Generate sample chat session (enhanced)
  const chatMessages: ChatMessage[] = [
    {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'What foods seem to trigger my symptoms most?',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Based on your logged data, I can see patterns where bloating and intestinal pinching often appear after consuming dairy products and processed foods. Specifically, you\'ve linked symptoms to pizza, mac and cheese, and ice cream multiple times. Your data shows these symptoms typically appear 2-4 hours after eating. Remember, this is based on patterns in your logged data only - not medical advice.',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 30000),
    },
    {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'How is my current experiment going?',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Your "Fish Focus" experiment has been active for 3 days. During this period, you\'ve logged fewer instances of bloating and intestinal pinching compared to the two weeks before starting the experiment. This could indicate a positive pattern, but you\'ll need more data points to draw meaningful conclusions. Keep tracking to see if this trend continues!',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 30000),
    },
    {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'I got a rash yesterday. What should I do?',
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'I can see you logged a rash about 2 hours after having pizza. The AI analysis of your photo suggests it may be a food reaction. While this is not medical advice, it would be wise to: 1) Avoid dairy and gluten for a few days to see if the rash clears, 2) Monitor the rash and take daily photos to track changes, 3) Consider consulting a dermatologist if it persists or worsens. Your linked food log shows pizza was consumed right before this, which could be a potential trigger.',
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000 + 30000),
    },
  ];

  const chatSession: ChatSession | null = chatMessages.length > 0 ? {
    id: crypto.randomUUID(),
    messages: chatMessages,
    createdAt: chatMessages[0].timestamp,
    updatedAt: chatMessages[chatMessages.length - 1].timestamp,
  } : null;

  // Add sample knowledge sources (good digestive health resources)
  const sourcesData: Omit<Source, 'id' | 'addedAt'>[] = [
    {
      title: 'The Mind-Gut Connection',
      type: 'book',
      author: 'Emeran Mayer',
      description: 'How the hidden conversation within our bodies impacts our mood, our choices, and our overall health.',
      url: 'https://www.emersonmayer.com/mind-gut-connection',
      content: 'The gut-brain axis is a bidirectional communication system between the central nervous system and the enteric nervous system. This connection influences mood, digestion, and overall health. Key concepts: microbiome diversity, stress impact on digestion, food-mood connections.',
      tags: ['gut-brain axis', 'microbiome', 'digestive health', 'mental health'],
    },
    {
      title: 'The Gut Balance Revolution',
      type: 'book',
      author: 'Gerard Mullin',
      description: 'A comprehensive guide to healing your digestive system and improving overall health through diet and lifestyle.',
      url: 'https://www.drgerardmullin.com/books',
      content: 'Restoring gut balance through dietary changes, probiotics, and lifestyle modifications. Covers elimination diets, food sensitivities, inflammatory foods, and healing protocols for digestive disorders.',
      tags: ['gut health', 'elimination diet', 'probiotics', 'inflammation'],
    },
    {
      title: 'IBS: The Complete Guide to Managing Irritable Bowel Syndrome',
      type: 'article',
      author: 'Monash University FODMAP Team',
      description: 'Evidence-based guide to the low FODMAP diet for IBS management.',
      url: 'https://www.monashfodmap.com',
      content: 'FODMAPs (Fermentable Oligosaccharides, Disaccharides, Monosaccharides and Polyols) are short-chain carbohydrates that can trigger digestive symptoms in sensitive individuals. The low FODMAP diet involves elimination and reintroduction phases to identify trigger foods.',
      tags: ['IBS', 'FODMAP', 'diet', 'symptoms'],
    },
    {
      title: 'The Elimination Diet',
      type: 'book',
      author: 'Tom Malterre & Alissa Segersten',
      description: 'Discover the foods that are making you sick and tired.',
      url: 'https://www.nourishingmeals.com/elimination-diet',
      content: 'Systematic approach to identifying food sensitivities through elimination and reintroduction. Common trigger foods include dairy, gluten, soy, corn, eggs, and nightshades. The process typically takes 4-6 weeks.',
      tags: ['elimination diet', 'food sensitivities', 'inflammation', 'autoimmune'],
    },
    {
      title: 'Harvard Health: Understanding Your Digestive System',
      type: 'article',
      author: 'Harvard Medical School',
      description: 'Educational resource about how the digestive system works and common disorders.',
      url: 'https://www.health.harvard.edu/topics/digestive-health',
      content: 'Overview of digestive anatomy and function, common digestive disorders (IBS, IBD, GERD), and evidence-based treatment approaches. Covers the role of fiber, hydration, and regular eating patterns in digestive health.',
      tags: ['digestive system', 'education', 'disorders', 'nutrition'],
    },
    {
      title: 'Nourishing Traditions',
      type: 'book',
      author: 'Sally Fallon Morell',
      description: 'The cookbook that challenges politically correct nutrition and the diet dictocrats.',
      url: 'https://www.westonaprice.org',
      content: 'Traditional food preparation methods, fermentation, and nutrient-dense foods. Emphasis on whole foods, bone broths, fermented foods, and avoiding processed foods. Focus on digestive health through proper food preparation.',
      tags: ['traditional foods', 'fermentation', 'nutrition', 'whole foods'],
    },
  ];

  sourcesData.forEach((source) => {
    sources.push({
      id: crypto.randomUUID(),
      ...source,
      addedAt: new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000), // Random time in last 2 weeks
    });
  });

  // Sort all by timestamp
  foodLogs.sort((a, b) => {
    const aTime = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const bTime = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return bTime.getTime() - aTime.getTime();
  });
  symptoms.sort((a, b) => {
    const aTime = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const bTime = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return bTime.getTime() - aTime.getTime();
  });
  contexts.sort((a, b) => {
    const aTime = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const bTime = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return bTime.getTime() - aTime.getTime();
  });
  experiments.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  realizations.sort((a, b) => {
    const aTime = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const bTime = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return bTime.getTime() - aTime.getTime();
  });

  return { foodLogs, symptoms, contexts, experiments, realizations, chatSession, sources };
}