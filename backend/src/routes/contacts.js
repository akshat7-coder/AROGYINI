import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../validators/admin.js";
import { createContactSchema, updateContactSchema } from "../validators/contacts.js";
import { listContacts, createContact, updateContact, deleteContact } from "../controllers/contactController.js";

const router = Router();

router.use(authenticate);

router.get("/", listContacts);
router.post("/", validate(createContactSchema), createContact);
router.patch("/:id", validate({ params: idParamSchema, body: updateContactSchema }), updateContact);
router.delete("/:id", validate({ params: idParamSchema }), deleteContact);

export default router;
