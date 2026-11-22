import { usersRepository } from '../repositories/users.repository';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export const usersController = {
  listAgents: asyncHandler(async (_req, res) => {
    sendSuccess(res, await usersRepository.findAgents());
  }),
};
