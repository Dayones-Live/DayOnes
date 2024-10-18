// redux/actions.js
export const SET_LOCATION = 'SET_GEOLOCATION_DATA';
export const SET_USER_PROFILE = 'SET_USER_PROFILE';
export const SET_ACCESS_TOKEN = 'SET_ACCESS_TOKEN';
export const SET_USER_ID = 'SET_USER_ID';
export const SET_SIGNATURE_COLOR = 'SET_SIGNATURE_COLOR';
export const SET_SIGNATURE_SIZE = 'SET_SIGNATURE_SIZE';
export const SET_FCM_TOKEN = 'SET_FCM_TOKEN';
export const SET_INVITES_ENABLED = 'SET_INVITES_ENABLED';


export const setInvitesEnabled = (isEnabled) => ({
  type: SET_INVITES_ENABLED,
  payload: isEnabled,
});

export const setLocation = (latitude, longitude) => ({
  type: 'SET_LOCATION',
  payload: { latitude, longitude },
});


export const setUserProfile = (userProfile) => ({
    type: SET_USER_PROFILE,
    payload: userProfile,
});

export const setAccessToken = (token) => ({
    type: SET_ACCESS_TOKEN,
    payload: token,
});

export const setUserID = (userID) => ({
    type: SET_USER_ID,
    payload: userID,
});

export const setSignatureColor = (color) => ({
    type: SET_SIGNATURE_COLOR,
    payload: color,
});

export const setSignatureSize = (size) => ({  // New action creator for signature size
    type: SET_SIGNATURE_SIZE,
    payload: size,
});

export const setFcmToken = (token) => {
  return {
    type: SET_FCM_TOKEN,
    payload: token,
  };
};
