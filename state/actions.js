import {
  SET_STATE,
  SET_RESOURCES,
  ADD_RESOURCE,
  UPDATE_RESOURCE,
  DELETE_RESOURCE,
} from "./actionTypes";

export const setState = (keyOrRootValues, maybeValues) => ({
  type: SET_STATE,
  payload: {
    keyOrRootValues,
    maybeValues,
  },
});

export const setTimelines = (payload, keepTemporary = false) => ({
  type: SET_RESOURCES,
  resourceName: "timeLines",
  payload,
  keepTemporary,
});

export const addTimeline = (payload) => ({
  type: ADD_RESOURCE,
  resourceName: "timeLines",
  payload,
});

export const updateTimeline = (payload) => ({
  type: UPDATE_RESOURCE,
  resourceName: "timeLines",
  payload,
});

export const deleteTimeline = (payload) => ({
  type: DELETE_RESOURCE,
  resourceName: "timeLines",
  payload,
});

export const setTimeIntervals = (payload) => ({
  type: SET_RESOURCES,
  resourceName: "timeIntervals",
  payload,
});

export const addTimeInterval = (payload) => ({
  type: ADD_RESOURCE,
  resourceName: "timeIntervals",
  payload,
});

export const updateTimeInterval = (payload) => ({
  type: UPDATE_RESOURCE,
  resourceName: "timeIntervals",
  payload,
});

export const deleteTimeInterval = (payload) => ({
  type: DELETE_RESOURCE,
  resourceName: "timeIntervals",
  payload,
});
