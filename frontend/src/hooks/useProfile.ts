"use client";

import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { setUser } from "@/features/auth";
import { userService } from "@/services/user";
import { UserProfile, UpdateProfileDto } from "@/types/user.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { logger } from "@/utils/logger";

export const useProfile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getProfile();
      setProfile(res.data.data);
      dispatch(setUser(res.data.data as unknown as Parameters<typeof setUser>[0]));
      logger.info("Profile fetched");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      logger.error("Failed to fetch profile", msg);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const updateProfile = async (dto: UpdateProfileDto): Promise<void> => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await userService.updateProfile(dto);
      setProfile(res.data.data);
      setSuccess(true);
      logger.info("Profile updated");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      logger.error("Failed to update profile", msg);
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, success, fetchProfile, updateProfile };
};
