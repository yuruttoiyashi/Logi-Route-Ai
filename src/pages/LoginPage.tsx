import React, { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setErrorMessage('');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(error);
      setErrorMessage('メールログインに失敗しました。');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorMessage('');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      setErrorMessage('Googleログインに失敗しました。');
    }
  };

  return (
    <div>
      {errorMessage && <p>{errorMessage}</p>}

      <button type="button" onClick={handleGoogleLogin}>
        Googleアカウントでログイン
      </button>

      <form onSubmit={handleEmailLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
        />

        <button type="submit">
          ログイン
        </button>
      </form>
    </div>
  );
}