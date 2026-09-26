import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CUSTOM_TASK_IMAGE_MAX_BYTES,
  CUSTOM_TASK_IMAGE_PATH,
  inspectCustomTaskImage,
} from './custom-task-image';

function jpegStub() {
  return Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
}

function pngStub() {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
}

function webpStub() {
  return Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ]);
}

describe('custom task images', () => {
  it('accepts jpeg, png, and webp from file bytes, not the filename', () => {
    assert.equal(inspectCustomTaskImage(jpegStub())?.mimeType, 'image/jpeg');
    assert.equal(inspectCustomTaskImage(pngStub())?.mimeType, 'image/png');
    assert.equal(inspectCustomTaskImage(webpStub())?.mimeType, 'image/webp');
  });

  it('rejects empty, huge, or non-image bytes', () => {
    assert.equal(inspectCustomTaskImage(Buffer.from('not-an-image-file')), null);
    assert.equal(inspectCustomTaskImage(Buffer.alloc(8, 0xff)), null);
    assert.equal(
      inspectCustomTaskImage(Buffer.concat([jpegStub(), Buffer.alloc(CUSTOM_TASK_IMAGE_MAX_BYTES)])),
      null,
    );
  });

  it('keeps the photo behind an authenticated custom-image path', () => {
    assert.equal(
      CUSTOM_TASK_IMAGE_PATH('11111111-1111-1111-1111-111111111111'),
      '/api/writing/custom-image/11111111-1111-1111-1111-111111111111',
    );
  });
});
