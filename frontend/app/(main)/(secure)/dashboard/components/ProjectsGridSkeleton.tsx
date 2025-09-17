'use client';

import React from 'react';
import { motion } from 'motion/react';
import ProjectCardSkeleton from './ProjectCardSkeleton';

interface ProjectsGridSkeletonProps {
  count?: number;
}

const ProjectsGridSkeleton: React.FC<ProjectsGridSkeletonProps> = ({ count = 6 }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <ProjectCardSkeleton />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ProjectsGridSkeleton;
