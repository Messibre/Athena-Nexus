import { updateUser } from "../usersApi";
import api from "../axios";

jest.mock("../axios", () => ({
  put: jest.fn(),
}));

describe("usersApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("updateUser calls PUT /api/users/:id with payload", () => {
    const id = "user123";
    const payload = { displayName: "Updated User" };
    updateUser(id, payload);
    expect(api.put).toHaveBeenCalledWith(`/api/users/${id}`, payload);
  });
});
