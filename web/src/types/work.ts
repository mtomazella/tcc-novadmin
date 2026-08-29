import type { Client } from './client';
import type { OrderOptions } from './utils';

export type Work = {
  id: number;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  addressComplement?: string;
  contact?: string;
  clientId?: number;
  client?: Client;
};

export type WorkParams = {
  generalFuzzyValue?: string;
  page?: number;
  limit?: number;
  order?: OrderOptions<'updatedAt' | 'name'>
};

export type WorkResponse = {
  data: Work[];
  count: { page: number; total: number };
  meta: {
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type WorkPostBody = {
  record: {
    id?: string;
    name: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: string;
    addressComplement?: string;
    contact?: string;
    clientId?: string;
  };
};