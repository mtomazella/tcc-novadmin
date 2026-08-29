import type { OrderOptions } from "./utils";

export interface Client {
  id: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  address: string;
  zipCode: string;
}

export interface ClientParams {
  generalFuzzyValue?: string;
  page?: number;
  limit?: number;
  order?: OrderOptions<'updatedAt' | 'name' | 'city' | 'state'>;
}

export interface ClientResponse {
  data: Client[];
  count?: {
    total: number;
  };
  meta?: {
    page: number;
    limit: number;
  };
}