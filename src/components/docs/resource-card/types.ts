export interface Dependency {
  name: string;
  url: string;
}

export interface ResourceImage {
  src: string;
  alt: string;
  title?: string;
}

export interface ResourceCardProps {
  name: string;
  description: string;
  version?: string;
  dependencies?: Dependency[];
  images?: ResourceImage[];
  downloadUrl: string;
  className?: string;
}

export interface ResourceCardGridProps {
  children: React.ReactNode;
  className?: string;
}
