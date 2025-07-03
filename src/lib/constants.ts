import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Globe,
  Zap
} from 'lucide-react';

export const analysisSections = [
  { key: 'fundamentalAnalysis', title: 'Fundamental Analysis', icon: ClipboardList },
  { key: 'thesisValidation', title: 'Thesis Validation', icon: CheckCircle2 },
  { key: 'sectorAndMacroView', title: 'Sector & Macro View', icon: Globe },
  { key: 'catalystWatch', title: 'Catalyst Watch', icon: Zap },
  { key: 'investmentSummary', title: 'Investment Summary', icon: FileText },
] as const;
