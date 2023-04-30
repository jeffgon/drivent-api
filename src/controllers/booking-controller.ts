import { Response } from 'express';
import httpStatus from 'http-status';
import { AuthenticatedRequest } from '@/middlewares';
import { bookingService } from '@/services/booking-service';

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId as number;
  try {
    const booking = await bookingService.getBooking(userId);
    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    return res.status(httpStatus.NOT_FOUND).send(error.message);
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId as number;
  const roomId: number = req.body.roomId;

  try {
    const bookingId = await bookingService.postBooking(userId, roomId);
    return res.status(httpStatus.OK).send({ bookingId: bookingId });
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.status(httpStatus.NOT_FOUND).send({ message: error.message });
    }
    if (error.name === 'ForbiddenError') {
      return res.status(httpStatus.FORBIDDEN).send({ message: error.message });
    }
    return res.sendStatus(httpStatus.FORBIDDEN);
  }
}
