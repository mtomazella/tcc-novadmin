import React from 'react';
import type { Work } from '../../types/work';
import GenericModal from '../../components/GenericModal';
import { FiTrash2 } from 'react-icons/fi';

interface ExcludeWorkProps {
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (isOpen: boolean) => void;
  setCurrentWork: (work: Work | null) => void;
  confirmDelete: () => void;
  currentWork: Work | null;
  isLoading: boolean;
}

const ExcludeWork: React.FC<ExcludeWorkProps> = ({
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  setCurrentWork,
  confirmDelete,
  currentWork,
  isLoading
}) => {
  if (!isDeleteModalOpen) return null;

  return (
    <GenericModal
      isOpen={isDeleteModalOpen}
      onClose={() => {
        setIsDeleteModalOpen(false);
        setCurrentWork(null);
      }}
      title="Confirmar Exclusão"
      onSave={confirmDelete}
      saveButtonText="Confirmar"
      isLoading={isLoading}
    >
      <div className="text-center py-2 md:py-4">
        <FiTrash2 className="mx-auto h-8 w-8 md:h-12 md:w-12 text-red-500 mb-2 md:mb-4" />
        <p className="text-base md:text-lg font-medium text-gray-900">
          Tem certeza que deseja excluir a obra: <span className="font-bold">{currentWork?.name}</span>?
        </p>
        <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-600">
          Esta ação não pode ser desfeita.
        </p>
      </div>
    </GenericModal>
  );
};

export default ExcludeWork;