import React, { useEffect, useRef } from 'react';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.google?.accounts?.id) return Promise.resolve();
  const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('GIS load failed')));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('GIS load failed'));
    document.head.appendChild(script);
  });
}

function GoogleSignInButton({ onCredential, disabled = false, label = 'Continuar com Google' }) {
  const containerRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || disabled || !containerRef.current) return undefined;

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = '';
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) onCredential(response.credential);
          },
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: containerRef.current.offsetWidth || 360,
          locale: 'pt-BR',
        });
      })
      .catch(() => {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, disabled, onCredential]);

  if (!clientId) {
    return (
      <p className="muted small" style={{ textAlign: 'center', margin: 0 }}>
        Google Sign-In indisponível (configure VITE_GOOGLE_CLIENT_ID).
      </p>
    );
  }

  return (
    <div className="auth-google-wrap">
      <div ref={containerRef} className="auth-google-btn" aria-label={label} />
    </div>
  );
}

export { GoogleSignInButton, loadGoogleScript };
