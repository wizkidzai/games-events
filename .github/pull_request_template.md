## Summary

<!-- Describe what this PR does and why -->

## Checklist

### Code Quality
- [ ] Lint passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] TypeScript compilation succeeds
- [ ] No console errors in browser

### Game-Specific (if applicable)
- [ ] All three scenes implemented (MenuScene, GameScene, GameOverScene)
- [ ] Card I/O tested (read at start, write at end)
- [ ] Score accumulation correct
- [ ] Mascot animations smooth
- [ ] Leaderboard displays correctly
- [ ] Offline mode works (reader unavailable)
- [ ] `gameRegistry.json` updated with new game metadata

### Accessibility (WCAG 2.1 AA)
- [ ] Keyboard-only navigation works end-to-end
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Color contrast passes (4.5:1 text, 3:1 UI)
- [ ] Screen reader can navigate

### Design & UX
- [ ] Light mode applied (default)
- [ ] Responsive layout verified (1920×1080, 1366×768, 1024×768)
- [ ] Mascot color theme consistent

### Security & COPPA
- [ ] No personal data collected beyond card data
- [ ] No third-party trackers added
- [ ] No external APIs except CDN for models

### Performance
- [ ] 60 FPS stable
- [ ] Bundle < 500 KB (gzipped)
- [ ] Load time < 3 sec
