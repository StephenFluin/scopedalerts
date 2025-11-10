import { Component, input, computed } from '@angular/core';
import { ValidationError } from '@angular/forms/signals';

@Component({
  selector: 'app-validation-errors',
  template: `
    @if (shouldShowErrors()) {
    <div class="validation-errors">
      @for(message of errorMessages(); track message) {
      <div>{{ message }}</div>
      }
    </div>
    }
  `,
  styles: `
    .validation-errors {
      color: var(--color-error-600);
      font-size: var(--font-size-sm);
      margin-top: var(--spacing-xs);
    }
    
    .validation-errors div {
      margin-bottom: var(--spacing-xs);
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  `,
})
export class ValidationErrorsComponent {
  field = input<any>(); // The field signal or field state from the form
  submitted = input<boolean>(false);

  private fieldState = computed(() => {
    const field = this.field();
    if (!field) return null;
    // Check if it's a function (field signal) or direct field state
    return typeof field === 'function' ? field() : field;
  });

  errorMessages = computed(() => {
    const fieldState = this.fieldState();
    return fieldState ? toErrorMessages(fieldState.errors()) : [];
  });

  shouldShowErrors = computed(() => {
    const fieldState = this.fieldState();
    if (!fieldState) return false;

    const hasErrors = fieldState.errors().length > 0;
    const isFieldTouched = fieldState.touched();
    const isFormSubmitted = this.submitted();

    return hasErrors && (isFieldTouched || isFormSubmitted);
  });
}

function toErrorMessages(errors: ValidationError[]): string[] {
  return errors.map((error) => {
    return error.message ?? toMessage(error);
  });
}

function toMessage(error: ValidationError): string {
  switch (error.kind) {
    case 'required':
      return 'This field is required';
    case 'pattern':
      return 'Invalid format';
    case 'minlength':
      return `Minimum length not met`;
    default:
      return error.kind ?? 'Validation Error';
  }
}
