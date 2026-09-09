# Chesslysis UI Stabilization

## Design direction

Chesslysis uses a restrained editorial chess-analysis interface rather than a generic blue/purple AI dashboard.

Core tokens:
- warm paper background
- charcoal sidebar
- forest-green accent
- thin neutral borders
- small square corners
- monospaced numeric/engine values
- restrained shadows
- dense but readable analytical layouts

## What was changed

1. Replaced the old dark utility appearance across feature clients with the shared editorial token system.
2. Added a real persistent light/dark theme toggle.
3. Preserved existing feature routes, API calls, loading/error states, and analysis controls.
4. Added responsive mobile navigation instead of allowing the desktop sidebar to simply disappear.
5. Added accessible focus-visible states and current-page semantics.
6. Kept the homepage untouched.
7. Added a shared page/card vocabulary for future UI work.

## Regression checklist

Before merging UI changes:

- `npm test`
- `npm run build`
- Check `/analyze`
- Check `/dashboard/:username`
- Check `/insights/:username`
- Check `/training/:username`
- Check `/openings/:username`
- Check `/mistakes/:username`
- Check `/dna/:username`
- Check `/performance/:username`
- Check `/time/:username`
- Check `/data-health/:username`
- Check `/inspector/:username`
- Check `/games/:gameId`
- Toggle light/dark mode.
- Resize from desktop to mobile.
- Verify no feature client loses its loading/error/empty state.
