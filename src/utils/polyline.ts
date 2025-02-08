/**
 * Decodes an encoded path string into a sequence of LatLngs.
 *
 * See {@link https://developers.google.com/maps/documentation/utilities/polylinealgorithm}
 *
 *  #### Example
 *
 * ```js
 * import { decode } from "@googlemaps/polyline-codec";
 *
 * const encoded = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";
 * console.log(decode(encoded, 5));
 * // [
 * //   [38.5, -120.2],
 * //   [40.7, -120.95],
 * //   [43.252, -126.453],
 * // ]
 * ```
 */
export const decode = function (
  encodedPath: string,
  precision = 5,
): LatLngTuple[] {
  const factor = Math.pow(10, precision);

  const len = encodedPath.length;

  // For speed we preallocate to an upper bound on the final length, then
  // truncate the array before returning.
  const path = new Array(Math.floor(encodedPath.length / 2));
  let index = 0;
  let lat = 0;
  let lng = 0;
  let pointIndex = 0;

  // This code has been profiled and optimized, so don't modify it without
  // measuring its performance.
  for (; index < len; ++pointIndex) {
    // Fully unrolling the following loops speeds things up about 5%.
    let result = 1;
    let shift = 0;
    let b: number;
    do {
      // Invariant: "result" is current partial result plus (1 << shift).
      // The following line effectively clears this bit by decrementing "b".
      b = encodedPath.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f); // See note above.
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 1;
    shift = 0;
    do {
      b = encodedPath.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    path[pointIndex] = [lat / factor, lng / factor];
  }
  // truncate array
  path.length = pointIndex;

  return path;
};

/**
 * Array with lat and lng elements.
 */
export type LatLngTuple = [number, number];
