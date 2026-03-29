import { customAlphabet } from "nanoid";

const generate = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export const createInviteCode = () => generate();
