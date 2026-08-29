import React, { useRef, useEffect } from 'react'
import type { Client } from '../../types/client'
import GenericModal from '../../components/GenericModal'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import type { Dispatch, SetStateAction } from 'react'
import { useEditClient } from '../../hooks/client/useEditClient'

interface EditClientProps {
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
  setNewClient: Dispatch<SetStateAction<Omit<Client, 'id'>>>
  newClient: Omit<Client, 'id'>
  setCurrentClient: (client: Client | null) => void
  handleAddClient: () => void
  currentClient: Client | null
  isLoading: boolean
  disableSave: boolean
}

const EditClient: React.FC<EditClientProps> = ({
  isModalOpen,
  setIsModalOpen,
  setNewClient,
  newClient,
  setCurrentClient,
  handleAddClient,
  currentClient,
  isLoading,
  disableSave,
}) => {
  const {
    isLoadingCep,
    fetchAddressByZipCode,
    formatPhone,
    handlePhoneChange,
    formatZipCode,
    handleZipCodeChange,
  } = useEditClient(setNewClient)

  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const zipCodeRef = useRef<HTMLInputElement>(null)
  const stateRef = useRef<HTMLInputElement>(null)
  const cityRef = useRef<HTMLInputElement>(null)
  const addressRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isModalOpen && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 100)
    }
  }, [isModalOpen])

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    nextRef: React.RefObject<HTMLInputElement | null>,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextRef.current?.focus()
    }
  }

  const handleLastFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disableSave) {
      e.preventDefault()
      handleAddClient()
    }
  }

  if (!isModalOpen) return null

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <GenericModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setCurrentClient(null)
          setNewClient({
            name: '',
            phone: '',
            zipCode: '',
            state: '',
            city: '',
            address: '',
          })
        }}
        title={currentClient ? 'Editar Cliente' : 'Cadastro de Cliente'}
        onSave={handleAddClient}
        saveButtonText="Salvar"
        isLoading={isLoading}
        disableSave={disableSave}
      >
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1 text-2xl lg:text-base">
              Nome*
            </label>
            <input
              ref={nameRef}
              type="text"
              className="w-full p-2 text-sm md:text-base border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              value={newClient.name.toUpperCase()}
              onChange={e =>
                setNewClient(prev => ({
                  ...prev,
                  name: e.target.value.substring(0, 115).toUpperCase(),
                }))
              }
              onKeyDown={e => handleKeyDown(e, phoneRef)}
              placeholder="Nome do cliente"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-2xl lg:text-base">
              Telefone*
            </label>
            <input
              ref={phoneRef}
              type="tel"
              className="w-full p-2 text-sm md:text-base border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              value={formatPhone(newClient.phone)}
              onChange={handlePhoneChange}
              onKeyDown={e => handleKeyDown(e, zipCodeRef)}
              placeholder="(99) 99999-9999"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-2xl lg:text-base">
              CEP
            </label>
            <input
              ref={zipCodeRef}
              type="text"
              className="w-full p-2 text-sm md:text-base border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              value={formatZipCode(newClient.zipCode)}
              onChange={handleZipCodeChange}
              onBlur={() => fetchAddressByZipCode(newClient.zipCode)}
              onKeyDown={e => handleKeyDown(e, stateRef)}
              placeholder="99999-999"
              disabled={isLoadingCep}
            />
            {isLoadingCep && (
              <p className="text-sm text-gray-500">Buscando CEP...</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-2xl lg:text-base">
                Estado
              </label>
              <input
                ref={stateRef}
                type="text"
                className="w-full p-2 text-sm md:text-base border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                value={newClient.state.toUpperCase()}
                onChange={e =>
                  setNewClient(prev => ({
                    ...prev,
                    state: e.target.value.substring(0, 2).toUpperCase(),
                  }))
                }
                onKeyDown={e => handleKeyDown(e, cityRef)}
                placeholder="Digite o estado"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-2xl lg:text-base">
                Cidade
              </label>
              <input
                ref={cityRef}
                type="text"
                className="w-full p-2 text-sm md:text-base border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                value={newClient.city.toUpperCase()}
                onChange={e =>
                  setNewClient(prev => ({
                    ...prev,
                    city: e.target.value.substring(0, 30).toUpperCase(),
                  }))
                }
                onKeyDown={e => handleKeyDown(e, addressRef)}
                placeholder="Digite a cidade"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1 text-2xl lg:text-base">
              Endereço
            </label>
            <input
              ref={addressRef}
              type="text"
              className="w-full p-2 text-sm md:text-base border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              value={newClient.address.toUpperCase()}
              onChange={e =>
                setNewClient(prev => ({
                  ...prev,
                  address: e.target.value.substring(0, 50).toUpperCase(),
                }))
              }
              onKeyDown={handleLastFieldKeyDown}
              placeholder="Digite o endereço"
            />
          </div>
        </div>
      </GenericModal>
    </>
  )
}

export default EditClient
