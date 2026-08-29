import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { helpKindFromCategory } from '../../core/customer-request/customer-request.model';
import { ServiceIcon } from '../../shared/service-icon/service-icon';
import {
  PROCESS_STEPS,
  SAFETY_PRINCIPLES,
  SERVICE_CATEGORIES,
  ServiceCategoryId,
  TRUST_ITEMS,
} from './landing.content';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, ServiceIcon],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  protected readonly serviceCategories = SERVICE_CATEGORIES;
  protected readonly trustItems = TRUST_ITEMS;
  protected readonly processSteps = PROCESS_STEPS;
  protected readonly safetyPrinciples = SAFETY_PRINCIPLES;

  protected requestQuery(categoryId: ServiceCategoryId, serviceId: string) {
    return { kind: helpKindFromCategory(categoryId), service: serviceId };
  }
}
