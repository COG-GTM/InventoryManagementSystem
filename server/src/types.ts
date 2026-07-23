export type PartKind = 'inhouse' | 'outsourced';

export interface PartBase {
  partId: number;
  name: string;
  price: number;
  inStock: number;
  min: number;
  max: number;
}

export interface InhousePart extends PartBase {
  kind: 'inhouse';
  machineId: number;
}

export interface OutsourcedPart extends PartBase {
  kind: 'outsourced';
  companyName: string;
}

export type Part = InhousePart | OutsourcedPart;

export type InhousePartInput = Omit<InhousePart, 'partId'>;
export type OutsourcedPartInput = Omit<OutsourcedPart, 'partId'>;
export type PartInput = InhousePartInput | OutsourcedPartInput;

export interface Product {
  productId: number;
  name: string;
  price: number;
  inStock: number;
  min: number;
  max: number;
  associatedParts: Part[];
}

export interface PartRow {
  partId: number;
  name: string;
  price: number;
  inStock: number;
  min: number;
  max: number;
  kind: string;
  machineId: number | null;
  companyName: string | null;
  deleted: number;
}

export interface ProductRow {
  productId: number;
  name: string;
  price: number;
  inStock: number;
  min: number;
  max: number;
}
