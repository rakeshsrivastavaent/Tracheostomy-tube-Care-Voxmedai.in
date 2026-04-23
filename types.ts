
export interface CareStep {
  title: string;
  description: string;
  icon: string;
}

export interface CareSection {
  title: string;
  introduction: string;
  steps: CareStep[];
}

export interface EmergencyProcedure {
  situation: string;
  steps: string[];
  whenToCallHelp: string;
}

export interface CareGuide {
  patientType: string;
  dailyCare: CareSection;
  livingWell: CareSection;
  emergency: {
    title:string;
    introduction: string;
    procedures: EmergencyProcedure[];
  };
}

export type PatientType = 'pediatric' | 'adult';

export interface AppContent {
  ui: {
    title: string;
    subtitle: string;
    loading: string;
    translating: string;
    backToHome: string;
    back: string;
    selectPatient: string;
    whoFor: string;
    child: string;
    adult: string;
    emergencyHelpline: string;
    callNow: string;
    seniorStaff: string;
    watchOnYoutube: string;
  };
  homeMenu: {
    generalInfo: { title: string; desc: string; };
    careGuide: { title: string; desc: string; };
    suctionGuide: { title: string; desc: string; };
    tubeTypes: { title: string; desc: string; };
    ageSizing: { title: string; desc: string; };
    videoGuides: { title: string; desc: string; };
  };
  generalInfo: {
    title: string;
    whatIsTitle: string;
    whatIsDesc: string;
    breathingChangesTitle: string;
    breathingNormal: string;
    breathingTrach: string;
    indicationsTitle: string;
    indicationsDesc: string;
    indications: string[];
  };
  suctionGuide: {
    title: string;
    tableHeaders: [string, string, string];
    tableRows: { id: string; safe: string; typical: string }[];
    tipsTitle: string;
    tips: string[];
  };
  tubeTypes: {
    title: string;
    partsTitle: string;
    parts: { name: string; description: string; critical?: string }[];
    typesTitle: string;
    types: { name: string; description: string; bestFor: string; care: string }[];
  };
  ageSizing: {
    title: string;
    tableHeaders: [string, string, string];
    note: string;
  };
  videoGuides: {
    title: string;
    videos: { title: string; desc: string; url: string }[];
  };
}
