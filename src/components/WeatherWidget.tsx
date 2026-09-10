'use client';

import { useEffect, useState } from 'react';

const DC_LAT = 38.8951;
const DC_LON = -77.0364;

type WeatherData = {
  temp: number;
  condition: string;
  high: number;
  low: number;
  icon: string;
};

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

const fallback: WeatherData = { temp: 72, condition: 'Partly cloudy', high: 78, low: 62, icon: '⛅' };

export default function WeatherWidget() {
  const [w, setW] = useState<WeatherData | null>(null);

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
      .catch(() => { if (!cancelled) setW(fallback); });
    return () => { cancelled = true; };
  }, []);

  const data = w || fallback;
  return (
    <a
      href="#"
      className="flex items-center gap-3 px-3 py-2 hover:bg-wp-light border-b border-wp-border transition"
      aria-label={`Washington DC weather: ${data.temp} degrees, ${data.condition}`}
    >
      <span className="text-2xl" aria-hidden="true">{data.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-sans font-bold text-sm">Washington, DC</span>
          <span className="font-serif font-black text-xl leading-none">{!w ? '—' : data.temp + '°'}</span>
        </div>
        <div className="text-[11px] font-sans text-wp-gray truncate">
          {data.condition} · H {data.high}° L {data.low}°
        </div>
      </div>
    </a>
  );
}
