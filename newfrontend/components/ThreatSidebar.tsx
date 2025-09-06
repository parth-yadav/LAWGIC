"use client";
import { useState } from 'react';
import { AlertTriangle, FileText, Eye } from "lucide-react";
import { ThreatData } from '../types/highlight';

interface PageData {
  page: number;
  threats: ThreatData[];
  totalWords: number;
}

interface AnalysisResult {
  pages: PageData[];
  totalPages: number;
  totalThreats: number;
}

interface ThreatSidebarProps {
  analysisResult: AnalysisResult | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  selectedThreat: ThreatData | null;
  onThreatClick: (threat: ThreatData) => void;
  onPageChange: (page: number) => void;
}

export function ThreatSidebar({ 
  analysisResult, 
  currentPage, 
  setCurrentPage, 
  selectedThreat, 
  onThreatClick,
  onPageChange 
}: ThreatSidebarProps) {
  const [activeTab, setActiveTab] = useState<number | 'overview'>('overview');

  if (!analysisResult) {
    return null;
  }

  const threatSeverity = (reason: string): 'high' | 'medium' | 'low' => {
    const highSeverity = ['injection', 'xss', 'command', 'malicious'];
    const mediumSeverity = ['suspicious', 'credential', 'exposure'];
    const lowerReason = reason.toLowerCase();
    if (highSeverity.some(keyword => lowerReason.includes(keyword))) return 'high';
    if (mediumSeverity.some(keyword => lowerReason.includes(keyword))) return 'medium';
    return 'low';
  };

  const handlePageTabClick = (pageNumber: number) => {
    setActiveTab(activeTab === pageNumber ? 'overview' : pageNumber);
    setCurrentPage(pageNumber);
    onPageChange(pageNumber);
  };

  const handleOverviewTabClick = () => {
    setActiveTab('overview');
  };

  const handleThreatItemClick = (threat: ThreatData, pageNumber: number) => {
    setCurrentPage(pageNumber);
    onPageChange(pageNumber);
    onThreatClick(threat);
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getSeverityBadgeColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-orange-500 text-white';
      case 'low': return 'bg-yellow-500 text-white';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            All Threats
          </h3>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {analysisResult.totalPages} pages
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              {analysisResult.totalThreats} threats
            </span>
          </div>
        </div>
      </div>

      {/* Page Tabs */}
      <div className="border-b bg-gray-50">
        <div className="flex overflow-x-auto scrollbar-hide">
          {/* Overview Tab - Always present */}
          <button
            onClick={handleOverviewTabClick}
            className={`
              flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === 'overview'
                ? 'border-red-500 text-red-600 bg-white' 
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span>All Threats Found</span>
              <span className="px-2 py-1 text-xs rounded-full font-medium bg-red-500 text-white">
                {analysisResult.totalThreats}
              </span>
            </div>
          </button>

          {/* Page Tabs */}
          {analysisResult.pages.map((pageData) => {
            const isActive = activeTab === pageData.page;
            const isCurrentPage = currentPage === pageData.page;
            const threatCount = pageData.threats.length;
            const hasThreats = threatCount > 0;
            
            return (
              <button
                key={pageData.page}
                onClick={() => handlePageTabClick(pageData.page)}
                className={`
                  flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors relative
                  ${isActive 
                    ? 'border-red-500 text-red-600 bg-white' 
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                  ${isCurrentPage && !isActive ? 'bg-blue-50 text-blue-600' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <span>Page {pageData.page}</span>
                  {hasThreats && (
                    <span className={`
                      px-2 py-1 text-xs rounded-full font-medium
                      ${hasThreats ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}
                    `}>
                      {threatCount}
                    </span>
                  )}
                </div>
                {isCurrentPage && (
                  <div className="absolute top-1 right-1">
                    <Eye className="w-3 h-3 text-blue-500" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Threats Content */}
      <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
        {activeTab === 'overview' ? (
          // Show overview of all threats
          <div className="p-4">
            <div className="mb-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">
                All Threats Overview ({analysisResult.totalThreats} total)
              </h4>
            </div>
            
            {/* Summary by severity */}
            {(() => {
              const allThreats = analysisResult.pages.flatMap(p => p.threats);
              const severityCounts = {
                high: allThreats.filter(t => threatSeverity(t.reason) === 'high').length,
                medium: allThreats.filter(t => threatSeverity(t.reason) === 'medium').length,
                low: allThreats.filter(t => threatSeverity(t.reason) === 'low').length,
              };
              
              return (
                <div className="space-y-3 mb-6">
                  <h5 className="text-sm font-semibold text-gray-700">Threat Summary</h5>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-red-600">{severityCounts.high}</div>
                      <div className="text-xs text-red-700">High</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-orange-600">{severityCounts.medium}</div>
                      <div className="text-xs text-orange-700">Medium</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-yellow-600">{severityCounts.low}</div>
                      <div className="text-xs text-yellow-700">Low</div>
                    </div>
                  </div>
                </div>
              );
            })()}
            
            {/* All threats from all pages */}
            <div className="space-y-3">
              <h5 className="text-sm font-semibold text-gray-700">All Threats</h5>
              {analysisResult.pages.flatMap(pageData => 
                pageData.threats.map((threat, threatIndex) => {
                  const severity = threatSeverity(threat.reason);
                  const hasLocation = threat.bbox !== null;
                  const isSelected = selectedThreat === threat;
                  
                  return (
                    <div
                      key={`${pageData.page}-${threatIndex}`}
                      onClick={() => handleThreatItemClick(threat, pageData.page)}
                      className={`
                        p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md
                        ${isSelected ? 'ring-2 ring-red-500' : ''}
                        ${getSeverityColor(severity)}
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`
                            px-2 py-1 text-xs font-medium rounded-full
                            ${getSeverityBadgeColor(severity)}
                          `}>
                            {severity.toUpperCase()}
                          </span>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                            Page {pageData.page}
                          </span>
                          {!hasLocation && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                              No location
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-medium text-sm break-words mb-1">
                        "{threat.text}"
                      </p>
                      <p className="text-xs opacity-80">
                        {threat.reason}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          // Show threats for selected page
          <div className="p-4">
            <div className="mb-3">
              <h4 className="text-md font-semibold text-gray-900">
                Page {activeTab} Threats ({analysisResult.pages.find(p => p.page === activeTab)?.threats.length || 0})
              </h4>
            </div>
            
            {(() => {
              const pageData = analysisResult.pages.find(p => p.page === activeTab);
              const threats = pageData?.threats || [];
              
              if (threats.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">No threats detected on this page.</p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-3">
                  {threats.map((threat, index) => {
                    const severity = threatSeverity(threat.reason);
                    const hasLocation = threat.bbox !== null;
                    const isSelected = selectedThreat === threat;
                    
                    return (
                      <div
                        key={index}
                        onClick={() => handleThreatItemClick(threat, activeTab as number)}
                        className={`
                          p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md
                          ${isSelected ? 'ring-2 ring-red-500' : ''}
                          ${getSeverityColor(severity)}
                        `}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`
                              px-2 py-1 text-xs font-medium rounded-full
                              ${getSeverityBadgeColor(severity)}
                            `}>
                              {severity.toUpperCase()}
                            </span>
                            {!hasLocation && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                No location
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="font-medium text-sm break-words mb-1">
                          "{threat.text}"
                        </p>
                        <p className="text-xs opacity-80">
                          {threat.reason}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
