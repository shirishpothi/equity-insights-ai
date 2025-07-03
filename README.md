# Equity Insights AI

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-11.9.1-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Google AI](https://img.shields.io/badge/Google_AI-Genkit-4285F4?style=flat-square&logo=google)](https://firebase.google.com/docs/genkit)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

> Your personal AI analyst. Validate your investment thesis with in-depth analysis powered by AI.

**Equity Insights AI** is a sophisticated stock analysis platform that leverages artificial intelligence to provide comprehensive equity research reports. Built with modern web technologies and powered by Google's Genkit AI framework, it delivers professional-grade investment analysis to help you make informed decisions.

## ✨ Features

- **🔍 AI-Powered Stock Analysis**: Get detailed fundamental analysis using advanced AI models
- **🔐 User Authentication**: Secure Google OAuth login with Supabase backend
- **📚 Analysis History**: Save and manage your analysis history with search functionality
- **📊 Comprehensive Reports**: Five-section analysis covering fundamentals, thesis validation, sector view, catalysts, and investment summary
- **🎯 Thesis Validation**: Validate your investment ideas with data-driven insights
- **📈 Real-time Ticker Suggestions**: Smart autocomplete for stock symbols
- **📄 PDF Export**: Generate professional PDF reports for your analysis
- **👤 User Profiles**: Manage your account and view personal analysis history
- **🛡️ Row Level Security**: Your data is private and secure with database-level protection
- **📋 Copy to Clipboard**: Easy sharing of analysis results
- **🎨 Modern UI**: Beautiful, responsive interface with dark theme and smooth animations
- **⚡ Fast Performance**: Built with Next.js 15 and optimized for speed

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0 or later
- npm, yarn, or pnpm
- Google AI API key (for Genkit integration)
- Supabase account (for authentication and data storage)

## 🌐 Deployment

For production deployment with full AI functionality, see our comprehensive [Deployment Guide](DEPLOYMENT.md).

**Quick deployment options:**
- **Vercel** (Recommended): Full functionality with serverless functions
- **Netlify**: Full functionality with serverless functions
- **GitHub Pages**: Static demo only (limited functionality)

The application is configured to work seamlessly with modern hosting platforms that support Next.js and serverless functions.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/equity-insights-ai.git
   cd equity-insights-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Add your API keys to `.env.local`:
   ```env
   # Google AI API Key (required)
   GOOGLE_GENAI_API_KEY=your_google_ai_api_key_here

   # Supabase Configuration (required for authentication)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Next.js Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:9002
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:9002](http://localhost:9002) to see the application.

## 📖 Usage

### Basic Analysis

1. **Enter Stock Ticker**: Type a stock symbol (e.g., AAPL, GOOGL, TSLA)
2. **Investment Goal**: Describe your investment objective (e.g., "Long-term growth", "Dividend income")
3. **Investment Thesis**: Provide your reasoning for considering this stock (minimum 25 characters)
4. **Generate Analysis**: Click the "Generate Analysis" button to get your AI-powered report

### Report Sections

The AI generates a comprehensive report with five key sections:

- **📊 Fundamental Analysis**: Financial metrics, valuation, and company performance
- **✅ Thesis Validation**: Assessment of your investment hypothesis
- **🌍 Sector & Macro View**: Industry trends and macroeconomic factors
- **⚡ Catalyst Watch**: Upcoming events and potential market movers
- **📋 Investment Summary**: Concise overview and recommendations

### Export Options

- **Copy Text**: Copy the entire analysis to your clipboard
- **Download PDF**: Generate a professional PDF report

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.3.3** - React framework with App Router
- **React 18.3.1** - UI library
- **TypeScript 5.0** - Type safety
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

### AI & Backend
- **Google Genkit 1.13.0** - AI framework for building AI-powered applications
- **Google AI** - Large language models for analysis
- **Firebase 11.9.1** - Backend services and hosting

### Form & Validation
- **React Hook Form 7.54.2** - Performant forms with easy validation
- **Zod 3.24.2** - TypeScript-first schema validation

### PDF Generation
- **jsPDF 2.5.1** - PDF generation
- **html2canvas 1.4.1** - HTML to canvas conversion

## 🏗️ Project Structure

```
equity-insights-ai/
├── src/
│   ├── ai/                 # AI flows and configurations
│   │   ├── flows/          # Genkit AI flows
│   │   ├── dev.ts          # Development AI setup
│   │   └── genkit.ts       # AI configuration
│   ├── app/                # Next.js App Router
│   │   ├── actions.ts      # Server actions
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Main page
│   ├── components/         # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── markdown-renderer.tsx
│   │   └── pdf-report.tsx
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utility functions
├── docs/                   # Documentation
├── public/                 # Static assets
└── ...config files
```

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server on port 9002
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run genkit:dev` - Start Genkit development server
- `npm run genkit:watch` - Start Genkit with file watching

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Google AI API Key (required)
GOOGLE_GENAI_API_KEY=your_api_key_here

# Supabase Configuration (required for authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

## 🔐 Authentication & Data Storage

This application uses **Supabase** for authentication and data storage, providing:

- **Google OAuth Login**: Secure authentication with Google accounts
- **User Profiles**: Automatic profile creation and management
- **Analysis History**: Save and retrieve your stock analyses
- **Row Level Security**: Database-level security ensuring data privacy
- **Real-time Updates**: Instant synchronization across sessions

### Setting up Authentication

1. **Create a Supabase Project**: Visit [supabase.com](https://supabase.com) and create a new project
2. **Configure Google OAuth**: Set up Google OAuth in your Supabase dashboard
3. **Set Environment Variables**: Add your Supabase credentials to `.env.local`
4. **Database Setup**: The required tables and security policies are automatically configured

For detailed authentication setup instructions, see [AUTHENTICATION.md](./AUTHENTICATION.md).

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests** for your changes
5. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Ensure components are accessible
- Add proper error handling
- Write meaningful commit messages
- Update documentation as needed

### Code Style

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Tailwind CSS** for consistent styling

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Genkit** for the AI framework
- **Vercel** for Next.js and deployment platform
- **Radix UI** for accessible components
- **Tailwind CSS** for the utility-first CSS framework
- **Lucide** for beautiful icons

## 📞 Support

If you have any questions or need help:

- 📧 Email: [your-email@example.com](mailto:your-email@example.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/equity-insights-ai/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/equity-insights-ai/discussions)

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/shirishpothi">Shirish Pothi</a></p>
  <p>© 2025 Equity Insights AI. All Rights Reserved.</p>
</div>
