const mockFindOne = jest.fn()
const mockCreate = jest.fn()

jest.mock('../../models/User', () => ({
  __esModule: true,
  default: {
    findOne: mockFindOne,
    create: mockCreate,
  },
}))

describe('ensureAdminAccount', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    jest.resetModules()
    mockFindOne.mockReset()
    mockCreate.mockReset()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('creates the admin user when none exists', async () => {
    mockFindOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    })

    const createdUser = {
      _id: 'admin-id',
      email: 'admin@pomi.community',
      username: 'Pomi Admin',
      isAdmin: true,
      comparePassword: jest.fn(),
    }
    mockCreate.mockResolvedValue(createdUser)

    const { ensureAdminAccount } = await import('../adminAccount')

    const result = await ensureAdminAccount({
      email: 'admin@pomi.community',
      password: 'secret123',
      name: 'Pomi Admin',
      area: 'Downtown Ottawa',
      workOrSchool: 'Operations',
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@pomi.community',
        password: 'secret123',
        username: 'Pomi Admin',
        isAdmin: true,
      }),
    )
    expect(result).toBe(createdUser)
  })

  it('updates an existing admin profile when fields are missing', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined)
    const compareMock = jest.fn().mockResolvedValue(false)
    const selectMock = jest.fn().mockResolvedValue({
      _id: 'admin-id',
      email: 'admin@pomi.community',
      username: '',
      area: '',
      workOrSchool: '',
      isAdmin: false,
      comparePassword: compareMock,
      save: saveMock,
    })

    mockFindOne.mockReturnValue({ select: selectMock })
    const { ensureAdminAccount } = await import('../adminAccount')

    const result = await ensureAdminAccount({
      email: 'admin@pomi.community',
      password: 'secret123',
      name: 'Pomi Admin',
      area: 'Outside Ottawa',
      workOrSchool: 'Ops',
    })

    expect(compareMock).toHaveBeenCalledWith('secret123')
    expect(saveMock).toHaveBeenCalled()
    expect(result.isAdmin).toBe(true)
    expect(result.area).toBe('Outside Ottawa')
    expect(result.workOrSchool).toBe('Ops')
  })
})

