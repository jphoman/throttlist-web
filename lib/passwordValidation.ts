export interface PasswordChecks {
  minLength: boolean    // >= 12 chars
  hasUppercase: boolean // [A-Z]
  hasLowercase: boolean // [a-z]
  hasNumber: boolean    // [0-9]
  hasSpecial: boolean   // [!@#$%^&*]
  noSpaces: boolean     // no whitespace
}

export interface PasswordValidation {
  isValid: boolean
  checks: PasswordChecks
  strength: 'weak' | 'medium' | 'strong'
}

export function validatePassword(password: string): PasswordValidation {
  const checks: PasswordChecks = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*]/.test(password),
    noSpaces: !/\s/.test(password),
  }

  const passedCount = Object.values(checks).filter(Boolean).length

  let strength: 'weak' | 'medium' | 'strong'
  if (passedCount <= 2) {
    strength = 'weak'
  } else if (passedCount <= 4) {
    strength = 'medium'
  } else {
    strength = 'strong'
  }

  const isValid = Object.values(checks).every(Boolean)

  return { isValid, checks, strength }
}
