import React, { useState, useCallback, useEffect } from 'react';
import { SetupForm } from './components/SetupForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { runAnalysis } from './services/geminiService';
import type { AnalysisResult, AppConfig, SavedReport, Task, Session, ApiKeys } from './types';
import { LoadingStatus } from './components/LoadingSpinner';
import { SavedReportsList } from './components/SavedReportsList';
import { ReportViewer } from './components/ReportViewer';
import { generateHtmlReport, createHostedReport } from './utils/exportUtils';
import { supabase } from './supabase';
import { Auth } from './components/Auth';
import { Settings } from './components/Settings';

const TravykLogo: React.FC = () => (
    <svg aria-label="TRAVYK Logo" height="28" viewBox="0 0 180 32" xmlns="http://www.w3.org/2000/svg">
        <text
            x="0"
            y="26"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif"
            fontSize="32"
            fontWeight="800"
            letterSpacing="-2"
            fill="#f3f4f6"
        >
            TRAVY
        </text>
        <text
            x="98"
            y="26"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif"
            fontSize="32"
            fontWeight="800"
            letterSpacing="-2"
            fill="#4ade80"
        >
            K
        </text>
    </svg>
);

interface ShareLinkModalProps {
    sharingState: {
        isSharing: boolean;
        link: string | null;
        error: string | null;
    };
    onClose: () => void;
}

