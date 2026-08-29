import React from 'react';
import type { Supplier } from 'types/supplier';
import GenericModal from 'components/GenericModal';
import { FiTrash2 } from 'react-icons/fi';

interface ExcludeSupplierProps {
    isDeleteModalOpen: boolean;
    setIsDeleteModalOpen: (isOpen: boolean) => void;
    setCurrentSupplier: (supplier: Supplier | null) => void;
    confirmDelete: () => void;
    currentSupplier: Supplier | null;
    isLoading: boolean;
}

const ExcludeSupplier: React.FC<ExcludeSupplierProps> = ({
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    setCurrentSupplier,
    confirmDelete,
    currentSupplier,
    isLoading
}) => {
  if (!isDeleteModalOpen) return null;

  return (
    <GenericModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
        setIsDeleteModalOpen(false);
        setCurrentSupplier(null);
        }}
        title="Confirmar Exclusão"
        onSave={confirmDelete}
        saveButtonText="Confirmar"
        isLoading={isLoading}
    >
        <div className="text-center py-2 md:py-4">
        <FiTrash2 className="mx-auto h-8 w-8 md:h-12 md:w-12 text-red-500 mb-2 md:mb-4" />
        <p className="text-base md:text-lg font-medium text-gray-900">
            Tem certeza que deseja excluir o fornecedor <span className="font-bold">{currentSupplier?.name}</span>?
        </p>
        <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-600">
            Esta ação não pode ser desfeita.
        </p>
        </div>
    </GenericModal>
  );
};

export default ExcludeSupplier;