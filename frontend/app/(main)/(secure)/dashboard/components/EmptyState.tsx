'use client';

import React from 'react';
import { motion } from 'motion/react';
import { FileX, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  searchQuery?: string;
  onCreateNew: () => void;
  onClearSearch?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  searchQuery,
  onCreateNew,
  onClearSearch,
}) => {
  const isSearchResult = searchQuery && searchQuery.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mb-6"
      >
        {isSearchResult ? (
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full flex items-center justify-center">
            <Search className="w-10 h-10 text-muted-foreground/60" />
          </div>
        ) : (
          <div className="w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full flex items-center justify-center">
            <FileX className="w-10 h-10 text-muted-foreground/60" />
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="space-y-3 max-w-md"
      >
        <h3 className="text-xl font-semibold text-foreground">
          {isSearchResult 
            ? `No projects found for "${searchQuery}"` 
            : 'No projects yet'
          }
        </h3>
        
        <div className="text-muted-foreground">
          {isSearchResult
            ? 'Try adjusting your search terms or create a new project.'
            : 'Create your first project to get started with your creative journey.'
          }
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="flex gap-3 mt-8"
      >
        {isSearchResult && onClearSearch && (
          <Button 
            variant="outline" 
            onClick={onClearSearch}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            Clear Search
          </Button>
        )}
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            onClick={onCreateNew}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
          >
            <Plus className="w-4 h-4" />
            {isSearchResult ? 'Create New Project' : 'Create Your First Project'}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default EmptyState;
