import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupUser } from './entities/group-user.entity';
import { User } from '../user/entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupUser)
    private readonly groupUserRepository: Repository<GroupUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async findAll(): Promise<Group[]> {
    return await this.groupRepository.find({
      where: { isDeleted: false },
      relations: ['groupUsers', 'groupUsers.user', 'company'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['groupUsers', 'groupUsers.user', 'company'],
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
    });
    const savedGroup = await this.groupRepository.save(group);

    // Create GroupUser records for each user
    if (userIds && userIds.length > 0) {
      const groupUsers = userIds.map((userId) =>
        this.groupUserRepository.create({
          groupId: savedGroup.id,
          userId,
          isActive: true,
          isDeleted: false,
        }),
      );
      await this.groupUserRepository.save(groupUsers);
    }

    return this.findOne(savedGroup.id);
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

    // If userIds are being updated, update GroupUser records
    if (userIds !== undefined) {
      // Remove existing GroupUser records
      await this.groupUserRepository.delete({ groupId: id });

      // Create new GroupUser records
      if (userIds.length > 0) {
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

        const groupUsers = userIds.map((userId) =>
          this.groupUserRepository.create({
            groupId: id,
            userId,
            isActive: true,
            isDeleted: false,
          }),
        );
        await this.groupUserRepository.save(groupUsers);
      }
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
      relations: ['groupUsers', 'groupUsers.user'],
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

    // Get existing GroupUser records to avoid duplicates
    const existingGroupUsers = await this.groupUserRepository.find({
      where: { groupId },
    });
    const existingUserIds = existingGroupUsers.map((gu) => gu.userId);

    // Create GroupUser records for new users only
    const newUserIds = userIds.filter((id) => !existingUserIds.includes(id));
    if (newUserIds.length > 0) {
      const groupUsers = newUserIds.map((userId) =>
        this.groupUserRepository.create({
          groupId,
          userId,
          isActive: true,
          isDeleted: false,
        }),
      );
      await this.groupUserRepository.save(groupUsers);
    }

    return this.findOne(groupId);
  }

  async removeUsersFromGroup(
    groupId: string,
    userIds: string[],
  ): Promise<Group> {
    // Remove GroupUser records
    await this.groupUserRepository.delete({
      groupId,
      userId: In(userIds),
    });

    return this.findOne(groupId);
  }
}
