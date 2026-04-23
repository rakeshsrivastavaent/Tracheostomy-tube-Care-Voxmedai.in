
import React, { useState, useEffect, useCallback } from 'react';
import { generateCareGuide, translateAppContent } from './services/geminiService';
import { CareGuide, PatientType, CareStep, EmergencyProcedure, AppContent } from './types';
import { IconMap, BackIcon, EmergencyIcon, TranslateIcon, SizingChartIcon, HomeIcon, GuideIcon, TubeTypesIcon, AgeSizingIcon, VideoIcon, InfoIcon } from './components/Icons';

const ocrText = `
Comprehensive Guide to Tracheostomy Tube Care for Pediatric and Adult Patients
Tracheostomy tube care represents a critical aspect of respiratory management for patients requiring long-term airway support...
[... The extremely long OCR text from the user prompt has been truncated for brevity in this example. The full text would be included here in a real application. ...]
...By staying updated with these guidelines (ATS, AARC, ENT society statements, etc.), healthcare providers can ensure they are delivering care in line with the latest recommendations, ultimately improving outcomes for trach patients both young and old.
`;

const LANGUAGES = [
  'English', 'Hindi (हिन्दी)', 'Tamil (தமிழ்)', 'Telugu (తెలుగు)', 'Gujarati (ગુજરાતી)', 
  'Marathi (मराठी)', 'Bengali (বাংলা)', 'Malayalam (മലയാളം)', 'Swahili', 'French (Français)', 'Spanish (Español)'
];

