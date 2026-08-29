import api from './api';
import type { Client, ClientParams, ClientResponse } from "../../types/client";

const ENDPOINT = '/client';

export const getClients = async (
  params?: ClientParams
): Promise<ClientResponse> => {
  const response = await api.get<ClientResponse>(ENDPOINT, { params });
  return response.data;
};

export const createClient = async (client: Omit<Client, 'id'>): Promise<Client> => {
  const payload = {
    record: {
      name: client.name.substring(0, 115),
      phone: client.phone.substring(0, 15),
      city: client.city?.substring(0, 30) || '',
      state: client.state?.substring(0, 2) || '',
      address: client.address?.substring(0, 50) || '',
      zipCode: client.zipCode?.substring(0, 8) || '',
    }
  };

  const response = await api.post<{ data: Client }>(ENDPOINT, payload);
  return response.data.data;
};

export const updateClient = async (client: Client): Promise<Client> => {
  const payload = {
    record: {
      id: client.id,
      name: client.name.substring(0, 115),
      phone: client.phone.substring(0, 15),
      city: client.city?.substring(0, 30) || '',
      state: client.state?.substring(0, 2) || '',
      address: client.address?.substring(0, 50) || '',
      zipCode: client.zipCode?.substring(0, 8) || '',
    }
  };

  const response = await api.post<{ data: Client }>(ENDPOINT, payload);
  return response.data.data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await api.delete(ENDPOINT, { params: { id } });
};