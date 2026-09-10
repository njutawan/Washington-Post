'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const DC_LAT = 38.8951;
const DC_LON = -77.0364;

type W = { temp: number; condition: string; high: number; low: number; icon: string };

function codeToWeather(code: number): { label: string; icon: string } {
  if (code === 0) return { label: 'Clear', icon: '☀️' };
  if (code <= 3) return { label: 'Partly cloudy', icon: '⛅' };
  if (code <= 48) return { label: 'Foggy', icon: '🌫️' };
  if (code <= 57) return { label: 'Drizzle', icon: '🌦️' };
  if (code <= 67) return { label: 'Rain', icon: '🌧️' };
  if (code <= 77) return { label: 'Snow', icon: '❄️' };
  if (code <= 82) return { label: 'Rain showers', icon: '🌧️' };
  if (code <= 86) return { label: 'Snow showers', icon: '🌨️' };
  if (code <= 99) return { label: 'Thunderstorms', icon: '⛈️' };
  return { label: 'Weather', icon: '🌤️' };
}

const FALLBACK: W = { temp: 72, condition: 'Partly cloudy', high: 78, low: 62, icon: '⛅' };

/**
 * Compact DC weather pill for the Masthead top utility bar (links to the
 * /climate/weather subsection). Falls back to static data if the live API
 * fails, so the bar never looks empty.
 */
export default function TopBarWeather() {
  const [w, setW] = useState<W | null>(null);
  useEffect(() => {
    let cancelled = false;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${DC_LAT}&longitude=${DC_LON}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FNew_York&forecast_days=1`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.current || !data?.daily) return;
        const c = codeToWeather(data.current.weather_code);
        setW({
          temp: Math.round(data.current.temperature_2m),
          condition: c.label,
          icon: c.icon,
          high: Math.round(data.daily.temperature_2m_max[0]),
          low: Math.round(data.daily.temperature_2m_min[0]),
        });
      })
      .catch(() => { if (!cancelled) setW(FALLBACK); });
    return () => { cancelled = true; };
  }, []);
  const data = w || FALLBACK;
  return (
    <Link
      href="/weather"
      className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 hover:bg-wp-light hover:text-wp-black transition tap-target"
      title={`Washington DC: ${data.condition}, high ${data.high}°, low ${data.low}°`}
    >
      <span aria-hidden="true" className="text-base leading-none">{data.icon}</span>
      <span className="font-sans font-bold text-[11px]">
        {w ? `${data.temp}°` : '—'} DC
      </span>
    </Link>
  );
}
