import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HEALTH_LABELS, ProductHealth } from '../utils/notice.utils';

/** Colored pill for a notice severity or a product's current health. */
@Component({
  selector: 'app-health-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="health-pill" [class]="'health-pill health-' + health()">{{ label() }}</span>`,
})
export class HealthPill {
  readonly health = input.required<ProductHealth>();
  readonly suffix = input('');

  protected readonly label = computed(
    () => HEALTH_LABELS[this.health()] + (this.suffix() ? ` · ${this.suffix()}` : '')
  );
}
