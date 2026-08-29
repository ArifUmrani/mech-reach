import { Component } from '@angular/core';
import { ServiceIcon } from '../../shared/service-icon/service-icon';
import {
  PROCESS_STEPS,
  SAFETY_PRINCIPLES,
  SERVICE_CATEGORIES,
  TRUST_ITEMS,
} from './landing.content';

@Component({
  selector: 'app-landing',
  imports: [ServiceIcon],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  protected readonly serviceCategories = SERVICE_CATEGORIES;
  protected readonly trustItems = TRUST_ITEMS;
  protected readonly processSteps = PROCESS_STEPS;
  protected readonly safetyPrinciples = SAFETY_PRINCIPLES;
}
