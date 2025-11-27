import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BatteryGroupAssignment } from './entities/battery-group-assignment.entity';
import { Battery } from '../battery/entities/battery.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../user/entities/user.entity';
import { Test } from '../test/entities/test.entity';
import { AssignmentStatus } from './entities/battery-group-assignment.entity';
import {
  CreateBatteryAssignmentDto,
  UpdateBatteryAssignmentDto,
  AssignBatteryToGroupDto,
  AssignBatteryToMultipleGroupsDto,
  GroupAssignmentDto,
} from './dto/battery-assignment.dto';

@Injectable()
export class BatteryAssignmentService {
  constructor(
    @InjectRepository(BatteryGroupAssignment)
    private readonly assignmentRepository: Repository<BatteryGroupAssignment>,
    @InjectRepository(Battery)
    private readonly batteryRepository: Repository<Battery>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
  ) {}

  async findAll(): Promise<BatteryGroupAssignment[]> {
    return await this.assignmentRepository.find({
      relations: ['battery', 'group', 'assignedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<BatteryGroupAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['battery', 'group', 'assignedBy'],
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment with id ${id} not found`);
    }
    return assignment;
  }

  async create(
    createDto: CreateBatteryAssignmentDto,
    assignedById: string,
  ): Promise<BatteryGroupAssignment> {
    // Verify battery exists
    const battery = await this.batteryRepository.findOne({
      where: { id: createDto.batteryId },
    });
    if (!battery) {
      throw new NotFoundException(
        `Battery with id ${createDto.batteryId} not found`,
      );
    }

    // Verify group exists
    const group = await this.groupRepository.findOne({
      where: { id: createDto.groupId },
      relations: ['company'],
    });
    if (!group) {
      throw new NotFoundException(
        `Group with id ${createDto.groupId} not found`,
      );
    }

    // Check if assignment already exists
    const existingAssignment = await this.assignmentRepository.findOne({
      where: {
        batteryId: createDto.batteryId,
        groupId: createDto.groupId,
        status: AssignmentStatus.ACTIVE,
      },
    });

    if (existingAssignment) {
      throw new ConflictException('Battery is already assigned to this group');
    }

    // Verify assignedBy user exists
    const assignedBy = await this.userRepository.findOne({
      where: { id: assignedById },
    });
    if (!assignedBy) {
      throw new NotFoundException(`User with id ${assignedById} not found`);
    }

    const assignment = this.assignmentRepository.create({
      ...createDto,
      battery,
      group,
      assignedBy,
      assignedAt: new Date(),
    });

    return this.assignmentRepository.save(assignment);
  }

  async update(
    id: string,
    updateDto: UpdateBatteryAssignmentDto,
  ): Promise<BatteryGroupAssignment> {
    const assignment = await this.findOne(id);

    Object.assign(assignment, updateDto);
    return this.assignmentRepository.save(assignment);
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.findOne(id);
    await this.assignmentRepository.remove(assignment);
  }

  async assignBatteryToGroup(
    assignDto: AssignBatteryToGroupDto,
    assignedById: string,
  ): Promise<BatteryGroupAssignment> {
    return this.create(
      {
        batteryId: assignDto.batteryId,
        groupId: assignDto.groupId,
        status: AssignmentStatus.ACTIVE,
        expiresAt: assignDto.expiresAt,
        notes: assignDto.notes,
      },
      assignedById,
    );
  }

  async assignBatteryToMultipleGroups(
    assignDto: AssignBatteryToMultipleGroupsDto,
    assignedById: string,
  ): Promise<BatteryGroupAssignment[]> {
    // Verify battery exists
    const battery = await this.batteryRepository.findOne({
      where: { id: assignDto.batteryId },
    });
    if (!battery) {
      throw new NotFoundException(
        `Battery with id ${assignDto.batteryId} not found`,
      );
    }

    // Verify assignedBy user exists
    const assignedBy = await this.userRepository.findOne({
      where: { id: assignedById },
    });
    if (!assignedBy) {
      throw new NotFoundException(`User with id ${assignedById} not found`);
    }

    // Validate all groups exist
    const groupIds = assignDto.groups.map((g) => g.groupId);
    const groups = await this.groupRepository.find({
      where: { id: In(groupIds) },
      relations: ['company'],
    });

    if (groups.length !== groupIds.length) {
      const foundGroupIds = groups.map((g) => g.id);
      const missingGroupIds = groupIds.filter(
        (id) => !foundGroupIds.includes(id),
      );
      throw new NotFoundException(
        `Groups not found: ${missingGroupIds.join(', ')}`,
      );
    }

    // Check for existing assignments
    const existingAssignments = await this.assignmentRepository.find({
      where: {
        batteryId: assignDto.batteryId,
        groupId: In(groupIds),
        status: AssignmentStatus.ACTIVE,
      },
    });

    if (existingAssignments.length > 0) {
      const existingGroupIds = existingAssignments.map((a) => a.groupId);
      throw new ConflictException(
        `Battery is already assigned to groups: ${existingGroupIds.join(', ')}`,
      );
    }

    // Create assignments for all groups
    const assignments: BatteryGroupAssignment[] = [];
    const groupMap = new Map(groups.map((g) => [g.id, g] as const));

    for (const groupAssignment of assignDto.groups) {
      const group = groupMap.get(groupAssignment.groupId);
      if (!group) {
        throw new NotFoundException(
          `Group with id ${groupAssignment.groupId} not found`,
        );
      }

      const assignment = this.assignmentRepository.create({
        batteryId: assignDto.batteryId,
        groupId: groupAssignment.groupId,
        status: AssignmentStatus.ACTIVE,
        expiresAt: groupAssignment.expiresAt,
        notes: groupAssignment.notes,
        battery,
        group,
        assignedBy,
        assignedAt: new Date(),
      });

      assignments.push(assignment);
    }

    // Save all assignments
    return this.assignmentRepository.save(assignments);
  }

  async getBatteriesByGroup(
    groupId: string,
  ): Promise<BatteryGroupAssignment[]> {
    return await this.assignmentRepository.find({
      where: {
        groupId,
        status: AssignmentStatus.ACTIVE,
      },
      relations: ['battery', 'assignedBy'],
      order: { assignedAt: 'DESC' },
    });
  }

  async getGroupsByBattery(
    batteryId: string,
  ): Promise<BatteryGroupAssignment[]> {
    return await this.assignmentRepository.find({
      where: {
        batteryId,
        status: AssignmentStatus.ACTIVE,
      },
      relations: ['group', 'assignedBy'],
      order: { assignedAt: 'DESC' },
    });
  }

  async getUserAccessibleBatteries(userId: string): Promise<Battery[]> {
    // Get user's group
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['groupMemberships', 'groupMemberships.group'],
    });

    if (!user || !user.groupMemberships || user.groupMemberships.length === 0) {
      return [];
    }

    const groupId = user.groupMemberships[0].group.id; // User belongs to exactly one group

    // Get active battery assignments for the group
    const assignments = await this.assignmentRepository.find({
      where: {
        groupId,
        status: AssignmentStatus.ACTIVE,
      },
      relations: [
        'battery',
        'battery.batteryTests',
        'battery.batteryTests.test',
      ],
    });

    // Filter out expired assignments
    const now = new Date();
    const validAssignments = assignments.filter(
      (assignment) => !assignment.expiresAt || assignment.expiresAt > now,
    );

    return validAssignments.map((assignment) => assignment.battery);
  }

  async validateUserBatteryAccess(
    userId: string,
    batteryId: string,
  ): Promise<boolean> {
    const accessibleBatteries = await this.getUserAccessibleBatteries(userId);
    return accessibleBatteries.some((battery) => battery.id === batteryId);
  }

  async getUserAccessibleTests(userId: string): Promise<Test[]> {
    // Get all accessible batteries for the user
    const accessibleBatteries = await this.getUserAccessibleBatteries(userId);

    // Extract unique test IDs from all batteries
    const testIdsSet = new Set<string>();
    for (const battery of accessibleBatteries) {
      if (battery.batteryTests && battery.batteryTests.length > 0) {
        for (const batteryTest of battery.batteryTests) {
          testIdsSet.add(batteryTest.testId);
        }
      }
    }

    // If no tests found, return empty array
    if (testIdsSet.size === 0) {
      return [];
    }

    // Fetch all unique tests with their relations
    const uniqueTestIds = Array.from(testIdsSet);
    const tests = await this.testRepository.find({
      where: {
        id: In(uniqueTestIds),
      },
      relations: ['questions', 'questions.options'],
      order: {
        createdAt: 'DESC',
      },
    });

    return tests;
  }

  async validateUserTestAccess(
    userId: string,
    testId: string,
  ): Promise<boolean> {
    const accessibleBatteries = await this.getUserAccessibleBatteries(userId);

    // Check if the test belongs to any accessible battery
    for (const battery of accessibleBatteries) {
      if (
        battery.batteryTests &&
        battery.batteryTests.some((bt) => bt.testId === testId)
      ) {
        return true;
      }
    }

    return false;
  }

  async getAssignmentStats(): Promise<{
    totalAssignments: number;
    activeAssignments: number;
    expiredAssignments: number;
    suspendedAssignments: number;
  }> {
    const [total, active, expired, suspended] = await Promise.all([
      this.assignmentRepository.count(),
      this.assignmentRepository.count({
        where: { status: AssignmentStatus.ACTIVE },
      }),
      this.assignmentRepository.count({
        where: { status: AssignmentStatus.EXPIRED },
      }),
      this.assignmentRepository.count({
        where: { status: AssignmentStatus.SUSPENDED },
      }),
    ]);

    return {
      totalAssignments: total,
      activeAssignments: active,
      expiredAssignments: expired,
      suspendedAssignments: suspended,
    };
  }
}
