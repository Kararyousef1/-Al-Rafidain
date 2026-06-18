# 🧪 Development Data (`dev/`)

This folder contains **mock data used only in development/fallback scenarios**.
It is **NOT used in production** when Supabase is properly connected.

## 📁 Contents

| File | Purpose | Used In |
|------|---------|---------|
| `mockData.ts` | Default user, problems, notifications, etc. | `src/store/index.ts` (initial state only) |

## ⚠️ How It's Used

The `mockUser` is used in **3 fallback scenarios**:

1. **Local mode** (when no Supabase session is found)
2. **Profile not yet created** (after signup, before profile is inserted)
3. **Quick login** (`loginLocal` for testing different roles)

In all other cases, **real Supabase data is loaded** and `mockUser` is
replaced automatically.

## 🎯 Production Hardening (TODO)

To completely remove mock data from production:
1. Add `import.meta.env.PROD` guard in `store/index.ts`
2. Throw a clear error if `mockUser` is used in production
3. Move initial state to a `<LoadingScreen />` while fetching real data

```typescript
// Example
if (import.meta.env.PROD && usingMockData) {
  throw new Error('Mock data should not be used in production!');
}
```

## 🔒 Security Note

The `mockUser` contains a **non-sensitive** placeholder profile. Even if it
leaks to production, it does **not** expose real user credentials or PII.
