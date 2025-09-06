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
  const [activeTab, setActiveTab] = useState<number | null>(null);

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
    setActiveTab(activeTab === pageNumber ? null : pageNumber);
    setCurrentPage(pageNumber);
    onPageChange(pageNumber);
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
        {activeTab !== null ? (
          // Show threats for selected tab
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
                        onClick={() => handleThreatItemClick(threat, activeTab)}
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
        ) : (
          // Show overview of all pages
          <div className="p-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Click on a page tab above to view threats for that specific page.
              </p>
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
                  <h4 className="text-sm font-semibold text-gray-700">Threat Summary</h4>
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
            
            {/* Pages overview */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Pages Overview</h4>
              {analysisResult.pages.map((pageData) => (
                <button
                  key={pageData.page}
                  onClick={() => handlePageTabClick(pageData.page)}
                  className="w-full p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Page {pageData.page}</span>
                    <div className="flex items-center gap-2">
                      {pageData.threats.length > 0 ? (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                          {pageData.threats.length} threats
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                          Clean
                        </span>
                      )}
                    </div>
                  </div>
                  {pageData.threats.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      {pageData.threats.slice(0, 2).map(t => `"${t.text}"`).join(', ')}
                      {pageData.threats.length > 2 && ` +${pageData.threats.length - 2} more`}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
