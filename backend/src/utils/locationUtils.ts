/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first coordinate
 * @param lon1 Longitude of first coordinate
 * @param lat2 Latitude of second coordinate
 * @param lon2 Longitude of second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Convert latitude and longitude from degrees to radians
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const φ1 = toRadians(Number(lat1));
  const φ2 = toRadians(Number(lat2));
  const Δφ = toRadians(Number(lat2) - Number(lat1));
  const Δλ = toRadians(Number(lon2) - Number(lon1));

  // Haversine formula
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Earth's radius in kilometers
  const R = 6371;

  // Calculate distance
  const distance = R * c;

  // Return the distance with 2 decimal places
  return distance;
}
