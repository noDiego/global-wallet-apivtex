export function validateCardNumber(number: string) {
  const cardValidator = require('card-validator');
  if (!number) return false;
  const numberValidation = cardValidator.number(number);
  return numberValidation.isValid;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