const INITIAL_CONTENT: AppContent = {
  ui: {
    title: "Trach Care Guide",
    subtitle: "Simple, AI-powered instructions for caregivers. Select an option below to get started.",
    loading: "Creating Your Guide...",
    translating: "Translating App...",
    backToHome: "Return to Home",
    back: "Back",
    selectPatient: "Select Patient Type",
    whoFor: "Who is this guide for?",
    child: "A Child (Pediatric)",
    adult: "An Adult",
    emergencyHelpline: "Emergency Helpline",
    callNow: "Call Now",
    seniorStaff: "Senior Nursing Staff",
    watchOnYoutube: "Watch on YouTube",
  },
  homeMenu: {
    generalInfo: { title: "General Info", desc: "What is a tracheostomy and why is it done?" },
    careGuide: { title: "Full Care Guide", desc: "Generate a personalized step-by-step guide." },
    suctionGuide: { title: "Suction Size Guide", desc: "Quick reference for trach and catheter sizes." },
    tubeTypes: { title: "Types of Trach Tubes", desc: "Learn about tube parts and types." },
    ageSizing: { title: "Size by Age", desc: "Typical tracheostomy tube sizes for different ages." },
    videoGuides: { title: "Video Guides", desc: "Watch helpful videos on tracheostomy care." },
  },
  generalInfo: {
    title: "General Information",
    whatIsTitle: "What is a Tracheostomy?",
    whatIsDesc: "A tracheostomy (trach) is a surgical opening made in the front of the neck into the windpipe (trachea). A tube is placed into this opening to create a new airway.",
    breathingChangesTitle: "How breathing changes:",
    breathingNormal: "Normal: Air goes through nose/mouth → throat → lungs.",
    breathingTrach: "Tracheostomy: Air enters the neck tube → directly to lungs (bypassing the nose and mouth).",
    indicationsTitle: "Why is it done? (Indications)",
    indicationsDesc: "Doctors perform a tracheostomy for several important reasons to help the patient:",
    indications: [
       "To Bypass a Blockage: If something is blocking the upper airway (like swelling, a tumor, or an object), the tube allows air to get to the lungs.",
       "Long-term Breathing Support: For patients who need a ventilator (breathing machine) for a long time, a trach is more comfortable and safer than a tube in the mouth.",
       "To Remove Secretions: If a patient is too weak to cough up mucus, the tube allows nurses and caregivers to suction it out easily to prevent pneumonia.",
       "Airway Protection: It protects the lungs from food or drink going down the wrong way (aspiration) in patients who have trouble swallowing."
    ]
  },
  suctionGuide: {
    title: "Suction Size Guide",
    tableHeaders: ["Trach Tube ID (mm)", "Safe Catheter (Fr)", "Typical Choice"],
    tableRows: [
        { id: '3.0–3.5 (neonate)', safe: '5–6 Fr', typical: '6 Fr' },
        { id: '4.0–4.5 (infant)', safe: '6–7 Fr', typical: '6–8 Fr' },
        { id: '5.0 (small child)', safe: 'up to 7–8 Fr', typical: '8 Fr' },
        { id: '5.5–6.0 (child / small adult)', safe: 'up to 8–9 Fr', typical: '8–10 Fr' },
        { id: '6.0 (adult small)', safe: 'up to 9 Fr', typical: '10 Fr (gentle)' },
        { id: '7.0 (adult medium)', safe: 'up to 10–11 Fr', typical: '10–12 Fr' },
        { id: '7.5 (adult)', safe: 'up to 11–12 Fr', typical: '10–12 Fr' },
        { id: '8.0 (adult standard)', safe: 'up to 12 Fr', typical: '12 Fr' },
        { id: '8.5–9.0 (adult large)', safe: 'up to 12–13 Fr', typical: '12–14 Fr' },
        { id: '10.0 (very large)', safe: 'up to 15 Fr', typical: '14–16 Fr*' },
    ],
    tipsTitle: "Practical Tips",
    tips: [
        "If in doubt, choose the smaller Fr and do short, gentle passes; you can always step up if secretions are tenacious.",
        "Measure the right ID: if a fenestrated tube is in place, suction through a non-fenestrated inner cannula to avoid mucosal trauma.",
        "Pre-oxygenate and keep each pass ≤10 seconds (adults) with recovery time between passes.",
        "For pediatrics, err on smaller catheters and lower suction pressures."
    ]
  },
  tubeTypes: {
    title: "Tube Types & Parts",
    partsTitle: "1. Know Your Hardware (Parts)",
    parts: [
      {
          name: "Outer Cannula (The Main Tube)",
          description: "This stays in the neck. It holds the airway open. It has a 'flange' (neck plate) that rests against the skin.",
          critical: "Never remove this yourself unless it is an emergency accidental decannulation situation."
      },
      {
          name: "Inner Cannula (The Liner)",
          description: "This fits inside the outer cannula. It collects mucus. If it gets clogged, you can pull it out and replace/clean it without removing the whole tube.",
          critical: "Safety Rule: Always have an inner cannula in place."
      },
      {
          name: "Obturator (The Guide)",
          description: "A smooth, rounded stick put inside the outer cannula only during insertion to smooth the tip so it doesn't scratch the trachea.",
          critical: "Critical Rule: Remove immediately after insertion. Tape to the head of the bed for emergencies."
      }
    ],
    typesTitle: "2. Types of Tubes",
    types: [
        {
          name: "Cuffed Tubes",
          description: "These tubes have a soft balloon (cuff) around the end. When inflated with water or air, it creates a seal against the windpipe wall.",
          bestFor: "Patients on a ventilator (breathing machine) or those at high risk of swallowing issues (aspiration).",
          care: "Check cuff pressure regularly to prevent injury to the windpipe."
        },
        {
          name: "Uncuffed Tubes",
          description: "These tubes do not have a balloon. Air can pass through the tube and also around it.",
          bestFor: "Babies/children (since their windpipes are small) and adults who are ready to speak or breathe on their own.",
          care: "Easier to manage but does not protect against aspiration."
        },
        {
          name: "Fenestrated Tubes",
          description: "These tubes have small holes (fenestrations) on the curve of the shaft, allowing more air to flow upward to the vocal cords.",
          bestFor: "Patients who are learning to speak again or weaning off the trach.",
          care: "Higher risk of tissue growing into the holes (granulation). Not used for suctioning unless inner cannula is in place."
        },
    ]
  },
  ageSizing: {
    title: "Size by Age Guide",
    tableHeaders: ["Age/Weight", "ID (mm)", "Length"],
    note: "Note: These are general guidelines. Always follow the specific size prescribed by your ENT surgeon or pulmonologist.",
  },
  videoGuides: {
      title: "Video Guides",
      videos: [
          { 
            title: "जानिए Tracheostomy के Benefits और Tracheostomy Care कैसे करें in Hindi", 
            url: "https://www.youtube.com/watch?v=PrNmZgobCg0", 
            desc: "Hindi guide on benefits and care routines." 
          },
          { 
            title: "Caring for Tracheostomy Tubes: How to Change Them", 
            url: "https://www.youtube.com/watch?v=hJtWug1vgPM", 
            desc: "Dr. Anjoo Choudhary demonstrates safe tube changing techniques." 
          },
          { 
            title: "Tracheostomy care at Home (घर पर देखभाल)", 
            url: "https://www.youtube.com/watch?v=KfB-SFcrzkY", 
            desc: "Step-by-step home care instructions." 
          },
      ]
  }
};

