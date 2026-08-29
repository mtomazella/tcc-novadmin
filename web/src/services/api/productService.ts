import api from './api';
import type { Product, ProductParams, ProductResponse } from "../../types/product";

const ENDPOINT = '/product';

export const getProducts = async (
  params?: ProductParams
): Promise<ProductResponse> => {
  const response = await api.get<ProductResponse>(ENDPOINT, { params });
  return response.data;
};

export const createProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
  const response = await api.post<{ data: Product }>(ENDPOINT, { record: product });
  return response.data.data;
};

export const updateProduct = async (product: Product): Promise<Product> => {
  const response = await api.post<{ data: Product }>(ENDPOINT, { record: product });
  return response.data.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(ENDPOINT, { params: { id } });
};