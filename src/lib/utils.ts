import type { CustomValidator, InputDataType, ValidationState } from '$lib/types';

/**
 * @description A common function to validate value provided inside the input component
 * @param inputValue String value coming from input field
 * @param dataType Datatype of the value being entered in the input component
 * @param validPattern Regular expression which is supposed to be applied on the input string
 * @param inProgressPattern Regular expression which is supposed to be applied on the input string while input is in progress
 * @param customValidators Array of customer validator functions
 * @returns ValidationState : InProgress | Valid | Invalid
 */

export function validateInput(
  inputValue: string,
  dataType: InputDataType,
  validPattern: RegExp | null,
  inProgressPattern: RegExp | null,
  customValidators: CustomValidator[]
): ValidationState {
  let validationResult: ValidationState = 'Valid';

  switch (dataType) {
    case 'email':
      validationResult = validateEmailInput(inputValue);
      break;

    case 'tel':
      validationResult =
        validPattern === null
          ? validatePhoneNumber(inputValue)
          : validateTextWithPattern(inputValue, validPattern, inProgressPattern);
      break;

    case 'password':
      validationResult = validatePassword(inputValue, validPattern, inProgressPattern);
      break;

    case 'text':
      validationResult = validateTextWithPattern(inputValue, validPattern, inProgressPattern);
      break;
  }

  customValidators.forEach((validator: CustomValidator) => {
    const currentResult = validator(inputValue, validationResult);
    if (currentResult === 'Invalid') {
      validationResult = 'Invalid';
    } else if (currentResult === 'InProgress') {
      validationResult = 'InProgress';
    } else {
      validationResult =
        validationResult === 'Valid' && currentResult === 'Valid' ? 'Valid' : validationResult;
    }
  });

  return validationResult;
}

/**
 * @description Validates input string against passed RegExp
 * @param inputValue string
 * @param validationPattern RegExp for valid input
 * @param inProgressPattern RegExp for inprogress input
 * @returns ValidationState
 */

function validateTextWithPattern(
  inputValue: string,
  validationPattern: RegExp | null,
  inProgressPattern: RegExp | null
): ValidationState {
  if (validationPattern !== null) {
    if (validationPattern.test(inputValue)) {
      return 'Valid';
    } else if (
      (inProgressPattern !== null && inProgressPattern.test(inputValue)) ||
      inputValue.length === 0
    ) {
      return 'InProgress';
    } else {
      return 'Invalid';
    }
  }
  return 'Valid';
}

/**
 * @description Validates password string against passed RegExp
 * @param password string
 * @param validationPattern RegExp for valid input
 * @param inProgressPattern RegExp for inprogress input
 * @returns ValidationState
 */
function validatePassword(
  password: string,
  validationPattern: RegExp | null,
  inProgressPattern: RegExp | null
): ValidationState {
  if (validationPattern !== null) {
    if (validationPattern.test(password)) {
      return 'Valid';
    } else if (
      inProgressPattern !== null &&
      inProgressPattern.test(password) &&
      password.length === 0
    ) {
      return 'InProgress';
    } else {
      return 'Invalid';
    }
  }
  return 'Valid';
}

/**
 * @description Validates an email input based upon RF 5322 Email format
 * @param emailId String
 * @returns ValidationState
 */
function validateEmailInput(emailId: string): ValidationState {
  try {
    /**
     * @description Using RFC 5322 Format for validation
     * @tutorial https://www.regextester.com/115911
     * @tutorial https://emailregex.com/
     * @tutorial https://stackoverflow.com/questions/42982005/email-address-regular-expression-rfc-5322-passed-in-to-match-does-not-work
     * @tutorial https://www.regular-expressions.info/email.html
     */
    const validPattern = new RegExp(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
    const inProgressPattern = new RegExp(/[^ ]{1,}[\w0-9.,_,@]{0,}/);
    if (validPattern.test(emailId)) {
      return 'Valid';
    } else if (inProgressPattern.test(emailId) || emailId.length === 0) {
      return 'InProgress';
    } else {
      return 'Invalid';
    }
  } catch (e) {
    console.error('Email Regex creation failed: ', e);
  }
  return 'Valid';
}

/**
 * @description Validates Indian phone numbers
 * @todo Update Regex to take different variations of input in next update
 * @link https://stackoverflow.com/questions/18351553/regular-expression-validation-for-indian-phone-number-and-mobile-number
 * @param phoneNumber
 * @returns ValidationState
 */
function validatePhoneNumber(phoneNumber: string): ValidationState {
  let validationPattern: RegExp | null = null;
  let inProgressPattern: RegExp | null = null;
  try {
    validationPattern = new RegExp('^[6-9]{1}[0-9]{9}$');
    inProgressPattern = new RegExp('^[6-9]{1}[0-9]{0,9}$');
    if (validationPattern.test(phoneNumber)) {
      return 'Valid';
    } else if (inProgressPattern.test(phoneNumber) || phoneNumber.length === 0) {
      return 'InProgress';
    } else {
      return 'Invalid';
    }
  } catch (e) {
    console.error('Phone Regex creation failed', e);
  }
  return phoneNumber.length === 10 ? 'Valid' : phoneNumber.length > 10 ? 'InProgress' : 'Invalid';
}


/**
 * @description Creates a debouncer function that delays invoking the provided callback until a specified delay period has elapsed since the last invocation.
 * @param delay The delay period in milliseconds before invoking the callback.
 * @returns A debouncer function that accepts a callback and delays its invocation based on the specified delay.
 */
export function createDebouncer(delay: number) {
  let lastCallTime = 0;
  return function(callback: Function, ...args: any[]) {
        const now = Date.now();
        if (now - lastCallTime > delay) {
          lastCallTime = now;
          callback(...args);
        }
    };
}
