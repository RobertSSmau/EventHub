import { Router } from 'express';
import { celebrate, Joi, errors } from 'celebrate';
import { register, login } from '../controllers/auth.controller.js';

const router = Router();

router.post(
  '/register',
  celebrate({
    body: Joi.object({
      username: Joi.string().min(3).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
    }),
  }),
  register
);

router.post(
  '/login',
  celebrate({
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  }),
  login
);

router.use(errors());

export default router;