/**
 * NERMAI SACS — Neumorphic Design System
 *
 * Neumorphism on dark backgrounds works by pairing:
 *   - a slightly lighter shadow on one side (highlight)
 *   - a slightly darker shadow on the other (shadow)
 *
 * Base color: #1B1B1B (surface)
 * Highlight:  #282828  (surface + ~8 lightness)
 * Shadow:     #0E0E0E  (surface - ~8 lightness / background)
 */

export const NM = {
  /** Colors — sourced from @nermai/theme */
  colors: {
    bg:              '#0E0E0E',
    surface:         '#1B1B1B',
    surfaceHigh:     '#252525',
    gold:            '#D4AF37',
    red:             '#FF3B30',
    textPrimary:     '#F8F8F8',
    textSecondary:   '#A0A0A0',
    success:         '#34C759',
    warning:         '#FF9500',
    error:           '#FF3B30',
    goldAlpha20:     'rgba(212,175,55,0.20)',
    goldAlpha10:     'rgba(212,175,55,0.10)',
    redAlpha20:      'rgba(255,59,48,0.20)',
    white05:         'rgba(255,255,255,0.05)',
    white10:         'rgba(255,255,255,0.10)',
    white03:         'rgba(255,255,255,0.03)',
  },

  /**
   * Neumorphic shadow styles
   *
   * On dark: lighter top-left, darker bottom-right
   *
   * CSS (web):
   *   boxShadow: `4px 4px 10px #0a0a0a, -4px -4px 10px #272727`
   *
   * React Native: `elevation` + paired shadows (Android/iOS only approximation)
   */
  shadows: {
    flat: {
      web: `2px 2px 6px #090909, -2px -2px 6px #272727`,
      rn: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 4,
      },
    },
    raised: {
      web: `5px 5px 14px #080808, -5px -5px 14px #2d2d2d`,
      rn: {
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.7,
        shadowRadius: 10,
        elevation: 8,
      },
    },
    inset: {
      web: `inset 3px 3px 8px #090909, inset -3px -3px 8px #262626`,
    },
    pressed: {
      web: `inset 2px 2px 6px #080808, inset -2px -2px 6px #282828`,
    },
    active: {
      web: `3px 3px 10px #080808, -3px -3px 10px #2d2d2d, inset 0 0 0 1px rgba(212,175,55,0.3)`,
    },
  },

  /** Border radius */
  radius: {
    xs:  4,
    sm:  8,
    md:  12,
    lg:  16,
    xl:  20,
    xxl: 28,
    pill: 999,
  },

  /** Spacing */
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  /** Typography */
  type: {
    h1: 24,
    h2: 20,
    h3: 16,
    body: 14,
    caption: 12,
    micro: 10,
  },
} as const;
