import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home, RefreshCw, ShieldAlert, ServerCrash, WifiOff } from 'lucide-react';
import { FillButtonContent } from '../components/FillButtonContent';

export type ErrorCode = '404' | '403' | '500' | '503';

interface ErrorMetadata {
  code: ErrorCode;
  tag: string;
  title: string;
  description: string;
  hint: string;
  icon: React.FC<{ className?: string }>;
}

const ERROR_CATALOG: Record<ErrorCode, ErrorMetadata> = {
  '404': {
    code: '404',
    tag: 'SIGNAL LOST · ROUTE NOT FOUND',
    title: 'This Sector Does Not Exist',
    description:
      'The page or broadcast feed you requested may have been moved, archived, or never provisioned on this server.',
    hint: 'Return to the Kathmandu HQ homepage or navigate to an active production channel below.',
    icon: AlertTriangle,
  },
  '403': {
    code: '403',
    tag: 'ACCESS RESTRICTED · CLEARANCE REQUIRED',
    title: 'Restricted Control Room Area',
    description:
      'You do not have permission to access this protected endpoint or studio resource.',
    hint: 'Sign in with an authorized administrator account or return to the public broadcast portal.',
    icon: ShieldAlert,
  },
  '500': {
    code: '500',
    tag: 'INTERNAL MCR FAULT · RUNTIME ERROR',
    title: 'Unexpected Production Signal Fault',
    description:
      'An unexpected runtime or server exception interrupted rendering this view. Our fallback diagnostics have caught the error safely.',
    hint: 'Reload the page to re-establish the signal or return to the main stage.',
    icon: ServerCrash,
  },
  '503': {
    code: '503',
    tag: 'FEED STANDBY · SERVICE UNAVAILABLE',
    title: 'Upstream Studio Feed Temporarily Offline',
    description:
      'The requested data service is temporarily down for maintenance or unreachable from this deployment.',
    hint: 'Retry the connection in a few seconds or continue browsing cached sections.',
    icon: WifiOff,
  },
};

export const ErrorPage: React.FC<{
  code?: ErrorCode;
  embedded?: boolean;
  onRetry?: () => void;
}> = ({ code = '404', embedded = false, onRetry }) => {
  const navigate = useNavigate();
  const meta = ERROR_CATALOG[code] || ERROR_CATALOG['404'];
  const Icon = meta.icon;

  return (
    <section
      className={`${
        embedded ? 'py-20' : 'min-h-[82vh] pt-32 pb-24 flex items-center'
      } relative overflow-hidden`}
    >
      <div className="max-w-[920px] w-full mx-auto px-6 relative z-10">
        <div
          className="border p-8 sm:p-12 bg-[#0d0d12]/90 relative overflow-hidden"
          style={{ borderColor: 'var(--brand-border)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-600" />

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="space-y-5 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-red-500/40 bg-red-950/30 text-[11px] font-mono-num font-bold tracking-wider text-red-400">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>HTTP {meta.code} · {meta.tag}</span>
              </div>

              <h1
                className="font-display font-bold tracking-tight text-white leading-[1.02]"
                style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}
              >
                {meta.title}
              </h1>

              <p className="text-sm sm:text-base leading-relaxed text-neutral-300">
                {meta.description}
              </p>

              <p className="text-xs text-neutral-400 border-l-2 border-red-600 pl-3">
                {meta.hint}
              </p>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-5 py-3 text-xs font-semibold btn-brand"
                >
                  <FillButtonContent className="gap-2">
                    <Home className="w-4 h-4" />
                    <span>Back to Home</span>
                  </FillButtonContent>
                </Link>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center justify-center px-5 py-3 text-xs font-semibold btn-brand-outline"
                >
                  <FillButtonContent className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous Page</span>
                  </FillButtonContent>
                </button>

                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center justify-center px-5 py-3 text-xs font-semibold btn-brand-outline"
                  >
                    <FillButtonContent className="gap-2">
                      <RefreshCw className="w-4 h-4" />
                      <span>Retry Signal</span>
                    </FillButtonContent>
                  </button>
                )}
              </div>
            </div>

            {/* Architectural Code Display */}
            <div className="shrink-0 flex flex-col items-start md:items-end justify-between border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
              <div className="font-mono-num text-7xl sm:text-8xl font-bold leading-none text-white/15 select-none tabular-nums">
                {meta.code}
              </div>
              <div className="mt-6 space-y-1.5 text-xs md:text-right">
                <div className="text-neutral-500 uppercase tracking-wider text-[10px]">Active Channels</div>
                <div className="flex flex-wrap md:justify-end gap-x-4 gap-y-1.5 text-neutral-300">
                  <Link to="/services" className="hover:text-white underline underline-offset-4">
                    Services
                  </Link>
                  <Link to="/events" className="hover:text-white underline underline-offset-4">
                    Events
                  </Link>
                  <Link to="/portfolio" className="hover:text-white underline underline-offset-4">
                    Work
                  </Link>
                  <Link to="/reviews" className="hover:text-white underline underline-offset-4">
                    Reviews
                  </Link>
                  <Link to="/contact" className="hover:text-white underline underline-offset-4">
                    Contact
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || 'Unexpected application error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#08080A] text-[#F8FAFC] flex items-center justify-center p-6">
          <div className="max-w-xl w-full border border-white/15 bg-[#101016] p-8 space-y-5">
            <div className="h-[2px] w-16 bg-red-600" />
            <div className="font-mono-num text-xs text-red-400">HTTP 500 · RUNTIME RECOVERY</div>
            <h1 className="font-display text-4xl font-bold text-white">
              Signal Interrupted — Safe Recovery Active
            </h1>
            <p className="text-sm text-neutral-300 leading-relaxed">
              {this.state.message || 'An unexpected rendering issue occurred.'}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.assign('/')}
                className="px-5 py-3 text-xs font-semibold btn-brand inline-flex items-center justify-center"
              >
                <FillButtonContent className="gap-2">
                  <Home className="w-4 h-4" />
                  <span>Return Home</span>
                </FillButtonContent>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-3 text-xs font-semibold btn-brand-outline inline-flex items-center justify-center"
              >
                <FillButtonContent className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Page</span>
                </FillButtonContent>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
