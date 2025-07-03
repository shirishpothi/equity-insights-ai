# Build Caching Guide

This document explains the build caching system implemented in Equity Insights AI for faster development and deployment.

## Overview

The project uses multiple caching strategies to significantly reduce build times:

1. **Next.js Build Cache** - Caches compiled pages and components
2. **Webpack Filesystem Cache** - Caches webpack compilation results
3. **TypeScript Incremental Compilation** - Caches TypeScript compilation
4. **Node.js Module Cache** - Leverages npm/node_modules caching

## Cache Locations

- `.next/cache/` - Next.js build cache (107+ MB typical)
- `.next/static/` - Static assets cache
- `.next/server/` - Server-side rendering cache
- `tsconfig.tsbuildinfo` - TypeScript incremental compilation cache
- `node_modules/.cache/` - Various tool caches

## Cache Management Commands

### Analyze Cache
```bash
npm run cache:analyze
```
Shows current cache size and status.

### Clean Cache
```bash
npm run cache:clean
```
Removes all build cache except TypeScript incremental cache.

### Optimize Cache
```bash
npm run cache:optimize
```
Cleans and rebuilds cache for optimal performance.

### Build Commands
```bash
npm run build              # Normal build (uses cache)
npm run build:clean        # Clean build (clears cache first)
npm run build:optimized    # Optimized build with cache rebuild
```

## Performance Benefits

With caching enabled:
- **First build**: ~8-10 seconds
- **Subsequent builds**: ~3-5 seconds (60-70% faster)
- **Development hot reload**: <1 second
- **TypeScript compilation**: ~50% faster with incremental compilation

## Cache Configuration

The caching system is configured in:
- `next.config.ts` - Next.js and webpack caching
- `tsconfig.json` - TypeScript incremental compilation
- `.gitignore` - Cache directory exclusions

## Best Practices

1. **Keep TypeScript cache**: Never delete `tsconfig.tsbuildinfo`
2. **Regular cache analysis**: Run `npm run cache:analyze` weekly
3. **Clean builds for deployment**: Use `npm run build:clean` for production
4. **Optimize after major changes**: Run `npm run cache:optimize` after dependency updates

## Troubleshooting

### Cache Issues
If builds are slow or failing:
```bash
npm run cache:clean
npm run build
```

### Disk Space
If cache is too large:
```bash
npm run cache:analyze  # Check size
npm run cache:clean    # Clean if needed
```

### Development Issues
If hot reload is broken:
```bash
rm -rf .next/cache
npm run dev
```

## Environment Variables

Cache behavior can be controlled via environment variables:
- `NEXT_CACHE_ENABLED=false` - Disable caching
- `NEXT_BUILD_OPTIMIZE=true` - Enable additional optimizations

## CI/CD Considerations

For GitHub Actions and other CI systems:
- Cache `.next/cache` directory between builds
- Keep `tsconfig.tsbuildinfo` in cache
- Use `npm run build:optimized` for first-time builds
