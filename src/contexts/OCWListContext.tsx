import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface OCWRecommendation {
  model: string;
  Prefix: number;
  Suffix: number;
  surface_gauss: number;
  force_factor: number;
  watts: number;
  width: number;
  frame: string;
  belt_width?: number;
  magnet_dimension?: string;
  // Material stream properties (if provided during calculation)
  density?: number;
  waterContent?: number;
  troughAngle?: number;
  bulkDensity?: number;
  ambientTemp?: number;
}

export interface OCWInputParameters {
  beltSpeed?: number;
  beltWidth: number;
  feedDepth?: number;
  throughput?: number;
  magnetGap?: number;
  coreBeltRatio: number;
  magnetPosition?: string;
  bulkDensity?: number;
  waterContent?: number;
  ambientTemp?: number;
  beltIncline?: number;
  trampMetals?: Array<{
    id: string;
    name: string;
    width: number;
    length: number;
    height: number;
  }>;
}

interface OCWListContextValue {
  recommendations: OCWRecommendation[];
  setRecommendations: (recs: OCWRecommendation[]) => void;
  selectedOCW: OCWRecommendation | null;
  setSelectedOCW: (ocw: OCWRecommendation | null) => void;
  inputParameters: OCWInputParameters | null;
  setInputParameters: (params: OCWInputParameters | null) => void;
  clearList: () => void;
  hasActiveList: boolean;
}

const OCWListContext = createContext<OCWListContextValue | undefined>(undefined);

export function OCWListProvider({ children }: { children: ReactNode }) {
  const [recommendations, setRecommendations] = useState<OCWRecommendation[]>([]);
  const [selectedOCW, setSelectedOCW] = useState<OCWRecommendation | null>(null);
  const [inputParameters, setInputParameters] = useState<OCWInputParameters | null>(null);

  const clearList = () => {
    setRecommendations([]);
    setSelectedOCW(null);
    setInputParameters(null);
  };

  const hasActiveList = recommendations.length > 0;

  return (
    <OCWListContext.Provider
      value={{
        recommendations,
        setRecommendations,
        selectedOCW,
        setSelectedOCW,
        inputParameters,
        setInputParameters,
        clearList,
        hasActiveList,
      }}
    >
      {children}
    </OCWListContext.Provider>
  );
}

export function useOCWList() {
  const context = useContext(OCWListContext);
  if (context === undefined) {
    throw new Error('useOCWList must be used within an OCWListProvider');
  }
  return context;
}
