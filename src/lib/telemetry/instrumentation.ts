// Must be imported before any other modules to ensure proper instrumentation
import './opentelemetry-config';

// Initialize telemetry as early as possible
import { initializeTelemetry } from './opentelemetry-config';

// Initialize immediately
initializeTelemetry();