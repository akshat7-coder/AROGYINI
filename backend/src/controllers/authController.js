import * as authService from "../services/authService.js";
import { ok, created } from "../utils/apiResponse.js";

export async function signup(req, res) {
  const { user, token } = await authService.signup(req.body);
  return created(res, { user, token });
}

export async function signin(req, res) {
  const { user, token } = await authService.signin(req.body);
  return ok(res, { user, token });
}

export async function getMe(req, res) {
  return ok(res, { user: await authService.getMe(req.user.id) });
}

export async function updateMe(req, res) {
  return ok(res, { user: await authService.updateMe(req.user.id, req.body) });
}

export async function changePassword(req, res) {
  await authService.changePassword(req.user.id, req.body);
  return ok(res, { message: "Password updated" });
}
