export interface Formula {
  id: string;
  name: string;
  expression: string;
  description: string;
  category: string;
}

export const FORMULA_CATEGORIES = ['General', 'Production', 'Cost', 'Waste', 'Doubling'];

export function defaultFormulas(): Formula[] {
  return [
    { id: '1', name: 'Production / day / frame', expression: 'GPS × 3 ÷ 1000 × 1632', description: 'Daily production per frame based on GPS value', category: 'Production' },
    { id: '2', name: 'Ex-Mill Inc. Transport',   expression: 'Ex-Mill Rate + Transport', description: 'Ex-mill rate including transport charges', category: 'Cost' },
    { id: '3', name: 'Clean Fibre Price',         expression: 'Ex-Mill Inc. Transport × (1 + Waste %)', description: 'Effective fibre cost after accounting for waste', category: 'Cost' },
    { id: '4', name: 'Waste Adjusted Cost',       expression: 'Price ÷ (1 - Waste %)', description: 'Cost adjusted for material waste percentage', category: 'Waste' },
    { id: '5', name: 'Doubling Cost',             expression: 'Doubling Rate + TFO Doubling + Transport', description: 'Total cost for doubling process per kg', category: 'Doubling' },
  ];
}
