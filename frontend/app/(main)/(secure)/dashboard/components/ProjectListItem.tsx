'use client';

import React from 'react';
import { motion } from 'motion/react';
import { FileText, Users, Clock, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface ProjectAuthor {
  id: string;
  name: string;
  avatar?: string;
}

interface Project {
  id: string;
  title: string;
  thumbnail?: string;
  dateCreated: string;
  lastEdited: string;
  authors: ProjectAuthor[];
  description?: string;
}

interface ProjectListItemProps {
  project: Project;
  onSelect?: (project: Project) => void;
  index: number;
}

const ProjectListItem: React.FC<ProjectListItemProps> = ({
  project,
  onSelect,
  index,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(dateString);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      whileHover={{ x: 4 }}
      className="group"
    >
      <Card 
        className="p-4 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-border transition-all duration-200 cursor-pointer"
        onClick={() => onSelect?.(project)}
      >
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div className="w-16 h-12 bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-blue-400/20 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {project.thumbnail ? (
              <img
                src={project.thumbnail}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <FileText className="w-6 h-6 text-muted-foreground/50" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200">
                  {project.title}
                </h3>
                {project.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            {/* Authors */}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <div className="flex -space-x-1">
                {project.authors.slice(0, 3).map((author) => (
                  <Avatar key={author.id} className="w-7 h-7 border-2 border-background">
                    {author.avatar ? (
                      <img
                        src={author.avatar}
                        alt={author.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xs font-medium text-white">
                        {author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Avatar>
                ))}
                {project.authors.length > 3 && (
                  <div className="w-7 h-7 bg-muted border-2 border-background rounded-full flex items-center justify-center text-xs font-medium text-muted-foreground">
                    +{project.authors.length - 3}
                  </div>
                )}
              </div>
            </div>

            {/* Created Date */}
            <div className="flex items-center gap-2 min-w-[100px]">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(project.dateCreated)}</span>
            </div>

            {/* Last Edited */}
            <div className="flex items-center gap-2 min-w-[80px]">
              <Clock className="w-4 h-4" />
              <span>{getTimeAgo(project.lastEdited)}</span>
            </div>
          </div>

          {/* Mobile metadata */}
          <div className="md:hidden flex flex-col items-end gap-1 text-xs text-muted-foreground">
            <span>{getTimeAgo(project.lastEdited)}</span>
            <div className="flex -space-x-1">
              {project.authors.slice(0, 2).map((author) => (
                <Avatar key={author.id} className="w-5 h-5 border border-background">
                  {author.avatar ? (
                    <img
                      src={author.avatar}
                      alt={author.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xs font-medium text-white">
                      {author.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Avatar>
              ))}
              {project.authors.length > 2 && (
                <div className="w-5 h-5 bg-muted border border-background rounded-full flex items-center justify-center text-xs font-medium text-muted-foreground">
                  +{project.authors.length - 2}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ProjectListItem;
