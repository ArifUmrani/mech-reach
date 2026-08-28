import { Component, input } from '@angular/core';
import { ServiceIconName } from '../../pages/landing/landing.content';

@Component({
  selector: 'app-service-icon',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      @switch (name()) {
        @case ('battery-jump') {
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M7 8h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Zm3-3h4M10 12.5h4M12 10.5v4"
          />
        }
        @case ('flat-tyre') {
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 5.5A6.5 6.5 0 1 1 5.5 12 6.5 6.5 0 0 1 12 5.5Zm0 3.2A3.3 3.3 0 1 1 8.7 12 3.3 3.3 0 0 1 12 8.7Z"
          />
        }
        @case ('not-starting') {
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8 11.5h8.5a2 2 0 0 1 1.5.7l2 2.3M4.5 11.5H8m2 0V8.8A2.3 2.3 0 0 1 12.3 6.5h.4M8 11.5v5.2A1.8 1.8 0 0 0 9.8 18.5h.7m5-7v5.2a1.8 1.8 0 0 1-1.8 1.8h-.4"
          />
        }
        @case ('overheating') {
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10 13.5V7.2a2 2 0 1 1 4 0v6.3a3.2 3.2 0 1 1-4 0Zm-1.8-5.8h1.8m2.2 0h1.8M8.2 10h1.8m4 0h1.8"
          />
        }
        @case ('fuel') {
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 19.5V6.8A1.8 1.8 0 0 1 7.8 5h6.4A1.8 1.8 0 0 1 16 6.8v12.7M5 19.5h12m4-10.5v5.2a2 2 0 0 1-2 2h-1M16 8.5l3-2v3"
          />
        }
        @case ('towing') {
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3.5 16.5h12.2V9.8H9.2L7 12.5H3.5v4Zm12.2 0H19l1.5-3.2V10h-4.8m-9.2 6.5a1.8 1.8 0 1 0 3.6 0 1.8 1.8 0 0 0-3.6 0Zm8.4 0a1.8 1.8 0 1 0 3.6 0 1.8 1.8 0 0 0-3.6 0Z"
          />
        }
        @case ('other') {
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m8.2 14.2 2.4-2.4 5.7 5.7a1.8 1.8 0 0 1-2.5 2.5l-5.6-5.8Zm2.4-2.4 1.6-1.6a2 2 0 0 0 0-2.8l-.8-.8a2 2 0 0 0-2.8 0L7 8.2m5.7 1.2 2.3-2.3a1.6 1.6 0 1 1 2.3 2.3l-2.2 2.2"
          />
        }
        @case ('oil-change') {
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 4.5s4.5 5.2 4.5 8.4A4.5 4.5 0 1 1 7.5 12.9C7.5 9.7 12 4.5 12 4.5Z"
          />
        }
        @case ('battery-inspection') {
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M7 9h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Zm3-3h4M9.2 14.2l1.7 1.6 4-3.6"
          />
        }
        @case ('inspection') {
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.5 5.5h7A2 2 0 0 1 17.5 7.5v11a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Zm2.2 0V4.8A1.3 1.3 0 0 1 12 3.5h0a1.3 1.3 0 0 1 1.3 1.3v.7M9.5 11h5m-5 3.2h5m-5 3.2h3"
          />
        }
        @case ('maintenance') {
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M7.5 5.5h9A2 2 0 0 1 18.5 7.5v11a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2ZM7.5 10h9M10 5.5V4m4 1.5V4m-4.2 7.8h.2m3.8 0h.2m-4.2 3.4h.2m3.8 0h.2"
          />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      color: currentColor;
    }

    svg {
      width: 1.5rem;
      height: 1.5rem;
    }
  `,
})
export class ServiceIcon {
  readonly name = input.required<ServiceIconName>();
}
