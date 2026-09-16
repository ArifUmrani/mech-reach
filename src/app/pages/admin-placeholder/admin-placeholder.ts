import { Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-placeholder',
  template: `
    <section class="placeholder" [attr.aria-labelledby]="headingId()">
      <div class="container placeholder-shell">
        <p class="eyebrow">Admin</p>
        <h1 [id]="headingId()">{{ title() }}</h1>
        <p class="lede">{{ message() }}</p>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .placeholder {
      padding-block: clamp(2rem, 5vw, 3.5rem) clamp(3rem, 7vw, 5rem);
    }

    .placeholder-shell {
      max-width: 40rem;
    }

    .placeholder h1 {
      font-size: var(--font-size-2xl);
    }

    .lede {
      margin-top: var(--space-4);
      color: var(--color-text-secondary);
      font-size: var(--font-size-md);
    }
  `,
})
export class AdminPlaceholder {
  readonly title = input.required<string>();
  readonly message = input('This area is not built yet.');
  readonly headingId = input('admin-placeholder-heading');
}
