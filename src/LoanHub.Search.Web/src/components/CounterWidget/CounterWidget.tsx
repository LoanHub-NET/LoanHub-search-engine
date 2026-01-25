import { useEffect, useMemo, useRef, useState } from 'react';
import './CounterWidget.css';

interface CounterWidgetProps {
  successCount: number;
}

type Stat = {
  id: string;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'compact';
  icon: string;
};

const formatCompact = (value: number): string => {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const decimals = millions % 1 === 0 ? 0 : 1;
    return `${millions.toFixed(decimals)}M`;
  }

  if (value >= 1_000) {
    const thousands = value / 1_000;
    const decimals = thousands % 1 === 0 ? 0 : 1;
    return `${thousands.toFixed(decimals)}K`;
  }

  return value.toString();
};

const ANIMATION_DURATION_MS = 1200;
const EASING_POWER = 3;

const formatValue = (value: number, stat: Stat): string => {
  const base =
    stat.format === 'compact'
      ? formatCompact(value)
      : value.toLocaleString('en-US');
  return `${stat.prefix ?? ''}${base}${stat.suffix ?? ''}`;
};

export function CounterWidget({ successCount }: CounterWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [displayValues, setDisplayValues] = useState<number[]>([0, 0, 0]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  // Listen for changes to the prefers-reduced-motion preference
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const stats = useMemo<Stat[]>(
    () => [
      {
        id: 'found',
        label: 'people found their best loan',
        value: successCount,
        format: 'number',
        icon: '🎯',
      },
      {
        id: 'partners',
        label: 'bank partners',
        value: 28,
        format: 'number',
        icon: '🏦',
      },
      {
        id: 'loans',
        label: 'loans granted',
        value: 125_000_000,
        prefix: '$',
        suffix: '+',
        format: 'compact',
        icon: '💸',
      },
    ],
    [successCount],
  );

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasAnimated) {
      return;
    }

    const targets = stats.map((stat) => stat.value);
    const start = performance.now();
    const duration = prefersReducedMotion ? 0 : ANIMATION_DURATION_MS;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = duration > 0 ? Math.min(1, elapsed / duration) : 1;
      const eased = 1 - Math.pow(1 - progress, EASING_POWER);
      setDisplayValues(targets.map((target) => Math.round(target * eased)));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [hasAnimated, stats, prefersReducedMotion]);

  useEffect(() => {
    if (!hasAnimated) {
      return;
    }

    setDisplayValues((prev) => {
      const next = [...prev];
      next[0] = stats[0]?.value ?? prev[0];
      return next;
    });
  }, [hasAnimated, stats]);

  return (
    <section className="counter-widget" ref={containerRef}>
      <div className="counter-widget-inner">
        {stats.map((stat, index) => (
          <div key={stat.id} className="counter-card">
            <div className="counter-icon" aria-hidden="true">
              {stat.icon}
            </div>
            <div className="counter-value">
              {formatValue(displayValues[index] ?? 0, stat)}
            </div>
            <div className="counter-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
