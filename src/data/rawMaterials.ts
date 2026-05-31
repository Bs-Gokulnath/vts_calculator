export interface RawMaterial {
  id: string;
  name: string;
  supplier: string;
  exMillRate: number;
  transport: number;
  wastePercent: number;
}

export function exMillIncTransport(m: RawMaterial) { return m.exMillRate + m.transport; }
export function cleanFibrePrice(m: RawMaterial) {
  return exMillIncTransport(m) * (1 + m.wastePercent / 100);
}

export function defaultMaterials(): RawMaterial[] {
  return [
    { id: '1',  name: 'Viscose',        supplier: 'Grasim',  exMillRate: 187, transport: 0, wastePercent: 5 },
    { id: '2',  name: 'Modal',          supplier: 'Grasim',  exMillRate: 283, transport: 0, wastePercent: 5 },
    { id: '3',  name: 'Micro Modal',    supplier: 'Grasim',  exMillRate: 301, transport: 0, wastePercent: 5 },
    { id: '4',  name: 'Excel',          supplier: 'Grasim',  exMillRate: 200, transport: 0, wastePercent: 5 },
    { id: '5',  name: 'Micro Liva Eco', supplier: 'Grasim',  exMillRate: 211, transport: 0, wastePercent: 5 },
    { id: '6',  name: 'Liva Eco',       supplier: 'Grasim',  exMillRate: 205, transport: 0, wastePercent: 5 },
    { id: '7',  name: 'Anti-Bacterial', supplier: 'Grasim',  exMillRate: 186, transport: 0, wastePercent: 5 },
    { id: '8',  name: 'Liva Reviva',    supplier: 'Grasim',  exMillRate: 198, transport: 0, wastePercent: 5 },
    { id: '9',  name: 'Eco Vero',       supplier: 'Lenzing', exMillRate: 210, transport: 2, wastePercent: 5 },
    { id: '10', name: 'Refibra',        supplier: 'Lenzing', exMillRate: 310, transport: 5, wastePercent: 5 },
    { id: '11', name: 'Micro Modal',    supplier: 'Lenzing', exMillRate: 310, transport: 2, wastePercent: 5 },
    { id: '12', name: 'Micro EcoVero',  supplier: 'Lenzing', exMillRate: 195, transport: 2, wastePercent: 5 },
    { id: '13', name: 'Tencel STD',     supplier: 'Lenzing', exMillRate: 210, transport: 2, wastePercent: 5 },
    { id: '14', name: 'Tencel LF',      supplier: 'Lenzing', exMillRate: 270, transport: 2, wastePercent: 5 },
    { id: '15', name: 'Tencel A100',    supplier: 'Lenzing', exMillRate: 400, transport: 2, wastePercent: 5 },
    { id: '16', name: 'Micro Tencel',   supplier: 'Lenzing', exMillRate: 270, transport: 2, wastePercent: 5 },
  ];
}
