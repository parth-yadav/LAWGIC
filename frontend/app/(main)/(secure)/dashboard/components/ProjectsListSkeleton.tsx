'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';

interface ProjectsListSkeletonProps {
  count?: number;
}

const ProjectsListSkeleton: React.FC<ProjectsListSkeletonProps> = ({ count = 8 }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-3"
    >
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              {/* Thumbnail skeleton */}
              <div className="w-16 h-12 bg-muted/70 rounded-lg animate-pulse flex-shrink-0 relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </div>

              {/* Content skeleton */}
              <div className="flex-1 min-w-0">
                <div className="space-y-2">
                  <div className="h-4 bg-muted/70 rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-muted/50 rounded animate-pulse w-1/2" />
                </div>
              </div>

              {/* Metadata skeleton */}
              <div className="hidden md:flex items-center gap-6">
                {/* Authors */}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-muted/60 rounded animate-pulse" />
                  <div className="flex -space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 bg-muted/70 rounded-full border-2 border-background animate-pulse"
                      />
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 min-w-[100px]">
                  <div className="w-4 h-4 bg-muted/60 rounded animate-pulse" />
                  <div className="h-3 bg-muted/60 rounded animate-pulse w-16" />
                </div>

                {/* Time */}
                <div className="flex items-center gap-2 min-w-[80px]">
                  <div className="w-4 h-4 bg-muted/60 rounded animate-pulse" />
                  <div className="h-3 bg-muted/60 rounded animate-pulse w-12" />
                </div>
              </div>

              {/* Mobile metadata */}
              <div className="md:hidden flex flex-col items-end gap-1">
                <div className="h-3 bg-muted/60 rounded animate-pulse w-12" />
                <div className="flex -space-x-1">
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 bg-muted/70 rounded-full border border-background animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ProjectsListSkeleton;
