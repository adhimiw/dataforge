/** DataForge terminal-field-manual: warm paper shell, monospaced hierarchy, no decorative UI. */
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProviderShim>
          <Router />
          <Toaster position="bottom-right" />
        </TooltipProviderShim>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function TooltipProviderShim({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
