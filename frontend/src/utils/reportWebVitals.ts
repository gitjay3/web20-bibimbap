import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';

type ReportHandler = (metric: Metric) => void;

const reportWebVitals = (onReport?: ReportHandler) => {
  if (onReport) {
    onCLS(onReport);
    onFCP(onReport);
    onLCP(onReport);
    onTTFB(onReport);
    onINP(onReport);
  }
};

export const logWebVitals = () => {
  reportWebVitals((metric) => {
    // eslint-disable-next-line no-console
    console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}`);
  });
};

export default reportWebVitals;
