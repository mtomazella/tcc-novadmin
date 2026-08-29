import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import type { Client } from '../../types/client';
import { 
  getClients, 
  createClient, 
  updateClient, 
  deleteClient 
} from '../../services/api/clientService';
import { useHasPermission, webPermissions } from '../auth/usePermissions';

export function useClientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const tableRef = useRef<{ refresh: () => void }>(null);

  const [newClient, setNewClient] = useState<Omit<Client, 'id'>>({
    name: '',
    phone: '',
    city: '',
    state: '',
    address: '',
    zipCode: '' 
  });

  const canAdd = useHasPermission(webPermissions.client.add);
  const canEdit = useHasPermission(webPermissions.client.edit);
  const canDelete = useHasPermission(webPermissions.client.delete);

  const fetchClients = useCallback(async (params: { page: number; limit: number }) => {
    const apiParams: any = {
      page: params.page,
      limit: params.limit,
    };

    if (searchTerm) {
      apiParams.generalFuzzyValue = searchTerm;
    }

    const response = await getClients(apiParams);

    return {
      count: response.count,
      data: response.data,
      meta: {
        page: params.page,
        limit: params.limit,
      },
    };
  }, [searchTerm]);

  const handleAddClient = async () => {
    if ((currentClient && !canEdit) || (!currentClient && !canAdd)) {
      toast.error('Você não tem permissão para realizar esta ação');
      return;
    }

    try {
      setIsMutating(true);
      
      if (currentClient) {
        const cliente = {
          ...newClient,
          id: currentClient.id,
        };
        await updateClient(cliente);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await createClient(newClient);
        toast.success('Cliente adicionado com sucesso!');
      }
      
      setIsModalOpen(false);
      setCurrentClient(null);
      setNewClient({
        name: '',
        phone: '',
        city: '',
        state: '',
        address: '',
        zipCode: ''
      });
      setApiError(null);
      
      if (tableRef.current) {
        tableRef.current.refresh();
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar cliente';
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsMutating(false);
    }
  };

  const handleEdit = (client: Client) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para editar clientes');
      return;
    }
    
    setCurrentClient(client);
    setNewClient({
      name: client.name,
      phone: client.phone,
      city: client.city,
      state: client.state,
      address: client.address,
      zipCode: client.zipCode
    });
    setIsModalOpen(true);
  };

  const handleDelete = (client: Client) => {
    if (!canDelete) {
      toast.error('Você não tem permissão para excluir clientes');
      return;
    }
    
    setCurrentClient(client);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentClient) return;
    
    try {
      setIsMutating(true);
      await deleteClient(currentClient.id);
      toast.success('Cliente excluído com sucesso!');
      setIsDeleteModalOpen(false);
      setCurrentClient(null);
      setApiError(null);
      
      if (tableRef.current) {
        tableRef.current.refresh();
      }
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir cliente';
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsMutating(false);
    }
  };

  const isSaveDisabled = !newClient.name || !newClient.phone;

  return {
    isModalOpen,
    setIsModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    searchTerm,
    setSearchTerm,
    currentClient,
    setCurrentClient,
    apiError,
    isMutating,
    tableRef,
    newClient,
    setNewClient,
    fetchClients,
    handleAddClient,
    handleEdit,
    handleDelete,
    confirmDelete,
    isSaveDisabled,
    canAdd,
    canEdit,
    canDelete
  };
}