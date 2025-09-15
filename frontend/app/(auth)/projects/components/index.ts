// Project components exports
export { default as ProjectCard } from './ProjectCard';
export { default as ProjectCardSkeleton } from './ProjectCardSkeleton';
export { default as ProjectsHeader } from './ProjectsHeader';
export { default as ProjectListItem } from './ProjectListItem';
export { default as EmptyState } from './EmptyState';
export { default as ProjectsGridSkeleton } from './ProjectsGridSkeleton';
export { default as ProjectsListSkeleton } from './ProjectsListSkeleton';

// Types
export interface ProjectAuthor {
  id: string;
  name: string;
  avatar?: string;
}

export interface Project {
  id: string;
  title: string;
  thumbnail?: string;
  dateCreated: string;
  lastEdited: string;
  authors: ProjectAuthor[];
  description?: string;
}
