import type { ButtonProperties } from '$lib/Button/properties';

export type StatusProperties = StatusEventProperties & {
  statusIcon: string;
  statusText: string;
  statusDescription: string;
  buttonProperties?: ButtonProperties;
  classes?: string;
};

export type StatusEventProperties = {
  onbuttonClick?: () => void;
};
