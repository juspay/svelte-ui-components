import type { ButtonProperties } from '$lib/Button/properties';

export type StatusProperties = {
  statusIcon: string;
  statusText: string;
  statusDescription: string;
  buttonProperties: ButtonProperties | null;
};

export const defaultStatusProperties: StatusProperties = {
  statusIcon: 'icons/order-success-icon.svg',
  statusText: '',
  statusDescription: '',
  buttonProperties: null
};
