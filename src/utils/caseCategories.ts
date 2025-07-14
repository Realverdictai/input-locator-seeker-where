export interface CaseCategory {
  value: string;
  label: string;
  subCategories: string[];
}

export const caseCategories: CaseCategory[] = [
  {
    value: 'auto-accident',
    label: 'Auto Accident',
    subCategories: [
      'Rear-End Collision',
      'T-Bone/Broadside',
      'Head-On Collision',
      'Sideswipe',
      'Multi-Vehicle Pileup',
      'Hit and Run',
      'Rollover',
      'Pedestrian Strike',
      'Bicycle vs Auto'
    ]
  },
  {
    value: 'premises-liability',
    label: 'Premises Liability',
    subCategories: [
      'Slip on Wet Surface',
      'Trip on Uneven Surface',
      'Stairway Fall',
      'Escalator/Elevator',
      'Falling Object',
      'Construction Site Accident',
      'Swimming Pool Incident'
    ]
  },
  {
    value: 'dog-bite',
    label: 'Dog Bite',
    subCategories: ['Dog Bite/Attack']
  },
  {
    value: 'wrongful-death',
    label: 'Wrongful Death',
    subCategories: ['Motor Vehicle', 'Premises Liability', 'Medical Negligence']
  },
  {
    value: 'assault-battery',
    label: 'Assault/Battery',
    subCategories: ['Physical Assault', 'Sexual Assault']
  }
];
