import { Router } from 'express';
import { authenticateToken } from '@/middlewares';
import { getBooking, postBooking } from '@/controllers';

const bookingRouter = Router();

bookingRouter.get('/', authenticateToken, getBooking);
bookingRouter.post('/', authenticateToken, postBooking);

export { bookingRouter };
