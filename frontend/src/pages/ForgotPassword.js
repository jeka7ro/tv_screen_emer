import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Mail, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

export const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
            toast.success('Link-ul de resetare a fost trimis!');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'A apărut o eroare');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="glass-card p-8">
                    <div className="flex justify-center mb-8">
                        <div className="bg-indigo-100 p-4 rounded-2xl">
                            <Monitor className="w-12 h-12 text-indigo-600" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">
                        Resetare Parolă
                    </h1>
                    <p className="text-center text-slate-500 mb-8">
                        Introduceți email-ul pentru a primi link-ul de resetare
                    </p>

                    {sent ? (
                        <div className="text-center space-y-6">
                            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Send className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-green-800 mb-2">Email Trimis!</h3>
                                <p className="text-green-700 text-sm">
                                    Dacă există un cont asociat cu <strong>{email}</strong>, veți primi instrucțiunile de resetare în curând.
                                </p>
                                <p className="text-xs text-green-600 mt-4">
                                    (Verificați și folderul Spam)
                                </p>
                            </div>

                            <Link to="/login" className="btn-secondary w-full flex items-center justify-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Înapoi la Autentificare
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    <Mail className="w-4 h-4 inline mr-1" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full glass-input px-4 py-3 border"
                                    placeholder="admin@sushimaster.ro"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="spinner w-5 h-5"></div>
                                        Se trimite...
                                    </div>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <Send className="w-4 h-4" />
                                        Trimite Link Resetare
                                    </span>
                                )}
                            </button>

                            <div className="text-center">
                                <Link
                                    to="/login"
                                    className="text-slate-500 hover:text-slate-700 font-medium text-sm flex items-center justify-center gap-1"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Înapoi la Autentificare
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
