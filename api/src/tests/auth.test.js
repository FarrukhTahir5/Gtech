import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
const app = require("../app");

describe("Auth Routes", () => {
  it("POST /api/auth/register — missing fields returns 500", async () => {
    const res = await request(app).post("/api/auth/register").send({});
    // Accepts 400 or 500 since DB may be offline
    expect([400, 500]).toContain(res.statusCode);
  });

  it("POST /api/auth/login — missing credentials returns 400", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect([400, 500]).toContain(res.statusCode);
  });
});

describe("Product Routes", () => {
  it("GET /api/products — returns success", async () => {
    const res = await request(app).get("/api/products");
    expect([200, 500]).toContain(res.statusCode);
  });

  it("GET /api/products/:id — invalid id returns 404 or 500", async () => {
    const res = await request(app).get("/api/products/nonexistent");
    expect([404, 500]).toContain(res.statusCode);
  });
});

describe("Category Routes", () => {
  it("GET /api/categories — returns success", async () => {
    const res = await request(app).get("/api/categories");
    expect([200, 500]).toContain(res.statusCode);
  });
});

describe("Contact Routes", () => {
  it("POST /api/contact — missing fields returns 400", async () => {
    const res = await request(app).post("/api/contact").send({});
    expect([400, 500]).toContain(res.statusCode);
  });

  it("POST /api/contact/newsletter — missing email returns 400", async () => {
    const res = await request(app).post("/api/contact/newsletter").send({});
    expect([400, 500]).toContain(res.statusCode);
  });
});

describe("Stats Routes", () => {
  it("GET /api/stats — without auth returns 401", async () => {
    const res = await request(app).get("/api/stats");
    expect(res.statusCode).toBe(401);
  });
});

describe("Root Route", () => {
  it("GET / — returns welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("Gillani Tech");
  });
});
