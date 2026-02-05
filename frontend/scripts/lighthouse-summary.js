/* eslint-disable */
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

import desktopConfig from 'lighthouse/core/config/desktop-config.js';

const url = process.env.LH_URL;
const token = process.env.LH_TOKEN;
const lhMode = process.env.LH_MODE || 'desktop'; // 기본값 desktop

async function run() {
  const NUM_RUNS = 5;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  console.log(`🚀 Analyzing ${url} (${lhMode} mode)...`);
  console.log(`📈 Running ${NUM_RUNS} times to calculate averages...\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--remote-debugging-port=9222', '--no-sandbox'],
  });

  const allScores = {
    performance: [],
    accessibility: [],
    'best-practices': [],
    seo: [],
  };

  const allMetrics = {
    'largest-contentful-paint': [],
    'total-blocking-time': [],
    'cumulative-layout-shift': [],
    'first-contentful-paint': [],
  };

  let lastReport = null;

  try {
    for (let i = 1; i <= NUM_RUNS; i++) {
      process.stdout.write(`  Run ${i}/${NUM_RUNS}... `);
      const flags = {
        logLevel: 'error',
        output: ['json', 'html'],
        port: 9222,
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        extraHeaders: {
          Cookie: `access_token=${token}`,
        },
      };

      const config = lhMode === 'mobile' ? undefined : desktopConfig;
      const runnerResult = await lighthouse(url, flags, config);
      const { lhr, report } = runnerResult;

      // Collect Categories
      Object.keys(allScores).forEach((cat) => {
        allScores[cat].push(lhr.categories[cat].score * 100);
      });

      // Collect Metrics
      Object.keys(allMetrics).forEach((metric) => {
        const audit = lhr.audits[metric];
        if (audit) {
          allMetrics[metric].push(audit.numericValue);
        }
      });

      const reportPath = path.resolve(process.cwd(), `lighthouse-report-run${i}-${timestamp}.html`);
      fs.writeFileSync(reportPath, report[1]);

      console.log(`Done (Report: run${i})`);
    }

    const average = (arr) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    const averagePrecise = (arr) => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
    const msToS = (arr) => (arr.reduce((a, b) => a + b, 0) / arr.length / 1000).toFixed(2);

    console.log(`\n📊 Lighthouse Average Summary (${lhMode.toUpperCase()})`);
    console.log('============================');
    console.log(`Performance:    ${average(allScores.performance)}`);
    console.log(`Accessibility:  ${average(allScores.accessibility)}`);
    console.log(`Best Practices: ${average(allScores['best-practices'])}`);
    console.log(`SEO:            ${average(allScores.seo)}`);
    console.log('----------------------------');
    console.log(`LCP: ${msToS(allMetrics['largest-contentful-paint'])} s`);
    console.log(`TBT: ${averagePrecise(allMetrics['total-blocking-time'])} ms`);
    console.log(`CLS: ${averagePrecise(allMetrics['cumulative-layout-shift'])}`);
    console.log(`FCP: ${msToS(allMetrics['first-contentful-paint'])} s`);
    console.log('============================');

    console.log(`\n📂 All 5 reports have been saved in the current directory.`);
    console.log('----------------------------\n');
  } catch (error) {
    console.error('❌ Lighthouse Error:', error.message);
  } finally {
    await browser.close();
  }
}

run();
