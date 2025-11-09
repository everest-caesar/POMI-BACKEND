import type { Request, Response } from 'express'

const mockUploadImages = jest.fn()

jest.mock('../../services/storageService', () => ({
  __esModule: true,
  uploadImages: (...args: unknown[]) => mockUploadImages(...args),
}))

const buildResponse = () => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnThis()
  res.json = jest.fn().mockReturnThis()
  return res as Response & { status: jest.Mock; json: jest.Mock }
}

describe('marketplace image upload', () => {
  beforeEach(() => {
    jest.resetModules()
    mockUploadImages.mockReset()
  })

  it('allows an authenticated admin to upload listing images', async () => {
    mockUploadImages.mockResolvedValue(['https://example.com/pomi/listing-1.jpg'])

    const { uploadListingImages } = await import('../marketplace.controller')
    const req = {
      files: [
        {
          buffer: Buffer.from('image-bytes'),
          originalname: 'photo.jpg',
          mimetype: 'image/jpeg',
        },
      ],
      userId: 'admin-user-id',
    } as unknown as Request & { files: Express.Multer.File[]; userId: string }

    const res = buildResponse()

    await uploadListingImages(req, res)

    expect(mockUploadImages).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ originalname: 'photo.jpg' }),
      ]),
      'marketplace/listings',
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        images: ['https://example.com/pomi/listing-1.jpg'],
      }),
    )
  })
})
