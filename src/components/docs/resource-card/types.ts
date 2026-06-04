export interface Dependency {
  name: string;
  url: string;
}

export interface ResourceImage {
  src: string;
  alt: string;
  title?: string;
  unoptimized?: boolean;
}


export interface ModrinthProject {
  title: string;
  description: string;
  body: string;
  versions: string[];
  icon_url: string | null;
  gallery: ModrinthGalleryImage[];
  project_type: "mod" | "resourcepack" | "shader" | "modpack" | "datapack";
  source_url: string | null;
  slug: string;
  id: string;
  categories: string[];
  client_side: "required" | "optional" | "unsupported" | "unknown";
  server_side: "required" | "optional" | "unsupported" | "unknown";
  downloads: number;
  followers: number;
  published: string;
  updated: string;
}

export interface ModrinthVersionFile {
  url: string;
  filename: string;
  primary: boolean;
  size: number;
}

export interface ModrinthVersion {
  id: string;
  version_number: string;
  name: string;
  date_published: string;
  downloads: number;
  game_versions: string[];
  loaders: string[];
  files: ModrinthVersionFile[];
  dependencies: {
    project_id: string | null;
    version_id: string | null;
    dependency_type: "required" | "optional" | "incompatible" | "embedded";
    file_name: string | null;
  }[];
}

export interface ModrinthGalleryImage {
  url: string;
  featured: boolean;
  title: string | null;
  description: string | null;
  created: string;
  ordering: number;
}


export interface ResourceCardProps {
  modrinthId?: string;

  name?: string;
  description?: string;
  version?: string;
  dependencies?: Dependency[];
  images?: ResourceImage[];
  downloadUrl?: string;
  className?: string;
}

export interface ResourceCardGridProps {
  children: React.ReactNode;
  className?: string;
}