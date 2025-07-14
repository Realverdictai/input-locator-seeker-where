export interface CaseCategory {
  value: string;
  label: string;
  subCategories: string[];
}

export const caseCategories: CaseCategory[] = [
  { value: "auto-accident", label: "Auto Accident", subCategories: [] },
  { value: "dog-bite", label: "Dog Bite", subCategories: [] },
  { value: "slip-and-fall", label: "Slip and Fall", subCategories: [] },
  { value: "trip-and-fall", label: "Trip and Fall", subCategories: [] },
  {
    value: "homeowner-premises",
    label: "Homeowner Premises",
    subCategories: [],
  },
  {
    value: "construction-injury",
    label: "Construction Injury",
    subCategories: [],
  },
  { value: "wrongful-death", label: "Wrongful Death", subCategories: [] },
  { value: "assault-battery", label: "Assault/Battery", subCategories: [] },
  { value: "other", label: "Other", subCategories: [] },
];
