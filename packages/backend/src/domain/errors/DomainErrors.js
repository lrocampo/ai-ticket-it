export class DomainValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = "DomainValidationError"
  }
}

export class DomainRuleError extends Error {
  constructor(message) {
    super(message)
    this.name = "DomainRuleError"
  }
}
