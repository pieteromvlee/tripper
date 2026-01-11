import type { LocationType } from "./locationStyles";

interface TypeIconProps {
  type: LocationType;
  className?: string;
}

export function TypeIcon({ type, className = "w-4 h-4" }: TypeIconProps) {
  const colorClass = getIconColorClass(type);

  switch (type) {
    case "attraction":
      return (
        <svg
          className={`${className} ${colorClass}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case "restaurant":
      return (
        <svg
          className={`${className} ${colorClass}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
        </svg>
      );
    case "accommodation":
      return (
        <svg
          className={`${className} ${colorClass}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z" />
        </svg>
      );
    case "shop":
      return (
        <svg
          className={`${className} ${colorClass}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z" />
        </svg>
      );
    case "snack":
      return (
        <svg
          className={`${className} ${colorClass}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M2 21h18v-2H2v2zm18-11.5c0-.83-.67-1.5-1.5-1.5S17 8.67 17 9.5V11h3V9.5zm-15.5.5h-1c-.28 0-.5-.22-.5-.5V9c0-.28.22-.5.5-.5h1c.28 0 .5.22.5.5v.5c0 .28-.22.5-.5.5zM18 13H4c-1.1 0-2 .9-2 2v2h18v-2c0-1.1-.9-2-2-2z" />
        </svg>
      );
    default:
      return null;
  }
}

function getIconColorClass(type: LocationType): string {
  switch (type) {
    case "attraction":
      return "text-blue-400";
    case "restaurant":
      return "text-orange-400";
    case "accommodation":
      return "text-purple-400";
    case "shop":
      return "text-green-400";
    case "snack":
      return "text-pink-400";
    default:
      return "text-gray-400";
  }
}
