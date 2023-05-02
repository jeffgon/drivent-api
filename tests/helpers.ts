import * as jwt from 'jsonwebtoken';
import { TicketStatus, User } from '@prisma/client';

import {
  createEnrollmentWithAddress,
  createNotRemote,
  createRemoteTicketType,
  createTicket,
  createUser,
} from './factories';
import { createSession } from './factories/sessions-factory';
import { prisma } from '@/config';

export async function cleanDb() {
  await prisma.address.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.ticketType.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.hotel.deleteMany({});
  await prisma.user.deleteMany({});
}

export async function generateValidToken(user?: User) {
  const incomingUser = user || (await createUser());
  const token = jwt.sign({ userId: incomingUser.id }, process.env.JWT_SECRET);

  await createSession(token);

  return token;
}

export async function generateValidUser(remote: boolean, paid: boolean, includesHotel?: boolean) {
  const user = await createUser();
  const token = await generateValidToken(user);
  let ticketType;
  if (remote) {
    ticketType = await createRemoteTicketType();
  } else {
    ticketType = await createNotRemote(includesHotel);
  }
  const enrollment = await createEnrollmentWithAddress(user);
  const ticketStatus = paid ? TicketStatus.PAID : TicketStatus.RESERVED;
  const ticket = await createTicket(enrollment.id, ticketType.id, ticketStatus);
  return { user, token, enrollment, ticketType, ticket };
}
