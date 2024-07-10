import type { AutoCompleteType, CustomValidator, InputDataType, TextTransformer } from '$lib/types';

export type InputProperties = {
  value: string;
  placeholder: string;
  dataType: InputDataType;
  label: string | null;
  message: {
    onError: string;
    info: string;
  };
  validators: CustomValidator[];
  focus: boolean;
  disable: boolean;
  validationPattern: RegExp | null;
  inProgressPattern: RegExp | null;
  addFocusColor: boolean;
  maxLength: number;
  minLength: number;
  actionInput: boolean;
  useTextArea: boolean;
  autoComplete: AutoCompleteType;
  name: string;
  textTransformers: TextTransformer[];
  dataPw?: string;
};

export const defaultInputProperties: InputProperties = {
  value: '',
  placeholder: '',
  dataType: 'text',
  label: '',
  message: {
    onError: 'error',
    info: ''
  },
  validators: [],
  focus: true,
  disable: false,
  validationPattern: null,
  inProgressPattern: null,
  addFocusColor: false,
  maxLength: 1000,
  minLength: 0,
  actionInput: false,
  useTextArea: false,
  autoComplete: 'on',
  name: '',
  textTransformers: []
};
