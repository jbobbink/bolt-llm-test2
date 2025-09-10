import React, { useState } from 'react';
import type { AppConfig, Provider } from '../types';

interface SetupFormProps {
  onStartAnalysis: (config: Omit<AppConfig, 'apiKeys'>) => void;
  apiKeysConfigured: boolean;
}

const FormField: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div>
        <label className="block text-lg font-medium text-gray-200">{label}</label>
        <p className="text-sm text-gray-400 mb-2">{description}</p>
        {children}
    </div>
);

const providerDetails: Record<Provider, { name: string, requiresKey: boolean, requiresEndpoint?: boolean }> = {
    gemini: { name: 'Google Gemini', requiresKey: true },
    openai: { name: 'OpenAI', requiresKey: true },
    perplexity: { name: 'Perplexity', requiresKey: true },
    copilot: { name: 'Copilot / Azure', requiresKey: true, requiresEndpoint: true },
};

const modelOptions: Partial<Record<Provider, string[]>> = {
    gemini: ['gemini-2.5-flash'],
    openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
    perplexity: ['llama-3-sonar-large-32k-online', 'llama-3-sonar-small-32k-online', 'sonar', 'sonar pro', 'sonar reasoning', 'sonar reasoning pro', 'sonar deep research', 'r1-1776'],
};

const defaultModels: Partial<Record<Provider, string>> = {
    gemini: 'gemini-2.5-flash',
    openai: 'gpt-4o-mini',
    perplexity: 'llama-3-sonar-large-32k-online',
    copilot: 'gpt-4o'
};


export const SetupForm: React.FC<SetupFormProps> = ({ onStartAnalysis, apiKeysConfigured }) => {
  const [clientName, setClientName] = useState<string>('');
  const [competitors, setCompetitors] = useState<string>('');
  const [prompts, setPrompts] = useState<string>('');
  const [additionalQuestions, setAdditionalQuestions] = useState<string>('');
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>(['gemini']);
  const [models, setModels] = useState<Partial<Record<Provider, string>>>({ gemini: defaultModels.gemini });


  const handleProviderToggle = (provider: Provider) => {
    const newSelection = selectedProviders.includes(provider) 
        ? selectedProviders.filter(p => p !== provider)
        : [...selectedProviders, provider];
    
    setSelectedProviders(newSelection);

    if (newSelection.includes(provider) && !models[provider]) {
        setModels(prev => ({ ...prev, [provider]: defaultModels[provider] }));
    }
  };

  const handleModelChange = (provider: Provider, value: string) => {
    setModels(prev => ({ ...prev, [provider]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartAnalysis({
      providers: selectedProviders,
      models: models,
      clientName: clientName.trim(),
      competitors: competitors.split('\n').map(c => c.trim()).filter(Boolean),
      prompts: prompts.split('\n').map(p => p.trim()).filter(Boolean),
      additionalQuestions: additionalQuestions.split('\n').map(q => q.trim()).filter(Boolean),
    });
  };
  
  const isSubmitDisabled = !clientName || !competitors || !prompts || selectedProviders.length === 0 || 
    selectedProviders.some(p => !models[p]) || !apiKeysConfigured;

  return (
    <div className="max-w-3xl mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
      <h2 className="text-3xl font-bold mb-2 text-green-400">Configure Your Analysis</h2>
      <p className="text-gray-400 mb-8">Enter the details below to start tracking LLM visibility for your brand.</p>
      
      {!apiKeysConfigured && (
         <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg mb-6" role="alert">
            <strong className="font-bold">Action Required: </strong>
            <span className="block sm:inline">Please configure your API keys in Settings. The 'Start Analysis' button will be enabled once your keys are set up.</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-gray-100">LLM Providers & Models</h3>
             <FormField label="Select Providers" description="Choose which AI models to use for the analysis. You can select multiple.">
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(providerDetails) as Provider[]).map(p => (
                    <label key={p} className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${selectedProviders.includes(p) ? 'border-green-500 bg-green-900/30' : 'border-gray-600 bg-gray-800 hover:bg-gray-700'}`}>
                      <input type="checkbox" checked={selectedProviders.includes(p)} onChange={() => handleProviderToggle(p)} className="h-5 w-5 rounded bg-gray-700 border-gray-500 text-green-600 focus:ring-green-500" />
                      <span className="font-medium text-gray-200">{providerDetails[p].name}</span>
                    </label>
                  ))}
                </div>
            </FormField>
            <div className="space-y-4 mt-4">
              {selectedProviders.includes('gemini') && (
                    <FormField label="Gemini Model" description="Select the model for analysis.">
                        <select value={models.gemini || ''} onChange={(e) => handleModelChange('gemini', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition">
                            {modelOptions.gemini?.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </FormField>
              )}
              {selectedProviders.includes('openai') && (
                    <FormField label="OpenAI Model" description="Select the model for analysis.">
                        <select value={models.openai || ''} onChange={(e) => handleModelChange('openai', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition">
                            {modelOptions.openai?.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </FormField>
              )}
              {selectedProviders.includes('perplexity') && (
                     <FormField label="Perplexity Model" description="Select the model for analysis.">
                        <select value={models.perplexity || ''} onChange={(e) => handleModelChange('perplexity', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition">
                            {modelOptions.perplexity?.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </FormField>
              )}
              {selectedProviders.includes('copilot') && (
                    <FormField label="Azure/Copilot Deployment Name" description="The 'model' name of your deployment.">
                        <input type="text" value={models.copilot || ''} onChange={(e) => handleModelChange('copilot', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition" placeholder="e.g., gpt-4o-deployment" required />
                    </FormField>
              )}
            </div>
        </div>

        <FormField label="Client Brand Name" description="The primary brand you want to track.">
          <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition" placeholder="e.g., Bynder" required />
        </FormField>
        
        <FormField label="Competitor Brands" description="List each competitor on a new line.">
          <textarea value={competitors} onChange={(e) => setCompetitors(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 h-24 focus:ring-2 focus:ring-green-500 focus:outline-none transition" placeholder="e.g., Canto&#x0a;Widen Collective&#x0a;Brandfolder" required />
        </FormField>

        <FormField label="Prompts" description="List each search prompt on a new line.">
          <textarea value={prompts} onChange={(e) => setPrompts(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 h-32 focus:ring-2 focus:ring-green-500 focus:outline-none transition" placeholder="e.g., What is the best DAM system?&#x0a;Compare DAM systems for enterprise companies" required />
        </FormField>
        
        <FormField label="Additional Analysis Questions" description="Optional. Ask specific questions about each LLM response. List each question on a new line.">
          <textarea value={additionalQuestions} onChange={(e) => setAdditionalQuestions(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 h-24 focus:ring-2 focus:ring-green-500 focus:outline-none transition" placeholder="e.g., How are the mentioned prices in comparison with competition?&#x0a;What are the USPs in comparison with the mentioned competitors?" />
        </FormField>

        <div className="pt-4">
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100" disabled={isSubmitDisabled}>
                Start Analysis
            </button>
        </div>
      </form>
    </div>
  );
};
