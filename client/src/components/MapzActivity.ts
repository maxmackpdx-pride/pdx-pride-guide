import { createContext, useContext } from 'react';

/** Other card contexts remain active; retained Mapz supplies its visibility. */
export const MapzActivity = createContext(true);
export const useMapzActive = () => useContext(MapzActivity);
