export type AvatarSize = 'small' | 'medium' | 'large';

export type AvatarProperties = MandatoryAvatarProperties &
  OptionalAvatarProperties &
  AvatarEventProperties;

export type MandatoryAvatarProperties = {
  alt: string;
};

export type OptionalAvatarProperties = {
  src?: string;
  name?: string;
  size?: AvatarSize;
  testId?: string;
  classes?: string;
};

export type AvatarEventProperties = {
  onclick?: (event: MouseEvent) => void;
};
