import { beforeEach, describe, expect, it, vi } from "vitest";
import { createToy, deleteToy, updateToy } from "./toys";

const requireAdmin = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const updateTag = vi.hoisted(() => vi.fn());

vi.mock("@/lib/session", () => ({ requireAdmin }));
vi.mock("next/cache", () => ({ revalidatePath, updateTag }));

const db = vi.hoisted(() => ({
  toy: {
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ db }));

const baseInput = {
  title: "Mainan A",
  price: 5000,
  stock: 3,
};

beforeEach(() => {
  vi.clearAllMocks();
  db.toy.findUnique.mockResolvedValue(null);
});

describe("toy mutations invalidate the toys cache tag", () => {
  it("createToy revalidates the toys tag", async () => {
    db.toy.create.mockResolvedValue({ id: "t1", title: "Mainan A" });

    const result = await createToy(baseInput as Parameters<typeof createToy>[0]);

    expect(result.ok).toBe(true);
    expect(updateTag).toHaveBeenCalledWith("toys");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/toys");
  });

  it("updateToy revalidates the toys tag", async () => {
    db.toy.update.mockResolvedValue({ id: "t1", title: "Mainan A" });

    const result = await updateToy("t1", baseInput as Parameters<typeof updateToy>[1]);

    expect(result.ok).toBe(true);
    expect(updateTag).toHaveBeenCalledWith("toys");
  });

  it("deleteToy revalidates the toys tag", async () => {
    await expect(deleteToy("t1")).resolves.toBeUndefined();
    expect(db.toy.delete).toHaveBeenCalledWith({ where: { id: "t1" } });
    expect(updateTag).toHaveBeenCalledWith("toys");
  });
});
