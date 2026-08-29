import { useState, useCallback, useEffect } from 'react';
import type { Work } from '../../types/work';
import type { Client } from '../../types/client';
import { 
  getWorks, 
  createWork, 
  updateWork, 
  deleteWork 
} from '../../services/api/workService';
import { getClients } from '../../services/api/clientService';
import { toast } from 'react-toastify';
import { useHasPermission, webPermissions } from '../auth/usePermissions';

export default function useWorks() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentWork, setCurrentWork] = useState<Work | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [newWork, setNewWork] = useState<Omit<Work, 'id'>>({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    addressComplement: '',
    contact: '',
    clientId: undefined,
  });

  const canAdd = useHasPermission(webPermissions.obra.add);
  const canEdit = useHasPermission(webPermissions.obra.edit);
  const canDelete = useHasPermission(webPermissions.obra.delete);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await getClients({ page: 1, limit: 1000, order: 'name_asc' });
        setClients(response.data);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        toast.error('Erro ao carregar clientes');
      }
    };
    fetchClients();
  }, []);

  const fetchWorks = useCallback(async (params: { page: number; limit: number }) => {
    const apiParams: any = {
      page: params.page,
      limit: params.limit,
    };

    if (searchTerm) {
      apiParams.generalFuzzyValue = searchTerm;
    }

    const response = await getWorks(apiParams);

    return {
      count: response.count,
      data: response.data,
      meta: {
        page: params.page,
        limit: params.limit,
      },
    };
  }, [searchTerm]);

  const handleAddWork = async () => {
    if ((currentWork && !canEdit) || (!currentWork && !canAdd)) {
      toast.error('Você não tem permissão para realizar esta ação');
      return false;
    }

    try {
      setIsMutating(true);
      
      if (currentWork) {
        const obraAtualizada = {
          ...newWork,
          id: currentWork.id,
        };
        await updateWork(obraAtualizada);
        toast.success('Obra atualizada com sucesso!');
      } else {
        await createWork(newWork);
        toast.success('Obra adicionada com sucesso!');
      }
      
      setIsModalOpen(false);
      setCurrentWork(null);
      setNewWork({
        name: '',
        description: '',
        phone: '',
        email: '',
        address: '',
        addressComplement: '',
        contact: '',
        clientId: undefined,
      });
      setApiError(null);
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar obra:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar obra';
      setApiError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const handleEdit = (work: Work) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para editar obras');
      return;
    }
    
    setCurrentWork(work);
    setNewWork({
      name: work.name,
      description: work.description || '',
      phone: work.phone || '',
      email: work.email || '',
      address: work.address || '',
      addressComplement: work.addressComplement || '',
      contact: work.contact || '',
      clientId: work.clientId || undefined,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (work: Work) => {
    if (!canDelete) {
      toast.error('Você não tem permissão para excluir obras');
      return;
    }
    
    setCurrentWork(work);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentWork) return false;
    
    try {
      setIsMutating(true);
      await deleteWork(currentWork.id.toString());
      toast.success('Obra excluída com sucesso!');
      setIsDeleteModalOpen(false);
      setCurrentWork(null);
      setApiError(null);
      return true;
    } catch (error) {
      console.error('Erro ao excluir obra:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir obra';
      setApiError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const formatPhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, '').substring(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    if (digits.length <= 10) return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
  };

  const isSaveDisabled = !newWork.name || !newWork.clientId;

  return {
    states: {
      isModalOpen,
      isDeleteModalOpen,
      searchTerm,
      currentWork,
      apiError,
      isMutating,
      clients,
      newWork,
      isSaveDisabled
    },
    actions: {
      setIsModalOpen,
      setIsDeleteModalOpen,
      setSearchTerm,
      setCurrentWork,
      setNewWork,
      fetchWorks,
      handleAddWork,
      handleEdit,
      handleDelete,
      confirmDelete,
      formatPhone
    }
  };
}