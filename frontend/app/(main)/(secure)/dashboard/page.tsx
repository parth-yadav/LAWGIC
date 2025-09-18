'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ProjectsHeader from './components/ProjectsHeader';
import ProjectCard from './components/ProjectCard';
import ProjectListItem from './components/ProjectListItem';
import EmptyState from './components/EmptyState';
import ProjectsGridSkeleton from './components/ProjectsGridSkeleton';
import ProjectsListSkeleton from './components/ProjectsListSkeleton';

// Mock data - replace with actual API calls
const mockProjects = [
  {
    id: '1',
    title: 'AI-Powered Dashboard',
    description: 'A comprehensive dashboard for managing AI workflows and analytics.',
    thumbnail: '',
    dateCreated: '2024-09-01T10:00:00Z',
    lastEdited: '2024-09-15T14:30:00Z',
    authors: [
      { id: '1', name: 'John Doe', avatar: '' },
      { id: '2', name: 'Jane Smith', avatar: '' },
    ],
  },
  {
    id: '2',
    title: 'E-commerce Platform',
    description: 'Modern e-commerce solution with advanced filtering and search capabilities.',
    thumbnail: '',
    dateCreated: '2024-08-15T09:00:00Z',
    lastEdited: '2024-09-14T16:45:00Z',
    authors: [
      { id: '3', name: 'Mike Johnson', avatar: '' },
    ],
  },
  {
    id: '3',
    title: 'Social Media Analytics',
    description: 'Real-time analytics platform for social media insights and engagement tracking.',
    thumbnail: '',
    dateCreated: '2024-07-20T11:30:00Z',
    lastEdited: '2024-09-13T09:15:00Z',
    authors: [
      { id: '1', name: 'John Doe', avatar: '' },
      { id: '4', name: 'Sarah Wilson', avatar: '' },
      { id: '5', name: 'Tom Brown', avatar: '' },
    ],
  },
  {
    id: '4',
    title: 'Mobile Task Manager',
    description: 'Cross-platform task management app with real-time collaboration features.',
    thumbnail: '',
    dateCreated: '2024-06-10T14:00:00Z',
    lastEdited: '2024-09-12T11:20:00Z',
    authors: [
      { id: '2', name: 'Jane Smith', avatar: '' },
      { id: '6', name: 'Alex Chen', avatar: '' },
    ],
  },
  {
    id: '5',
    title: 'Crypto Trading Bot',
    description: 'Automated cryptocurrency trading system with advanced algorithms and risk management.',
    thumbnail: '',
    dateCreated: '2024-05-25T08:45:00Z',
    lastEdited: '2024-09-11T13:30:00Z',
    authors: [
      { id: '7', name: 'David Lee', avatar: '' },
    ],
  },
  {
    id: '6',
    title: 'Healthcare Portal',
    description: 'Patient management system with appointment scheduling and medical records.',
    thumbnail: '',
    dateCreated: '2024-04-30T16:20:00Z',
    lastEdited: '2024-09-10T10:45:00Z',
    authors: [
      { id: '8', name: 'Emily Davis', avatar: '' },
      { id: '9', name: 'Robert Taylor', avatar: '' },
    ],
  },
];

function Projects() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('lastEdited');
  const [filterBy, setFilterBy] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState(mockProjects);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.authors.some(author => 
          author.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply category filter
    if (filterBy === 'recent') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter(project => 
        new Date(project.lastEdited) > sevenDaysAgo
      );
    } else if (filterBy === 'created') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(project => 
        new Date(project.dateCreated) > thirtyDaysAgo
      );
    }
    // Note: 'shared' filter would require additional data about sharing

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'lastEdited':
          return new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime();
        case 'dateCreated':
          return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects, searchQuery, filterBy, sortBy]);

  const handleProjectSelect = (project: any) => {
    console.log('Selected project:', project);
    // Navigate to project or open modal
  };

  const handleCreateNew = () => {
    console.log('Create new project');
    // Navigate to create project page or open modal
  };

  const handleProjectDelete = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const handleProjectDuplicate = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const duplicated = {
        ...project,
        id: Date.now().toString(),
        title: `${project.title} (Copy)`,
        dateCreated: new Date().toISOString(),
        lastEdited: new Date().toISOString(),
      };
      setProjects(prev => [duplicated, ...prev]);
    }
  };

  const handleProjectRename = (projectId: string) => {
    const newTitle = prompt('Enter new project name:');
    if (newTitle) {
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, title: newTitle, lastEdited: new Date().toISOString() }
          : p
      ));
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <ProjectsHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filterBy={filterBy}
          onFilterChange={setFilterBy}
          onCreateNew={handleCreateNew}
          projectsCount={filteredAndSortedProjects.length}
          isLoading={isLoading}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mt-8"
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {viewMode === 'grid' ? (
                  <ProjectsGridSkeleton count={8} />
                ) : (
                  <ProjectsListSkeleton count={6} />
                )}
              </motion.div>
            ) : filteredAndSortedProjects.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <EmptyState
                  searchQuery={searchQuery}
                  onCreateNew={handleCreateNew}
                  onClearSearch={searchQuery ? handleClearSearch : undefined}
                />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAndSortedProjects.map((project, index) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onSelect={handleProjectSelect}
                        onDelete={handleProjectDelete}
                        onDuplicate={handleProjectDuplicate}
                        onRename={handleProjectRename}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAndSortedProjects.map((project, index) => (
                      <ProjectListItem
                        key={project.id}
                        project={project}
                        onSelect={handleProjectSelect}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

export default Projects;