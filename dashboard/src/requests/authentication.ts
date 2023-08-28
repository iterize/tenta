"use client";

import axios from "axios";
import { z } from "zod";
import { mutate } from "swr";

const userDataSchema = z
  .object({
    user_identifier: z.string(),
    access_token: z.string(),
  })
  .transform((data) => ({
    userIdentifier: data.user_identifier,
    accessToken: data.access_token,
  }));

export type UserDataType = z.infer<typeof userDataSchema>;

export const login = async (username: string, password: string) => {
  const { data } = await axios.post("/api/login", {
    username,
    password,
  });
  const userData = userDataSchema.parse(data);
  mutate("userData", userData);
};
