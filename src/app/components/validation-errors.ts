import { Component, input, computed } from '@angular/core';
import { ValidationError } from '@angular/forms/signals';

@Component({
  selector: 'app-validation-errors',
  template: `
    @if (errorMessages().length > 0) {
    <div class="validation-errors">
      @for(message of errorMessages(); track message) {
      <div>{{ message }}</div>
      }
    </div>
    }
  `,
  styles: `
    .validation-errors {
      color: #f44336;
      font-size: 0.875rem;
      margin-top: 4px;
    }
    
    .validation-errors div {
      margin-bottom: 2px;
    }
  `,
})
export class ValidationErrorsComponent {
  errors = input.required<ValidationError[]>();

  errorMessages = computed(() => toErrorMessages(this.errors()));
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
