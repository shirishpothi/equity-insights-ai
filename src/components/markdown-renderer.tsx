'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) {
    return null;
  }

  // Improved parser to handle consecutive lists and paragraphs
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc space-y-2 pl-5 my-4">
          {currentList.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const lines = content.split('\n').filter(line => line.trim() !== '');

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      currentList.push(trimmedLine.substring(2).trim());
    } else {
      flushList();
      elements.push(<p key={`p-${index}`} className="mb-4 last:mb-0">{trimmedLine}</p>);
    }
  });

  flushList();

  return <>{elements}</>;
}
