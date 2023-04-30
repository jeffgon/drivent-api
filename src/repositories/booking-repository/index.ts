import { prisma } from '@/config';

async function getBooking(userId: number) {
  const booking = await prisma.booking.findFirst({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      userId: false,
      roomId: false,
      createdAt: false,
      updatedAt: false,
      Room: true,
    },
  });

  return booking;
}

async function verifyRoom(roomId: number) {
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
    select: {
      capacity: true,
      Booking: true,
    },
  });

  return room;
}

async function postBooking(userId: number, roomId: number) {
  const booking = await prisma.booking.create({
    data: {
      userId: userId,
      roomId: roomId,
    },
  });

  return booking.id;
}

async function verifyBooking(bookingId: number) {
  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
  });
  if (booking == null) return undefined;
  return booking.userId;
}

async function changeBooking(bookingId: number, roomId: number) {
  await prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      roomId: roomId,
    },
  });
}

const bookingRepository = {
  getBooking,
  verifyRoom,
  postBooking,
  verifyBooking,
  changeBooking,
};

export { bookingRepository };
