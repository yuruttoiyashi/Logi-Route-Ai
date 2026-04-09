import React, { useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithRedirect,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
  const init = async () => {
    try {
      const result = await getRedirectResult(auth);
      console.log('[LoginPage] redirect result:', result?.user?.email ?? null);
      if (result?.user) {
        navigate('/dashboard', { replace: true });
        return;
      }
    } catch (error) {
      console.error('[LoginPage] redirect result error:', error);
    }
  };

  init();

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log('[LoginPage] auth state:', user?.email ?? null);
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  });

  return () => unsubscribe();
}, [navigate]);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/dashboard', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setErrorMessage('');
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error(error);
      setErrorMessage('メールログインに失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setSubmitting(true);
      setErrorMessage('');
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error(error);
      setErrorMessage('Googleログインに失敗しました。');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden bg-blue-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/15 p-3 text-2xl">📦</div>
            <div className="text-3xl font-bold">LogiRoute AI</div>
          </div>

          <div className="max-w-xl">
            <h1 className="text-6xl font-bold leading-tight">
              次世代の物流管理を、
              <br />
              AIと共に。
            </h1>
            <p className="mt-8 text-2xl leading-relaxed text-blue-100">
              配送ルートの最適化から遅延リスクの予測まで。
              LogiRoute AI は、現場の「今」を可視化し、効率を最大化します。
            </p>
          </div>

          <div className="text-sm text-blue-100">全国の配送現場に対応</div>
        </div>

        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-4xl font-bold text-slate-900">おかえりなさい</h2>
            <p className="mt-3 text-slate-500">
              アカウントにログインして業務を開始しましょう
            </p>

            {errorMessage && (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {errorMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-lg font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-2xl">🟢</span>
              Googleアカウントでログイン
            </button>

            <div className="my-8 flex items-center gap-4 text-sm text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              <span>または</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  メールアドレス
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-base outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  パスワード
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワード"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-base outline-none transition focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-blue-600 px-4 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? '処理中...' : 'ログイン'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}