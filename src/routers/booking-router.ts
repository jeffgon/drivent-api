import { Router } from 'express';
import { authenticateToken } from '@/middlewares';
import { changeBooking, getBooking, postBooking } from '@/controllers';

const bookingRouter = Router();

bookingRouter.get('/', authenticateToken, getBooking);
bookingRouter.post('/', authenticateToken, postBooking);
bookingRouter.put('/:bookingId', authenticateToken, changeBooking);

export { bookingRouter };
