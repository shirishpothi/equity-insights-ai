'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast"
import { handleStockAnalysis, handleTickerSuggest } from './actions';
import type { AnalyzeStockOutput } from '@/ai/flows/analyze-stock';
import type { TickerSuggestionOutput } from '@/ai/flows/suggest-tickers';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { PdfReport } from '@/components/pdf-report';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Copy,
  Download,
  LoaderCircle,
  Terminal,
  History,
  Save,
  Settings,
} from 'lucide-react';
import { analysisSections } from '@/lib/constants';
import { useAuth } from '@/contexts/auth-context';
import { LoginButton } from '@/components/auth/login-button';
import { useFeatureFlags, FEATURE_FLAGS } from '@/lib/feature-flags';
import { UserMenu } from '@/components/auth/user-menu';
import { AuthStatus } from '@/components/auth/auth-status';
import { analysisHistoryService } from '@/lib/analysis-history';
import Link from 'next/link';


const formSchema = z.object({
  ticker: z.string().min(1, 'Ticker symbol is required.').max(6, 'Ticker symbol is too long.').transform(v => v.toUpperCase()),
  investmentThesis: z.string().min(25, 'Please provide a more detailed investment thesis (at least 25 characters).'),
  goal: z.string().min(15, 'Please describe your investment goal (at least 15 characters).'),
});

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeStockOutput | null>(null);
  const [submittedTicker, setSubmittedTicker] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<z.infer<typeof formSchema> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authPrompt, setAuthPrompt] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Feature flags
  const featureFlags = useFeatureFlags([
    FEATURE_FLAGS.AI_STOCK_ANALYSIS,
    FEATURE_FLAGS.AI_TICKER_SUGGESTIONS,
    FEATURE_FLAGS.UI_ANALYSIS_HISTORY,
    FEATURE_FLAGS.UI_PDF_EXPORT,
    FEATURE_FLAGS.UI_COPY_TO_CLIPBOARD,
    FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT,
  ]);

  const [isCopied, setIsCopied] = useState(false);
  const [suggestions, setSuggestions] = useState<TickerSuggestionOutput>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticker: '',
      investmentThesis: '',
      goal: '',
    },
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsContainerRef.current && !suggestionsContainerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [suggestionsContainerRef]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSuggestions([]);
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);
    setSubmittedTicker(values.ticker);
    setSubmittedData(values);
    setAuthPrompt(false);

    // Check if AI stock analysis is enabled
    if (!featureFlags[FEATURE_FLAGS.AI_STOCK_ANALYSIS]) {
      setError('AI stock analysis is currently disabled.');
      setIsLoading(false);
      return;
    }

    const result = await handleStockAnalysis(values);

    if (result.success) {
      setAnalysisResult(result.data);

      // Auto-save if user is authenticated
      if (user) {
        await saveAnalysisToHistory(values, result.data);
      } else {
        setAuthPrompt(true);
      }
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }

  const saveAnalysisToHistory = async (formData: z.infer<typeof formSchema>, analysisData: AnalyzeStockOutput) => {
    if (!user) return;

    // Check if analysis history feature is enabled
    if (!featureFlags[FEATURE_FLAGS.UI_ANALYSIS_HISTORY]) {
      return;
    }

    setIsSaving(true);
    const result = await analysisHistoryService.saveAnalysis({
      ticker: formData.ticker,
      investment_thesis: formData.investmentThesis,
      investment_goal: formData.goal,
      analysis_result: analysisData
    });

    if (result.success) {
      toast({
        title: "Analysis Saved",
        description: "Your analysis has been saved to your history.",
      });
    } else {
      console.error('Failed to save analysis:', result.error);
      // Don't show error toast for save failures to avoid disrupting user experience
    }
    setIsSaving(false);
  };

  const handleManualSave = async () => {
    if (!user || !submittedData || !analysisResult) return;
    await saveAnalysisToHistory(submittedData, analysisResult);
  };
  
  const handleCopy = () => {
    if (!analysisResult) return;

    // Check if copy to clipboard feature is enabled
    if (!featureFlags[FEATURE_FLAGS.UI_COPY_TO_CLIPBOARD]) {
      toast({
        title: "Feature Unavailable",
        description: "Copy to clipboard is currently disabled.",
        variant: "destructive",
      });
      return;
    }

    const reportText = analysisSections
      .map(({ key, title }) => {
        const content = analysisResult[key]
        return `## ${title}\n\n${content}`;
      })
      .join('\n\n---\n\n');

    navigator.clipboard.writeText(reportText);
    toast({
      title: "Report Copied",
      description: "The full analysis has been copied to your clipboard.",
    });
    setIsCopied(true);
    setTimeout(() => {
        setIsCopied(false);
    }, 2000);
  };

  const handleDownloadPdf = async () => {
    if (!analysisResult || !submittedTicker) return;

    // Check if PDF export feature is enabled
    if (!featureFlags[FEATURE_FLAGS.UI_PDF_EXPORT]) {
      toast({
        title: "Feature Unavailable",
        description: "PDF export is currently disabled.",
        variant: "destructive",
      });
      return;
    }

    const input = document.getElementById('pdf-report');
    if (!input) {
      setError('Could not generate PDF. Report element not found.');
      return;
    }

    setIsGeneratingPdf(true);
    setError(null);

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps= pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`Equity-Insights-Report-${submittedTicker}.pdf`);
    } catch (e) {
      console.error(e);
      setError('An error occurred while generating the PDF.');
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: "An unexpected error occurred while creating the PDF.",
      })
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    form.setValue('ticker', value, { shouldValidate: true });

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (value.length < 1) {
      setSuggestions([]);
      setIsSuggesting(false);
      return;
    }

    // Only show suggestions if the feature is enabled
    if (!featureFlags[FEATURE_FLAGS.AI_TICKER_SUGGESTIONS]) {
      setSuggestions([]);
      setIsSuggesting(false);
      return;
    }

    setIsSuggesting(true);
    debounceTimeout.current = setTimeout(async () => {
      if (value === form.getValues('ticker')) {
        const result = await handleTickerSuggest(value);
        if (result.success) {
          setSuggestions(result.data);
        } else {
          setSuggestions([]);
          console.error(result.error);
        }
      }
      setIsSuggesting(false);
    }, 100);
  };

  const selectSuggestion = (ticker: string) => {
    form.setValue('ticker', ticker.toUpperCase(), { shouldValidate: true });
    setSuggestions([]);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-4xl mx-auto flex flex-grow flex-col">
        <div className="flex-grow">
          {/* Navigation Bar */}
          <nav className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              {user && featureFlags[FEATURE_FLAGS.UI_ANALYSIS_HISTORY] && (
                <Button variant="outline" asChild>
                  <Link href="/history">
                    <History className="mr-2 h-4 w-4" />
                    History
                  </Link>
                </Button>
              )}
              {user && featureFlags[FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT] && (
                <Button variant="outline" asChild>
                  <Link href="/admin/feature-flags">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin
                  </Link>
                </Button>
              )}
            </div>
            <AuthStatus />
          </nav>

          <header className="text-center mb-12">
            <h1 className="font-headline text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight bg-gradient-to-br from-foreground via-violet-400 to-accent text-transparent bg-clip-text animated-gradient-text drop-shadow-[0_0_12px_hsl(var(--accent)/0.5)]">
              Equity Insights AI
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Your personal AI analyst. Validate your investment thesis with in-depth analysis powered by AI.
            </p>
            {user && (
              <p className="mt-2 text-sm text-muted-foreground">
                Welcome back, {user.user_metadata?.full_name || user.email}! Your analyses are automatically saved.
              </p>
            )}
          </header>

          <Card className="w-full shadow-2xl shadow-primary/10 bg-card/50 backdrop-blur-sm border-white/10 purple-glow">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Analyze a Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="ticker"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Ticker</FormLabel>
                          <div className="relative" ref={suggestionsContainerRef}>
                            <FormControl>
                              <div className="relative">
                                  <Input
                                  placeholder="e.g., AAPL"
                                  {...field}
                                  onChange={handleTickerChange}
                                  className="purple-glow"
                                  autoComplete="off"
                                  />
                                  {isSuggesting && (
                                  <LoaderCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                  )}
                              </div>
                            </FormControl>
                            {suggestions.length > 0 && (
                              <Card className="absolute top-full mt-2 w-full z-20 bg-card/80 backdrop-blur-md purple-glow">
                                <CardContent className="p-1">
                                  <ul className="space-y-1">
                                    {suggestions.map((suggestion) => (
                                      <li key={suggestion.ticker}>
                                        <button
                                          type="button"
                                          onClick={() => selectSuggestion(suggestion.ticker)}
                                          className="w-full text-left p-2 rounded-md hover:bg-accent/50 transition-colors flex justify-between items-center"
                                        >
                                          <span className="font-semibold">{suggestion.ticker}</span>
                                          <span className="text-sm text-muted-foreground truncate ml-2">{suggestion.name}</span>
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="goal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Investment Goal</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Long-term growth, dividend income" {...field} className="purple-glow" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="investmentThesis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investment Thesis</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe why you are considering this stock..."
                            className="min-h-[120px] purple-glow resize-none"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // Auto-resize logic
                              const target = e.currentTarget;
                              target.style.height = 'auto';
                              target.style.height = `${target.scrollHeight}px`;
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="lg" className="w-full font-bold text-base bg-gradient-to-r from-accent to-purple-600 transition-all duration-300 purple-glow hover:brightness-110" disabled={isLoading || isGeneratingPdf}>
                    {isLoading ? (
                      <>
                        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Analyzing...
                      </>
                    ) : "Generate Analysis"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {isLoading && (
            <div className="mt-12 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-slide-up-fade" style={{ animationDelay: `${i * 100}ms` }}>
                    <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                      <CardHeader>
                      <Skeleton className="h-7 w-1/3 bg-muted/80" />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Skeleton className="h-4 w-full bg-muted/80" />
                        <Skeleton className="h-4 w-5/6 bg-muted/80" />
                        <Skeleton className="h-4 w-3/4 bg-muted/80" />
                      </CardContent>
                    </Card>
                </div>
              ))}
            </div>
          )}
          
          {error && (
            <div className="mt-12 animate-slide-up-fade">
              <Alert variant="destructive" className="bg-destructive/50 backdrop-blur-sm border-destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Analysis Failed</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {authPrompt && analysisResult && !user && (
            <div className="mt-8 animate-slide-up-fade">
              <Alert className="bg-primary/10 border-primary">
                <Save className="h-4 w-4" />
                <AlertTitle>Save Your Analysis</AlertTitle>
                <AlertDescription className="mt-2">
                  <p className="mb-3">Sign in to save this analysis to your history and access it anytime.</p>
                  <LoginButton size="sm" />
                </AlertDescription>
              </Alert>
            </div>
          )}

          {analysisResult && (
            <div className="mt-12 animate-slide-up-fade">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-3xl font-headline font-bold">Analysis Report</h2>
                  <div className="flex items-center gap-2">
                      {user && submittedData && (
                        <Button
                          variant="outline"
                          onClick={handleManualSave}
                          disabled={isSaving}
                          className="purple-glow"
                        >
                          {isSaving ? (
                            <>
                              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save
                            </>
                          )}
                        </Button>
                      )}
                      {featureFlags[FEATURE_FLAGS.UI_COPY_TO_CLIPBOARD] && (
                        <Button variant="outline" onClick={handleCopy} className="purple-glow w-[130px]">
                            {isCopied ? (
                                <CheckCircle2 className="mr-2 h-4 w-4 animate-pop-in" />
                            ) : (
                                <Copy className="mr-2 h-4 w-4" />
                            )}
                            {isCopied ? 'Copied!' : 'Copy Text'}
                        </Button>
                      )}
                      {featureFlags[FEATURE_FLAGS.UI_PDF_EXPORT] && (
                        <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="purple-glow w-[170px]">
                            <Download className={cn("mr-2 h-4 w-4", isGeneratingPdf && "animate-bounce")} />
                            {isGeneratingPdf ? 'Downloading...' : 'Download PDF'}
                        </Button>
                      )}
                  </div>
              </div>
              <Card className="bg-card/50 backdrop-blur-sm border-white/10 purple-glow">
                <CardContent className="p-2 sm:p-4">
                  <Accordion type="multiple" defaultValue={['fundamentalAnalysis']} className="w-full">
                    {analysisSections.map(({ key, title, icon: Icon }) => (
                      analysisResult[key] && (
                          <AccordionItem value={key} key={key} className="border-b-white/10">
                          <AccordionTrigger className="text-lg hover:no-underline px-4 group">
                            <div className="flex items-center">
                              <Icon className="mr-4 h-6 w-6 icon-glow flex-shrink-0" />
                              <span className="font-headline">{title}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 text-base text-muted-foreground">
                            <MarkdownRenderer content={analysisResult[key]} />
                          </AccordionContent>
                        </AccordionItem>
                      )
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          )}

          {analysisResult && submittedTicker && (
            <div className="absolute top-0 -left-[9999px] -z-10">
              <PdfReport
                id="pdf-report"
                analysis={analysisResult}
                ticker={submittedTicker}
              />
            </div>
          )}
        </div>
        <footer className="mt-auto pt-8 border-t border-white/10 text-center text-muted-foreground text-sm">
          <p className="mb-2">
            <a
              href="https://github.com/shirishpothi"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold inline-flex items-center group"
            >
              <span className="bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500 text-transparent bg-clip-text group-hover:brightness-125 transition-all">
                Made with
              </span>
              &nbsp;
              <span className="animate-heartbeat">❤️</span>
              &nbsp;
              <span className="bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500 text-transparent bg-clip-text group-hover:brightness-125 transition-all">
                by Shirish Pothi
              </span>
            </a>
          </p>
          <p>&copy; {new Date().getFullYear()} Equity Insights AI. All Rights Reserved.</p>
        </footer>
      </div>
    </main>
  );
}
