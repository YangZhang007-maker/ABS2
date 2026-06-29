import { Injectable, ConflictException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcryptjs from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto/user.dto';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultUsers();
  }

  private async seedDefaultUsers() {
    const count = await this.userRepository.count({ where: { isDeleted: false } });
    if (count > 0) return;

    const defaultUsers = [
      { username: 'root', password: 'admin123', name: '部门总负责人', role: UserRole.ROOT },
      { username: 'root2', password: 'admin123', name: '存续期负责人', role: UserRole.ROOT2 },
      { username: 'owner1', password: 'admin123', name: '产品负责人A', role: UserRole.PRODUCT_OWNER },
      { username: 'sales1', password: 'admin123', name: '销售人员A', role: UserRole.SALES },
    ];

    for (const u of defaultUsers) {
      const hashed = await bcryptjs.hash(u.password, 10);
      const user = this.userRepository.create({ ...u, password: hashed });
      await this.userRepository.save(user);
    }
    console.log('✅ 已创建默认测试用户: root, owner1, sales1 (密码: admin123)');
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: { isDeleted: false },
      select: { id: true, username: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { role, isDeleted: false },
      select: { id: true, username: true, name: true, email: true, role: true },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!user) throw new NotFoundException(`用户 "${id}" 未找到`);
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username, isDeleted: false },
    });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByUsername(dto.username);
    if (existing) throw new ConflictException(`用户名 "${dto.username}" 已存在`);

    const hashed = await bcryptjs.hash(dto.password, 10);
    const user = this.userRepository.create({ ...dto, password: hashed, email: dto.email || null });
    return this.userRepository.save(user);
  }

  async createRaw(data: {
    username: string;
    password: string;
    name: string;
    email: string | null;
    role: UserRole;
  }): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email || null;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.password !== undefined) {
      user.password = await bcryptjs.hash(dto.password, 10);
    }
    return this.userRepository.save(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email || null;
    if (dto.password && dto.password.trim() !== '') {
      user.password = await bcryptjs.hash(dto.password, 10);
    }
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    user.isDeleted = true;
    await this.userRepository.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcryptjs.compare(password, user.password);
  }
}