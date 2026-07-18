import type { GardenWeather } from "@daily-puzzle/puzzle-core";

type Props = {
  weather: GardenWeather;
  night: boolean;
};

/** Daily random weather overlay — cosmetic only. */
export function GardenWeatherLayer({ weather, night }: Props) {
  if (weather === "clear") {
    if (night) return null;
    return (
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(circle at 78% 14%, #fff6c888 0 8%, transparent 28%)",
        }}
        aria-hidden
      />
    );
  }

  if (weather === "cloudy") {
    return (
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-x-0 top-0 h-[42%]"
          style={{
            background: night
              ? "radial-gradient(ellipse at 20% 30%, #2a304088 0 28%, transparent 30%), radial-gradient(ellipse at 70% 20%, #32384899 0 32%, transparent 34%), radial-gradient(ellipse at 45% 40%, #242a3888 0 26%, transparent 28%)"
              : "radial-gradient(ellipse at 20% 30%, #ffffffaa 0 28%, transparent 30%), radial-gradient(ellipse at 70% 20%, #f0f4f8cc 0 32%, transparent 34%), radial-gradient(ellipse at 45% 40%, #e8eef4aa 0 26%, transparent 28%)",
          }}
        />
        <div className="absolute inset-0 bg-[#6a7a8822]" />
      </div>
    );
  }

  if (weather === "fog") {
    return (
      <div
        className="garden-weather-fog pointer-events-none absolute inset-0"
        aria-hidden
      />
    );
  }

  if (weather === "rain") {
    return (
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[#4a608822]" />
        <div className="garden-weather-rain absolute inset-0" />
      </div>
    );
  }

  // snow
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute inset-0 bg-[#a8c0d822]" />
      <div className="garden-weather-snow absolute inset-0" />
    </div>
  );
}
