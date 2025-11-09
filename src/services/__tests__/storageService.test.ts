import type { initializeBucket as InitializeBucketFn, uploadImage as UploadImageFn } from '../storageService'

const headBucketPromiseMock = jest.fn()
const createBucketPromiseMock = jest.fn()
const putBucketPolicyPromiseMock = jest.fn()
const putObjectPromiseMock = jest.fn()
const deleteObjectPromiseMock = jest.fn()

const headBucketCallMock = jest.fn()
const createBucketCallMock = jest.fn()
const putObjectCallMock = jest.fn()

jest.mock('aws-sdk', () => {
  const S3 = jest.fn().mockImplementation(() => ({
    headBucket: jest.fn((params: unknown) => {
      headBucketCallMock(params)
      return { promise: () => headBucketPromiseMock() }
    }),
    createBucket: jest.fn((params: unknown) => {
      createBucketCallMock(params)
      return { promise: () => createBucketPromiseMock() }
    }),
    putBucketPolicy: jest.fn((params: unknown) => ({
      promise: () => putBucketPolicyPromiseMock(),
    })),
    putObject: jest.fn((params: unknown) => {
      putObjectCallMock(params)
      return { promise: () => putObjectPromiseMock() }
    }),
    deleteObject: jest.fn((params: unknown) => ({
      promise: () => deleteObjectPromiseMock(),
    })),
  }))

  const Endpoint = jest.fn().mockImplementation((endpoint: string) => ({ href: endpoint }))

  return {
    S3,
    Endpoint,
  }
})

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}))

describe('storageService', () => {
  let initializeBucket: typeof InitializeBucketFn
  let uploadImage: typeof UploadImageFn
  let AWSModule: any

  let consoleLogSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(async () => {
    jest.resetModules()

    headBucketPromiseMock.mockReset()
    createBucketPromiseMock.mockReset()
    putBucketPolicyPromiseMock.mockReset()
    putObjectPromiseMock.mockReset()
    deleteObjectPromiseMock.mockReset()

    headBucketCallMock.mockReset()
    createBucketCallMock.mockReset()
    putObjectCallMock.mockReset()

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    headBucketPromiseMock.mockResolvedValue(undefined)
    createBucketPromiseMock.mockResolvedValue(undefined)
    putBucketPolicyPromiseMock.mockResolvedValue(undefined)
    putObjectPromiseMock.mockResolvedValue(undefined)
    deleteObjectPromiseMock.mockResolvedValue(undefined)

    process.env.S3_ENDPOINT = 'http://localhost:9000'
    process.env.S3_PUBLIC_URL = 'http://localhost:9000'
    process.env.S3_ACCESS_KEY = 'test-access'
    process.env.S3_SECRET_KEY = 'test-secret'
    process.env.S3_BUCKET = 'test-bucket'
    process.env.AWS_REGION = 'us-east-1'

    ;({ initializeBucket, uploadImage } = await import('../storageService'))
    AWSModule = await import('aws-sdk')
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('creates the bucket when headBucket reports missing', async () => {
    headBucketPromiseMock.mockRejectedValueOnce({ code: 'NotFound' })
    createBucketPromiseMock.mockResolvedValueOnce(undefined)
    putBucketPolicyPromiseMock.mockResolvedValueOnce(undefined)

    await expect(initializeBucket()).resolves.toBeUndefined()

    expect(headBucketCallMock).toHaveBeenCalledTimes(1)
    expect(createBucketCallMock).toHaveBeenCalledWith({ Bucket: 'test-bucket' })
    expect(createBucketPromiseMock).toHaveBeenCalledTimes(1)
    expect(putBucketPolicyPromiseMock).toHaveBeenCalledTimes(1)
  })

  it('retries uploads after restoring a missing bucket', async () => {
    headBucketPromiseMock.mockRejectedValueOnce({ code: 'NotFound' })
    createBucketPromiseMock.mockResolvedValueOnce(undefined)
    putBucketPolicyPromiseMock.mockResolvedValueOnce(undefined)

    putObjectPromiseMock
      .mockRejectedValueOnce({ code: 'NoSuchBucket' })
      .mockResolvedValueOnce(undefined)

    const file = {
      buffer: Buffer.from('test-data'),
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
    }

    const result = await uploadImage(file, 'marketplace/listings')

    expect(result).toBe('http://localhost:9000/test-bucket/marketplace/listings/mock-uuid.jpg')

    const AWS = AWSModule as { S3: jest.Mock }
    const s3Instance = AWS.S3.mock.results[0].value

    expect(s3Instance.putObject).toHaveBeenCalledTimes(2)
    expect(headBucketCallMock).toHaveBeenCalled()
    expect(createBucketCallMock).toHaveBeenCalledWith({ Bucket: 'test-bucket' })
  })
})
