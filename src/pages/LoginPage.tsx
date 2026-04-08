import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { Package, LogIn, ShieldCheck, Globe } from 'lucide-react';
import { auth } from '../lib/firebase.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { motion } from 'motion/react';

const LoginPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Googleログインに失敗しました。');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('メールアドレスまたはパスワードが正しくありません。');
      } else {
        setError('ログイン中にエラーが発生しました。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Left Side: Branding */}
      <div className="lg:w-1/2 bg-blue-600 p-12 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-700 rounded-full translate-y-1/2 -translate-x-1/2 opacity-50 blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-white p-2 rounded-lg">
              <Package className="text-blue-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">LogiRoute AI</h1>
          </div>
          
          <div className="space-y-6 max-w-lg">
            <h2 className="text-5xl font-extrabold leading-tight">
              次世代の物流管理を、<br />
              AIと共に。
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              配送ルートの最適化から遅延リスクの予測まで。
              LogiRoute AIは、現場の「今」を可視化し、効率を最大化します。
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8">
          <div className="flex items-center gap-3">
            <ShieldCheck size={24} className="text-blue-200" />
            <span className="text-sm font-medium">エンタープライズ級のセキュリティ</span>
          </div>
          <div className="flex items-center gap-3">
            <Globe size={24} className="text-blue-200" />
            <span className="text-sm font-medium">全国の配送網に対応</span>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="text-center lg:text-left">
            <h3 className="text-3xl font-bold text-slate-900">おかえりなさい</h3>
            <p className="text-slate-500 mt-2">アカウントにログインして業務を開始しましょう</p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
              Googleアカウントでログイン
            </button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200"></span>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-50 text-slate-400 font-medium">または</span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">メールアドレス</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="name@company.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">パスワード</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn size={20} />
                    ログイン
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 leading-relaxed">
            ログインすることで、当社の<a href="#" className="underline hover:text-blue-600">利用規約</a>および<a href="#" className="underline hover:text-blue-600">プライバシーポリシー</a>に同意したものとみなされます。
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
