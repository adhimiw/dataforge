/** DataForge terminal-field-manual: warm paper shell, monospaced hierarchy, no decorative UI. */
import { Route, Router as WouterRouter, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

function AppRouter() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <WouterRouter base={base}>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProviderShim>
          <AppRouter />
          <Toaster position="bottom-right" />
        </TooltipProviderShim>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function TooltipProviderShim({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
