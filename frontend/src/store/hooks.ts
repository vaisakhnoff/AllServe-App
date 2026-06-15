"use client";

import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";

/**
 * Typed dispatch hook — avoids manually typing useDispatch<AppDispatch>() everywhere.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed selector hook — provides full RootState type inference.
 */
export const useAppSelector = <TSelected>(
  selector: (state: RootState) => TSelected
): TSelected => useSelector(selector);
