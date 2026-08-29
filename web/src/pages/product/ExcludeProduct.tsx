import React from 'react';
import type { Product } from 'types/product';
import GenericModal from 'components/GenericModal';
import { FiTrash2 } from 'react-icons/fi';

interface ExcludeProductProps {
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (isOpen: boolean) => void;
  setCurrentProduct: (product: Product | null) => void;
  confirmDelete: () => void;
  currentProduct: Product | null;
  isLoading: boolean;
}

const ExcludeProduct: React.FC<ExcludeProductProps> = ({
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  setCurrentProduct,
  confirmDelete,
  currentProduct,
  isLoading
}) => {
  if (!isDeleteModalOpen) return null;

  return (
    <GenericModal
      isOpen={isDeleteModalOpen}
      onClose={() => {
        setIsDeleteModalOpen(false);
        setCurrentProduct(null);
      }}
      title="Confirmar Exclusão"
      onSave={confirmDelete}
      saveButtonText="Confirmar"
      showCancelButton={true}
      isLoading={isLoading}
    >
      <div className="text-center py-2 md:py-4">
        <FiTrash2 className="mx-auto h-8 w-8 md:h-12 md:w-12 text-red-500 mb-2 md:mb-4" />
        <p className="text-base md:text-lg font-medium text-gray-900">
          Tem certeza que deseja excluir o produto <span className="font-bold">{currentProduct?.name}</span>?
        </p>
        <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-600">
          Esta ação não pode ser desfeita.
        </p>
      </div>
    </GenericModal>
  );
};

export default ExcludeProduct;