import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export const ShortLinkRedirect = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (slug) {
            // Redirect to the actual display page
            navigate(`/display/${slug}`, { replace: true });
        }
    }, [slug, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
            <div className="text-center">
                <div className="spinner w-8 h-8 mx-auto mb-4"></div>
                <p>Se redirecționează către ecran...</p>
            </div>
        </div>
    );
};
