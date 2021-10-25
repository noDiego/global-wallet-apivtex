export function validateCardNumber(number: string){
    const cardValidator = require("card-validator");
    var numberValidation = cardValidator.number(number);
    return numberValidation.isValid;
}
