import { DOCUMENT } from '@angular/common';
import { computed, inject, Service, signal } from '@angular/core';
import { CustomerAuthService } from '../customer-auth/customer-auth.service';
import { CustomerRequestDraft } from './customer-request.model';
import {
  CUSTOMER_REQUEST_HISTORY_STORAGE_KEY,
  CustomerRequestSnapshot,
  parseCustomerRequestHistory,
  snapshotFromDraft,
} from './customer-request-history.model';

@Service()
export class CustomerRequestHistoryService {
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(CustomerAuthService);
  private readonly itemsState = signal<readonly CustomerRequestSnapshot[]>(this.readStored());

  readonly items = computed(() => {
    const session = this.auth.session();
    if (!session) {
      return [];
    }

    return this.itemsState().filter((item) => item.mobile === session.mobile);
  });

  record(draft: CustomerRequestDraft): void {
    if (!this.auth.matchesVerifiedMobile(draft.mobile)) {
      return;
    }

    const snapshot = snapshotFromDraft(draft);
    if (!snapshot) {
      return;
    }

    if (this.itemsState().some((item) => item.reference === snapshot.reference)) {
      return;
    }

    const next = [snapshot, ...this.itemsState()];
    this.itemsState.set(next);
    this.writeStored(next);
  }

  private readStored(): CustomerRequestSnapshot[] {
    return parseCustomerRequestHistory(
      this.storage()?.getItem(CUSTOMER_REQUEST_HISTORY_STORAGE_KEY) ?? null,
    );
  }

  private writeStored(items: readonly CustomerRequestSnapshot[]): void {
    this.storage()?.setItem(CUSTOMER_REQUEST_HISTORY_STORAGE_KEY, JSON.stringify(items));
  }

  private storage(): Storage | null {
    return this.document.defaultView?.sessionStorage ?? null;
  }
}
