import { FoodLog, Symptom, Context, Experiment } from '@/types';

const foodOptions = [
  { food: 'Oatmeal with banana', quantity: '1 bowl', tags: ['gluten', 'fiber-rich'] },
  { food: 'Greek yogurt with berries', quantity: '1 cup', tags: ['dairy'] },
  { food: 'Scrambled eggs with toast', quantity: '2 eggs, 2 slices', tags: ['gluten', 'processed'] },
  { food: 'Avocado toast', quantity: '2 slices', tags: ['gluten', 'fatty'] },
  { food: 'Pancakes with maple syrup', quantity: '3 pancakes', tags: ['gluten', 'processed'] },
  { food: 'Smoothie bowl', quantity: '1 bowl', tags: ['dairy', 'fiber-rich'] },
  { food: 'Bagel with cream cheese', quantity: '1 bagel', tags: ['dairy', 'gluten', 'processed'] },
  { food: 'French toast', quantity: '2 slices', tags: ['gluten', 'dairy', 'processed'] },
  { food: 'Granola with milk', quantity: '1 bowl', tags: ['dairy', 'gluten', 'processed'] },
  
  { food: 'Chicken salad sandwich', quantity: '1 sandwich', tags: ['gluten', 'processed'] },
  { food: 'Pasta with marinara sauce', quantity: '1 bowl', tags: ['gluten'] },
  { food: 'Grilled chicken with rice', quantity: '1 plate', tags: [] },
  { food: 'Pizza slice', quantity: '2 slices', tags: ['dairy', 'gluten', 'processed'] },
  { food: 'Burger with fries', quantity: '1 burger', tags: ['gluten', 'fatty', 'processed'] },
  { food: 'Sushi rolls', quantity: '8 pieces', tags: ['raw'] },
  { food: 'Caesar salad', quantity: '1 large bowl', tags: ['dairy', 'gluten'] },
  { food: 'Tacos', quantity: '3 tacos', tags: ['gluten', 'spicy', 'fatty'] },
  { food: 'Pad Thai', quantity: '1 plate', tags: ['gluten', 'spicy', 'processed'] },
  { food: 'Soup and salad', quantity: '1 bowl soup', tags: ['gluten', 'processed'] },
  { food: 'Wrap with vegetables', quantity: '1 wrap', tags: ['gluten', 'fiber-rich'] },
  
  { food: 'Grilled salmon with vegetables', quantity: '1 fillet', tags: ['fatty'] },
  { food: 'Baked fish', quantity: '1 fillet', tags: [] },
  { food: 'Fish and vegetables', quantity: '1 portion', tags: [] },
  { food: 'Tuna salad', quantity: '1 bowl', tags: ['fiber-rich'] },
  { food: 'Grilled fish', quantity: '1 fillet', tags: [] },
  { food: 'Pasta carbonara', quantity: '1 bowl', tags: ['dairy', 'gluten', 'fatty', 'processed'] },
  { food: 'Stir-fry with tofu', quantity: '1 plate', tags: ['spicy', 'fiber-rich'] },
  { food: 'Lasagna', quantity: '1 slice', tags: ['dairy', 'gluten', 'processed'] },
  { food: 'Chicken curry with rice', quantity: '1 plate', tags: ['spicy'] },
  { food: 'Mac and cheese', quantity: '1 bowl', tags: ['dairy', 'gluten', 'processed'] },
  { food: 'Burrito', quantity: '1 large', tags: ['gluten', 'dairy', 'spicy', 'processed'] },
  { food: 'Ramen', quantity: '1 bowl', tags: ['gluten', 'processed'] },
  { food: 'Fajitas', quantity: '1 plate', tags: ['gluten', 'spicy'] },
  { food: 'Fish and chips', quantity: '1 portion', tags: ['gluten', 'fatty', 'processed'] },
  
  { food: 'Ice cream', quantity: '1 cup', tags: ['dairy'] },
  { food: 'Chocolate chip cookies', quantity: '3 cookies', tags: ['gluten', 'dairy', 'processed'] },
  { food: 'Cheesecake', quantity: '1 slice', tags: ['dairy', 'fatty', 'processed'] },
  { food: 'Brownies', quantity: '2 pieces', tags: ['gluten', 'processed'] },
  { food: 'Yogurt parfait', quantity: '1 cup', tags: ['dairy', 'fiber-rich'] },
  { food: 'Fruit salad', quantity: '1 bowl', tags: ['fiber-rich'] },
  { food: 'Popcorn', quantity: '1 bowl', tags: ['fiber-rich', 'processed'] },
  { food: 'Chips and salsa', quantity: '1 bowl', tags: ['spicy', 'processed'] },
  { food: 'Mixed nuts', quantity: '1 handful', tags: ['fatty'] },
  { food: 'Dark chocolate', quantity: '2 squares', tags: ['processed'] },
  
  { food: 'Coffee with cream', quantity: '1 cup', tags: ['dairy'] },
  { food: 'Green smoothie', quantity: '1 glass', tags: ['fiber-rich'] },
  { food: 'Tea with honey', quantity: '1 cup', tags: [] },
  { food: 'Orange juice', quantity: '1 glass', tags: ['fiber-rich'] },
  { food: 'Protein shake', quantity: '1 serving', tags: ['dairy', 'processed'] },
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
  'inflammation'
];
const durations = ['30 minutes', '1 hour', '2 hours', '3 hours', '4 hours', 'half day'];

