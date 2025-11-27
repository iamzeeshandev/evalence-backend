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
import { GroupResponseDto, GroupUserDto, CompanyDto } from './dto/group-response.dto';

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

  async findAll(): Promise<GroupResponseDto[]> {
    const groups = await this.groupRepository.find({
      where: { isDeleted: false },
      relations: ['groupUsers', 'groupUsers.user', 'company'],
      order: {
        createdAt: 'DESC',
      },
    });
    
    // Transform to GroupResponseDto
    return groups.map(group => this.transformToGroupResponseDto(group));
  }

  async findOne(id: string): Promise<GroupResponseDto> {
    const group = await this.groupRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['groupUsers', 'groupUsers.user', 'company'],
    });
    if (!group) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }
    
    return this.transformToGroupResponseDto(group);
  }

  async create(createGroupDto: CreateGroupDto): Promise<GroupResponseDto> {
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
        (user) => user.company && user.company.id !== companyId,
      );
      if (invalidUsers.length > 0) {
        throw new BadRequestException(
          'All users must belong to the same company as the group',
        );
      }
    }

    const group = this.groupRepository.create({
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

    // Load the complete group with relations for response
    const completeGroup = await this.groupRepository.findOne({
      where: { id: savedGroup.id, isDeleted: false },
      relations: ['groupUsers', 'groupUsers.user', 'company'],
    });

    return this.transformToGroupResponseDto(completeGroup!);
  }

  async update(id: string, updateGroupDto: UpdateGroupDto): Promise<GroupResponseDto> {
    // Load the existing group with relations for update
    const existingGroup = await this.groupRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['groupUsers', 'groupUsers.user', 'company'],
    });
    
    if (!existingGroup) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }

    const { userIds, companyId, ...groupData } = updateGroupDto;

    // If companyId is being updated, verify the new company exists
    if (companyId && existingGroup.company && companyId !== existingGroup.company.id) {
      const company = await this.companyRepository.findOne({
        where: { id: companyId, isDeleted: false },
      });
      if (!company) {
        throw new NotFoundException(`Company with id ${companyId} not found`);
      }
      existingGroup.company = company;
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
          (user) => existingGroup.company && user.company && user.company.id !== existingGroup.company.id,
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

    Object.assign(existingGroup, groupData);
    await this.groupRepository.save(existingGroup);
    
    // Load the updated group with relations for response
    const updatedGroup = await this.groupRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['groupUsers', 'groupUsers.user', 'company'],
    });

    return this.transformToGroupResponseDto(updatedGroup!);
  }

  async softDelete(id: string): Promise<void> {
    const group = await this.groupRepository.findOne({
      where: { id, isDeleted: false },
    });
    
    if (!group) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }

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

  async getGroupsByCompany(companyId: string): Promise<GroupResponseDto[]> {
    const groups = await this.groupRepository.find({
      where: { company: { id: companyId }, isDeleted: false },
      relations: ['groupUsers', 'groupUsers.user'],
      order: { createdAt: 'DESC' },
    });
    
    return groups.map(group => this.transformToGroupResponseDto(group));
  }

  async addUsersToGroup(groupId: string, userIds: string[]): Promise<GroupResponseDto> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId, isDeleted: false },
      relations: ['company'],
    });
    
    if (!group) {
      throw new NotFoundException(`Group with id ${groupId} not found`);
    }

    const users = await this.userRepository.find({
      where: { id: In(userIds), isDeleted: false },
      relations: ['company'],
    });

    if (users.length !== userIds.length) {
      throw new BadRequestException('One or more users not found');
    }

    // Check if all users belong to the group's company
    const invalidUsers = users.filter(
      (user) => group.company && user.company && user.company.id !== group.company.id,
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

    // Load the updated group with relations for response
    const updatedGroup = await this.groupRepository.findOne({
      where: { id: groupId, isDeleted: false },
      relations: ['groupUsers', 'groupUsers.user', 'company'],
    });

    return this.transformToGroupResponseDto(updatedGroup!);
  }

  async removeUsersFromGroup(
    groupId: string,
    userIds: string[],
  ): Promise<GroupResponseDto> {
    // Remove GroupUser records
    await this.groupUserRepository.delete({
      groupId,
      userId: In(userIds),
    });

    // Load the updated group with relations for response
    const updatedGroup = await this.groupRepository.findOne({
      where: { id: groupId, isDeleted: false },
      relations: ['groupUsers', 'groupUsers.user', 'company'],
    });

    return this.transformToGroupResponseDto(updatedGroup!);
  }

  private transformToGroupResponseDto(group: Group): GroupResponseDto {
    const users: GroupUserDto[] = group.groupUsers?.map(gu => ({
      id: gu.user.id,
      firstName: gu.user.firstName,
      lastName: gu.user.lastName,
      email: gu.user.email,
      role: gu.user.role,
      phone: gu.user.phone,
      isActive: gu.user.isActive,
      isDeleted: gu.user.isDeleted,
      createdAt: gu.user.createdAt,
      updatedAt: gu.user.updatedAt,
      lastLoginAt: gu.user.lastLoginAt,
    })) || [];

    let companyDto: CompanyDto | undefined;
    if (group.company) {
      companyDto = {
        id: group.company.id,
        name: group.company.name,
        description: group.company.description,
        email: group.company.email,
        phone: group.company.phone,
        address: group.company.address,
        city: group.company.city,
        state: group.company.state,
        country: group.company.country,
        postalCode: group.company.postalCode,
        website: group.company.website,
        industry: group.company.industry,
        size: group.company.size,
        status: group.company.status,
        isDeleted: group.company.isDeleted,
        createdAt: group.company.createdAt,
        updatedAt: group.company.updatedAt,
      };
    }

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      isActive: group.isActive,
      isDeleted: group.isDeleted,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      users,
      company: companyDto,
    };
  }
}
