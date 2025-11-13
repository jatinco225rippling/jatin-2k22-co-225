'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password }),
      });

      // Save token + basic user info (simple version)
      if (typeof window !== 'undefined') {
        localStorage.setItem('boostly_token', data.token);
        localStorage.setItem('boostly_user', JSON.stringify(data.user));
      }

      router.push('/dashboard'); // we'll build this later
    } catch (err: unknown) {
      try {
        const parsed = JSON.parse((err as Error).message);
        setError(parsed.message || 'Something went wrong');
      } catch {
        setError((err as Error).message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-transparent border-none shadow-none text-slate-50">
      <CardContent className="px-0">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-slate-900/60 border-slate-700 text-slate-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">College email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-900/60 border-slate-700 text-slate-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-900/60 border-slate-700 text-slate-50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="px-0 pt-4 flex justify-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="ml-1 text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
        >
          Log in
        </Link>
      </CardFooter>
    </Card>
  );
}
