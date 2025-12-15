// Mock worker_threads - use a variable to store the handler
let capturedMessageHandler: ((buffer: Buffer) => void) | undefined;

const mockOn = jest.fn((event: string, handler: any) => {
  if (event === 'message') {
    capturedMessageHandler = handler;
  }
});

const mockPostMessage = jest.fn();
const mockParentPort = {
  on: mockOn,
  postMessage: mockPostMessage
};

jest.mock('worker_threads', () => ({
  parentPort: mockParentPort
}));

// Mock the mp3-parser service
const mockGetMp3FrameCount = jest.fn();
jest.mock('../../../services/mp3-parser', () => ({
  getMp3FrameCount: mockGetMp3FrameCount
}));

// Import worker module - this will register the message handler
require('../../../workers/mp3-parser.worker');

describe('MP3 Parser Worker', () => {
  let messageHandler: ((buffer: Buffer) => void) | undefined;

  beforeEach(() => {
    // Use the captured handler (should be set when module loaded)
    messageHandler = capturedMessageHandler;
    
    // Clear mocks (but keep the handler reference)
    // Note: We don't clear mockOn calls here because we need to verify registration
    // in some tests. Individual tests can clear if needed.
    mockPostMessage.mockClear();
    mockGetMp3FrameCount.mockClear();
    
    // Ensure mock implementation is set up to capture handler
    if (!mockOn.mock.results.length || !capturedMessageHandler) {
      mockOn.mockImplementation((event: string, handler: any) => {
        if (event === 'message') {
          capturedMessageHandler = handler;
          messageHandler = handler;
        }
      });
    }
  });

  describe('Worker Message Handling', () => {
    it('should register message handler on parentPort', () => {
      // The handler should have been registered when the module was loaded
      // Check that mockOn was called with 'message' event
      const messageCalls = mockOn.mock.calls.filter(call => call[0] === 'message');
      expect(messageCalls.length).toBeGreaterThan(0);
      expect(messageCalls[0][0]).toBe('message');
      expect(typeof messageCalls[0][1]).toBe('function');
      expect(messageHandler).toBeDefined();
    });

    it('should handle messages when parentPort exists', () => {
      // Verify handler was registered and is available
      expect(messageHandler).toBeDefined();
      expect(typeof messageHandler).toBe('function');
      // Verify mockOn was called (registration happened when module loaded)
      expect(mockOn.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Successful Parsing', () => {
    it('should post success message with frame count on successful parse', () => {
      const mockBuffer = Buffer.from('test mp3 data');
      const expectedFrameCount = 42;

      mockGetMp3FrameCount.mockReturnValue(expectedFrameCount);

      if (messageHandler) {
        messageHandler(mockBuffer);
      }

      expect(mockGetMp3FrameCount).toHaveBeenCalledWith(mockBuffer);
      expect(mockPostMessage).toHaveBeenCalledWith({
        success: true,
        frameCount: expectedFrameCount
      });
    });

    it('should handle different frame counts', () => {
      const testCases = [0, 1, 100, 1000, 10000];

      testCases.forEach(frameCount => {
        jest.clearAllMocks();
        const mockBuffer = Buffer.from('test');

        mockGetMp3FrameCount.mockReturnValue(frameCount);

        if (messageHandler) {
          messageHandler(mockBuffer);
        }

        expect(mockPostMessage).toHaveBeenCalledWith({
          success: true,
          frameCount
        });
      });
    });

    it('should pass buffer correctly to parser', () => {
      const mockBuffer = Buffer.from('specific mp3 data');

      mockGetMp3FrameCount.mockReturnValue(10);

      if (messageHandler) {
        messageHandler(mockBuffer);
      }

      expect(mockGetMp3FrameCount).toHaveBeenCalledWith(mockBuffer);
      expect(mockGetMp3FrameCount).toHaveBeenCalledTimes(1);
      expect(mockPostMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling in Worker', () => {
    it('should post error message when parsing throws Error', () => {
      const mockBuffer = Buffer.from('test');
      const errorMessage = 'Invalid MP3 file';
      const error = new Error(errorMessage);

      mockGetMp3FrameCount.mockImplementation(() => {
        throw error;
      });

      if (messageHandler) {
        messageHandler(mockBuffer);
      }

      expect(mockPostMessage).toHaveBeenCalledWith({
        success: false,
        error: errorMessage
      });
    });

    it('should handle non-Error exceptions', () => {
      const mockBuffer = Buffer.from('test');
      const errorMessage = 'String error';

      mockGetMp3FrameCount.mockImplementation(() => {
        throw errorMessage;
      });

      if (messageHandler) {
        messageHandler(mockBuffer);
      }

      expect(mockPostMessage).toHaveBeenCalledWith({
        success: false,
        error: errorMessage
      });
    });

    it('should handle null/undefined errors', () => {
      const mockBuffer = Buffer.from('test');

      mockGetMp3FrameCount.mockImplementation(() => {
        throw null;
      });

      if (messageHandler) {
        messageHandler(mockBuffer);
      }

      expect(mockPostMessage).toHaveBeenCalledWith({
        success: false,
        error: 'null'
      });
    });

    it('should handle errors with no message', () => {
      const mockBuffer = Buffer.from('test');
      const error = new Error();

      mockGetMp3FrameCount.mockImplementation(() => {
        throw error;
      });

      if (messageHandler) {
        messageHandler(mockBuffer);
      }

      expect(mockPostMessage).toHaveBeenCalledWith({
        success: false,
        error: ''
      });
    });

    it('should not crash worker on error', () => {
      const mockBuffer = Buffer.from('test');

      mockGetMp3FrameCount.mockImplementation(() => {
        throw new Error('Test error');
      });

      expect(() => {
        if (messageHandler) {
          messageHandler(mockBuffer);
        }
      }).not.toThrow();
    });
  });

  describe('Invalid Buffer Handling', () => {
    it('should handle empty buffer', () => {
      const emptyBuffer = Buffer.alloc(0);

      mockGetMp3FrameCount.mockReturnValue(0);

      if (messageHandler) {
        messageHandler(emptyBuffer);
      }

      expect(mockGetMp3FrameCount).toHaveBeenCalledWith(emptyBuffer);
      expect(mockPostMessage).toHaveBeenCalledWith({
        success: true,
        frameCount: 0
      });
    });

    it('should handle very small buffer', () => {
      const smallBuffer = Buffer.alloc(4);

      mockGetMp3FrameCount.mockReturnValue(0);

      if (messageHandler) {
        messageHandler(smallBuffer);
      }

      expect(mockGetMp3FrameCount).toHaveBeenCalledWith(smallBuffer);
    });

    it('should handle large buffer', () => {
      const largeBuffer = Buffer.alloc(1024 * 1024); // 1MB

      mockGetMp3FrameCount.mockReturnValue(1000);

      if (messageHandler) {
        messageHandler(largeBuffer);
      }

      expect(mockGetMp3FrameCount).toHaveBeenCalledWith(largeBuffer);
      expect(mockPostMessage).toHaveBeenCalledWith({
        success: true,
        frameCount: 1000
      });
    });

    it('should handle corrupted buffer that causes parser to return 0', () => {
      const corruptedBuffer = Buffer.from('not an mp3 file');

      mockGetMp3FrameCount.mockReturnValue(0);

      if (messageHandler) {
        messageHandler(corruptedBuffer);
      }

      expect(mockGetMp3FrameCount).toHaveBeenCalledWith(corruptedBuffer);
      expect(mockPostMessage).toHaveBeenCalledWith({
        success: true,
        frameCount: 0
      });
    });

    it('should handle buffer that causes parser to throw RangeError', () => {
      const invalidBuffer = Buffer.from('invalid');

      mockGetMp3FrameCount.mockImplementation(() => {
        throw new RangeError('Buffer access error');
      });

      if (messageHandler) {
        messageHandler(invalidBuffer);
      }

      expect(mockPostMessage).toHaveBeenCalledWith({
        success: false,
        error: 'Buffer access error'
      });
    });
  });

  describe('Message Format', () => {
    it('should always send success: true with frameCount on success', () => {
      const mockBuffer = Buffer.from('test');
      const frameCount = 5;

      mockGetMp3FrameCount.mockReturnValue(frameCount);

      if (messageHandler) {
        messageHandler(mockBuffer);
      }

      const callArgs = mockPostMessage.mock.calls[0][0];
      expect(callArgs).toEqual({
        success: true,
        frameCount
      });
      expect(callArgs.success).toBe(true);
      expect(callArgs.frameCount).toBe(frameCount);
    });

    it('should always send success: false with error on failure', () => {
      const mockBuffer = Buffer.from('test');
      const errorMessage = 'Parse error';

      mockGetMp3FrameCount.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      if (messageHandler) {
        messageHandler(mockBuffer);
      }

      const callArgs = mockPostMessage.mock.calls[0][0];
      expect(callArgs).toEqual({
        success: false,
        error: errorMessage
      });
      expect(callArgs.success).toBe(false);
      expect(callArgs.error).toBe(errorMessage);
    });
  });

  describe('Concurrent Message Handling', () => {
    it('should handle multiple messages sequentially', () => {
      const buffers = [
        Buffer.from('test1'),
        Buffer.from('test2'),
        Buffer.from('test3')
      ];

      let callCount = 0;
      mockGetMp3FrameCount.mockImplementation(() => {
        return callCount++;
      });

      buffers.forEach(buffer => {
        if (messageHandler) {
          messageHandler(buffer);
        }
      });

      expect(mockGetMp3FrameCount).toHaveBeenCalledTimes(3);
      expect(mockPostMessage).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid successive messages', () => {
      const buffers = Array.from({ length: 10 }, (_, i) => Buffer.from(`test${i}`));

      mockGetMp3FrameCount.mockReturnValue(42);

      buffers.forEach(buffer => {
        if (messageHandler) {
          messageHandler(buffer);
        }
      });

      expect(mockGetMp3FrameCount).toHaveBeenCalledTimes(10);
      expect(mockPostMessage).toHaveBeenCalledTimes(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle buffer with only ID3 tags', () => {
      const id3OnlyBuffer = Buffer.from('ID3');

      mockGetMp3FrameCount.mockReturnValue(0);

      if (messageHandler) {
        messageHandler(id3OnlyBuffer);
      }

      expect(mockGetMp3FrameCount).toHaveBeenCalledWith(id3OnlyBuffer);
      expect(mockPostMessage).toHaveBeenCalledWith({
        success: true,
        frameCount: 0
      });
    });

    it('should handle buffer that returns maximum frame count', () => {
      const mockBuffer = Buffer.from('test');
      const maxFrames = Number.MAX_SAFE_INTEGER;

      mockGetMp3FrameCount.mockReturnValue(maxFrames);

      if (messageHandler) {
        messageHandler(mockBuffer);
      }

      expect(mockPostMessage).toHaveBeenCalledWith({
        success: true,
        frameCount: maxFrames
      });
    });

    it('should handle TypeError from parser', () => {
      const mockBuffer = Buffer.from('test');

      mockGetMp3FrameCount.mockImplementation(() => {
        throw new TypeError('Type error');
      });

      if (messageHandler) {
        messageHandler(mockBuffer);
      }

      expect(mockPostMessage).toHaveBeenCalledWith({
        success: false,
        error: 'Type error'
      });
    });
  });
});

