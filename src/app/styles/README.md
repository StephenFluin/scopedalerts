# Forms Stylesheet

A comprehensive, reusable stylesheet for forms and buttons that can be imported into any Angular component that needs form functionality.

## Installation

Import this stylesheet in your component's SCSS file:

```scss
// Use the shared forms stylesheet
@use '../../../styles/forms.scss';
```

## Available Classes

### Form Layout

#### `.form-container`

Main form wrapper with proper max-width and centering.

#### `.form-header`

Header section with title and optional description.

```html
<div class="form-header">
  <h1>Form Title</h1>
  <div class="form-description">Optional description</div>
</div>
```

#### `.form-section`

Groups related form fields together with proper spacing.

#### `.form-row`

Creates a responsive two-column layout for form fields.

```html
<div class="form-row">
  <div class="form-field">
    <!-- First field -->
  </div>
  <div class="form-field">
    <!-- Second field -->
  </div>
</div>
```

#### `.form-field`

Individual field wrapper with label, input, and error styling.

```html
<div class="form-field">
  <label for="name">Name *</label>
  <input type="text" id="name" class="form-input" />
  <div class="field-description">Helper text</div>
  <div class="error-message">Error message</div>
</div>
```

#### `.form-field-full`

Use within `.form-row` to make a field span both columns.

### Form Controls

#### `.form-input`

Standard text input styling.

#### `.form-textarea`

Textarea with proper sizing and resize behavior.

#### `.form-select`

Select dropdown with custom arrow styling.

#### `.form-checkbox` / `.form-radio`

Styled checkbox and radio button containers.

```html
<div class="form-checkbox">
  <input type="checkbox" id="option1" />
  <div class="checkbox-label">
    Option Label
    <div class="label-description">Optional description</div>
  </div>
</div>
```

### Buttons

#### Base Button

```html
<button class="btn">Base Button</button>
```

#### Button Variants

- `.btn-primary` - Primary action (save, submit)
- `.btn-secondary` - Secondary action (cancel, edit)
- `.btn-danger` - Destructive action (delete)
- `.btn-outline` - Outlined style
- `.btn-ghost` - Minimal style

#### Button Sizes

- `.btn-sm` - Small button
- `.btn-lg` - Large button

#### Semantic Button Classes

Predefined button styles for common actions:

- `.save-btn` - Save action (primary style)
- `.submit-btn` - Submit action (primary style)
- `.edit-btn` - Edit action (secondary style)
- `.cancel-btn` - Cancel action (secondary style)
- `.delete-btn` - Delete action (danger style)
- `.back-btn` - Back navigation (ghost style)

### Form Actions

#### `.form-actions`

Container for form buttons with proper spacing and alignment.

```html
<div class="form-actions">
  <div class="primary-actions">
    <button type="submit" class="btn-primary">Save</button>
  </div>
  <div class="secondary-actions">
    <button type="button" class="btn-secondary">Cancel</button>
  </div>
</div>
```

#### Alignment Modifiers

- `.form-actions-end` - Right-align buttons
- `.form-actions-center` - Center-align buttons
- `.form-actions-between` - Space buttons apart

### Form Cards

#### `.form-card`

Card-style wrapper for forms.

```html
<div class="form-card">
  <div class="form-card-header">
    <h2>Card Title</h2>
    <div class="form-card-description">Optional description</div>
  </div>
  <!-- Form content -->
</div>
```

### Selection Controls

#### `.selection-container`

Styled container for multiple selection options.

### Validation States

#### Field States

- `.field-error` - Error state styling
- `.field-success` - Success state styling
- `.field-warning` - Warning state styling

#### Help Text

`.form-help` - Additional help text styling.

### Loading States

#### `.form-loading`

Apply to form container to show loading state.

## Usage Examples

### Basic Form

```html
<div class="form-container">
  <div class="form-header">
    <h1>User Information</h1>
  </div>

  <form class="form-card">
    <div class="form-section">
      <div class="form-row">
        <div class="form-field">
          <label for="firstName">First Name *</label>
          <input type="text" id="firstName" class="form-input" required />
        </div>
        <div class="form-field">
          <label for="lastName">Last Name *</label>
          <input type="text" id="lastName" class="form-input" required />
        </div>
      </div>

      <div class="form-field">
        <label for="email">Email *</label>
        <input type="email" id="email" class="form-input" required />
        <div class="form-help">We'll never share your email.</div>
      </div>
    </div>

    <div class="form-actions">
      <button type="submit" class="save-btn">Save User</button>
      <button type="button" class="cancel-btn">Cancel</button>
    </div>
  </form>
</div>
```

### Form with Selection

```html
<div class="form-field">
  <label>Select Products</label>
  <div class="selection-container">
    <div class="form-checkbox">
      <input type="checkbox" id="product1" />
      <div class="checkbox-label">
        Product Name
        <div class="label-description">Product description</div>
      </div>
    </div>
  </div>
</div>
```

## Responsive Behavior

The forms stylesheet includes responsive breakpoints:

- **Desktop**: Two-column form rows
- **Mobile (< 768px)**: Single-column layout, full-width buttons
- **Small Mobile (< 640px)**: Stacked form actions

## Integration with Angular Signal Forms

This stylesheet works seamlessly with Angular's signal forms:

```html
<div class="form-field">
  <label for="name">Name</label>
  <input type="text" [field]="form.name" class="form-input" />
  <app-validation-errors [errors]="form.name().errors()" />
</div>
```

## Customization

The stylesheet uses CSS custom properties for easy theming. Override these variables in your component or global styles:

```scss
:root {
  --form-field-padding: 12px 16px;
  --form-field-border: 1px solid var(--color-border);
  --form-field-radius: var(--radius-md);
  --button-padding-md: 10px 20px;
  --button-radius: var(--radius-md);
  --button-font-weight: var(--font-weight-medium);
}
```
