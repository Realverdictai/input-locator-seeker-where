export const caseCategoryHierarchy: Record<string, { label: string; sub: { value: string; label: string }[] }> = {
  "personal-injury": {
    label: "Personal Injury",
    sub: [
      { value: "motor-vehicle", label: "Motor Vehicle" },
      { value: "dog-bite", label: "Dog Bite" },
      { value: "assault-battery", label: "Assault/Battery" }
    ]
  },
  "workers-compensation": {
    label: "Workers Compensation",
    sub: [
      { value: "industrial-accident", label: "Industrial Accident" },
      { value: "repetitive-stress", label: "Repetitive Stress" },
      { value: "chemical-exposure", label: "Chemical Exposure" }
    ]
  },
  "medical-malpractice": {
    label: "Medical Malpractice",
    sub: [
      { value: "surgical-error", label: "Surgical Error" },
      { value: "misdiagnosis", label: "Misdiagnosis" },
      { value: "birth-injury", label: "Birth Injury" },
      { value: "medication-error", label: "Medication Error" }
    ]
  },
  "product-liability": {
    label: "Product Liability",
    sub: [
      { value: "defective-auto-part", label: "Defective Auto Part" },
      { value: "pharmaceutical", label: "Pharmaceutical" },
      { value: "consumer-product", label: "Consumer Product" }
    ]
  },
  "premises-liability": {
    label: "Premises Liability",
    sub: [
      { value: "slip-trip-fall", label: "Slip/Trip & Fall" },
      { value: "negligent-security", label: "Negligent Security" },
      { value: "dangerous-condition", label: "Dangerous Condition" }
    ]
  }
};

