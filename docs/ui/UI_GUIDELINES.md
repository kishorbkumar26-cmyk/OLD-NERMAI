# NERMAI UI Guidelines

## Mobile-First Principles

1. **No Fixed Widths**: Never use `width: '48%'` or `width: 320`. Use flexbox (`flex: 1`, `flexGrow`) to allow components to respond dynamically to screen sizes.
2. **Single Column Forms**: On mobile devices, all forms must be single-column. Stack `First Name` and `Last Name` vertically. Only use multi-column layouts on tablets or desktop.
3. **Safe Areas**: Use `react-native-safe-area-context` to ensure UI never overlaps notches or status bars. Wrap main screens in a `ScreenContainer`.
4. **Keyboard Management**: Always use `KeyboardAvoidingView` coupled with a `ScrollView`. Form inputs must never be hidden behind the keyboard.

## Accessibility (A11y)

1. **Touch Targets**: All interactive elements (Buttons, Icons, Links) must have a minimum bounding box of 48x48 pixels. Our standard for primary actions is 56px.
2. **Contrast**: Ensure text color contrast passes WCAG AA standards.
3. **Screen Readers**: Provide `accessibilityLabel` for icon-only buttons.

## Animation Rules

Subtle, non-distracting motion only.

**Allowed Animations:**
- Page transitions (fade, subtle slide).
- Button press state (scale down to 0.95 or ripple effect).
- Bottom Sheet entrance (slide up from bottom).
- Accordion expansion.

**Banned Animations:**
- Bouncing, looping, or excessive rotation.
- Long durations (>300ms).

## Component Rules

- **Inputs**: Height = 56px, Radius = 16px, Padding = 16px. Include leading icons and trailing actions (like password visibility toggle).
- **Buttons**: Height = 56px, Radius = 16px. Include loading states (`ActivityIndicator`).
- **Cards**: Radius = 20px, Padding = 20px. Use standard surface background (`#1B1B1B`).
