// src/components/modals/NewClientModal.tsx - Contraste corrigido
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { X, Building2, MapPin, DollarSign, User, FileText } from 'lucide-react'
import { CreateClientRequest, CompanySize, RelationshipStatus, AccountHealth } from '@/types/clients'

interface NewClientModalProps {
  isOpen: boolean
  onClose: () => void
  onClientCreated: () => void
}

interface TeamMember {
  id: string
  full_name: string
  email: string
}

export default function NewClientModal({ isOpen, onClose, onClientCreated }: NewClientModalProps) {
  const [formData, setFormData] = useState<CreateClientRequest>({
    company_name: '',
    company_cnpj: '',
    company_size: undefined,
    industry: '',
    website: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zipcode: '',
    address_country: 'Brasil',
    relationship_status: 'Prospect',
    account_health: 'Saudável',
    total_contract_value: 0,
    monthly_recurring_revenue: 0,
    contract_start_date: '',
    contract_end_date: '',
    account_manager_id: '',
    notes: ''
  })

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (isOpen) {
      loadTeamMembers()
      resetForm()
    }
  }, [isOpen])

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      console.error('Erro ao carregar membros da equipe:', error)
    }
  }

const validateForm = (formData: any) => {
  const newErrors: any = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Nome da empresa é obrigatório'
    }

    if (formData.website && formData.website.trim()) {
      try {
        new URL(formData.website)
      } catch {
        newErrors.website = 'URL do website inválida'
      }
    }

      if (formData.total_contract_value < 0) {
    newErrors.total_contract_value = 'Valor do contrato não pode ser negativo';
  }

  if (formData.monthly_recurring_revenue < 0) {
    newErrors.monthly_recurring_revenue = 'MRR não pode ser negativo';
    }

    if (formData.contract_start_date && formData.contract_end_date) {
      if (new Date(formData.contract_start_date) >= new Date(formData.contract_end_date)) {
        newErrors.contract_end_date = 'Data final deve ser posterior à data inicial'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof CreateClientRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const resetForm = () => {
    setFormData({
      company_name: '',
      company_cnpj: '',
      company_size: undefined,
      industry: '',
      website: '',
      address_street: '',
      address_city: '',
      address_state: '',
      address_zipcode: '',
      address_country: 'Brasil',
      relationship_status: 'Prospect',
      account_health: 'Saudável',
      total_contract_value: 0,
      monthly_recurring_revenue: 0,
      contract_start_date: '',
      contract_end_date: '',
      account_manager_id: '',
      notes: ''
    })
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
  if (!validateForm(formData)) return

    setLoading(true)

    try {
      const clientData = {
        company_name: formData.company_name.trim(),
        company_cnpj: formData.company_cnpj?.trim() || null,
        company_size: formData.company_size || null,
        industry: formData.industry?.trim() || null,
        website: formData.website?.trim() || null,
        address_street: formData.address_street?.trim() || null,
        address_city: formData.address_city?.trim() || null,
        address_state: formData.address_state?.trim() || null,
        address_zipcode: formData.address_zipcode?.trim() || null,
        address_country: formData.address_country?.trim() || 'Brasil',
        relationship_status: formData.relationship_status,
        account_health: formData.account_health,
        total_contract_value: Number(formData.total_contract_value) || 0,
        monthly_recurring_revenue: Number(formData.monthly_recurring_revenue) || 0,
        contract_start_date: formData.contract_start_date || null,
        contract_end_date: formData.contract_end_date || null,
        account_manager_id: formData.account_manager_id || null,
        notes: formData.notes?.trim() || null,
        is_active: true
      }

      const { data: insertedClient, error: insertError } = await supabase
        .from('clients')
        .insert([clientData])
        .select('id')
        .single()

      if (insertError) throw insertError

      if (insertedClient?.id) {
        const { error: interactionError } = await supabase
          .from('client_interactions')
          .insert([{
            client_id: insertedClient.id,
            interaction_type: 'Nota',
            title: 'Cliente cadastrado',
            description: `Cliente ${clientData.company_name} cadastrado no sistema`,
            outcome: 'Positivo',
            created_by: clientData.account_manager_id,
            interaction_date: new Date().toISOString()
          }])

        if (interactionError) {
          console.error('Erro ao criar interação:', interactionError)
        }
      }

      alert('Cliente criado com sucesso!')
      onClientCreated()
      onClose()
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error)
      
      let errorMessage = 'Erro ao criar cliente. Tente novamente.'
      
      if (error?.message) {
        if (error.message.includes('duplicate key')) {
          errorMessage = 'Já existe um cliente com essas informações.'
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Responsável selecionado é inválido.'
        } else if (error.message.includes('check constraint')) {
          errorMessage = 'Alguns valores inseridos são inválidos.'
        }
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Novo Cliente</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-8">
            {/* Dados da Empresa */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-medium text-gray-900">Dados da Empresa</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                      errors.company_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ex: TechCorp Ltda"
                  />
                  {errors.company_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    CNPJ (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.company_cnpj}
                    onChange={(e) => handleInputChange('company_cnpj', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                      errors.company_cnpj ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="12.345.678/0001-90"
                    maxLength={18}
                  />
                  {errors.company_cnpj && (
                    <p className="text-red-500 text-sm mt-1">{errors.company_cnpj}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Porte da Empresa
                  </label>
                  <select
                    value={formData.company_size || ''}
                    onChange={(e) => handleInputChange('company_size', e.target.value as CompanySize)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="" className="text-gray-500">Selecionar porte...</option>
                    <option value="Startup">Startup</option>
                    <option value="Pequena">Pequena</option>
                    <option value="Média">Média</option>
                    <option value="Grande">Grande</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Setor/Indústria
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="Ex: Tecnologia, Varejo, Financeiro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                      errors.website ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="https://empresa.com.br"
                  />
                  {errors.website && (
                    <p className="text-red-500 text-sm mt-1">{errors.website}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-medium text-gray-900">Endereço</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Rua/Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.address_street}
                    onChange={(e) => handleInputChange('address_street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="Rua das Empresas, 123 - Centro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.address_city}
                    onChange={(e) => handleInputChange('address_city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="São Paulo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={formData.address_state}
                    onChange={(e) => handleInputChange('address_state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={formData.address_zipcode}
                    onChange={(e) => handleInputChange('address_zipcode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="01234-567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    value={formData.address_country}
                    onChange={(e) => handleInputChange('address_country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Status e Relacionamento */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-medium text-gray-900">Status e Relacionamento</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Status do Relacionamento
                  </label>
                  <select
                    value={formData.relationship_status}
                    onChange={(e) => handleInputChange('relationship_status', e.target.value as RelationshipStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="Prospect">Prospect</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Renovação">Renovação</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Churned">Churned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Saúde da Conta
                  </label>
                  <select
                    value={formData.account_health}
                    onChange={(e) => handleInputChange('account_health', e.target.value as AccountHealth)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="Excelente">Excelente</option>
                    <option value="Saudável">Saudável</option>
                    <option value="Em Risco">Em Risco</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Responsável pela Conta
                  </label>
                  <select
                    value={formData.account_manager_id}
                    onChange={(e) => handleInputChange('account_manager_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="" className="text-gray-500">Selecionar responsável...</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Informações Comerciais */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-medium text-gray-900">Informações Comerciais</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Valor Total do Contrato (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.total_contract_value}
                    onChange={(e) => handleInputChange('total_contract_value', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                      errors.total_contract_value ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0,00"
                  />
                  {errors.total_contract_value && (
                    <p className="text-red-500 text-sm mt-1">{errors.total_contract_value}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    MRR - Receita Recorrente Mensal (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.monthly_recurring_revenue}
                    onChange={(e) => handleInputChange('monthly_recurring_revenue', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                      errors.monthly_recurring_revenue ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0,00"
                  />
                  {errors.monthly_recurring_revenue && (
                    <p className="text-red-500 text-sm mt-1">{errors.monthly_recurring_revenue}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Data de Início do Contrato
                  </label>
                  <input
                    type="date"
                    value={formData.contract_start_date}
                    onChange={(e) => handleInputChange('contract_start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Data de Término do Contrato
                  </label>
                  <input
                    type="date"
                    value={formData.contract_end_date}
                    onChange={(e) => handleInputChange('contract_end_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      errors.contract_end_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.contract_end_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.contract_end_date}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-medium text-gray-900">Observações</h3>
              </div>
              
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Observações sobre o cliente, histórico de relacionamento, pontos importantes..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Criando...
                </>
              ) : (
                'Criar Cliente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}