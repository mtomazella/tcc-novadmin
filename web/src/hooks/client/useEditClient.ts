import { useState } from 'react';
import { toast } from 'react-toastify';
import type { Client } from '../../types/client';
import type { Dispatch, SetStateAction } from 'react';

export function useEditClient(
  setNewClient: Dispatch<SetStateAction<Omit<Client, 'id'>>>
) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);  

  const formatPhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, '').substring(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    if (digits.length <= 10) return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
  };

  const formatZipCode = (zipCode: string): string => {
    const digits = zipCode.replace(/\D/g, '').substring(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.substring(0, 5)}-${digits.substring(5)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digits = input.replace(/\D/g, '').substring(0, 11);
    setNewClient(prev => ({ ...prev, phone: digits }));
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digits = input.replace(/\D/g, '').substring(0, 8);
    setNewClient(prev => ({ ...prev, zipCode: digits }));
  };

  const fetchAddressByZipCode = async (zipCode: string) => {
    const cleanedZipCode = zipCode.replace(/\D/g, '');
    if (cleanedZipCode.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedZipCode}/json/`);
      const data = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      setNewClient((prev: any) => ({
        ...prev,
        state: data.uf,
        city: data.localidade,
        address: data.logradouro
      }));
    } catch (error) {
      toast.error('CEP não encontrado ou erro na busca');
    } finally {
      setIsLoadingCep(false);
    }
  };

  return {
    isLoadingCep,
    fetchAddressByZipCode,
    handleZipCodeChange,
    handlePhoneChange,
    formatZipCode,
    formatPhone
  };
}