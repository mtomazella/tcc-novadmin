import api from './api';
import type { Work, WorkParams, WorkResponse, WorkPostBody } from "../../types/work";

const ENDPOINT = '/obra';

export const getWorks = async (
  params?: WorkParams
): Promise<WorkResponse> => {
  const response = await api.get<WorkResponse>(ENDPOINT, {
    params: {
      ...params,
      includeClient: true
    }
  });
  return response.data;
};

export const createWork = async (work: Omit<Work, 'id'>): Promise<Work> => {
  const payload: WorkPostBody = {
    record: {
      name: work.name.substring(0, 60),
      description: work.description?.substring(0, 255) || '',
      phone: work.phone?.substring(0, 15) || '',
      email: work.email?.substring(0, 254) || '',
      address: work.address?.substring(0, 50) || '',
      addressComplement: work.addressComplement?.substring(0, 30) || '',
      contact: work.contact?.substring(0, 30) || '',
      clientId: work.clientId?.toString() || undefined,
    }
  };

  const response = await api.post<{ data: Work }>(ENDPOINT, payload);
  return response.data.data;
};

export const updateWork = async (work: Work): Promise<Work> => {
  const payload: WorkPostBody = {
    record: {
      id: work.id.toString(),
      name: work.name.substring(0, 60),
      description: work.description?.substring(0, 255) || '',
      phone: work.phone?.substring(0, 15) || '',
      email: work.email?.substring(0, 254) || '',
      address: work.address?.substring(0, 50) || '',
      addressComplement: work.addressComplement?.substring(0, 30) || '',
      contact: work.contact?.substring(0, 30) || '',
      clientId: work.clientId?.toString() || undefined,
    }
  };

  const response = await api.post<{ data: Work }>(ENDPOINT, payload);
  return response.data.data;
};

export const deleteWork = async (id: string): Promise<void> => {
  await api.delete(ENDPOINT, { params: { id } });
};