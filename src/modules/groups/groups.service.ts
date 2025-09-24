import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Group } from './entities/group.entity';
import { User } from '../user/entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async findAll(): Promise<Group[]> {
    return await this.groupRepository.find({
      where: { isDeleted: false },
      relations: ['users', 'company'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['users', 'company'],
    });
    if (!group) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }
    return group;
  }

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    const { userIds, companyId, ...groupData } = createGroupDto;

    // Verify company exists
    const company = await this.companyRepository.findOne({
      where: { id: companyId, isDeleted: false },
    });
    if (!company) {
      throw new NotFoundException(`Company with id ${companyId} not found`);
    }

    // Verify users exist and belong to the same company
    let users: User[] = [];
    if (userIds && userIds.length > 0) {
      users = await this.userRepository.find({
        where: { id: In(userIds), isDeleted: false },
        relations: ['company'],
      });

      if (users.length !== userIds.length) {
        throw new BadRequestException('One or more users not found');
      }

      // Check if all users belong to the same company
      const invalidUsers = users.filter(
        (user) => user.company.id !== companyId,
      );
      if (invalidUsers.length > 0) {
        throw new BadRequestException(
          'All users must belong to the same company as the group',
        );
      }
    }

    const group = await this.groupRepository.create({
      ...groupData,
      company,
      users,
    });
    const result = await this.groupRepository.save(group);

    return result;
  }

  async update(id: string, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id);
    const { userIds, companyId, ...groupData } = updateGroupDto;

    // If companyId is being updated, verify the new company exists
    if (companyId && companyId !== group.company.id) {
      const company = await this.companyRepository.findOne({
        where: { id: companyId, isDeleted: false },
      });
      if (!company) {
        throw new NotFoundException(`Company with id ${companyId} not found`);
      }
      group.company = company;
    }

    // If userIds are being updated, verify users exist and belong to the company
    if (userIds !== undefined) {
      let users: User[] = [];
      if (userIds.length > 0) {
        users = await this.userRepository.find({
          where: { id: In(userIds), isDeleted: false },
          relations: ['company'],
        });

        if (users.length !== userIds.length) {
          throw new BadRequestException('One or more users not found');
        }

        // Check if all users belong to the group's company
        const invalidUsers = users.filter(
          (user) => user.company.id !== group.company.id,
        );
        if (invalidUsers.length > 0) {
          throw new BadRequestException(
            'All users must belong to the same company as the group',
          );
        }
      }
      group.users = users;
    }

    Object.assign(group, groupData);
    return this.groupRepository.save(group);
  }

  async softDelete(id: string): Promise<void> {
    const group = await this.findOne(id);

    await this.groupRepository.update(id, {
      isDeleted: true,
    });
  }

  async getDropdownList(): Promise<{ id: string; name: string }[]> {
    return await this.groupRepository.find({
      where: { isDeleted: false },
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });
  }

  async getGroupsByCompany(companyId: string): Promise<Group[]> {
    return await this.groupRepository.find({
      where: { company: { id: companyId }, isDeleted: false },
      relations: ['users'],
      order: { createdAt: 'DESC' },
    });
  }

  async addUsersToGroup(groupId: string, userIds: string[]): Promise<Group> {
    const group = await this.findOne(groupId);

    const users = await this.userRepository.find({
      where: { id: In(userIds), isDeleted: false },
      relations: ['company'],
    });

    if (users.length !== userIds.length) {
      throw new BadRequestException('One or more users not found');
    }

    // Check if all users belong to the group's company
    const invalidUsers = users.filter(
      (user) => user.company.id !== group.company.id,
    );
    if (invalidUsers.length > 0) {
      throw new BadRequestException(
        'All users must belong to the same company as the group',
      );
    }

    // Add new users to existing users (avoid duplicates)
    const existingUserIds = group.users.map((user) => user.id);
    const newUsers = users.filter((user) => !existingUserIds.includes(user.id));
    group.users = [...group.users, ...newUsers];

    return this.groupRepository.save(group);
  }

  async removeUsersFromGroup(
    groupId: string,
    userIds: string[],
  ): Promise<Group> {
    const group = await this.findOne(groupId);

    group.users = group.users.filter((user) => !userIds.includes(user.id));

    return this.groupRepository.save(group);
  }
}
