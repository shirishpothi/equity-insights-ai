# Contributing to Equity Insights AI

Thank you for your interest in contributing to Equity Insights AI! We welcome contributions from the community and are pleased to have you join us.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include screenshots if applicable**
- **Include your environment details** (OS, Node.js version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the enhancement**
- **Describe the current behavior and explain the behavior you expected**
- **Explain why this enhancement would be useful**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes** in a feature branch
4. **Add tests** for your changes
5. **Ensure tests pass**: `npm test`
6. **Ensure linting passes**: `npm run lint`
7. **Ensure type checking passes**: `npm run typecheck`
8. **Update documentation** if needed
9. **Commit your changes** with a clear commit message
10. **Push to your fork** and submit a pull request

### Development Setup

1. **Clone your fork**:
   ```bash
   git clone https://github.com/yourusername/equity-insights-ai.git
   cd equity-insights-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Add your Google AI API key to .env.local
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Run tests**:
   ```bash
   npm test
   ```

### Coding Standards

- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the existing ESLint configuration
- **Prettier**: Code formatting is handled by Prettier
- **Naming**: Use descriptive names for variables, functions, and components
- **Comments**: Add comments for complex logic
- **Testing**: Write tests for new features and bug fixes

### Commit Messages

Use clear and meaningful commit messages:

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Examples:
```
Add stock analysis caching functionality

- Implement Redis caching for API responses
- Add cache invalidation logic
- Update tests for caching behavior

Fixes #123
```

### Branch Naming

Use descriptive branch names:
- `feature/add-portfolio-tracking`
- `bugfix/fix-pdf-generation`
- `docs/update-installation-guide`
- `refactor/improve-error-handling`

### Testing

- Write unit tests for new functions and components
- Write integration tests for new features
- Ensure all tests pass before submitting a PR
- Aim for good test coverage

### Documentation

- Update the README.md if you change functionality
- Add JSDoc comments for new functions
- Update API documentation if applicable
- Include examples in documentation

## Project Structure

```
equity-insights-ai/
├── src/
│   ├── ai/                 # AI flows and configurations
│   ├── app/                # Next.js App Router
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utility functions
├── docs/                   # Documentation
├── .github/                # GitHub workflows
└── ...config files
```

## Getting Help

If you need help, you can:

- Check the [documentation](README.md)
- Open an issue with the "question" label
- Join our discussions on GitHub

## Recognition

Contributors will be recognized in our README.md file and release notes.

Thank you for contributing to Equity Insights AI! 🚀
