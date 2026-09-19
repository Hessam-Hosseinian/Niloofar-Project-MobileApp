import { gamesService } from "./data/gameService";
import {
  services as baseServices,
  type ServiceCategory,
  type ServiceItem,
} from "./data/serviceCatalog";

export type { ServiceCategory, ServiceItem } from "./data/serviceCatalog";

// Public service registry used by screens. Feature-specific entries can be
// composed here without turning the base catalog into another giant file.
export const services: ServiceItem[] = [...baseServices, gamesService];

export const enabledServices = services.filter((service) => service.enabled);

export const quickActions = enabledServices.filter(
  (service) => service.quickAction,
);

export const featuredServices = enabledServices.filter(
  (service) => service.featured,
);

export function getServiceByKey(key: string) {
  return services.find((service) => service.key === key);
}

export function getServicesByCategory(category: ServiceCategory) {
  return enabledServices.filter((service) => service.category === category);
}

export function getServicesByPhase(phase: number) {
  return enabledServices.filter((service) => service.phase === phase);
}
