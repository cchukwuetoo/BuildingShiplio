# BuildingShiplio

ShipLio backend milestone 1 built with NestJS, TypeScript, PostgreSQL, Prisma, JWT authentication, and role-based authorization.

## Features in this milestone

- User registration
- User login with JWT access token
- Role-based authorization (`USER`, `DRIVER`, `WAREHOUSE`, `SUPER_ADMIN`)
- Authenticated user profile (`GET /users/me`)
- Customer shipment creation (`POST /shipments`)
- Customer shipment listing and retrieval (`GET /shipments`, `GET /shipments/:id`)

## Tech stack

- NestJS 11
- TypeScript
- PostgreSQL
- Prisma ORM
- Passport JWT
- class-validator and class-transformer

## Prerequisites

- Node.js LTS (recommended v22+)
- npm
- PostgreSQL running locally or remotely

## 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd BuildingShiplio
npm install
```

If `npm`/`npx` is broken on your Windows machine, use the direct npm path:

```powershell
& "C:/Program Files/nodejs/npm.cmd" install
```

## 2. Configure environment variables

Create your local env file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update `.env`:

```dotenv
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://postgres:<your-password>@localhost:5432/shiplio

JWT_SECRET=<your-random-secret>
JWT_EXPIRES_IN=1d
```

### Generate a strong JWT secret

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output into `JWT_SECRET`.

## 3. Create database and run migrations

Make sure PostgreSQL is running and the `shiplio` database exists.

Run migration:

```bash
npx prisma migrate dev --name milestone1
```

If your global `npx` has the Node install directory error, run Prisma directly from local binaries:

```
Generate Prisma client (optional if migrate already generated it):

```bash
npx prisma generate
```


## 4. Run the API

Development mode:

```bash
npm run start:dev
```

Production build + start:

```bash
npm run build
npm run start:prod
```

## 5. Validate code quality

Lint:

```bash
npm run lint
```

Unit tests:

```bash
npm test -- --runInBand
```

E2E tests:

```bash
npm run test:e2e
```

## API endpoints in scope (milestone 1)

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Users

- `GET /users/me` (JWT required)

### Shipments

- `POST /shipments` (JWT + `USER` role)
- `GET /shipments` (JWT + `USER` role)
- `GET /shipments/:id` (JWT + `USER` role, own shipment only)

## Roles

Single users table with these roles:

- `USER`
- `DRIVER`
- `WAREHOUSE`
- `SUPER_ADMIN`

Public registration always creates `USER`.


## Project scripts

- `npm run start:dev` - start in watch mode
- `npm run build` - compile TypeScript
- `npm run start:prod` - run compiled app
- `npm run lint` - run ESLint
- `npm test` - run unit tests
- `npm run test:e2e` - run end-to-end tests

## Security notes

- Never commit real secrets in `.env`.
- Use a strong `JWT_SECRET`.
- Passwords are hashed with `bcrypt`.
- Do not expose `passwordHash` in responses.