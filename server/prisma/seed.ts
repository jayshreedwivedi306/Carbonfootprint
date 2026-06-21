/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const suggestions = [
  // TRAVEL
  {
    title: 'Walk or cycle short distances',
    description: 'Replace car trips under 2 miles with walking or cycling to eliminate tailpipe emissions completely.',
    category: 'TRAVEL',
    reductionPotential: 5.0, // kg CO2 per week
  },
  {
    title: 'Carpool for commutes',
    description: 'Share your daily commute with coworkers or friends to halve your travel emissions.',
    category: 'TRAVEL',
    reductionPotential: 12.0,
  },
  {
    title: 'Use public transit weekly',
    description: 'Take the bus or train instead of driving for your work commute at least once a week.',
    category: 'TRAVEL',
    reductionPotential: 15.0,
  },
  // ENERGY
  {
    title: 'Switch to LED lightbulbs',
    description: 'Replace old incandescent bulbs with energy-efficient LEDs, which use up to 75% less energy.',
    category: 'ENERGY',
    reductionPotential: 3.5,
  },
  {
    title: 'Lower thermostat by 2 degrees',
    description: 'Set your home temperature 2 degrees cooler in winter or warmer in summer to reduce heating/cooling loads.',
    category: 'ENERGY',
    reductionPotential: 8.0,
  },
  {
    title: 'Unplug vampire electronics',
    description: 'Unplug electronics, power strips, and chargers when not in use to eliminate standby energy draw.',
    category: 'ENERGY',
    reductionPotential: 2.0,
  },
  // DIET
  {
    title: 'Implement Meatless Mondays',
    description: 'Go vegetarian or vegan for at least one day a week to reduce agricultural footprint.',
    category: 'DIET',
    reductionPotential: 7.0,
  },
  {
    title: 'Reduce food waste',
    description: 'Plan meals, store food properly, and compost organic waste to prevent landfill methane emissions.',
    category: 'DIET',
    reductionPotential: 4.5,
  },
  {
    title: 'Switch to plant-based milk',
    description: 'Choose oat, almond, or soy milk over dairy milk for your daily drinks.',
    category: 'DIET',
    reductionPotential: 3.0,
  },
];

async function main() {
  console.log('Seeding suggestions...');
  // Clear suggestions and recreate
  await prisma.suggestion.deleteMany({});
  for (const s of suggestions) {
    await prisma.suggestion.create({ data: s });
  }
  console.log('Suggestions seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
