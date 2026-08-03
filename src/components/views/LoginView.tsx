'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Mail, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { useNavigationStore } from '@/stores/navigation-store';
import { useAuthStore } from '@/stores/auth-store';

const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginView() {
  const navigate = useNavigationStore((s) => s.navigate);
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 401) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(body?.error || 'Something went wrong. Please try again later.');
        }
        return;
      }

      const sessionData = await res.json();
      if (sessionData?.user) {
        setUser({
          id: sessionData.user.id || '',
          email: sessionData.user.email || data.email,
          name: sessionData.user.name || null,
          image: sessionData.user.image || null,
          role: sessionData.user.role || 'learner',
        });
        navigate('dashboard');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Back button */}
        <button
          onClick={() => navigate('landing')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 min-h-[44px] px-1 -ml-1 rounded-lg hover:bg-muted/50 cursor-pointer"
          type="button"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-green-600 text-white font-bold text-base">
            DS
          </div>
          <span className="text-lg font-bold text-foreground">Duolingo Somali</span>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl sm:text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-sm mt-1">
              Sign in to continue learning
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Error banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-700 dark:text-red-400"
                >
                  {error}
                </motion.div>
              )}

              {/* Email field */}
              <div className="grid gap-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="pl-10 h-11 rounded-xl"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="grid gap-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="pl-10 h-11 rounded-xl"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 rounded-xl font-bold text-base mt-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in&hellip;
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center pb-6">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => navigate('register')}
                className="text-green-600 dark:text-green-400 font-semibold hover:underline cursor-pointer min-h-[44px] px-1 inline-flex items-center"
                type="button"
              >
                Create Account
              </button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
