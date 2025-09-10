import React, { useState } from 'react';
import { supabase } from '../supabase';

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


export const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage('Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                // The onAuthStateChange listener in App.tsx will handle the redirect.
            }
        } catch (error: any) {
            setError(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
             <div className="absolute top-8 left-8">
                <TravykLogo />
            </div>
            <div className="w-full max-w-sm mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
                <h2 className="text-3xl font-bold mb-2 text-center text-green-400">
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-gray-400 mb-8 text-center">
                    {isSignUp ? 'Sign up to save and manage your reports.' : 'Sign in to access your dashboard.'}
                </p>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300" htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {loading ? (isSignUp ? 'Signing Up...' : 'Signing In...') : (isSignUp ? 'Sign Up' : 'Sign In')}
                        </button>
                    </div>
                </form>

                {error && <p className="mt-4 text-center text-red-400 bg-red-900/50 p-3 rounded-lg" role="alert">{error}</p>}
                {message && <p className="mt-4 text-center text-green-300 bg-green-900/50 p-3 rounded-lg" role="status">{message}</p>}

                <div className="mt-6 text-center">
                    <button onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }} className="text-sm text-green-400 hover:underline">
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
            <footer className="text-center p-4 text-gray-500 text-sm absolute bottom-0">
                Powered by Travyk | LLM Visibility Analysis Tool
            </footer>
        </div>
    );
};
