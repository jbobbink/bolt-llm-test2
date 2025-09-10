import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { User, ApiKeys } from '../types';

interface SettingsProps {
    user: User;
    onClose: () => void;
}

const FormField: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div>
        <label className="block text-lg font-medium text-gray-200">{label}</label>
        {description && <p className="text-sm text-gray-400 mb-2">{description}</p>}
        {children}
    </div>
);

export const Settings: React.FC<SettingsProps> = ({ user, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [apiKeys, setApiKeys] = useState<ApiKeys>({});
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const getProfile = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error, status } = await supabase
                .from('profiles')
                .select(`gemini, openai, perplexity, copilotKey, copilotEndpoint`)
                .eq('id', user.id)
                .single();

            if (error && status !== 406) throw error; // 406 means no rows found, which is fine for a new user

            if (data) {
                setApiKeys({
                    gemini: data.gemini,
                    openai: data.openai,
                    perplexity: data.perplexity,
                    copilotKey: data.copilotKey,
                    copilotEndpoint: data.copilotEndpoint,
                });
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        getProfile();
    }, [getProfile]);

    const handleApiKeyChange = (key: keyof ApiKeys, value: string) => {
        setApiKeys(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setSaving(true);
        try {
            const updates = {
                id: user.id,
                updated_at: new Date().toISOString(),
                gemini: apiKeys.gemini,
                openai: apiKeys.openai,
                perplexity: apiKeys.perplexity,
                copilotKey: apiKeys.copilotKey,
                copilotEndpoint: apiKeys.copilotEndpoint,
            };
            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;
            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center p-8">Loading settings...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-green-400">API Key Settings</h2>
            </div>
            <p className="text-gray-400 mb-8">
                Your API keys are stored securely and are only used to communicate with the LLM providers on your behalf.
            </p>
            {error && <p className="mb-4 text-red-400 bg-red-900/50 p-3 rounded-lg" role="alert">{error}</p>}
            {message && <p className="mb-4 text-green-300 bg-green-900/50 p-3 rounded-lg" role="status">{message}</p>}

            <form onSubmit={handleSubmit} className="space-y-6">
                 <FormField label="Google Gemini API Key">
                    <input type="password" value={apiKeys.gemini || ''} onChange={(e) => handleApiKeyChange('gemini', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition" placeholder="Enter your Gemini API key" />
                </FormField>
                 <FormField label="OpenAI API Key">
                    <input type="password" value={apiKeys.openai || ''} onChange={(e) => handleApiKeyChange('openai', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition" placeholder="Enter your OpenAI API key" />
                </FormField>
                <FormField label="Perplexity API Key">
                    <input type="password" value={apiKeys.perplexity || ''} onChange={(e) => handleApiKeyChange('perplexity', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition" placeholder="Enter your Perplexity API key" />
                </FormField>
                <FormField label="Azure/Copilot Endpoint URL">
                    <input type="text" value={apiKeys.copilotEndpoint || ''} onChange={(e) => handleApiKeyChange('copilotEndpoint', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition" placeholder="e.g., https://your-resource.openai.azure.com" />
                </FormField>
                <FormField label="Azure/Copilot API Key">
                    <input type="password" value={apiKeys.copilotKey || ''} onChange={(e) => handleApiKeyChange('copilotKey', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition" placeholder="Enter your Azure API key" />
                </FormField>
                <div className="pt-4 flex justify-end items-center space-x-4">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Close
                    </button>
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};
