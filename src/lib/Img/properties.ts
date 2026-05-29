export type ImgProperties = MandatoryImgProperties & OptionalImgProperties & ImgEventProperties;

export type MandatoryImgProperties = {
  src: string;
  alt: string;
};

export type OptionalImgProperties = {
  fallback?: string | null;
  classes?: string;
  testId?: string;
  inlineSvg?: boolean;
  transform?: (svg: string) => string;
};

export type ImgEventProperties = {
  onerror?: () => void;
};