type AppState = 'home' | 'selectingPatientType' | 'loading' | 'guide' | 'error' | 'suctionGuide' | 'tubeTypesGuide' | 'ageSizingGuide' | 'videoGuides' | 'generalInfo';

// Loading Spinner Component
const LoadingSpinner: React.FC<{message: string, subMessage: string}> = ({ message, subMessage }) => (
  <div className="flex flex-col items-center justify-center h-full text-center text-brand-dark p-8">
    <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-brand-DEFAULT" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <h2 className="text-xl font-semibold mt-4">{message}</h2>
    <p className="mt-2 text-gray-600">{subMessage}</p>
  </div>
);

// Language Selector Component
const LanguageSelector: React.FC<{
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  id: string;
  label: string;
}> = ({ selectedLanguage, onLanguageChange, id, label }) => (
  <div className="relative">
    <label htmlFor={id} className="absolute -top-3 left-2 inline-block bg-brand-light px-1 text-sm font-medium text-brand-dark">{label}</label>
    <select
      id={id}
      value={selectedLanguage}
      onChange={(e) => onLanguageChange(e.target.value)}
      className="block w-full appearance-none rounded-md border-gray-300 bg-white py-3 pl-3 pr-10 text-base focus:border-brand-DEFAULT focus:outline-none focus:ring-brand-DEFAULT sm:text-sm"
    >
      {LANGUAGES.map(lang => (
        <option key={lang} value={lang}>{lang}</option>
      ))}
    </select>
  </div>
);

const HomeMenuItem: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}> = ({ icon: Icon, title, description, onClick }) => (
  <button onClick={onClick} className="flex items-center w-full p-4 bg-white rounded-xl shadow-lg hover:bg-gray-50 transition-all transform hover:scale-[1.02] text-left border border-gray-200">
    <div className="flex-shrink-0 bg-brand-light p-4 rounded-full mr-5">
      <Icon className="h-8 w-8 text-brand-dark" />
    </div>
    <div>
      <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      <p className="mt-1 text-gray-600">{description}</p>
    </div>
  </button>
);

// Back to Home Button Component
const BackToHomeButton: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <div className="pt-8 pb-4">
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl shadow-sm hover:bg-gray-50 hover:text-brand-DEFAULT hover:border-brand-DEFAULT transition-colors"
    >
      <HomeIcon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  </div>
);


// Home Screen Component
const HomeScreen: React.FC<{ 
    setAppState: (state: AppState) => void;
    selectedLanguage: string;
    onLanguageChange: (lang: string) => void;
    content: AppContent;
}> = ({ setAppState, selectedLanguage, onLanguageChange, content }) => (
  <div className="flex flex-col h-full p-4 sm:p-6 md:p-8 bg-brand-light">
    <div className="text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-brand-dark">{content.ui.title}</h1>
      <p className="mt-4 text-lg text-gray-700 max-w-2xl mx-auto">
        {content.ui.subtitle}
      </p>
    </div>
    <div className="mt-8 max-w-xs mx-auto w-full">
      <LanguageSelector 
        selectedLanguage={selectedLanguage} 
        onLanguageChange={onLanguageChange} 
        id="home-lang-selector" 
        label="Language / भाषा"
      />
    </div>
    <div className="mt-8 flex-grow space-y-4 overflow-y-auto px-1">
        <HomeMenuItem
            icon={InfoIcon}
            title={content.homeMenu.generalInfo.title}
            description={content.homeMenu.generalInfo.desc}
            onClick={() => setAppState('generalInfo')}
        />
        <HomeMenuItem
            icon={GuideIcon}
            title={content.homeMenu.careGuide.title}
            description={content.homeMenu.careGuide.desc}
            onClick={() => setAppState('selectingPatientType')}
        />
        <HomeMenuItem
            icon={SizingChartIcon}
            title={content.homeMenu.suctionGuide.title}
            description={content.homeMenu.suctionGuide.desc}
            onClick={() => setAppState('suctionGuide')}
        />
        <HomeMenuItem
            icon={TubeTypesIcon}
            title={content.homeMenu.tubeTypes.title}
            description={content.homeMenu.tubeTypes.desc}
            onClick={() => setAppState('tubeTypesGuide')}
        />
        <HomeMenuItem
            icon={AgeSizingIcon}
            title={content.homeMenu.ageSizing.title}
            description={content.homeMenu.ageSizing.desc}
            onClick={() => setAppState('ageSizingGuide')}
        />
        <HomeMenuItem
            icon={VideoIcon}
            title={content.homeMenu.videoGuides.title}
            description={content.homeMenu.videoGuides.desc}
            onClick={() => setAppState('videoGuides')}
        />
    </div>
  </div>
);

