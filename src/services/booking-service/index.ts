import { forbiddenError, notFoundError } from '@/errors';
import { bookingRepository } from '@/repositories/booking-repository';
import enrollmentRepository from '@/repositories/enrollment-repository';

async function getBooking(userId: number) {
  const booking = await bookingRepository.getBooking(userId);
  if (!booking) throw notFoundError();
  return booking;
}

async function postBooking(userId: number, roomId: number) {
  const enrollment = enrollmentRepository.verifyTicket(userId);
  if (!enrollment) throw notFoundError();

  const remoteTicket = (await enrollment).Ticket.find(
    (ticket: { TicketType: { isRemote: unknown } }) => ticket.TicketType.isRemote,
  );
  if (remoteTicket) throw forbiddenError();

  const hotelTicket = (await enrollment).Ticket.find(
    (ticket: { TicketType: { includesHotel: unknown } }) => ticket.TicketType.includesHotel,
  );
  if (!hotelTicket) throw forbiddenError();

  const unpaidTicket = (await enrollment).Ticket.find((ticket: { status: string }) => ticket.status !== 'PAID');
  if (unpaidTicket) throw forbiddenError();

  const room = await bookingRepository.verifyRoom(roomId);
  if (!room) throw notFoundError();
  if (room.capacity <= room.Booking.length) throw forbiddenError();

  const bookingId = await bookingRepository.postBooking(userId, roomId);

  return bookingId;
}

async function changeBooking(userId: number, bookingId: number, roomId: number) {
  const bookingUserId = await bookingRepository.verifyBooking(bookingId);
  if (!bookingUserId || bookingUserId !== userId) throw forbiddenError();

  const room = await bookingRepository.verifyRoom(roomId);
  if (!room) throw notFoundError();
  if (room.capacity <= room.Booking.length) throw forbiddenError();

  await bookingRepository.changeBooking(bookingId, roomId);
}

const bookingService = {
  getBooking,
  postBooking,
  changeBooking,
};

export { bookingService };
