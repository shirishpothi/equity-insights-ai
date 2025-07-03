import type { AnalyzeStockOutput } from '@/ai/flows/analyze-stock';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { analysisSections } from '@/app/page';
import React from 'react';

interface PdfReportProps extends React.HTMLAttributes<HTMLDivElement> {
  analysis: AnalyzeStockOutput;
  ticker: string;
}

export function PdfReport({ analysis, ticker, ...props }: PdfReportProps) {
  const generationDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      {...props}
      style={{
        width: '210mm',
        fontFamily: 'Arial, sans-serif',
        color: '#1f2937', // text-gray-800
        backgroundColor: '#ffffff',
      }}
    >
      <div className="p-12 flex flex-col min-h-full">
        <header className="mb-12 text-center border-b-4 border-violet-600 pb-8">
          <h1 className="text-5xl font-bold text-gray-900">
            Equity Insights AI Report
          </h1>
          <h2 className="text-4xl font-semibold text-violet-700 mt-4">{ticker}</h2>
          <p className="text-base text-gray-500 mt-4">
            Generated on {generationDate}
          </p>
        </header>

        <main className="flex-grow space-y-8">
          {analysisSections.map(({ key, title }) => (
            analysis[key] && (
              <section key={key} className="break-inside-avoid">
                <h3 className="text-2xl font-bold border-b-2 border-violet-200 pb-2 mb-4 text-gray-800">
                  {title}
                </h3>
                <div className="text-base text-gray-700 leading-relaxed">
                  <MarkdownRenderer content={analysis[key]} />
                </div>
              </section>
            )
          ))}
        </main>

        <footer className="mt-12 pt-6 text-center text-xs text-gray-400 border-t border-gray-300">
          <p className="font-bold">Powered by Equity Insights AI</p>
          <p className="mt-2">
            This report is for informational purposes only and does not constitute financial advice.
          </p>
        </footer>
      </div>
    </div>
  );
}