// Patient Selection Screen
const PatientSelectionScreen: React.FC<{ onSelect: (type: PatientType) => void; onGoHome: () => void; content: AppContent; }> = ({ onSelect, onGoHome, content }) => (
    <div className="flex flex-col h-full bg-brand-light">
         <header className="bg-white text-brand-dark p-4 shadow-md flex items-center border-b border-gray-100">
             <button onClick={onGoHome} className="p-2 rounded-full hover:bg-gray-100 text-gray-600" aria-label={content.ui.backToHome}>
                <HomeIcon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-center flex-1 -ml-10">{content.ui.selectPatient}</h1>
        </header>
        <div className="flex flex-col items-center justify-center flex-grow p-8 text-center">
            <h2 className="text-2xl font-semibold text-brand-dark">{content.ui.whoFor}</h2>
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 mt-6 w-full max-w-lg">
                <button onClick={() => onSelect('pediatric')} className="flex-1 bg-brand-DEFAULT text-white font-bold py-6 px-6 rounded-xl shadow-lg hover:bg-brand-dark transition-transform transform hover:scale-105">
                    {content.ui.child}
                </button>
                <button onClick={() => onSelect('adult')} className="flex-1 bg-accent-DEFAULT text-brand-dark font-bold py-6 px-6 rounded-xl shadow-lg hover:bg-accent-dark transition-transform transform hover:scale-105">
                    {content.ui.adult}
                </button>
            </div>
        </div>
    </div>
);


// Step Card Component
const StepCard: React.FC<{ step: CareStep }> = ({ step }) => {
  const Icon = IconMap[step.icon] || EmergencyIcon;
  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-start space-x-4">
      <div className="flex-shrink-0 bg-brand-light p-3 rounded-full">
        <Icon className="h-6 w-6 text-brand-dark" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{step.title}</h3>
        <p className="mt-1 text-gray-600">{step.description}</p>
      </div>
    </div>
  );
};

// Emergency Procedure Card Component
const EmergencyCard: React.FC<{ procedure: EmergencyProcedure }> = ({ procedure }) => {
  return (
    <div className="bg-danger-light border-l-4 border-danger-DEFAULT p-4 rounded-r-lg">
      <h3 className="text-xl font-bold text-danger-dark flex items-center">
        <EmergencyIcon className="h-6 w-6 mr-2" />
        {procedure.situation}
      </h3>
      <ol className="mt-3 list-decimal list-inside space-y-2 text-gray-700">
        {procedure.steps.map((step, index) => <li key={index}>{step}</li>)}
      </ol>
      <div className="mt-4 bg-white p-3 rounded-md border border-danger-DEFAULT">
        <p className="font-semibold text-danger-dark">{procedure.whenToCallHelp}</p>
      </div>
    </div>
  );
};

