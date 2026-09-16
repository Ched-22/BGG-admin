import { computeBudgetTotal, SERVICES_CATALOG } from '../data/orcamentoCatalog'
import { validatePhone } from './phoneUtils'
import {
  formatPlateInput,
  isValidPlate,
  plateValidationMessage,
  resolvePlateCountry,
} from './plateUtils'

export function formatPlate(value, country) {
  return formatPlateInput(value, country)
}

export { isValidPlate } from './plateUtils'

export function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || '')
}

export function validateQuoteForm(form, servicesCatalog = SERVICES_CATALOG) {
  const selectedCount = Object.values(form.selected || {}).filter(Boolean).length
  const total = computeBudgetTotal({
    selected: form.selected,
    vehicleSize: form.vehicleSize,
    discount: form.discount,
    override: form.override ?? '',
  }, servicesCatalog)

  const plateCountry = resolvePlateCountry(form.plateCountry)
  const errors = {}
  if (form.clientExistente && !form.clientId) {
    errors.clientSelect = 'Selecione um cliente do cadastro.'
  }
  if (!form.clientExistente || form.clientId) {
    if (!form.clientName?.trim()) errors.clientName = 'Nome do cliente é obrigatório'
    const phoneError = validatePhone(form.clientPhoneCountryCode, form.clientPhoneNationalNumber)
    if (phoneError) errors.clientPhone = phoneError
  }
  if (form.clientEmail?.trim() && !isValidEmail(form.clientEmail)) errors.clientEmail = 'Formato de e-mail inválido'
  if (!form.plate?.trim()) errors.plate = 'Placa do veículo é obrigatória'
  else if (!isValidPlate(form.plate, plateCountry)) errors.plate = plateValidationMessage(plateCountry)
  if (selectedCount === 0) errors.services = 'Selecione pelo menos um serviço'
  if (total <= 0) errors.total = 'Valor total deve ser maior que zero'
  return errors
}
