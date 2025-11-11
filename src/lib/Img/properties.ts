export type ImgProperties = OptionalImgProperties & MandatoryImgProperties;

export type MandatoryImgProperties = {
  src: string;
  alt: string;
};

export type OptionalImgProperties = {
  fallback?: string | null;
};
