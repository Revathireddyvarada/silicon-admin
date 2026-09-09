import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { RolesModule } from "../entities/role-module.entity";
import { CreateRolesModuleDto } from "./dto/role-module.dto";

@Injectable()
export class RolesModuleService {
  constructor(
    @InjectRepository(RolesModule)
    private readonly repo: Repository<RolesModule>,
  ) {}

  async create(
    dto: CreateRolesModuleDto,
    currentUserId?: string,
  ): Promise<RolesModule> {
    const existing = await this.repo.findOne({
      where: { moduleName: dto.moduleName, isDeleted: false },
    });
    // if (existing)
    //   throw new ConflictException(`Module '${dto.moduleName}' already exists`);

    if (dto.parentId) {
      const parent = await this.repo.findOne({
        where: { id: dto.parentId, isDeleted: false },
      });
      if (!parent) throw new NotFoundException(`Parent module not found`);
    }

    const entity = this.repo.create({
      publicId: uuidv4(),
      moduleName: dto.moduleName,
      parentId: dto.parentId ?? null,
      status: dto.status ?? true,
      isDeleted: false,
      createdBy: currentUserId ?? null,
      updatedBy: currentUserId ?? null,
    });
    return this.repo.save(entity);
  }

  async findAll(): Promise<object[]> {
    const modules = await this.repo.find({
      where: { isDeleted: false },
      order: { createdAt: "ASC" },
    });

    const parents = modules.filter((m) => !m.parentId);

    return parents.map((parent) => ({
      id: parent.id,
      moduleName: parent.moduleName,
      parentId: parent.parentId,
      status: parent.status,
      children: modules
        .filter((m) => m.parentId === parent.id)
        .map((child) => ({
          id: child.id,
          moduleName: child.moduleName,
          parentId: child.parentId,
          status: child.status,
        })),
    }));
  }
}
