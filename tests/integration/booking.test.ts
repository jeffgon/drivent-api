import faker from '@faker-js/faker';
import httpStatus from 'http-status';
import * as jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { cleanDb, generateValidToken, generateValidUser } from '../helpers';
import { createHotel, createUser, createHotelRoom } from '../factories';
import { createBooking } from '../factories/booking-factory';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('GET /booking', () => {
  it('should return with 401 if no token', async () => {
    const response = await server.get('/booking');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should return with 401 if token is valid', async () => {
    const token = faker.lorem.word();
    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should return with 401 if there is no session for token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when there is a valid token', () => {
    it('should return with 404 if there is no booking for the user', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it('should return with 200 and the booking if there is a booking for the user', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createHotelRoom(hotel.id);
      const booking = await createBooking(user.id, room.id);
      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        id: booking.id,
        Room: {
          ...room,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        },
      });
    });
  });
});

describe('POST /booking', () => {
  it('should return with 401 if no token', async () => {
    const response = await server.post('/booking');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should return with 401 if token is invalid', async () => {
    const token = faker.lorem.word();
    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should return with 401 if there is no session for token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when there is a valid token', () => {
    it('should return with 403 if user has no ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createHotelRoom(hotel.id);
      const body = { roomId: room.id };
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should return with 403 if ticket is remote', async () => {
      const remote = true;
      const paid = true;
      const { token } = await generateValidUser(remote, paid);
      const body = { roomId: 1 };
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should return with 403 if ticket does not include hotel', async () => {
      const remote = false;
      const paid = true;
      const includesHotel = false;
      const { token } = await generateValidUser(remote, paid, includesHotel);
      const body = { roomId: 1 };
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should return with 403 if ticket is not paid', async () => {
      const remote = false;
      const paid = false;
      const includesHotel = true;
      const { token } = await generateValidUser(remote, paid, includesHotel);
      const body = { roomId: 1 };
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should return with 404 if room does not exist', async () => {
      const remote = false;
      const paid = true;
      const includesHotel = true;
      const { token } = await generateValidUser(remote, paid, includesHotel);
      const body = { roomId: 1 };
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it('should return with 403 if room is full', async () => {
      const remote = false;
      const paid = true;
      const includesHotel = true;
      const { token } = await generateValidUser(remote, paid, includesHotel);
      const { user } = await generateValidUser(remote, paid, includesHotel);
      const hotel = await createHotel();
      const room = await createHotelRoom(hotel.id, 1);
      await createBooking(user.id, room.id);
      const body = { roomId: room.id };
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with 200 and booking id if room is not full', async () => {
      const remote = false;
      const paid = true;
      const includesHotel = true;
      const { token } = await generateValidUser(remote, paid, includesHotel);
      const hotel = await createHotel();
      const room = await createHotelRoom(hotel.id, 1);
      const body = { roomId: room.id };
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({ bookingId: expect.any(Number) });
    });
  });
});

describe('PUT /booking', () => {
  it('should return with 401 if no token', async () => {
    const response = await server.put('/booking/1');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should return with 401 if invalid token is provided', async () => {
    const token = faker.lorem.word();
    const response = await server.put(`/booking/${faker.datatype.number()}`).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should return with 401 if there is no session for the token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.put(`/booking/${faker.datatype.number()}`).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when there is a valid token', () => {
    it('should respond with 403 if booking id does not belong to user', async () => {
      const remote = false;
      const paid = true;
      const includesHotel = true;
      const { token } = await generateValidUser(remote, paid, includesHotel);
      const user = await createUser();
      const hotel = await createHotel();
      const room = await createHotelRoom(hotel.id);
      const booking = await createBooking(user.id, room.id);
      const body = { roomId: room.id };
      const response = await server
        .put('/booking/' + booking.id)
        .set('Authorization', `Bearer ${token}`)
        .send(body);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with 403 if user has no booking', async () => {
      const remote = false;
      const paid = true;
      const includesHotel = true;
      const { token } = await generateValidUser(remote, paid, includesHotel);
      const hotel = await createHotel();
      const room = await createHotelRoom(hotel.id);
      const body = { roomId: room.id };
      const response = await server
        .put(`/booking/${faker.datatype.number()}`)
        .set('Authorization', `Bearer ${token}`)
        .send(body);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with 403 if room is full', async () => {
      const remote = false;
      const paid = true;
      const includesHotel = true;
      const { user: userOne, token } = await generateValidUser(remote, paid, includesHotel);
      const { user: userTwo } = await generateValidUser(remote, paid, includesHotel);
      const hotel = await createHotel();
      const roomOne = await createHotelRoom(hotel.id);
      const roomTwo = await createHotelRoom(hotel.id, 1);
      const booking = await createBooking(userOne.id, roomOne.id);
      await createBooking(userTwo.id, roomTwo.id);
      const body = { roomId: roomTwo.id };
      const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with 404 if room does not exist', async () => {
      const remote = false;
      const paid = true;
      const includesHotel = true;
      const { user, token } = await generateValidUser(remote, paid, includesHotel);
      const hotel = await createHotel();
      const room = await createHotelRoom(hotel.id);
      const booking = await createBooking(user.id, room.id);
      await createBooking(user.id, room.id);
      const body = { roomId: faker.datatype.number() };
      const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it('should respond with 200 and booking id if room is not full', async () => {
      const remote = false;
      const paid = true;
      const includesHotel = true;
      const { user, token } = await generateValidUser(remote, paid, includesHotel);
      const hotel = await createHotel();
      const room = await createHotelRoom(hotel.id);
      const anotherRoom = await createHotelRoom(hotel.id);
      const booking = await createBooking(user.id, room.id);
      const body = { roomId: anotherRoom.id };
      const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({ bookingId: expect.any(Number) });
    });
  });
});
