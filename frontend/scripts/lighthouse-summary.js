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
  console.log(`🚀 Analyzing ${url} (${lhMode} mode)...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--remote-debugging-port=9222', '--no-sandbox'],
  });

  try {
    const flags = {
      logLevel: 'error',
      output: ['json', 'html'],
      port: 9222,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      extraHeaders: {
        Cookie: `access_token=${token}`,
      },
    };

    // LH_MODE에 따라 설정 적용. mobile인 경우 null을 전달하여 기본값(모바일) 사용
    const config = lhMode === 'mobile' ? undefined : desktopConfig;
    const runnerResult = await lighthouse(url, flags, config);

    const { lhr, report } = runnerResult;
    const categories = lhr.categories;

    console.log(`\n📊 Lighthouse Score Summary (${lhMode.toUpperCase()})`);
    console.log('============================');
    console.log(`Performance:    ${Math.round(categories.performance.score * 100)}`);
    console.log(`Accessibility:  ${Math.round(categories.accessibility.score * 100)}`);
    console.log(`Best Practices: ${Math.round(categories['best-practices'].score * 100)}`);
    console.log(`SEO:            ${Math.round(categories.seo.score * 100)}`);
    console.log('============================');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `lighthouse-report-${timestamp}.html`;
    const reportPath = path.resolve(process.cwd(), fileName);

    fs.writeFileSync(reportPath, report[1]);
    console.log(`\n📂 Full Report: file://${reportPath}`);
    console.log('----------------------------\n');
  } catch (error) {
    console.error('❌ Lighthouse Error:', error.message);
  } finally {
    await browser.close();
  }
}

run();