export function generateSampleData(): { foodLogs: FoodLog[]; symptoms: Symptom[]; contexts: Context[]; experiments: Experiment[] } {
  const foodLogs: FoodLog[] = [];
  const symptoms: Symptom[] = [];
  const contexts: Context[] = [];
  const experiments: Experiment[] = [];
  
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
  
  experiments.push({
    id: crypto.randomUUID(),
    name: 'No Dairy',
    startDate: noDairyStart,
    endDate: noDairyEnd,
    active: false,
    notes: 'Testing if removing dairy reduces bloating and intestinal pinching',
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
  
  experiments.push({
    id: crypto.randomUUID(),
    name: 'Fish Focus',
    startDate: fishFocusStart,
    endDate: undefined,
    active: true,
    notes: 'Eating fish twice a week, focusing on anti-inflammatory foods. Glutamine supplements.',
  });

  // Generate 50 food logs over 2 weeks
  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    
    const timestamp = new Date(twoWeeksAgo);
    timestamp.setDate(timestamp.getDate() + daysAgo);
    timestamp.setHours(hours, minutes, 0, 0);

    const foodOption = foodOptions[Math.floor(Math.random() * foodOptions.length)];
    
    foodLogs.push({
      id: crypto.randomUUID(),
      food: foodOption.food,
      quantity: foodOption.quantity,
      tags: foodOption.tags,
      timestamp,
      notes: Math.random() > 0.7 ? 'Had this for lunch' : undefined,
    });
  }

  // Generate some symptoms (about 25, correlated with food times and realistic patterns)
  for (let i = 0; i < 25; i++) {
    const foodLog = foodLogs[Math.floor(Math.random() * foodLogs.length)];
    const hoursLater = 1 + Math.random() * 5; // 1-6 hours after food
    
    const timestamp = new Date(foodLog.timestamp);
    timestamp.setHours(timestamp.getHours() + hoursLater);
    
    // Weighted symptom selection - more common symptoms appear more often
    const weightedSymptoms = [
      ...Array(3).fill('cramps'), // Common
      ...Array(3).fill('low energy'), // Common
      ...Array(2).fill('hypoglycemia'), // Common with digestive issues
      ...Array(2).fill('intestinal pinching'), // Specific to user
      ...Array(2).fill('bloating'), // Common
      ...Array(2).fill('pain'), // Common
      ...Array(1).fill('inflammation'),
      ...Array(1).fill('low concentration'),
      ...Array(1).fill('gas'),
      ...Array(1).fill('constipation'),
      ...Array(1).fill('diarrhea'),
      ...Array(1).fill('nausea'),
      ...Array(1).fill('heartburn'),
    ];
    
    const symptomType = weightedSymptoms[Math.floor(Math.random() * weightedSymptoms.length)];
    const severity = (Math.floor(Math.random() * 5) + 3) as 3 | 4 | 5 | 6 | 7; // 3-7
    const duration = durations[Math.floor(Math.random() * durations.length)];

    // Add helpful notes for some symptoms
    let notes: string | undefined;
    if (symptomType === 'intestinal pinching' && Math.random() > 0.5) {
      notes = 'Tea and oregano helps';
    } else if (symptomType === 'inflammation' && Math.random() > 0.5) {
      notes = 'Glutamine helps';
    } else if (Math.random() > 0.6) {
      notes = 'After eating';
    }

    // Link some symptoms to the food that may have caused them (60% chance)
    const linkedFoodId = Math.random() > 0.4 ? foodLog.id : undefined;

    symptoms.push({
      id: crypto.randomUUID(),
      type: symptomType,
      severity,
      duration,
      timestamp,
      notes,
      linkedFoodId,
    });
  }

  // Generate some context entries (about 15)
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const timestamp = new Date(twoWeeksAgo);
    timestamp.setDate(timestamp.getDate() + daysAgo);
    timestamp.setHours(8 + Math.floor(Math.random() * 12), 0, 0, 0); // Morning/afternoon

    const sleepQualities: Array<'poor' | 'ok' | 'good'> = ['poor', 'ok', 'good'];
    const stressLevels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
    const activityLevels: Array<'none' | 'light' | 'intense'> = ['none', 'light', 'intense'];

    contexts.push({
      id: crypto.randomUUID(),
      sleepQuality: sleepQualities[Math.floor(Math.random() * sleepQualities.length)],
      stressLevel: stressLevels[Math.floor(Math.random() * stressLevels.length)],
      activityLevel: activityLevels[Math.floor(Math.random() * activityLevels.length)],
      bowelMovement: Math.random() > 0.5,
      timestamp,
    });
  }

  // Sort all by timestamp
  foodLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  symptoms.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  contexts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  experiments.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

  return { foodLogs, symptoms, contexts, experiments };
}

