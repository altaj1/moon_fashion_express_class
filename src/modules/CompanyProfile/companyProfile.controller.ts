import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { CompanyProfileService } from "./companyProfile.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";

export class CompanyProfileController extends BaseController {
  constructor(private service: CompanyProfileService) {
    super();
  }

  /**
   * Create a new CompanyProfile
   */
  public create = async (req: Request, res: Response) => {
    const body = req.validatedBody;
    this.logAction("create", req, { body });
    const logoUrl = req.file;
    const result = await this.service.create(body, logoUrl);

    return this.sendCreatedResponse(
      res,
      result,
      "CompanyProfile created successfully",
    );
  };

  /**
   * Get all CompanyProfiles
   */
  public getAll = async (req: Request, res: Response) => {
    const query = req.validatedQuery;
    const pagination = this.extractPaginationParams(req);
    const {
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      companyType,
      status,
      startDate,
      endDate,
      isDeleted,
    } = query;

    const filters: any = {};

    // 🔍 Search logic
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { registrationNumber: { contains: search, mode: "insensitive" } },
        { tradeLicenseNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    // 🏷 Optional filters
    if (companyType) {
      filters.companyType = companyType;
    }

    if (status) {
      filters.status = status;
    }

    const orderBy = {
      [sortBy]: sortOrder,
    };

    // Date Range Filter (issueDate)
    if (startDate || endDate) {
      filters.deliveryDate = {};
      if (startDate) filters.deliveryDate.gte = new Date(startDate as string);
      if (endDate) filters.deliveryDate.lte = new Date(endDate as string);
    }

    if (isDeleted) {
      filters.isDeleted = isDeleted;
    } else {
      filters.isDeleted = false;
    }
    const result = await this.service.findMany(filters, pagination, orderBy);

    return this.sendPaginatedResponse(
      res,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrevious: result.hasPrevious,
      },
      "CompanyProfiles retrieved successfully",
      result.data,
    );
  };
  /**
   * Get single CompanyProfile
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("getOne", req, { id });

    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(
        res,
        "CompanyProfile not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    return this.sendResponse(
      res,
      "CompanyProfile retrieved successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Update CompanyProfile
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "CompanyProfile not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateById(id, body);

    return this.sendResponse(
      res,
      "CompanyProfile updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Delete CompanyProfile
   */
  public delete = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    this.logAction("delete", req, { id });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "CompanyProfile not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    await this.service.softDelete({
      id,
      isDeleted: body?.isDeleted,
    });

    return this.sendResponse(
      res,
      "CompanyProfile deleted successfully",
      HTTPStatusCode.OK,
    );
  };
}
