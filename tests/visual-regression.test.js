const path = require('path');
const puppeteer = require('puppeteer');
const httpServer = require('http-server');
const {toMatchImageSnapshot} = require('jest-image-snapshot');

const PORT = process.env.PORT || 8985;
const PAGE = `http://localhost:${PORT}/examples/catalog.html`;

expect.extend({toMatchImageSnapshot});

describe('puppeteer', () => {
  let server;
  beforeAll(async () => {
    server = httpServer.createServer({
      root: path.join(__dirname, '../'),
      showDir: false,
    });
    server.listen(PORT);
  });
  
  afterAll(async () => {
    server.close();
  });

  test('puppeteer', async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(PAGE, {
      waitUntil: 'networkidle2',
    });

    const image = await page.screenshot({
      // path: './snapshot/screenshot.png',
      fullPage: true,
    });
  
    expect(image).toMatchImageSnapshot({
      failureThreshold: 0.01,
      failureThresholdType: 'percent',
      customDiffDir: './snapshot/',
      customSnapshotsDir: './snapshot/',
      updatePassedSnapshot: true,
    });
  });
});
