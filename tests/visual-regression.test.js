const path = require('path');
const puppeteer = require('puppeteer');
const httpServer = require('http-server');
const {toMatchImageSnapshot} = require('jest-image-snapshot');

const PORT = process.env.PORT || 8985;
const PAGE = `http://localhost:${PORT}/examples/catalog.html`;

expect.extend({toMatchImageSnapshot});

describe('puppeteer', () => {
  let browser;
  let server;
  beforeAll(async () => {
    server = httpServer.createServer({
      root: path.join(__dirname, '../'),
      showDir: false,
    });
    server.listen(PORT);
  });
  
  afterAll(async () => {
    await browser.close();
    server.close();
  });

  test('puppeteer', async () => {
    browser = await puppeteer.launch({
      args: [
        '--disable-gpu',
      ],
    });
    const page = await browser.newPage();
    await page.goto(PAGE, {
      waitUntil: 'networkidle2',
    });

    await page.waitFor(5);

    const image = await page.screenshot({
      fullPage: true,
    });
  
    expect(image).toMatchImageSnapshot({
      failureThreshold: 0.01,
      failureThresholdType: 'percent',
      customDiffDir: './tests/report-snapshot/',
      customSnapshotsDir: './tests/correct-snapshot/',
      updatePassedSnapshot: true,
    });
  });
});
