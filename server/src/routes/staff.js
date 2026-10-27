/**
 * /api/staff routes: admin-only management of staff accounts.
 */

import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { ROLES } from "../config/roles.js";
import { asyncHandler, HttpError } from "../utils/httpError.js";
import { validateNewStaffInput, validateStaffUpdateInput } from "../utils/validation.js";
import * as staff from "../services/staffService.js";

const router = Router();
router.use(requireRole(ROLES.ADMIN));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({ staff: await staff.listStaff() });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { data, errors } = validateNewStaffInput(req.body);
    if (Object.keys(errors).length) throw new HttpError(400, "Some fields need attention.", errors);
    const member = await staff.createStaff(data, req.user);
    res.status(201).json({ staff: member });
  })
);

router.patch(
  "/:uid",
  asyncHandler(async (req, res) => {
    const { data, errors } = validateStaffUpdateInput(req.body);
    if (Object.keys(errors).length) throw new HttpError(400, errors.form || "Some fields need attention.", errors);
    const member = await staff.updateStaff(req.params.uid, data, req.user);
    res.json({ staff: member });
  })
);

export default router;
