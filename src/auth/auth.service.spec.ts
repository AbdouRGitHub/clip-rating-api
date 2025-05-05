import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';

describe('AuthService', () => {
  let service: AuthService;
  let userMockRepository = {
    findOne: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userMockRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userMockRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should login with correct parameters', async () => {
      const authDto = { email: 'test@gmail.com', password: 'test' };
      const mockRequest = {
        session: { userId: null },
      } as any as Request;
      
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      userMockRepository.findOne = jest.fn().mockResolvedValue({
        id: 1,
        email: 'test@gmail.com',
        password: '$2b$10$abcdeHashedPasswordHere',
      });

      const result = await service.login(authDto, mockRequest);
      expect(result).toBe(undefined);
      expect(mockRequest.session.userId).toBe(1);
    });
  });
});
