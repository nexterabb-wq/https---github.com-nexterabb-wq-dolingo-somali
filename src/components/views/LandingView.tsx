'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Mic, BarChart3, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigationStore } from '@/stores/navigation-store';

const features = [
  {
    icon: BookOpen,
    title: 'Interactive Lessons',
    description: 'Engaging lessons that teach English vocabulary and grammar through Somali.',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    icon: Mic,
    title: 'Pronunciation Practice',
    description: 'Perfect your English pronunciation with audio examples and exercises.',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Watch your skills grow with detailed progress reports and analytics.',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    icon: Trophy,
    title: 'Gamification',
    description: 'Earn XP, maintain streaks, and unlock achievements as you learn.',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
];

const stats = [
  { value: '1000+', label: 'Words' },
  { value: '50+', label: 'Lessons' },
  { value: '10+', label: 'Units' },
  { value: 'Free', label: 'Forever' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function LandingView() {
  const navigate = useNavigationStore((s) => s.navigate);
  const shouldReduceMotion = useReducedMotion();

  const motionProps = shouldReduceMotion
    ? { initial: false, animate: false, whileInView: false }
    : {};

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-green-500 to-emerald-400" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,0,0,0.1)_0%,_transparent_60%)]" />

        {/* Decorative floating elements */}
        <div className="absolute top-12 left-8 w-20 h-20 rounded-full bg-white/10 blur-xl" />
        <div className="absolute top-32 right-16 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-20 left-1/4 w-16 h-16 rounded-full bg-white/10 blur-lg" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36 text-center">
          <motion.div
            {...motionProps}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-6"
          >
            <motion.div variants={itemVariants} className="flex items-center gap-2">
              <Sparkles className="size-5 text-yellow-200" />
              <span className="text-green-100 text-sm font-medium tracking-wide uppercase">
                Learn English through Somali
              </span>
              <Sparkles className="size-5 text-yellow-200" />
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight"
            >
              Learn English,{' '}
              <span className="text-yellow-200">Your Way</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-green-50 max-w-lg"
            >
              Baro Ingiriiska, Sida aad Doontid
            </motion.p>

            <motion.p
              variants={itemVariants}
              className="text-green-100 max-w-md text-sm sm:text-base"
            >
              Master English with lessons designed for Somali speakers.
              Interactive, fun, and completely free.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-4">
              <Button
                size="lg"
                onClick={() => navigate('register')}
                className="h-14 px-8 text-lg font-bold rounded-2xl bg-white text-green-700 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                Start Learning
                <ArrowRight className="size-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 60L48 54C96 48 192 36 288 30C384 24 480 24 576 28C672 32 768 40 864 42C960 44 1056 40 1152 34C1248 28 1344 20 1392 16L1440 12V60H1392C1344 60 1248 60 1152 60C1056 60 960 60 864 60C768 60 672 60 576 60C480 60 384 60 288 60C192 60 96 60 48 60H0Z"
              fill="hsl(var(--background))"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            {...motionProps}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeUp}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Everything you need to{' '}
              <span className="text-green-600 dark:text-green-400">succeed</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Our platform combines proven language learning methods with gamification
              to make learning English enjoyable and effective.
            </p>
          </motion.div>

          <motion.div
            {...motionProps}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} variants={itemVariants}>
                  <Card className="h-full border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-card">
                    <CardContent className="p-5 sm:p-6 flex gap-4 items-start">
                      <div
                        className={`shrink-0 flex items-center justify-center size-12 rounded-xl ${feature.color}`}
                      >
                        <Icon className="size-6" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h3 className="font-semibold text-foreground text-base">
                          {feature.title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            {...motionProps}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={containerVariants}
            className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border border-green-100 dark:border-green-900/50 p-8 sm:p-12"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  className="text-center"
                >
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-green-600 dark:text-green-400">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            {...motionProps}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeUp}
            className="text-center"
          >
            <div className="text-6xl text-green-200 dark:text-green-800 font-serif leading-none select-none">
              &ldquo;
            </div>
            <blockquote className="mt-2 text-lg sm:text-xl text-foreground leading-relaxed font-medium">
              Duolingo Somali made learning English feel natural. The lessons start
              from Somali, so I understood everything from day one. It&apos;s like
              having a patient teacher who speaks my language.
            </blockquote>
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-sm">
                FA
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm text-foreground">Fatima Ahmed</div>
                <div className="text-xs text-muted-foreground">Language Learner, Mogadishu</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          {...motionProps}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Ready to start learning?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Join thousands of Somali speakers who are mastering English every day.
          </p>
          <div className="mt-6">
            <Button
              size="lg"
              onClick={() => navigate('register')}
              className="h-12 px-8 text-base font-bold rounded-2xl cursor-pointer"
            >
              Get Started — It&apos;s Free
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-green-600 text-white font-bold text-sm">
              DS
            </div>
            <span className="font-semibold text-foreground">Duolingo Somali</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Learn English through Somali. Free forever.
          </p>
        </div>
      </footer>
    </div>
  );
}
