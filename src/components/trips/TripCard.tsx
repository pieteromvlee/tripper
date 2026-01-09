interface Trip {
  _id: string;
  name: string;
  createdAt: number;
}

interface TripCardProps {
  trip: Trip;
  onClick?: () => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TripCard({ trip, onClick }: TripCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-4 cursor-pointer border border-gray-100 hover:border-gray-200 active:scale-[0.98] touch-manipulation"
    >
      <h3 className="text-lg font-semibold text-gray-900 truncate">
        {trip.name}
      </h3>
      <p className="text-sm text-gray-500 mt-1">
        Created {formatDate(trip.createdAt)}
      </p>
    </div>
  );
}
