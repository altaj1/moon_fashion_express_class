import { Request, Response } from "express";
import { BaseController } from "@/core/BaseController";
import { OrderService } from "./order.service";
import { HTTPStatusCode } from "@/types/HTTPStatusCode";
export class OrderController extends BaseController {
  constructor(private service: OrderService) {
    super();
  }

  /**
   * Create a new Order
   */
  public create = async (req: Request, res: Response) => {
    const body = req.validatedBody;
    this.logAction("create", req, { body });

    const result = await this.service.create(body, req.userId);

    return this.sendCreatedResponse(res, result, "Order created successfully");
  };

  /**
   * Get all Orders
   */
  public getAll = async (req: Request, res: Response) => {
    const query = req.validatedQuery || req.query;

    this.logAction("getAll", req, { query });

    const result = await this.service.findMany(query);
    // Transform each order's orderItems array into a single object
    const transformedData = result.data.map((order) => ({
      ...order,
      orderItems: order.orderItems[0] || null,
    }));
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
      "Orders retrieved successfully",
      transformedData,
    );
  };
  /**
   * Get single Order
   */
  public getOne = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("getOne", req, { id });

    const result = await this.service.findById(id);

    if (!result) {
      return this.sendResponse(
        res,
        "Order not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }
    // Flatten orderItems to a single object (if exists)
    const transformedData = {
      ...result,
      orderItems: result.orderItems?.[0] || null,
    };

    return this.sendResponse(
      res,
      "Order retrieved successfully",
      HTTPStatusCode.OK,
      transformedData,
    );
  };

  /**
   * Update Order
   */
  public update = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const body = req.validatedBody;
    this.logAction("update", req, { id, body });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Order not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateById(id, body);

    return this.sendResponse(
      res,
      "Order updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  //Update order status
  public updateStatus = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const { status } = req.validatedBody;
    this.logAction("updateStatus", req, { id, status });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Order not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.updateStatus(id, status);

    return this.sendResponse(
      res,
      "Order status updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };

  /**
   * Delete Order
   */
  public delete = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    this.logAction("delete", req, { id });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Order not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    await this.service.deleteById(id);

    return this.sendResponse(
      res,
      "Order deleted successfully",
      HTTPStatusCode.OK,
    );
  };

  public softDeleteOrder = async (req: Request, res: Response) => {
    const { id } = req.validatedParams;
    const { isDeleted } = req.validatedBody;
    this.logAction("softDeleteOrder", req, { id, isDeleted });

    const exists = await this.service.exists({ id });
    if (!exists) {
      return this.sendResponse(
        res,
        "Order not found",
        HTTPStatusCode.NOT_FOUND,
      );
    }

    const result = await this.service.softDeleteOrder(id, isDeleted);

    return this.sendResponse(
      res,
      "Order status updated successfully",
      HTTPStatusCode.OK,
      result,
    );
  };
}
