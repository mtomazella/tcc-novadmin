import React, { useRef, useEffect } from 'react'
import type { Work } from '../../types/work'
import type { Client } from '../../types/client'
import GenericModal from '../../components/GenericModal'
import type { Dispatch, SetStateAction } from 'react'
import useWorks from '../../hooks/work/useWorks'

interface EditWorkProps {
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
  setNewWork: Dispatch<SetStateAction<Omit<Work, 'id'>>>
  newWork: Omit<Work, 'id'>
  setCurrentWork: (work: Work | null) => void
  handleAddWork: () => void
  currentWork: Work | null
  clients: Client[]
  isLoading: boolean
  disableSave: boolean
}

const EditWork: React.FC<EditWorkProps> = ({
  isModalOpen,
  setIsModalOpen,
  setNewWork,
  newWork,
  setCurrentWork,
  handleAddWork,
  currentWork,
  clients,
  isLoading,
  disableSave,
}) => {
  const {
    actions: { formatPhone },
  } = useWorks()

  const clientRef = useRef<HTMLSelectElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const addressRef = useRef<HTMLInputElement>(null)
  const addressComplementRef = useRef<HTMLInputElement>(null)
  const contactRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isModalOpen && clientRef.current) {
      setTimeout(() => clientRef.current?.focus(), 100)
    }
  }, [isModalOpen])

  const handleKeyDown = (
    e: React.KeyboardEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    nextRef: React.RefObject<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
    >,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextRef.current?.focus()
    }
  }

  const handleLastFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disableSave) {
      e.preventDefault()
      handleAddWork()
    }
  }

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value
    setNewWork(prev => ({
      ...prev,
      clientId,
    }))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const digits = input.replace(/\D/g, '').substring(0, 11)
    setNewWork(prev => ({ ...prev, phone: digits }))
  }

  if (!isModalOpen) return null

  return (
    <GenericModal
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false)
        setCurrentWork(null)
        setNewWork({
          name: '',
          description: '',
          phone: '',
          email: '',
          address: '',
          addressComplement: '',
          contact: '',
          clientId: undefined,
        })
      }}
      title={currentWork ? 'Editar Obra' : 'Cadastro de Obra'}
      onSave={handleAddWork}
      saveButtonText="Salvar"
      isLoading={isLoading}
      disableSave={disableSave}
    >
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2">
            <label className="block font-medium mb-1 text-2xl lg:text-base">
              Cliente*
            </label>
            <select
              ref={clientRef}
              className="w-full p-2 text-sm md:text-base border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent bg-white"
              value={newWork.clientId}
              onChange={handleClientChange}
              onKeyDown={e => handleKeyDown(e, nameRef)}
              required
            >
              <option value="">Selecione o cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/2">
            <label className="block font-medium mb-1 text-2xl lg:text-base">
              Nome da Obra*
            </label>
            <input
              ref={nameRef}
              type="text"
              className="w-full p-2 text-sm md:text-base border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              value={newWork.name.toUpperCase()}
              onChange={e =>
                setNewWork(prev => ({
                  ...prev,
                  name: e.target.value.substring(0, 60).toUpperCase(),
                }))
              }
              onKeyDown={e => handleKeyDown(e, descriptionRef)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1 text-2xl lg:text-base">
            Descrição
          </label>
          <textarea
            ref={descriptionRef}
            className="w-full p-2 text-sm md:text-base border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
            value={newWork.description?.toUpperCase() || ''}
            onChange={e =>
              setNewWork(prev => ({
                ...prev,
                description: e.target.value.substring(0, 255).toUpperCase(),
              }))
            }
            onKeyDown={e => handleKeyDown(e, phoneRef)}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2">
            <label className="block font-medium mb-1 text-2xl lg:text-base">
              Telefone
            </label>
            <input
              ref={phoneRef}
              type="tel"
              className="w-full p-2 text-sm md:text-base border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              value={formatPhone(newWork.phone || '')}
              onChange={handlePhoneChange}
              onKeyDown={e => handleKeyDown(e, emailRef)}
              placeholder="(99) 99999-9999"
            />
          </div>

          <div className="w-full md:w-1/2">
            <label className="block font-medium mb-1 text-2xl lg:text-base">
              Email
            </label>
            <input
              ref={emailRef}
              type="email"
              className="w-full p-2 text-sm md:text-base border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              value={newWork.email?.toUpperCase() || ''}
              onChange={e =>
                setNewWork(prev => ({
                  ...prev,
                  email: e.target.value.substring(0, 254).toUpperCase(),
                }))
              }
              onKeyDown={e => handleKeyDown(e, addressRef)}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2">
            <label className="block font-medium mb-1 text-2xl lg:text-base">
              Endereço
            </label>
            <input
              ref={addressRef}
              type="text"
              className="w-full p-2 text-sm md:text-base border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              value={newWork.address?.toUpperCase() || ''}
              onChange={e =>
                setNewWork(prev => ({
                  ...prev,
                  address: e.target.value.substring(0, 50).toUpperCase(),
                }))
              }
              onKeyDown={e => handleKeyDown(e, addressComplementRef)}
            />
          </div>

          <div className="w-full md:w-1/2">
            <label className="block font-medium mb-1 text-2xl lg:text-base">
              Complemento
            </label>
            <input
              ref={addressComplementRef}
              type="text"
              className="w-full p-2 text-sm md:text-base border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              value={newWork.addressComplement?.toUpperCase() || ''}
              onChange={e =>
                setNewWork(prev => ({
                  ...prev,
                  addressComplement: e.target.value
                    .substring(0, 30)
                    .toUpperCase(),
                }))
              }
              onKeyDown={e => handleKeyDown(e, contactRef)}
            />
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1 text-2xl lg:text-base">
            Contato
          </label>
          <input
            ref={contactRef}
            type="text"
            className="w-full p-2 text-sm md:text-base border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
            value={newWork.contact?.toUpperCase() || ''}
            onChange={e =>
              setNewWork(prev => ({
                ...prev,
                contact: e.target.value.substring(0, 30).toUpperCase(),
              }))
            }
            onKeyDown={handleLastFieldKeyDown}
          />
        </div>
      </div>
    </GenericModal>
  )
}

export default EditWork
