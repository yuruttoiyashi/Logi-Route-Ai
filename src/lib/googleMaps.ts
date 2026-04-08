import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

let initialized = false;

export async function loadGoogleMaps() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_GOOGLE_MAPS_API_KEY が設定されていません。');
  }

  if (!initialized) {
    setOptions({
      key: apiKey,
      v: 'weekly',
      language: 'ja',
      region: 'JP',
    });
    initialized = true;
  }

  const mapsLibrary = await importLibrary('maps');

  return { mapsLibrary };
}