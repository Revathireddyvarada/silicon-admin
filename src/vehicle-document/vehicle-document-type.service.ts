import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { VehicleDocumentType } from "../entities/vehicle-document-type.entity";
import {
  CreateVehicleDocumentTypeDto,
  UpdateVehicleDocumentTypeDto,
} from "./dto/vehicle-document-type.dto";

@Injectable()
export class VehicleDocumentTypeService {
  constructor(
    @InjectRepository(VehicleDocumentType)
    private readonly repo: Repository<VehicleDocumentType>,
  ) {}

  async create(
    dto: CreateVehicleDocumentTypeDto,
    currentUserId?: string,
  ): Promise<VehicleDocumentType[]> {
    const parent = await this.repo.save(
      this.repo.create({
        documentName: dto.documentName,
        documentNumber: false,
        expiryDate: false,
        uploadSide: null,
        parentId: null,
        isMandatory: dto.isMandatory ?? false,
        status: dto.status,
        isDeleted: false,
        createdBy: currentUserId ?? null,
        updatedBy: currentUserId ?? null,
      }),
    );

    const childRows: Partial<VehicleDocumentType>[] = [];

    if (dto.documentNumber) {
      childRows.push({
        documentName: `${dto.documentName} Number`,
        documentNumber: true,
        expiryDate: false,
        uploadSide: null,
        parentId: parent.id,
        isMandatory: false,
        status: true,
        isDeleted: false,
        createdBy: currentUserId ?? null,
        updatedBy: currentUserId ?? null,
      });
    }

    if (dto.expiryDate) {
      childRows.push({
        documentName: `${dto.documentName} Expiry Date`,
        documentNumber: false,
        expiryDate: true,
        uploadSide: null,
        parentId: parent.id,
        isMandatory: false,
        status: true,
        isDeleted: false,
        createdBy: currentUserId ?? null,
        updatedBy: currentUserId ?? null,
      });
    }

    if (dto.uploadSide === "front" || dto.uploadSide === "both_side") {
      childRows.push({
        documentName: `Upload ${dto.documentName} Front`,
        documentNumber: false,
        expiryDate: false,
        uploadSide: "front",
        parentId: parent.id,
        isMandatory: false,
        status: true,
        isDeleted: false,
        createdBy: currentUserId ?? null,
        updatedBy: currentUserId ?? null,
      });
    }

    if (dto.uploadSide === "back" || dto.uploadSide === "both_side") {
      childRows.push({
        documentName: `Upload ${dto.documentName} Back`,
        documentNumber: false,
        expiryDate: false,
        uploadSide: "back",
        parentId: parent.id,
        isMandatory: false,
        status: true,
        isDeleted: false,
        createdBy: currentUserId ?? null,
        updatedBy: currentUserId ?? null,
      });
    }

    const savedChildren = childRows.length
      ? await this.repo.save(childRows.map((row) => this.repo.create(row)))
      : [];

    return [parent, ...savedChildren];
  }

  async findAll(): Promise<VehicleDocumentType[]> {
    return this.repo.find({
      where: { isDeleted: false },
      order: { createdAt: "DESC" },
    });
  }

  async findAllGrouped(): Promise<
    (VehicleDocumentType & { children: VehicleDocumentType[] })[]
  > {
    const all = await this.repo.find({
      where: { isDeleted: false },
      order: { createdAt: "DESC" },
    });

    const parents = all.filter((r) => !r.parentId);
    const childrenByParentId = new Map<string, VehicleDocumentType[]>();
    for (const r of all) {
      if (!r.parentId) continue;
      if (!childrenByParentId.has(r.parentId)) {
        childrenByParentId.set(r.parentId, []);
      }
      childrenByParentId.get(r.parentId)!.push(r);
    }

    return parents.map((p) => ({
      ...p,
      children: childrenByParentId.get(p.id) ?? [],
    }));
  }

