export type ImgProperties = MandatoryImgProperties & OptionalImgProperties & ImgEventProperties;

export type MandatoryImgProperties = {
  src: string;
  alt: string;
};

export type OptionalImgProperties = {
  fallback?: string | null;
  classes?: string;
};

export type ImgEventProperties = {
  onerror?: () => void;
};
