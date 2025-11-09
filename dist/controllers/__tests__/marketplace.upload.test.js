const mockUploadImages = jest.fn();
jest.mock('../../services/storageService', () => ({
    __esModule: true,
    uploadImages: (...args) => mockUploadImages(...args),
}));
const buildResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    return res;
};
describe('marketplace image upload', () => {
    beforeEach(() => {
        jest.resetModules();
        mockUploadImages.mockReset();
    });
    it('allows an authenticated admin to upload listing images', async () => {
        mockUploadImages.mockResolvedValue(['https://example.com/pomi/listing-1.jpg']);
        const { uploadListingImages } = await import('../marketplace.controller');
        const req = {
            files: [
                {
                    buffer: Buffer.from('image-bytes'),
                    originalname: 'photo.jpg',
                    mimetype: 'image/jpeg',
                },
            ],
            userId: 'admin-user-id',
        };
        const res = buildResponse();
        await uploadListingImages(req, res);
        expect(mockUploadImages).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ originalname: 'photo.jpg' }),
        ]), 'marketplace/listings');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            images: ['https://example.com/pomi/listing-1.jpg'],
        }));
    });
});
export {};
//# sourceMappingURL=marketplace.upload.test.js.map