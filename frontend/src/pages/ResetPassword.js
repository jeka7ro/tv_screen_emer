import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Monitor, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

export const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Parolele nu coincid');
            return;
        }

        if (password.length < 6) {
            toast.error('Parola trebuie să aibă minim 6 caractere');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/reset-password', {
                token,
                new_password: password
            });
            setSuccess(true);
            toast.success('Parola a fost actualizată cu succes!');

            // Redirect after 3 seconds
            setTimeout(() => navigate('/login'), 3000);

        } catch (error) {
            toast.error(error.response?.data?.detail || 'Link-ul este invalid sau expirat');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-md glass-card p-8 text-center">
                    <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Link Invalid</h3>
                    <p className="text-slate-600 mb-6">
                        Link-ul de resetare lipsește sau este invalid. Vă rugăm să solicitați unul nou.
                    </p>
                    <Link to="/forgot-password" className="btn-primary w-full">
                        Solicită Resetare Nouă
                    </Link>
                </div>
            </div>
        );
    }

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
                        Setare Parolă Nouă
                    </h1>
                    <p className="text-center text-slate-500 mb-8">
                        Introduceți noua parolă pentru contul dvs.
                    </p>

                    {success ? (
                        <div className="text-center space-y-6">
                            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-green-800 mb-2">Parolă Actualizată!</h3>
                                <p className="text-green-700 text-sm">
                                    Parola dvs. a fost schimbată cu succes. Veți fi redirecționat către pagina de autentificare...
                                </p>
                            </div>

                            <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2">
                                Mergi la Autentificare
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    <Lock className="w-4 h-4 inline mr-1" />
                                    Parolă Nouă
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full glass-input px-4 py-3 border"
                                    placeholder="••••••••"
                                    required
                                    message="Minim 6 caractere"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    <Lock className="w-4 h-4 inline mr-1" />
                                    Confirmă Parola
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full glass-input px-4 py-3 border"
                                    placeholder="••••••••"
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
                                        Se actualizează...
                                    </div>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        Schimbă Parola
                                    </span>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
