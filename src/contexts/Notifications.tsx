import type { Dispatch, SetStateAction } from "react";

import { createContext, useContext, useState } from "react";

export interface INotificationsContext {
  isPingLogoutSessionExpiry: boolean;
  isPingInvalidStartSession: boolean;
  setIsPingLogoutSessionExpiry: Dispatch<SetStateAction<boolean>>;
  setIsPingInvalidStartSession: Dispatch<SetStateAction<boolean>>;
}

export const NotificationsContext = createContext<INotificationsContext>({
  isPingLogoutSessionExpiry: false,
  isPingInvalidStartSession: false,
  setIsPingLogoutSessionExpiry: () => {},
  setIsPingInvalidStartSession: () => {},
});

export const useNotifications = (): INotificationsContext => {
  return useContext(NotificationsContext);
};

const NotificationsProvider = ({ children }: { children: JSX.Element }) => {
  const [isPingLogoutSessionExpiry, setIsPingLogoutSessionExpiry] =
    useState<boolean>(false);
  const [isPingInvalidStartSession, setIsPingInvalidStartSession] =
    useState<boolean>(false);

  const contextProvider = {
    isPingLogoutSessionExpiry,
    isPingInvalidStartSession,
    setIsPingLogoutSessionExpiry,
    setIsPingInvalidStartSession,
  };
  return (
    <NotificationsContext.Provider value={contextProvider}>
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsProvider;
