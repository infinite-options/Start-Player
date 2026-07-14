// Shared visual constants for the dark, game-like look. Plain values only, no logic.
export const theme = {
  background: "#0B0D12",
  backgroundGradientStart: "#0B0D12",
  backgroundGradientEnd: "#12141C",
  surface: "#1A1D24",
  surfaceBorder: "#2A2E38",
  accent: "#7C5CFF",
  accent2: "#00E5FF",
  // the app's signature purple->cyan fill, shared by every primary button and every claimed circle
  gradient: ["#7C5CFF", "#00E5FF"] as const,
  textPrimary: "#F5F6FA",
  textSecondary: "#8A8F9C",
  spacing: { sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 16, lg: 24, pill: 999 },
  font: {
    title: { fontSize: 26, fontWeight: "700" as const },
    subtitle: { fontSize: 16, fontWeight: "400" as const },
    button: { fontSize: 18, fontWeight: "600" as const },
    // small uppercase micro-labels ("HOW MANY PLAYERS?", "TAP TO CLAIM") - tight and letter-spaced
    caption: { fontSize: 13, fontWeight: "600" as const, letterSpacing: 1.5 },
  },
};
