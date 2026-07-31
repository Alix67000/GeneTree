import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Link } from 'react-router-dom';
import { BirthdaysWidget } from '@/components/BirthdaysWidget';

export function Home() {
  const { currentUser, loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      console.error(err);
      let message = 'An error occurred during authentication.';
      if (err.code === 'auth/invalid-email') message = 'Invalid email address.';
      else if (err.code === 'auth/user-not-found') message = 'No account found with this email.';
      else if (err.code === 'auth/wrong-password') message = 'Incorrect password.';
      else if (err.code === 'auth/invalid-credential') message = 'Invalid email or password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-8 max-w-4xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary font-bold">Welcome back to GeneTree</h1>
        <p className="text-xl text-text-secondary max-w-2xl">
          Continue building your family legacy. Add new relatives, preserve memories, and explore your ancestry.
        </p>
        <div className="flex gap-4">
          <Link to="/tree">
            <Button size="lg">View Family Tree</Button>
          </Link>
          <Link to="/person/add">
            <Button variant="outline" size="lg">Add Person</Button>
          </Link>
        </div>
        <div className="w-full pt-4">
          <BirthdaysWidget />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-8">
      <div className="space-y-3">
        <h1 className="text-5xl md:text-6xl lg:text-7xl text-primary font-bold">Discover Your Roots</h1>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
          GeneTree is the elegant way to trace your family history, connect generations, and preserve your legacy for the future.
        </p>
      </div>

      <Card className="w-full max-w-md p-8 space-y-6 text-left">
        <div className="text-center">
          <h2 className="text-2xl font-display font-semibold text-text-primary">
            Sign In to GeneTree
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Access your family tree
          </p>
        </div>

        {error && (
          <div className="p-3 bg-error/10 border border-error/20 text-error text-sm rounded-[var(--radius-button)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Identifiant / E-mail
            </label>
            <input 
              type="text" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail ou Identifiant"
              className="w-full px-4 py-2.5 rounded-[var(--radius-button)] border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Mot de passe</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-[var(--radius-button)] border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading ? 'Please wait...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center pt-2">
          <Link 
            to="/about"
            className="text-xs font-medium text-primary hover:underline"
          >
            Don't have an account? Learn about GeneTree & Request Access
          </Link>
        </div>
      </Card>
    </div>
  );
}
