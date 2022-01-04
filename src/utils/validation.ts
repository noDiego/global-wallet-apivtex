export function validateCardNumber(number: string) {
  const cardValidator = require('card-validator');
  if (!number) return true;
  const numberValidation = cardValidator.number(number);
  return numberValidation.isValid;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function cleanObject<T>(obj: T): T {
  for (const key in obj) {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  }
  return obj;
}

export function clone<T>(a: T): T {
  return JSON.parse(JSON.stringify(a));
}
