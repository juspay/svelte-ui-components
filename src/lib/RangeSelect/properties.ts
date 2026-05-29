export type RangeValue = {
  min: number | null;
  max: number | null;
};

export type RangeSelectProperties = {
  min?: number;
  max?: number;
  placeholder?: string;
  minLabel?: string;
  maxLabel?: string;
  testId?: string;
  classes?: string;
  onapply?: (range: RangeValue) => void;
};