const ShareLinkModal: React.FC<ShareLinkModalProps> = ({ sharingState, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (sharingState.link) {
            navigator.clipboard.writeText(sharingState.link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg text-left" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-green-400">Share Report</h3>
                </div>
                <div className="p-6 space-y-4">
                    {sharingState.isSharing && (
                        <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500"></div>
                            <p className="text-gray-300">Creating a secure, shareable link...</p>
                        </div>
                    )}
                    {sharingState.error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                            <p><strong className="font-bold">Error:</strong> {sharingState.error}</p>
                        </div>
                    )}
                    {sharingState.link && (
                        <div>
                            <p className="text-gray-400 mb-2">Your report is hosted and can be shared with this public link:</p>
                            <div className="flex space-x-2">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={sharingState.link} 
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none" 
                                />
                                <button
                                    onClick={handleCopy}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors w-28"
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-900/50 rounded-b-xl text-right">
                     <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<'app' | 'settings'>('app');
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [keysLoaded, setKeysLoaded] = useState(false);

  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [results, setResults] = useState<AnalysisResult[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [viewingReportHtml, setViewingReportHtml] = useState<string | null>(null);
  const [sharingReport, setSharingReport] = useState<{ reportId: string, isSharing: boolean, link: string | null, error: string | null } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Data fetching for logged-in user
  useEffect(() => {
    if (session) {
      setKeysLoaded(false);
      supabase.from('profiles').select('gemini, openai, perplexity, copilotKey, copilotEndpoint').eq('id', session.user.id).single()
        .then(({ data, error }) => {
          if (data) {
            setApiKeys({
              gemini: data.gemini,
              openai: data.openai,
              perplexity: data.perplexity,
              copilotKey: data.copilotKey,
              copilotEndpoint: data.copilotEndpoint,
            });
          } else if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error for new users
            console.error("Error fetching API keys:", error);
          }
          setKeysLoaded(true);
        });

      supabase.from('reports').select('id, created_at, clientName, htmlContent, shareableLink').eq('user_id', session.user.id).order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching reports:", error);
            setError("Could not load your saved reports.");
          } else if (data) {
            const reports = data.map(r => ({ ...r, createdAt: r.created_at }));
            setSavedReports(reports);
          }
        });
    } else {
      setSavedReports([]);
      setApiKeys({});
      setKeysLoaded(false);
    }
  }, [session]);

  const handleProgressUpdate = useCallback((updatedTasks: Task[]) => {
    setTasks(updatedTasks);
  }, []);

  const handleStartAnalysis = useCallback(async (config: Omit<AppConfig, 'apiKeys'>) => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    const fullConfig: AppConfig = { ...config, apiKeys };
    setAppConfig(fullConfig);
    setTasks([]);
    try {
      const analysisResults = await runAnalysis(fullConfig, handleProgressUpdate);
      setResults(analysisResults);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  }, [apiKeys, handleProgressUpdate]);

  const handleReset = () => {
    setAppConfig(null);
    setResults(null);
    setIsLoading(false);
    setError(null);
    setTasks([]);
    setViewingReportHtml(null);
    setView('app');
  };
  
  const handleSaveReport = useCallback(async () => {
    if (!results || !appConfig || !session) return;

    const htmlContent = generateHtmlReport(results, appConfig);
    const newReportData = {
        user_id: session.user.id,
        clientName: appConfig.clientName,
        htmlContent: htmlContent,
    };
    
    const { data, error } = await supabase.from('reports').insert(newReportData).select('id, created_at, clientName, htmlContent, shareableLink').single();

    if (error) {
        alert(`Error saving report: ${error.message}`);
    } else if (data) {
        const newReport: SavedReport = { ...data, createdAt: data.created_at };
        setSavedReports(prev => [newReport, ...prev]);
        alert('Report saved successfully!');
    }
  }, [results, appConfig, session]);

  const handleShareSavedReport = useCallback(async (reportId: string) => {
    const reportToShare = savedReports.find(r => r.id === reportId);
    if (!reportToShare) return;

    if (reportToShare.shareableLink) {
        setSharingReport({ reportId, isSharing: false, link: reportToShare.shareableLink, error: null });
        return;
    }

    setSharingReport({ reportId, isSharing: true, link: null, error: null });
    try {
        const newLink = await createHostedReport(reportToShare.htmlContent, reportToShare.clientName);
        
        const { error } = await supabase.from('reports').update({ shareableLink: newLink }).eq('id', reportId);
        if (error) throw error;
        
        const updatedReports = savedReports.map(r =>
            r.id === reportId ? { ...r, shareableLink: newLink } : r
        );
        setSavedReports(updatedReports);
        setSharingReport({ reportId, isSharing: false, link: newLink, error: null });
    } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred.';
        setSharingReport({ reportId: reportId, isSharing: false, link: null, error: errorMsg });
    }
  }, [savedReports]);

  const handleDeleteReport = useCallback(async (reportId: string) => {
    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
        const { error } = await supabase.from('reports').delete().eq('id', reportId);
        if (error) {
            alert(`Error deleting report: ${error.message}`);
        } else {
            setSavedReports(prev => prev.filter(report => report.id !== reportId));
        }
    }
  }, []);

  const handleViewReport = (htmlContent: string) => {
    setViewingReportHtml(htmlContent);
  };
  
  const handleLogout = async () => {
      handleReset();
      await supabase.auth.signOut();
  }
  
  const apiKeysConfigured = keysLoaded && Object.values(apiKeys).some(key => key && String(key).trim() !== '');

  const mainContent = () => {
    if (session && view === 'settings') {
        return <Settings user={session.user} onClose={() => { setView('app'); }} />;
    }
    if (viewingReportHtml) {
      return <ReportViewer htmlContent={viewingReportHtml} onClose={handleReset} />;
    }
    if (isLoading) {
      return <LoadingStatus tasks={tasks} />;
    }
    if (error) {
       return (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }
    if (results && appConfig) {
      return <ResultsDashboard results={results} config={appConfig} onSaveReport={handleSaveReport} />;
    }
    return (
      <div className="space-y-12">
        <SetupForm onStartAnalysis={handleStartAnalysis} apiKeysConfigured={apiKeysConfigured} />
        <SavedReportsList 
            reports={savedReports} 
            onView={handleViewReport} 
            onDelete={handleDeleteReport} 
            onShare={handleShareSavedReport}
            sharingReportId={sharingReport?.isSharing ? sharingReport.reportId : null}
        />
      </div>
    );
  }
  
  if (!session) {
      return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <TravykLogo />
           <div className="flex items-center space-x-4">
             {(results || viewingReportHtml || view === 'settings') && <button onClick={handleReset} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Start New Analysis</button>}
             {view === 'app' && (!results && !viewingReportHtml) && <button onClick={() => setView('settings')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Settings</button>}
             <button onClick={handleLogout} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Logout</button>
           </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-8">
        {mainContent()}
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm border-t border-gray-800 mt-8">
        Powered by Travyk | LLM Visibility Analysis Tool
      </footer>
      {sharingReport && <ShareLinkModal sharingState={sharingReport} onClose={() => setSharingReport(null)} />}
    </div>
  );
};

export default App;
