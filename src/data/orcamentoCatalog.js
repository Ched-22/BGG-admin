export const VEHICLE_SIZE_OPTIONS = [
  { id: 'pequeno', label: 'Pequeño', hint: 'Hatch, compacto' },
  { id: 'medio', label: 'Mediano', hint: 'Berlina, SUV mediano' },
  { id: 'grande', label: 'Grande', hint: 'SUV grande, pickup' },
]

export const SERVICES_CATALOG = [
  { id: 'polim', name: 'Pulido técnico', desc: 'Corrección de pintura en 1 etapa', durationHours: 2, prices: { pequeno: 75, medio: 95, grande: 120 } },
  { id: 'vitri', name: 'Vitrificación cerámica', desc: 'Protección cerámica de alto nivel', durationHours: 4, prices: { pequeno: 280, medio: 350, grande: 440 } },
  { id: 'ppf', name: 'PPF — película de protección', desc: 'Frontal completo, capó + parachoques', durationHours: 8, prices: { pequeno: 620, medio: 780, grande: 980 } },
  { id: 'couro', name: 'Higiene de cuero', desc: 'Asientos + salpicadero + acabados', durationHours: 2, prices: { pequeno: 55, medio: 70, grande: 90 } },
  { id: 'motor', name: 'Detallado de motor', desc: 'Limpieza y acabado', durationHours: 1.5, prices: { pequeno: 45, medio: 55, grande: 70 } },
  { id: 'ozonio', name: 'Tratamiento de ozono', desc: 'Desinfección completa del habitáculo', durationHours: 1.5, prices: { pequeno: 35, medio: 45, grande: 55 } },
  { id: 'rodas', name: 'Restauración de llantas', desc: 'Pulido + sellador por llanta', durationHours: 2, prices: { pequeno: 95, medio: 120, grande: 150 } },
  { id: 'farol', name: 'Pulido de faros', desc: 'Restauración óptica', durationHours: 1, prices: { pequeno: 30, medio: 35, grande: 45 } },
]

export const CAR_BRANDS = [
  'Abarth',
  'Alpine',
  'Aston Martin',
  'Audi',
  'Bentley',
  'BMW',
  'Bugatti',
  'BYD',
  'Cadillac',
  'Chevrolet',
  'Chrysler',
  'Citroën',
  'Cupra',
  'Dacia',
  'Dodge',
  'DS',
  'Ferrari',
  'Fiat',
  'Ford',
  'Genesis',
  'Honda',
  'Hyundai',
  'Infiniti',
  'Jaguar',
  'Jeep',
  'Kia',
  'Lamborghini',
  'Lancia',
  'Land Rover',
  'Lexus',
  'Lotus',
  'Maserati',
  'McLaren',
  'Mercedes-Benz',
  'MG',
  'Mini',
  'Mitsubishi',
  'Nissan',
  'Opel',
  'Peugeot',
  'Polestar',
  'Porsche',
  'RAM',
  'Range Rover',
  'Renault',
  'Rolls-Royce',
  'Saab',
  'Seat',
  'Skoda',
  'Smart',
  'Subaru',
  'Suzuki',
  'Tesla',
  'Toyota',
  'Vauxhall',
  'Volkswagen',
  'Volvo',
  'Otra',
]

/** Includes legacy/custom brand when not in the catalog list. */
export function carBrandOptions(currentBrand = '') {
  const value = String(currentBrand || '').trim();
  if (value && !CAR_BRANDS.includes(value)) {
    return [...CAR_BRANDS.filter((b) => b !== 'Otra'), value, 'Otra'];
  }
  return CAR_BRANDS;
}

export function servicePrice(service, size) {
  return service.prices[size] ?? service.prices.medio
}

export function sumQuoteServiceDurationHours(serviceIds) {
  const ids = Array.isArray(serviceIds) ? serviceIds : []
  if (!ids.length) return 2
  const total = ids.reduce((sum, id) => {
    const service = SERVICES_CATALOG.find((item) => item.id === id)
    return sum + (service?.durationHours ?? 0)
  }, 0)
  return total > 0 ? total : 2
}

export function computeBudgetTotal({ selected, vehicleSize, discount, override }, catalog = SERVICES_CATALOG) {
  const subtotal = Object.entries(selected || {}).reduce((sum, [id, on]) => {
    if (!on) return sum
    const s = catalog.find((x) => x.id === id)
    return sum + (s ? servicePrice(s, vehicleSize) : 0)
  }, 0)
  const computed = subtotal - Number(discount || 0)
  return override !== '' && override != null ? Number(override) : computed
}
