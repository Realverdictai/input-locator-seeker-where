export const caseCategoryHierarchy: Record<string, { label: string; sub: { value: string; label: string }[] }> = {
  "motor-vehicle": {
    label: "Motor Vehicle / Transportation",
    sub: [
      { value: "auto-accident", label: "Auto Accident" },
      { value: "motorcycle-accident", label: "Motorcycle Accident" },
      { value: "truck-accident", label: "Commercial Truck Accident" },
      { value: "bicycle-accident", label: "Bicycle Accident" },
      { value: "pedestrian-accident", label: "Pedestrian Accident" },
      { value: "rideshare-accident", label: "Rideshare Accident" },
      { value: "boating-accident", label: "Boating/Maritime Accident" },
      { value: "aviation-accident", label: "Aviation Accident" },
      { value: "train-accident", label: "Train/Railroad Accident" }
    ]
  },
  "premises-liability": {
    label: "Premises Liability",
    sub: [
      { value: "slip-fall", label: "Slip and Fall" },
      { value: "trip-fall", label: "Trip and Fall" },
      { value: "dangerous-condition", label: "Dangerous Condition" },
      { value: "negligent-security", label: "Negligent Security" },
      { value: "swimming-pool", label: "Swimming Pool Accident" },
      { value: "homeowner-premises", label: "Homeowner Premises" }
    ]
  },
  "medical-malpractice": {
    label: "Medical Malpractice",
    sub: [
      { value: "surgical-error", label: "Surgical Error" },
      { value: "misdiagnosis", label: "Misdiagnosis" },
      { value: "birth-injury", label: "Birth Injury" },
      { value: "medication-error", label: "Medication Error" },
      { value: "anesthesia-error", label: "Anesthesia Error" },
      { value: "hospital-negligence", label: "Hospital Negligence" },
      { value: "informed-consent", label: "Lack of Informed Consent" }
    ]
  },
  "nursing-home": {
    label: "Nursing Home",
    sub: [
      { value: "nursing-home-neglect", label: "Nursing Home Neglect" },
      { value: "nursing-home-abuse", label: "Nursing Home Abuse" }
    ]
  },
  "product-liability": {
    label: "Product Liability",
    sub: [
      { value: "defective-auto-part", label: "Defective Auto Part" },
      { value: "consumer-product", label: "Consumer Product" },
      { value: "medical-device", label: "Defective Medical Device" },
      { value: "pharmaceutical", label: "Pharmaceutical" },
      { value: "toxic-exposure", label: "Toxic Exposure" },
      { value: "food-poisoning", label: "Food Poisoning" }
    ]
  },
  "workers-compensation": {
    label: "Workers Compensation",
    sub: [
      { value: "workplace-accident", label: "Workplace Accident" },
      { value: "construction-accident", label: "Construction Accident" },
      { value: "repetitive-stress", label: "Repetitive Stress" },
      { value: "chemical-exposure", label: "Chemical Exposure" }
    ]
  },
  "intentional-tort": {
    label: "Intentional Tort",
    sub: [
      { value: "assault-battery", label: "Assault/Battery" },
      { value: "defamation-libel", label: "Defamation/Libel" }
    ]
  },
  "other-personal-injury": {
    label: "Other Personal Injury",
    sub: [
      { value: "dog-bite", label: "Dog Bite" },
      { value: "sports-injury", label: "Sports/Recreation Injury" },
      { value: "school-daycare", label: "School or Daycare Incident" },
      { value: "government-liability", label: "Government Liability" },
      { value: "wrongful-death", label: "Wrongful Death" },
      { value: "other", label: "Other" }
    ]
  }
};
