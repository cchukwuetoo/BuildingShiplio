import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole } from './enums/user-role.enum';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            getProfile: jest.fn().mockResolvedValue({
              id: 'user-1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
              phone: '08012345678',
              role: UserRole.USER,
              createdAt: new Date(),
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should return current user profile', async () => {
    const req = { user: { userId: 'user-1' } };
    const result = await controller.getMe(req);

    expect(service.getProfile).toHaveBeenCalledWith('user-1');
    expect(result.email).toBe('john@example.com');
  });
});