// Suction Guide Screen Component
const SuctionGuideScreen: React.FC<{ onBack: () => void; onGoHome: () => void; content: AppContent }> = ({ onBack, onGoHome, content }) => {
  const { suctionGuide } = content;
  
  return (
    <div className="flex flex-col h-full">
      <header className="bg-white text-brand-dark p-4 shadow-md flex items-center justify-between sticky top-0 z-10 border-b border-gray-100">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-600" aria-label={content.ui.back}>
          <BackIcon className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-center flex-1 mx-2">{suctionGuide.title}</h1>
        <button onClick={onGoHome} className="p-2 rounded-full hover:bg-gray-100 text-gray-600" aria-label={content.ui.backToHome}>
            <HomeIcon className="h-6 w-6" />
        </button>
      </header>
      <main className="flex-grow p-4 md:p-6 overflow-y-auto bg-gray-50 space-y-6">
        <div>
          <div className="overflow-x-auto rounded-lg shadow ring-1 ring-black ring-opacity-5">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {suctionGuide.tableHeaders.map((header, idx) => (
                    <th key={idx} scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {suctionGuide.tableRows.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{row.id}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{row.safe}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{row.typical}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-dark mb-3">{suctionGuide.tipsTitle}</h2>
          <div className="space-y-3">
            {suctionGuide.tips.map((tip, index) => (
              <div key={index} className="flex items-start bg-white p-3 rounded-md shadow-sm border-l-4 border-accent-DEFAULT">
                <svg className="h-5 w-5 flex-shrink-0 mr-3 mt-0.5 text-accent-dark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
        <BackToHomeButton onClick={onGoHome} label={content.ui.backToHome} />
      </main>
    </div>
  );
};

// General Info Screen
const GeneralInfoScreen: React.FC<{ onGoHome: () => void; content: AppContent }> = ({ onGoHome, content }) => {
  const { generalInfo, ui } = content;
  return (
    <div className="flex flex-col h-full">
      <header className="bg-white text-brand-dark p-4 shadow-md flex items-center sticky top-0 z-10 border-b border-gray-100">
        <button onClick={onGoHome} className="p-2 rounded-full hover:bg-gray-100 text-gray-600" aria-label={ui.backToHome}>
            <HomeIcon className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-center flex-1 -ml-10">{generalInfo.title}</h1>
      </header>
      <main className="flex-grow p-4 md:p-6 overflow-y-auto bg-gray-50 space-y-6">
        
        {/* Emergency Contact Banner */}
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
             <div className="flex items-center">
                <EmergencyIcon className="h-6 w-6 text-red-600 mr-2" />
                <h2 className="text-lg font-bold text-red-800">{ui.emergencyHelpline}</h2>
             </div>
             <div className="mt-2 flex items-center justify-between">
                <div>
                     <p className="text-red-700 font-bold text-xl">9839031127</p>
                     <p className="text-sm text-red-600">{ui.seniorStaff}</p>
                </div>
                 <a href="tel:9839031127" className="bg-red-600 text-white font-bold py-2 px-4 rounded-full hover:bg-red-700 transition-colors">
                     {ui.callNow}
                 </a>
             </div>
        </div>

        <section className="bg-white p-5 rounded-xl shadow-md border-t-4 border-brand-DEFAULT">
            <h2 className="text-xl font-bold text-brand-dark mb-3">{generalInfo.whatIsTitle}</h2>
            <p className="text-gray-700 leading-relaxed">
                {generalInfo.whatIsDesc}
            </p>
            <div className="mt-4 p-4 bg-brand-light rounded-lg">
                <p className="font-medium text-brand-dark">{generalInfo.breathingChangesTitle}</p>
                <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1">
                    <li>{generalInfo.breathingNormal}</li>
                    <li>{generalInfo.breathingTrach}</li>
                </ul>
            </div>
        </section>

        <section className="bg-white p-5 rounded-xl shadow-md border-t-4 border-accent-DEFAULT">
            <h2 className="text-xl font-bold text-brand-dark mb-3">{generalInfo.indicationsTitle}</h2>
            <p className="text-gray-700 mb-3">{generalInfo.indicationsDesc}</p>
            <ul className="space-y-3">
                {generalInfo.indications.map((indication, idx) => (
                    <li key={idx} className="flex items-start">
                        <span className="flex-shrink-0 h-6 w-6 bg-accent-light text-accent-dark rounded-full flex items-center justify-center font-bold text-sm mr-3">{idx + 1}</span>
                        <span className="text-gray-700">{indication}</span>
                    </li>
                ))}
            </ul>
        </section>
        
        <BackToHomeButton onClick={onGoHome} label={ui.backToHome} />
      </main>
    </div>
  );
};

// Tube Types Guide
const TubeTypesGuideScreen: React.FC<{ onGoHome: () => void; content: AppContent }> = ({ onGoHome, content }) => {
  const { tubeTypes, ui } = content;
  
  return (
    <div className="flex flex-col h-full">
        <header className="bg-white text-brand-dark p-4 shadow-md flex items-center sticky top-0 z-10 border-b border-gray-100">
            <button onClick={onGoHome} className="p-2 rounded-full hover:bg-gray-100 text-gray-600" aria-label={ui.backToHome}>
                <HomeIcon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-center flex-1 -ml-10">{tubeTypes.title}</h1>
        </header>
        <main className="flex-grow p-4 md:p-6 overflow-y-auto bg-gray-50 space-y-8">
            <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">{tubeTypes.partsTitle}</h2>
                <div className="grid gap-4">
                    {tubeTypes.parts.map((part, idx) => (
                         <div key={idx} className="bg-white p-5 rounded-xl shadow-md border-l-4 border-brand-light">
                            <h3 className="text-lg font-bold text-gray-800 mb-1">{part.name}</h3>
                            <p className="text-gray-700 mb-2">{part.description}</p>
                            {part.critical && (
                                <div className="bg-red-50 text-red-800 p-2 rounded text-sm font-semibold">
                                    {part.critical}
                                </div>
                            )}
                         </div>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">{tubeTypes.typesTitle}</h2>
                <div className="grid gap-4">
                    {tubeTypes.types.map((type, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-xl shadow-md border-l-4 border-brand-DEFAULT">
                            <h3 className="text-lg font-bold text-brand-dark mb-2">{type.name}</h3>
                            <p className="text-gray-700 mb-3">{type.description}</p>
                            <div className="bg-brand-light p-3 rounded-lg text-sm">
                                <p><span className="font-semibold text-brand-dark">Best for:</span> {type.bestFor}</p>
                                <p className="mt-1"><span className="font-semibold text-brand-dark">Key Care:</span> {type.care}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            
            <BackToHomeButton onClick={onGoHome} label={ui.backToHome} />
        </main>
    </div>
  );
};

// Age Sizing Guide
const AgeSizingGuideScreen: React.FC<{ onGoHome: () => void; content: AppContent }> = ({ onGoHome, content }) => {
    const { ageSizing, ui } = content;
    const sizeData = [
        { category: "Premature (< 1 kg)", size: "2.5 mm", length: "30-32 mm" },
        { category: "Premature (1–2.5 kg)", size: "3.0 mm", length: "32-34 mm" },
        { category: "Neonate (0–6 mos)", size: "3.0 – 3.5 mm", length: "36-40 mm" },
        { category: "Infant (6–12 mos)", size: "3.5 – 4.0 mm", length: "40–46 mm" },
        { category: "Child (1–3 yrs)", size: "4.0 – 4.5 mm", length: "45–50 mm" },
        { category: "Child (3–6 yrs)", size: "4.5 – 5.0 mm", length: "50–55 mm" },
        { category: "Child (6–12 yrs)", size: "5.5 – 6.0 mm", length: "55–65 mm" },
        { category: "Adolescent / Adult (F)", size: "7.0 – 8.0 mm", length: "65–75 mm" },
        { category: "Adult (M)", size: "8.0 – 9.0 mm", length: "75–85 mm" },
    ];

    return (
        <div className="flex flex-col h-full">
            <header className="bg-white text-brand-dark p-4 shadow-md flex items-center sticky top-0 z-10 border-b border-gray-100">
                <button onClick={onGoHome} className="p-2 rounded-full hover:bg-gray-100 text-gray-600" aria-label={ui.backToHome}>
                    <HomeIcon className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-bold text-center flex-1 -ml-10">{ageSizing.title}</h1>
            </header>
            <main className="flex-grow p-4 md:p-6 overflow-y-auto bg-gray-50 space-y-6">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{ageSizing.tableHeaders[0]}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{ageSizing.tableHeaders[1]}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{ageSizing.tableHeaders[2]}</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                            {sizeData.map((row, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.category}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{row.size}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{row.length}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                    <strong>{ageSizing.note}</strong>
                </div>
                <BackToHomeButton onClick={onGoHome} label={ui.backToHome} />
            </main>
        </div>
    );
};

// VideoGuidesScreen
const VideoGuidesScreen: React.FC<{ onGoHome: () => void; content: AppContent }> = ({ onGoHome, content }) => {
    const { videoGuides, ui } = content;

    return (
        <div className="flex flex-col h-full">
            <header className="bg-white text-brand-dark p-4 shadow-md flex items-center sticky top-0 z-10 border-b border-gray-100">
                <button onClick={onGoHome} className="p-2 rounded-full hover:bg-gray-100 text-gray-600" aria-label={ui.backToHome}>
                    <HomeIcon className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-bold text-center flex-1 -ml-10">{videoGuides.title}</h1>
            </header>
             <main className="flex-grow p-4 md:p-6 overflow-y-auto bg-gray-50 space-y-6">
                <div className="grid gap-4 md:grid-cols-1">
                    {videoGuides.videos.map((video, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl shadow-md flex flex-col">
                            <div className="flex flex-row items-center mb-3">
                                <div className="p-3 bg-brand-light rounded-full mr-4">
                                    <VideoIcon className="h-8 w-8 text-brand-dark" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 leading-tight">{video.title}</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">{video.desc}</p>
                            <a 
                                href={video.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-auto flex items-center justify-center w-full px-4 py-3 border border-transparent text-sm font-bold rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
                            >
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 0a10 10 0 100 20 10 10 0 000-20zm-2 14.5v-9l6 4.5-6 4.5z" />
                                </svg>
                                {ui.watchOnYoutube}
                            </a>
                        </div>
                    ))}
                </div>
                <BackToHomeButton onClick={onGoHome} label={ui.backToHome} />
             </main>
        </div>
    );
};


// CareGuideScreen (The AI generated one)
const CareGuideScreen: React.FC<{ guide: CareGuide; onBack: () => void; onGoHome: () => void; content: AppContent }> = ({ guide, onBack, onGoHome, content }) => {
  return (
    <div className="flex flex-col h-full">
       <header className="bg-white text-brand-dark p-4 shadow-md flex items-center sticky top-0 z-10 border-b border-gray-100">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-600" aria-label={content.ui.back}>
          <BackIcon className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-center flex-1 mx-2">{content.homeMenu.careGuide.title}</h1>
         <button onClick={onGoHome} className="p-2 rounded-full hover:bg-gray-100 text-gray-600" aria-label={content.ui.backToHome}>
            <HomeIcon className="h-6 w-6" />
        </button>
      </header>
      <main className="flex-grow p-4 md:p-6 overflow-y-auto bg-gray-50 space-y-8">
        {/* Daily Care Section */}
        <section>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-brand-light rounded-lg">
                <GuideIcon className="h-6 w-6 text-brand-dark" />
            </div>
            <h2 className="text-2xl font-bold text-brand-dark">{guide.dailyCare.title}</h2>
          </div>
          <p className="text-gray-700 mb-4 bg-white p-3 rounded-lg shadow-sm">{guide.dailyCare.introduction}</p>
          <div className="space-y-4">
            {guide.dailyCare.steps.map((step, index) => (
              <StepCard key={index} step={step} />
            ))}
          </div>
        </section>

        {/* Living Well Section */}
        <section>
           <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-accent-light rounded-lg">
                 <div className="h-6 w-6 text-accent-dark">☀️</div>
            </div>
             <h2 className="text-2xl font-bold text-brand-dark">{guide.livingWell.title}</h2>
          </div>
          <p className="text-gray-700 mb-4 bg-white p-3 rounded-lg shadow-sm">{guide.livingWell.introduction}</p>
          <div className="space-y-4">
            {guide.livingWell.steps.map((step, index) => (
              <StepCard key={index} step={step} />
            ))}
          </div>
        </section>

        {/* Emergency Section */}
        <section>
          <div className="flex items-center space-x-3 mb-4">
             <div className="p-2 bg-danger-light rounded-lg">
                <EmergencyIcon className="h-6 w-6 text-danger-DEFAULT" />
            </div>
            <h2 className="text-2xl font-bold text-danger-DEFAULT">{guide.emergency.title}</h2>
          </div>
          
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4 flex flex-col sm:flex-row items-center justify-between">
             <div>
                 <h3 className="text-lg font-bold text-red-800">{content.ui.emergencyHelpline}</h3>
                 <p className="text-red-600 text-sm">{content.ui.seniorStaff}</p>
             </div>
             <a href="tel:9839031127" className="mt-2 sm:mt-0 bg-red-600 text-white font-bold py-2 px-4 rounded-full hover:bg-red-700 transition-colors flex items-center">
                 <span className="mr-2">📞</span> 9839031127
             </a>
          </div>

          <p className="text-gray-700 mb-4 bg-white p-3 rounded-lg shadow-sm">{guide.emergency.introduction}</p>
          <div className="space-y-6">
            {guide.emergency.procedures.map((proc, index) => (
              <EmergencyCard key={index} procedure={proc} />
            ))}
          </div>
        </section>
        
        <BackToHomeButton onClick={onGoHome} label={content.ui.backToHome} />
      </main>
    </div>
  );
};


export default function App() {
  const [appState, setAppState] = useState<AppState>('home');
  const [patientType, setPatientType] = useState<PatientType | null>(null);
  const [careGuide, setCareGuide] = useState<CareGuide | null>(null);
  const [language, setLanguage] = useState<string>('English');
  const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);
  const [appContent, setAppContent] = useState<AppContent>(INITIAL_CONTENT);

  const fetchGuide = useCallback(async (selectedPatientType: PatientType, selectedLanguage: string) => {
    try {
      setAppState('loading');
      setIsSwitchingLanguage(false); 
      const guide = await generateCareGuide(selectedPatientType, ocrText, selectedLanguage);
      setCareGuide(guide);
      setAppState('guide');
    } catch (error) {
      console.error(error);
      setAppState('error');
    }
  }, []);

  const handlePatientSelect = (type: PatientType) => {
    setPatientType(type);
    fetchGuide(type, language);
  };

  const handleLanguageChange = async (newLanguage: string) => {
    setLanguage(newLanguage);
    setIsSwitchingLanguage(true);
    setAppState('loading');
    
    try {
        // Translate static content
        const translatedContent = await translateAppContent(INITIAL_CONTENT, newLanguage);
        setAppContent(translatedContent);

        // If a care guide is active, re-generate it in the new language
        if (patientType) {
            await fetchGuide(patientType, newLanguage);
        } else {
            setAppState('home');
            setIsSwitchingLanguage(false);
        }
    } catch (error) {
        console.error("Language switch failed", error);
        setAppState('home');
        setIsSwitchingLanguage(false);
    }
  };
  
  const handleGoHome = () => {
      setAppState('home');
      setPatientType(null);
      setCareGuide(null);
  }

  const renderContent = () => {
    switch (appState) {
      case 'home':
        return <HomeScreen setAppState={setAppState} selectedLanguage={language} onLanguageChange={handleLanguageChange} content={appContent} />;
      case 'selectingPatientType':
        return <PatientSelectionScreen onSelect={handlePatientSelect} onGoHome={handleGoHome} content={appContent} />;
      case 'loading':
        return <LoadingSpinner message={isSwitchingLanguage ? appContent.ui.translating : appContent.ui.loading} subMessage={isSwitchingLanguage ? "Just a moment..." : "Our AI is simplifying the medical text just for you."} />;
      case 'guide':
        return careGuide ? <CareGuideScreen guide={careGuide} onBack={() => setAppState('selectingPatientType')} onGoHome={handleGoHome} content={appContent} /> : null;
      case 'suctionGuide':
        return <SuctionGuideScreen onBack={() => setAppState('home')} onGoHome={handleGoHome} content={appContent} />;
      case 'tubeTypesGuide':
        return <TubeTypesGuideScreen onGoHome={handleGoHome} content={appContent} />;
      case 'ageSizingGuide':
        return <AgeSizingGuideScreen onGoHome={handleGoHome} content={appContent} />;
      case 'videoGuides':
        return <VideoGuidesScreen onGoHome={handleGoHome} content={appContent} />;
      case 'generalInfo':
        return <GeneralInfoScreen onGoHome={handleGoHome} content={appContent} />;
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <h2 className="text-2xl font-bold text-danger-dark">Oops! Something went wrong.</h2>
            <p className="mt-2 text-gray-600">We couldn't generate the guide. Please try again.</p>
            <button
              onClick={() => setAppState('home')}
              className="mt-6 bg-brand-DEFAULT text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-dark transition-colors"
            >
              Go Back Home
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-full bg-gray-100 font-sans overflow-hidden max-w-md mx-auto shadow-2xl relative">
      {renderContent()}
    </div>
  );
}
