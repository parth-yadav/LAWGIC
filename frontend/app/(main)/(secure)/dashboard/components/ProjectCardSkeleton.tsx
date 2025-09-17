'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';

const ProjectCardSkeleton: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
        {/* Thumbnail skeleton */}
        <div className="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted/30 relative">
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
        <div className="p-4 space-y-3">
          {/* Title skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-muted/70 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-muted/50 rounded animate-pulse w-1/2" />
          </div>

          {/* Metadata skeleton */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-3 bg-muted/60 rounded animate-pulse w-16" />
              <div className="h-3 bg-muted/60 rounded animate-pulse w-12" />
            </div>

            {/* Authors skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-muted/60 rounded animate-pulse" />
                <div className="flex -space-x-1">
                  {[...Array(3)].map((_, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 bg-muted/70 rounded-full border-2 border-background animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ProjectCardSkeleton;