  async findOne(id: string): Promise<VehicleDocumentType> {
    const entity = await this.repo.findOne({ where: { id, isDeleted: false } });
    if (!entity)
      throw new NotFoundException(`Vehicle document type ${id} not found`);
    return entity;
  }

  async update(
    id: string,
    dto: UpdateVehicleDocumentTypeDto,
    currentUserId?: string,
  ): Promise<VehicleDocumentType[]> {
    const entity = await this.repo.findOne({ where: { id, isDeleted: false } });
    if (!entity)
      throw new NotFoundException(`Vehicle document type ${id} not found`);

    if (entity.parentId) {
      if (dto.isMandatory !== undefined) entity.isMandatory = dto.isMandatory;
      if (dto.status !== undefined) entity.status = dto.status;
      entity.updatedBy = currentUserId ?? null;
      return [await this.repo.save(entity)];
    }

    if (dto.documentName !== undefined) entity.documentName = dto.documentName;
    if (dto.isMandatory !== undefined) entity.isMandatory = dto.isMandatory;
    entity.updatedBy = currentUserId ?? null;
    const savedParent = await this.repo.save(entity);

    const existingChildren = await this.repo.find({
      where: { parentId: savedParent.id, isDeleted: false },
    });
    const baseName = savedParent.documentName;

    const numberChild = existingChildren.find((c) => c.documentNumber);
    const expiryChild = existingChildren.find((c) => c.expiryDate);
    const frontChild = existingChildren.find((c) => c.uploadSide === "front");
    const backChild = existingChildren.find((c) => c.uploadSide === "back");

    const wantNumber = dto.documentNumber ?? !!numberChild;
    const wantExpiry = dto.expiryDate ?? !!expiryChild;
    const wantFront = dto.uploadSide
      ? dto.uploadSide === "front" || dto.uploadSide === "both_side"
      : !!frontChild;
    const wantBack = dto.uploadSide
      ? dto.uploadSide === "back" || dto.uploadSide === "both_side"
      : !!backChild;

    const results: VehicleDocumentType[] = [savedParent];

    const upsertChild = async (
      existing: VehicleDocumentType | undefined,
      want: boolean,
      name: string,
      flags: Partial<VehicleDocumentType>,
    ) => {
      if (want && !existing) {
        const created = await this.repo.save(
          this.repo.create({
            documentName: name,
            documentNumber: false,
            expiryDate: false,
            uploadSide: null,
            parentId: savedParent.id,
            isMandatory: false,
            status: true,
            isDeleted: false,
            createdBy: currentUserId ?? null,
            updatedBy: currentUserId ?? null,
            ...flags,
          }),
        );
        results.push(created);
      } else if (!want && existing) {
        existing.isDeleted = true;
        existing.updatedBy = currentUserId ?? null;
        await this.repo.save(existing);
      } else if (want && existing && existing.documentName !== name) {
        existing.documentName = name;
        existing.updatedBy = currentUserId ?? null;
        await this.repo.save(existing);
        results.push(existing);
      } else if (existing) {
        results.push(existing);
      }
    };

    await upsertChild(numberChild, wantNumber, `${baseName} Number`, {
      documentNumber: true,
    });
    await upsertChild(expiryChild, wantExpiry, `${baseName} Expiry Date`, {
      expiryDate: true,
    });
    await upsertChild(frontChild, wantFront, `Upload ${baseName} Front`, {
      uploadSide: "front",
    });
    await upsertChild(backChild, wantBack, `Upload ${baseName} Back`, {
      uploadSide: "back",
    });

    return results;
  }

  async remove(
    id: string,
    currentUserId?: string,
  ): Promise<{ message: string }> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity)
      throw new NotFoundException(`Vehicle document type ${id} not found`);

    if (!entity.parentId) {
      await this.repo.delete({ parentId: entity.id });
      await this.repo.delete({ id: entity.id });
    } else {
      await this.repo.delete({ id: entity.id });
    }

    return { message: "Vehicle document type permanently deleted" };
  }
}
