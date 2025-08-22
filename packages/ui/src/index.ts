// Strict Mac Theme Tokens
export const theme = {
  colors: {
    background: '#F5F5F7',
    surface: '#FFFFFF',
    border: '#E6E6EB',
    textPrimary: '#1D1D1F',
    textSecondary: '#6E6E73',
    accent: '#007AFF',
    danger: '#FF3B30',
    warning: '#FF9F0A',
    success: '#34C759',
  },
  typography: {
    fontFamily: 'SF Pro Display, SF Pro Text, -apple-system, system-ui, sans-serif',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
} as const;

export type Theme = typeof theme;