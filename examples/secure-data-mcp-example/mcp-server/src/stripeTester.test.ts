import { StripeTester, addStealth, createProxy, solveRecaptcha } from './stripeTester';
import puppeteer from 'puppeteer';

describe('stripeTester helpers', () => {
  it('addStealth sets viewport and user agent', async () => {
    const page = { setViewport: jest.fn(), setUserAgent: jest.fn() } as any;
    await addStealth(page);
    expect(page.setViewport).toHaveBeenCalled();
    expect(page.setUserAgent).toHaveBeenCalled();
  });

  it('createProxy enables request interception', async () => {
    const page = { setRequestInterception: jest.fn(), on: jest.fn() } as any;
    await createProxy(page);
    expect(page.setRequestInterception).toHaveBeenCalledWith(true);
    expect(page.on).toHaveBeenCalledWith('request', expect.any(Function));
  });

  it('solveRecaptcha returns true', async () => {
    expect(await solveRecaptcha({} as any)).toBe(true);
  });
});

describe('StripeTester', () => {
  let tester: StripeTester;
  beforeEach(() => {
    tester = new StripeTester();
  });

  it('constructor initializes fields', () => {
    expect(tester.browser).toBeNull();
    expect(tester.page).toBeNull();
    expect(tester.paymentDetails).toBeNull();
  });

  it('initialize sets paymentDetails and launches browser', async () => {
    const launchMock = jest.spyOn(puppeteer, 'launch').mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        setViewport: jest.fn(),
        setUserAgent: jest.fn(),
        setRequestInterception: jest.fn(),
        on: jest.fn(),
        authenticate: jest.fn(),
      }),
      close: jest.fn(),
    } as any);
    const details = { pan: '4111111111111111', expiration: '12/34', name: 'Test', postalCode: '12345', cvc: '123' };
    await tester.initialize(details);
    expect(tester.paymentDetails).toEqual(details);
    expect(launchMock).toHaveBeenCalled();
    launchMock.mockRestore();
  });

  it('cleanup closes browser if present', async () => {
    const close = jest.fn();
    tester.browser = { close } as any;
    await tester.cleanup();
    expect(close).toHaveBeenCalled();
  });

  it('navigateToPaymentPage throws if page not initialized', async () => {
    await expect(tester.navigateToPaymentPage()).rejects.toThrow('Page not initialized');
  });

  it('fillPaymentDetails throws if not initialized', async () => {
    await expect(tester.fillPaymentDetails()).rejects.toThrow('Page or payment details not initialized');
  });

  it('handleSubmission throws if page not initialized', async () => {
    await expect(tester.handleSubmission()).rejects.toThrow('Page not initialized');
  });

  it('inspectDOMForErrors throws if page not initialized', async () => {
    await expect(tester.inspectDOMForErrors()).rejects.toThrow('Page not initialized');
  });
}); 