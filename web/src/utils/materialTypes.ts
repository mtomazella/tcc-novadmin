export const materialTypes = ['chapa', 'chapa_especial', 'ripa', 'ripa_especial'] as const;

export type MaterialType = typeof materialTypes[number];

export const materialTypeLabels: Record<MaterialType, string> = {
  'chapa': 'Chapa',
  'chapa_especial': 'Chapa Especial',
  'ripa': 'Ripa',
  'ripa_especial': 'Ripa Especial'
};

export const getMaterialTypeLabel = (type: string): string => {
  return materialTypeLabels[type as MaterialType] || type;
};