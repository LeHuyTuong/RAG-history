import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup sau mỗi test (jsdom không tự dọn dẹp)
afterEach(() => {
  cleanup();
});
