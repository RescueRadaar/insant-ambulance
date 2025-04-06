import { Request, Response } from 'express';

class HelloController {
  /**
   * Simple hello world endpoint
   * @param req Request
   * @param res Response
   */
  hello(req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      message: 'Hello from Instant Ambulance API',
      data: {
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export default new HelloController();
