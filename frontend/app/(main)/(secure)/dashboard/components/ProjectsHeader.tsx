'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, SortAsc, Grid3x3, List, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ProjectsHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  filterBy: string;
  onFilterChange: (filterBy: string) => void;
  onCreateNew: () => void;
  projectsCount: number;
  isLoading?: boolean;
}

const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange,
  onCreateNew,
  projectsCount,
  isLoading = false,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Title and Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-1"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                />
                Loading projects...
              </span>
            ) : (
              `${projectsCount} ${projectsCount === 1 ? 'project' : 'projects'}`
            )}
          </motion.div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            onClick={onCreateNew}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </motion.div>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <motion.div
          className="relative flex-1 min-w-[300px]"
          whileFocus={{ scale: 1.02 }}
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`pl-10 transition-all duration-200 ${
              isSearchFocused 
                ? 'ring-2 ring-primary/20 border-primary/50' 
                : 'border-border/50'
            }`}
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                ×
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-2">
          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={`${filterBy !== 'all' ? 'bg-primary/10 border-primary/30' : ''}`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => onFilterChange('all')}
                className={filterBy === 'all' ? 'bg-accent' : ''}
              >
                All Projects
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onFilterChange('recent')}
                className={filterBy === 'recent' ? 'bg-accent' : ''}
              >
                Recently Edited
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onFilterChange('created')}
                className={filterBy === 'created' ? 'bg-accent' : ''}
              >
                Recently Created
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onFilterChange('shared')}
                className={filterBy === 'shared' ? 'bg-accent' : ''}
              >
                Shared with Me
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SortAsc className="w-4 h-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => onSortChange('lastEdited')}
                className={sortBy === 'lastEdited' ? 'bg-accent' : ''}
              >
                Last Edited
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onSortChange('dateCreated')}
                className={sortBy === 'dateCreated' ? 'bg-accent' : ''}
              >
                Date Created
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onSortChange('title')}
                className={sortBy === 'title' ? 'bg-accent' : ''}
              >
                Title (A-Z)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode */}
          <div className="flex items-center bg-muted/50 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="h-8 w-8 p-0"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectsHeader;
