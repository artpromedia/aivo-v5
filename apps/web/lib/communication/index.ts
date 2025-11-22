import type { CommunicationHub } from "@/lib/communication/communication-hub";

declare global {
  // eslint-disable-next-line no-var
  var __communicationHub__: CommunicationHub | undefined;
}

export function setCommunicationHubInstance(instance: CommunicationHub) {
  globalThis.__communicationHub__ = instance;
}

export function getCommunicationHubInstance() {
  return globalThis.__communicationHub__;
}
