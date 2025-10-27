import type { ButtonProperties } from '$lib/Button/properties';

export type StatusProperties = {
  statusIcon: string;
  statusText: string;
  statusDescription: string;
  buttonProperties?: ButtonProperties;
  onbuttonClick?: () => void;
};
