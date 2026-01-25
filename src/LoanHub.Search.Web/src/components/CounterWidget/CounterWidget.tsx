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

  const stats = useMemo<Stat[]>(
    () => [
      {
        id: 'found',
        label: 'people found their best loan',
        value: successCount,
        format: 'number',
      },
      {
        id: 'partners',
        label: 'bank partners',
        value: 28,
        format: 'number',
      },
      {
        id: 'loans',
        label: 'loans granted',
        value: 125_000_000,
        prefix: '$',
        suffix: '+',
        format: 'compact',
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

    const start = performance.now();
    const duration = 1200;
    const targets = stats.map((stat) => stat.value);

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValues(targets.map((target) => Math.round(target * eased)));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [hasAnimated, stats]);

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
