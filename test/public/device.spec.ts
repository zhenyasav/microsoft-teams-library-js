import { device } from '../../src/public/device' 
import { FramelessPostUtils } from '../framelessPostUtils';
import { _initialize, _uninitialize } from '../../src/public/publicAPIs';
import { frameContexts } from '../../src/internal/constants';
import { DOMMessageEvent } from '../../src/internal/interfaces';

/**
 * Test cases for device APIs
 */
describe('device', () => {
  const utils = new FramelessPostUtils();
  
  beforeEach(() => {
    utils.messages = [];

    // Set a mock window for testing
    _initialize(utils.mockWindow);
  });

  afterEach(() => {
    // Reset the object since it's a singleton
    if (_uninitialize) {
      _uninitialize();
    }
  });

  let emptyCallback = () => {};

  it('should not allow device.getImages calls before initialization', () => {
    expect(() => device.getImages(emptyCallback)).toThrowError(
      'The library has not yet been initialized',
    );
  });
  it('should not allow device.getImages calls for task frame context', () => {
    utils.initializeWithContext(frameContexts.task);
    expect(() => device.getImages(emptyCallback)).toThrowError(
      "This call is not allowed in the 'task' context",
    );
  });
  it('should not allow device.getImages calls for authentication frame context', () => {
    utils.initializeWithContext(frameContexts.authentication);
    expect(() => device.getImages(emptyCallback)).toThrowError(
      "This call is not allowed in the 'authentication' context",
    );
  });
  it('should not allow device.getImages calls for remove frame context', () => {
    utils.initializeWithContext(frameContexts.remove);
    expect(() => device.getImages(emptyCallback)).toThrowError(
      "This call is not allowed in the 'remove' context",
    );
  });
  it('should not allow device.getImages calls for settings frame context', () => {
    utils.initializeWithContext(frameContexts.settings);
    expect(() => device.getImages(emptyCallback)).toThrowError(
      "This call is not allowed in the 'settings' context",
    );
  });
  it('should not allow device.getImages calls with null callback', () => {
    expect(() => device.getImages(null)).toThrowError(
      '[device.getImages] Callback cannot be null',
    );
  });
  it('should not allow device.getImages calls with null callback after init context', () => {
    utils.initializeWithContext(frameContexts.content);
    expect(() => device.getImages(null)).toThrowError(
      '[device.getImages] Callback cannot be null',
    );
  });
  it('device.getImages call in content frameContext works', () => {
    utils.initializeWithContext(frameContexts.content);
    device.getImages(emptyCallback);
    let message = utils.findMessageByFunc('device.getImages');
    expect(message).not.toBeNull();
    expect(message.args.length).toBe(0);
  });
  it('device.getImages calls with successful result', () => {
    utils.initializeWithContext(frameContexts.content);
    let files = null;
    device.getImages((f: device.File[]) => {
      console.log('device.getImages callback...' + (typeof f));
      files = f;
    });

    let message = utils.findMessageByFunc('device.getImages');
    expect(message).not.toBeNull();
    expect(message.args.length).toBe(0);

    let callbackId = message.id;
    let filesArray = [{
        statusCode: device.StatusCode.Success,
        content: 'base64encodedImage',
        format: device.FileFormat.Base64,
        mimeType: 'image/png',
        size: 300,
      } as device.File];
    utils.sendMessageFromNativeToParent({
      data: {
        id: callbackId,
        args: [filesArray]
      }
    } as DOMMessageEvent)

    expect(files.length).toBe(1);
    let file = files[0];
    expect(file).not.toBeNull();
    expect(file.statusCode).toBe(device.StatusCode.Success);
    expect(file.format).toBe(device.FileFormat.Base64);
    expect(file.mimeType).toBe('image/png');
    expect(file.content).not.toBeNull();
    expect(file.size).not.toBeNull();
    expect(typeof file.size === 'number').toBeTruthy();
  });
  it('device.getImages calls with error', () => {
    utils.initializeWithContext(frameContexts.content);
    let files = null;
    device.getImages((f: device.File[]) => {
      console.log('device.getImages callback...' + (typeof f));
      files = f;
    });

    let message = utils.findMessageByFunc('device.getImages');
    expect(message).not.toBeNull();
    expect(message.args.length).toBe(0);

    let callbackId = message.id;
    let filesArray = [{
        statusCode: device.StatusCode.PermissionError,
        content: null
      } as device.File];
    utils.sendMessageFromNativeToParent({
      data: {
        id: callbackId,
        args: [filesArray]
      }
    } as DOMMessageEvent)

    expect(files.length).toBe(1);
    let file = files[0];
    expect(file).not.toBeNull();
    expect(file.statusCode).toBe(device.StatusCode.PermissionError);
    expect(file.format).toBeFalsy();
    expect(file.content).toBeFalsy();
    expect(file.size).toBeFalsy();
    expect(file.mimeType).toBeFalsy();
  });
});