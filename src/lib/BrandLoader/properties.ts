export type BrandLoaderProperties = {
  fullScreen: boolean;
  subText: string | null;
  brandLogoURL: string;
  brandText: string;
  loaderBackgroundImage: string;
};

export const defaultBrandLoaderProperties: BrandLoaderProperties = {
  fullScreen: true,
  subText: null,
  brandLogoURL: 'https://sdk.breeze.in/gallery/icons/logo.svg',
  brandText: 'breeze',
  loaderBackgroundImage: '/images/loader-background.svg'
};
