export const MALE_WEIGHT_CLASSES = [
  { name: 'Strawweight', limit: 115 },
  { name: 'Flyweight', limit: 125 },
  { name: 'Bantamweight', limit: 135 },
  { name: 'Featherweight', limit: 145 },
  { name: 'Lightweight', limit: 155 },
  { name: 'Welterweight', limit: 170 },
  { name: 'Middleweight', limit: 185 },
  { name: 'Light Heavyweight', limit: 205 },
  { name: 'Heavyweight', limit: 265 },
  { name: 'Super Heavyweight', limit: 999 }
];

export const FEMALE_WEIGHT_CLASSES = [
  { name: 'Atomweight', limit: 105 },
  { name: 'Strawweight', limit: 115 },
  { name: 'Flyweight', limit: 125 },
  { name: 'Bantamweight', limit: 135 },
  { name: 'Featherweight', limit: 145 },
  { name: 'Lightweight', limit: 155 },
  { name: 'Welterweight', limit: 170 },
  { name: 'Middleweight', limit: 185 }
];

export function getWeightClassInfo(gender: string = 'Male', weight: number) {
  const classes = gender === 'Female' ? FEMALE_WEIGHT_CLASSES : MALE_WEIGHT_CLASSES;
  
  if (!weight || isNaN(weight)) {
    return { currentClass: classes[classes.length - 1], nextClassDown: null };
  }

  const currentIdx = classes.findIndex(c => weight <= c.limit);
  const currentClass = classes[currentIdx !== -1 ? currentIdx : classes.length - 1];
  const nextClassDown = currentIdx > 0 ? classes[currentIdx - 1] : null;
  
  return { currentClass, nextClassDown };
}
