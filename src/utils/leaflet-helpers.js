export function getBounds(mapRef) {
  return mapRef.current.leafletElement.getBounds();
}

export function getCrs(mapRef) {
  return mapRef.current.leafletElement.options.crs;
}
