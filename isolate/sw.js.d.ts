/**
 * Declaration merging so that `self` inside public/sw.js is checked as a
 * ServiceWorkerGlobalScope (the file is excluded from TS compilation and is
 * executed by the browser directly, but editors and tooling benefit from
 * accurate typing).
 */
interface ServiceWorkerGlobalScope {
  registration: ServiceWorkerRegistration;
  clients: Clients;
  skipWaiting: () => Promise<void>;
}
